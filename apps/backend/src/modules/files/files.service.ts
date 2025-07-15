import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  FirebaseStorageService,
  FileMetadata,
} from '../../common/services/firebase-storage.service';
import {
  UploadFileDto,
  FileUploadResponseDto,
  FileDownloadResponseDto,
  FileListResponseDto,
  GetFilesDto,
} from './dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly firebaseStorageService: FirebaseStorageService
  ) {}

  /**
   * Upload a file
   */
  async uploadFile(
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
    userId: string
  ): Promise<FileUploadResponseDto> {
    try {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new HttpException(
          'File size exceeds 10MB limit',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        throw new HttpException(
          'Invalid file type. Only images, PDFs, Word documents, Excel files, and text files are allowed.',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate project ID for project-related files
      if (
        ['project-legal', 'project-financial', 'project-marketing'].includes(
          uploadFileDto.category
        ) &&
        !uploadFileDto.projectId
      ) {
        throw new HttpException(
          'Project ID is required for project-related files',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.firebaseStorageService.uploadFile(file, {
        userId,
        category: uploadFileDto.category,
        projectId: uploadFileDto.projectId,
        customPath: uploadFileDto.customPath,
        makePublic: uploadFileDto.makePublic,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to upload file', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to upload file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get file by ID
   */
  async getFile(
    fileId: string,
    userId: string,
    userRole: string
  ): Promise<FileDownloadResponseDto> {
    try {
      const result = await this.firebaseStorageService.getFile(fileId);

      // Check if user has permission to access this file
      if (userRole !== 'admin' && result.metadata.uploadedBy !== userId) {
        throw new HttpException(
          'Unauthorized to access this file',
          HttpStatus.FORBIDDEN
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to get file ${fileId}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Delete file by ID
   */
  async deleteFile(
    fileId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    try {
      // For non-admin users, they can only delete their own files
      if (userRole !== 'admin') {
        await this.firebaseStorageService.deleteFile(fileId, userId);
      } else {
        // Admin can delete any file, but we need to get the metadata first
        const { metadata } = await this.firebaseStorageService.getFile(fileId);
        await this.firebaseStorageService.deleteFile(
          fileId,
          metadata.uploadedBy
        );
      }
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileId}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get user files
   */
  async getUserFiles(
    userId: string,
    category?: string
  ): Promise<FileListResponseDto> {
    try {
      let files: FileMetadata[];

      if (category) {
        files = await this.firebaseStorageService.getFilesByCategory(
          category,
          userId
        );
      } else {
        files = await this.firebaseStorageService.getFilesByUser(userId);
      }

      return {
        files,
        total: files.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get files for user ${userId}`, error);
      throw new HttpException(
        'Failed to get user files',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get project files
   */
  async getProjectFiles(
    projectId: string,
    userId: string,
    userRole: string,
    category?: string
  ): Promise<FileListResponseDto> {
    try {
      // TODO: Add project access validation here
      // For now, we'll allow all authenticated users to access project files
      // In a real implementation, check if user has access to the project

      let files: FileMetadata[];

      if (category) {
        files = await this.firebaseStorageService.getFilesByCategory(category);
        // Filter by project ID
        files = files.filter(file => (file as any).projectId === projectId);
      } else {
        files = await this.firebaseStorageService.getFilesByProject(projectId);
      }

      return {
        files,
        total: files.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get files for project ${projectId}`, error);
      throw new HttpException(
        'Failed to get project files',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get files by category
   */
  async getFilesByCategory(
    category: string,
    userId: string,
    userRole: string,
    filterUserId?: string
  ): Promise<FileListResponseDto> {
    try {
      let files: FileMetadata[];

      if (userRole === 'admin') {
        // Admins can see all files in category
        files = await this.firebaseStorageService.getFilesByCategory(
          category,
          filterUserId
        );
      } else {
        // Regular users can only see their own files
        files = await this.firebaseStorageService.getFilesByCategory(
          category,
          userId
        );
      }

      return {
        files,
        total: files.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get files for category ${category}`, error);
      throw new HttpException(
        'Failed to get files by category',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all files (admin only)
   */
  async getAllFiles(query: GetFilesDto): Promise<FileListResponseDto> {
    try {
      let files: FileMetadata[];

      if (query.category) {
        files = await this.firebaseStorageService.getFilesByCategory(
          query.category,
          query.userId
        );
      } else if (query.projectId) {
        files = await this.firebaseStorageService.getFilesByProject(
          query.projectId
        );
      } else if (query.userId) {
        files = await this.firebaseStorageService.getFilesByUser(query.userId);
      } else {
        // For now, we'll return empty array for getting all files
        // In a real implementation, this would need pagination
        files = [];
      }

      return {
        files,
        total: files.length,
      };
    } catch (error) {
      this.logger.error('Failed to get all files', error);
      throw new HttpException(
        'Failed to get all files',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Regenerate signed URL for file
   */
  async regenerateSignedUrl(
    fileId: string,
    userId: string,
    userRole: string
  ): Promise<{ downloadUrl: string }> {
    try {
      const { metadata } = await this.firebaseStorageService.getFile(fileId);

      // Check if user has permission to access this file
      if (userRole !== 'admin' && metadata.uploadedBy !== userId) {
        throw new HttpException(
          'Unauthorized to access this file',
          HttpStatus.FORBIDDEN
        );
      }

      const downloadUrl = await this.firebaseStorageService.generateSignedUrl(
        metadata.bucketPath,
        3600000 // 1 hour
      );

      return { downloadUrl };
    } catch (error) {
      this.logger.error(`Failed to regenerate URL for file ${fileId}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to regenerate signed URL',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
