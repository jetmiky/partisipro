import { registerAs } from '@nestjs/config';
import serviceAccount from '../../firebase-service-account.json';

export default registerAs('firebase', () => ({
  projectId: process.env._FIREBASE_PROJECT_ID,
  privateKey: process.env._FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env._FIREBASE_CLIENT_EMAIL,
  databaseURL: process.env._FIREBASE_DATABASE_URL,
  storageBucket:
    process.env._FIREBASE_STORAGE_BUCKET ||
    `${process.env._FIREBASE_PROJECT_ID}.appspot.com`,
}));
