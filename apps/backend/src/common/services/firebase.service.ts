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
      const firebaseConfig = {
        projectId: this.configService.get('firebase.projectId'),
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

  // Batch operations
  getBatch() {
    return this.firestore.batch();
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
}
