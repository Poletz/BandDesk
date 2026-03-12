import admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';

declare global {
  var __betterAuthFirestore: ReturnType<typeof admin.initializeApp> | undefined;
}

const firestore =
  global.__betterAuthFirestore ??
  (global.__betterAuthFirestore = admin.initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID!,
    },
    'better-auth'
  ));

if (!global.__betterAuthFirestore) {
  admin.firestore(admin.app('better-auth')).settings({ ignoreUndefinedProperties: true });
}

export const db = firestore.firestore();
