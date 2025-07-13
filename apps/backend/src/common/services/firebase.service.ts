import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  Firestore,
  CollectionReference,
  DocumentData,
  Query,
  DocumentSnapshot,
  QuerySnapshot,
  WriteResult,
  FieldValue,
} from 'firebase-admin/firestore';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firestore: Firestore;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const projectId =
        this.configService.get('firebase.projectId') || 'partisipro-dev';

      // In development mode, use emulators
      if (isDevelopment) {
        this.logger.log('Development mode detected - using Firebase emulators');

        // Set emulator environment variables if not already set
        if (!process.env.FIRESTORE_EMULATOR_HOST) {
          process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
        }
        if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
          process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
        }

        // Initialize Firebase app with minimal config for emulators
        if (!admin.apps.length) {
          admin.initializeApp({
            projectId: projectId,
          });
        }

        this.firestore = admin.firestore();

        // Connect to Firestore emulator
        this.firestore.settings({
          host: 'localhost:8080',
          ssl: false,
        });

        this.logger.log('Firebase emulators initialized successfully');
      } else {
        // Production mode - use actual Firebase credentials
        const firebaseConfig = {
          projectId: projectId,
          privateKey: this.configService.get('firebase.privateKey'),
          clientEmail: this.configService.get('firebase.clientEmail'),
          databaseURL: this.configService.get('firebase.databaseURL'),
        };

        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
            databaseURL: firebaseConfig.databaseURL,
          });
        }

        this.firestore = admin.firestore();
        this.logger.log('Firebase Admin SDK initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      throw error;
    }
  }

  getFirestore(): Firestore {
    return this.firestore;
  }

  // Collection helpers
  collection(collectionName: string): CollectionReference<DocumentData> {
    return this.firestore.collection(collectionName);
  }

  // Document operations
  async getDocument(
    collectionName: string,
    documentId: string
  ): Promise<DocumentSnapshot> {
    return await this.collection(collectionName).doc(documentId).get();
  }

  async setDocument(
    collectionName: string,
    documentId: string,
    data: DocumentData,
    merge: boolean = false
  ): Promise<WriteResult> {
    return await this.collection(collectionName)
      .doc(documentId)
      .set(data, { merge });
  }

  async addDocument(
    collectionName: string,
    data: DocumentData
  ): Promise<string> {
    const docRef = await this.collection(collectionName).add(data);
    return docRef.id;
  }

  async updateDocument(
    collectionName: string,
    documentId: string,
    data: DocumentData
  ): Promise<WriteResult> {
    return await this.collection(collectionName).doc(documentId).update(data);
  }

  async deleteDocument(
    collectionName: string,
    documentId: string
  ): Promise<WriteResult> {
    return await this.collection(collectionName).doc(documentId).delete();
  }

  // Query operations
  async getDocuments(
    collectionName: string,
    queries?: (query: Query) => Query
  ): Promise<QuerySnapshot> {
    let collectionRef: Query = this.collection(collectionName);

    if (queries) {
      collectionRef = queries(collectionRef);
    }

    return await collectionRef.get();
  }

  async getDocumentsByField(
    collectionName: string,
    fieldName: string,
    value: unknown
  ): Promise<QuerySnapshot> {
    return await this.collection(collectionName)
      .where(fieldName, '==', value)
      .get();
  }

  async getDocumentsByQuery(
    collectionName: string,
    fieldName: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: unknown
  ): Promise<QuerySnapshot> {
    return await this.collection(collectionName)
      .where(fieldName, operator, value)
      .get();
  }

  // Transaction operations
  async runTransaction<T>(
    updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
  ): Promise<T> {
    return await this.firestore.runTransaction(updateFunction);
  }

  // Utility methods
  getTimestamp(): FieldValue {
    return admin.firestore.FieldValue.serverTimestamp();
  }

  increment(n: number): FieldValue {
    return admin.firestore.FieldValue.increment(n);
  }

  arrayUnion(...elements: unknown[]): FieldValue {
    return admin.firestore.FieldValue.arrayUnion(...elements);
  }

  arrayRemove(...elements: unknown[]): FieldValue {
    return admin.firestore.FieldValue.arrayRemove(...elements);
  }

  // Subcollection operations
  async getSubcollection(
    collectionName: string,
    documentId: string,
    subcollectionName: string
  ): Promise<QuerySnapshot> {
    return await this.collection(collectionName)
      .doc(documentId)
      .collection(subcollectionName)
      .get();
  }

  async addToSubcollection(
    collectionName: string,
    documentId: string,
    subcollectionName: string,
    data: DocumentData
  ): Promise<string> {
    const docRef = await this.collection(collectionName)
      .doc(documentId)
      .collection(subcollectionName)
      .add(data);
    return docRef.id;
  }

  // Pagination helpers
  async getPaginatedDocuments(
    collectionName: string,
    limit: number,
    startAfter?: DocumentSnapshot,
    orderBy?: string,
    direction: 'asc' | 'desc' = 'asc'
  ): Promise<QuerySnapshot> {
    let query = this.collection(collectionName).limit(limit);

    if (orderBy) {
      query = query.orderBy(orderBy, direction);
    }

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    return await query.get();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.firestore.collection('health').limit(1).get();
      return true;
    } catch (error) {
      this.logger.error('Firebase health check failed', error);
      return false;
    }
  }

  // Batch operations for DatabaseOptimizer
  getBatch(): FirebaseFirestore.WriteBatch {
    return this.firestore.batch();
  }

  getCollection(collectionName: string): CollectionReference {
    return this.firestore.collection(collectionName);
  }

  getDocumentReference(
    collectionName: string,
    documentId: string
  ): FirebaseFirestore.DocumentReference {
    return this.firestore.collection(collectionName).doc(documentId);
  }

  getNewDocumentReference(
    collectionName: string
  ): FirebaseFirestore.DocumentReference {
    return this.firestore.collection(collectionName).doc();
  }

  async getDocumentsByIds(
    collectionName: string,
    documentIds: string[]
  ): Promise<QuerySnapshot> {
    if (documentIds.length === 0) {
      // Return empty snapshot
      return await this.firestore
        .collection(collectionName)
        .where('__name__', 'in', [])
        .get();
    }

    // Firestore 'in' query supports up to 10 values
    const chunks = this.chunkArray(documentIds, 10);
    const snapshots: QuerySnapshot[] = [];

    for (const chunk of chunks) {
      const snapshot = await this.firestore
        .collection(collectionName)
        .where(
          '__name__',
          'in',
          chunk.map(id => this.firestore.doc(`${collectionName}/${id}`))
        )
        .get();
      snapshots.push(snapshot);
    }

    // Merge all snapshots
    const allDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    snapshots.forEach(snapshot => allDocs.push(...snapshot.docs));

    return {
      docs: allDocs,
      size: allDocs.length,
      empty: allDocs.length === 0,
    } as QuerySnapshot;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
