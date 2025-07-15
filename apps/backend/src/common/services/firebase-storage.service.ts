import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  Bucket,
  // File
} from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseService } from './firebase.service';

export interface FileMetadata {
  originalName: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  uploadedAt: Date;
  downloadUrl?: string;
  bucketPath: string;
}

export interface FileUploadResult {
  fileId: string;
  downloadUrl: string;
  metadata: FileMetadata;
}

export interface FileUploadOptions {
  userId: string;
  category:
    | 'kyc'
    | 'identity'
    | 'profile'
    | 'project-legal'
    | 'project-financial'
    | 'project-marketing'
    | 'platform'
    | 'temp';
  projectId?: string;
  customPath?: string;
  makePublic?: boolean;
}

@Injectable()
export class FirebaseStorageService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private storage: admin.storage.Storage;
  private bucket: Bucket;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService
  ) {}

  async onModuleInit() {
    await this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      this.bucketName =
        this.configService.get('firebase.storageBucket') ||
        'partisipro-dev.appspot.com';

      this.storage = admin.storage();
      this.bucket = this.storage.bucket(this.bucketName);

      if (isDevelopment) {
        // In development, use the Firebase Storage emulator if available
        const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
        if (emulatorHost) {
          this.logger.log(`Using Firebase Storage emulator at ${emulatorHost}`);
        } else {
          this.logger.log(
            'Firebase Storage emulator not configured, using real storage'
          );
        }
      }

      this.logger.log(
        `Firebase Storage initialized with bucket: ${this.bucketName}`
      );
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Storage', error);
      throw error;
    }
  }

  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(
    file: Express.Multer.File,
    options: FileUploadOptions
  ): Promise<FileUploadResult> {
    try {
      const fileId = uuidv4();
      const timestamp = new Date().toISOString().split('T')[0];
      const bucketPath = this.generateBucketPath(options, fileId, timestamp);

      // Create file reference
      const fileRef = this.bucket.file(bucketPath);

      // Upload file
      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy: options.userId,
            uploadedAt: new Date().toISOString(),
            fileId: fileId,
            category: options.category,
            ...(options.projectId && { projectId: options.projectId }),
          },
        },
      });

      return new Promise((resolve, reject) => {
        stream.on('error', error => {
          this.logger.error('File upload failed', error);
          reject(error);
        });

        stream.on('finish', async () => {
          try {
            let downloadUrl: string;

            if (options.makePublic) {
              await fileRef.makePublic();
              downloadUrl = `https://storage.googleapis.com/${this.bucketName}/${bucketPath}`;
            } else {
              // Generate signed URL for private access (valid for 1 hour)
              const [url] = await fileRef.getSignedUrl({
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000, // 1 hour
              });
              downloadUrl = url;
            }

            const metadata: FileMetadata = {
              originalName: file.originalname,
              fileName: bucketPath.split('/').pop() || fileId,
              fileSize: file.size,
              contentType: file.mimetype,
              uploadedBy: options.userId,
              uploadedAt: new Date(),
              downloadUrl,
              bucketPath,
            };

            // Store file metadata in Firestore
            await this.storeFileMetadata(fileId, metadata, options);

            const result: FileUploadResult = {
              fileId,
              downloadUrl,
              metadata,
            };

            this.logger.log(`File uploaded successfully: ${fileId}`);
            resolve(result);
          } catch (error) {
            this.logger.error('Failed to process uploaded file', error);
            reject(error);
          }
        });

        stream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('File upload error', error);
      throw error;
    }
  }

  /**
   * Download a file by its ID
   */
  async getFile(
    fileId: string
  ): Promise<{ metadata: FileMetadata; downloadUrl: string }> {
    try {
      // Get file metadata from Firestore
      const metadataDoc = await this.firebaseService.getDocument(
        'file_metadata',
        fileId
      );

      if (!metadataDoc.exists) {
        throw new Error(`File metadata not found for ID: ${fileId}`);
      }

      const metadata = metadataDoc.data() as FileMetadata;
      const fileRef = this.bucket.file(metadata.bucketPath);

      // Check if file exists
      const [exists] = await fileRef.exists();
      if (!exists) {
        throw new Error(`File not found in storage: ${metadata.bucketPath}`);
      }

      // Generate new signed URL
      const [downloadUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      return {
        metadata,
        downloadUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to get file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      // Get file metadata
      const metadataDoc = await this.firebaseService.getDocument(
        'file_metadata',
        fileId
      );

      if (!metadataDoc.exists) {
        throw new Error(`File metadata not found for ID: ${fileId}`);
      }

      const metadata = metadataDoc.data() as FileMetadata;

      // Check if user has permission to delete
      if (metadata.uploadedBy !== userId) {
        throw new Error('Unauthorized to delete this file');
      }

      // Delete file from storage
      const fileRef = this.bucket.file(metadata.bucketPath);
      await fileRef.delete();

      // Delete metadata from Firestore
      await this.firebaseService.deleteDocument('file_metadata', fileId);

      this.logger.log(`File deleted successfully: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Get files by user ID
   */
  async getFilesByUser(userId: string): Promise<FileMetadata[]> {
    try {
      const snapshot = await this.firebaseService.getDocumentsByField(
        'file_metadata',
        'uploadedBy',
        userId
      );

      return snapshot.docs.map(
        doc =>
          ({
            ...doc.data(),
            id: doc.id,
          }) as unknown
      ) as FileMetadata[];
    } catch (error) {
      this.logger.error(`Failed to get files for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get files by project ID
   */
  async getFilesByProject(projectId: string): Promise<FileMetadata[]> {
    try {
      const snapshot = await this.firebaseService.getDocumentsByField(
        'file_metadata',
        'projectId',
        projectId
      );

      return snapshot.docs.map(
        doc =>
          ({
            ...doc.data(),
            id: doc.id,
          }) as unknown
      ) as FileMetadata[];
    } catch (error) {
      this.logger.error(`Failed to get files for project ${projectId}`, error);
      throw error;
    }
  }

  /**
   * Get files by category
   */
  async getFilesByCategory(
    category: string,
    userId?: string
  ): Promise<FileMetadata[]> {
    try {
      let snapshot;

      if (userId) {
        // Get user's files in specific category
        snapshot = await this.firebaseService.getDocuments(
          'file_metadata',
          query =>
            query
              .where('category', '==', category)
              .where('uploadedBy', '==', userId)
        );
      } else {
        // Get all files in category (admin only)
        snapshot = await this.firebaseService.getDocumentsByField(
          'file_metadata',
          'category',
          category
        );
      }

      return snapshot.docs.map(
        doc =>
          ({
            ...doc.data(),
            id: doc.id,
          }) as unknown
      ) as FileMetadata[];
    } catch (error) {
      this.logger.error(`Failed to get files for category ${category}`, error);
      throw error;
    }
  }

  /**
   * Generate bucket path based on category and options
   */
  private generateBucketPath(
    options: FileUploadOptions,
    fileId: string,
    timestamp: string
  ): string {
    const { userId, category, projectId, customPath } = options;

    if (customPath) {
      return customPath;
    }

    const sanitizedFileName = `${fileId}_${timestamp}`;

    switch (category) {
      case 'kyc':
        return `users/${userId}/kyc-documents/${sanitizedFileName}`;
      case 'identity':
        return `users/${userId}/identity-verification/${sanitizedFileName}`;
      case 'profile':
        return `users/${userId}/profile-assets/${sanitizedFileName}`;
      case 'project-legal':
        return `projects/${projectId}/legal-documents/${sanitizedFileName}`;
      case 'project-financial':
        return `projects/${projectId}/financial-reports/${sanitizedFileName}`;
      case 'project-marketing':
        return `projects/${projectId}/marketing-assets/${sanitizedFileName}`;
      case 'platform':
        return `platform/system-assets/${sanitizedFileName}`;
      case 'temp':
        return `temp/uploads/${userId}/${sanitizedFileName}`;
      default:
        return `misc/${userId}/${sanitizedFileName}`;
    }
  }

  /**
   * Store file metadata in Firestore
   */
  private async storeFileMetadata(
    fileId: string,
    metadata: FileMetadata,
    options: FileUploadOptions
  ): Promise<void> {
    try {
      const metadataDoc = {
        ...metadata,
        category: options.category,
        ...(options.projectId && { projectId: options.projectId }),
        createdAt: this.firebaseService.getTimestamp(),
        updatedAt: this.firebaseService.getTimestamp(),
      };

      await this.firebaseService.setDocument(
        'file_metadata',
        fileId,
        metadataDoc
      );

      // Also add to user's files subcollection for easy access
      await this.firebaseService.addToSubcollection(
        'users',
        options.userId,
        'files',
        {
          fileId,
          category: options.category,
          originalName: metadata.originalName,
          contentType: metadata.contentType,
          fileSize: metadata.fileSize,
          uploadedAt: metadata.uploadedAt,
          ...(options.projectId && { projectId: options.projectId }),
        }
      );
    } catch (error) {
      this.logger.error('Failed to store file metadata', error);
      throw error;
    }
  }

  /**
   * Generate signed URL for existing file
   */
  async generateSignedUrl(
    bucketPath: string,
    expiration: number = 3600000 // 1 hour in milliseconds
  ): Promise<string> {
    try {
      const fileRef = this.bucket.file(bucketPath);
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiration,
      });
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for ${bucketPath}`,
        error
      );
      throw error;
    }
  }

  /**
   * Health check for Firebase Storage
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.bucket.exists();
      return true;
    } catch (error) {
      this.logger.error('Firebase Storage health check failed', error);
      return false;
    }
  }
}
