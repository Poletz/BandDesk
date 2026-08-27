import { cert, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

declare global {
  var __betterAuthFirestoreApp: App | undefined;
}

const isNewApp = !global.__betterAuthFirestoreApp;

export const betterAuthApp =
  global.__betterAuthFirestoreApp ??
  (global.__betterAuthFirestoreApp = initializeApp(
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

export const db = getFirestore(betterAuthApp);

if (isNewApp) {
  db.settings({ ignoreUndefinedProperties: true });
}
