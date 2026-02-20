import { headers as Headers } from 'next/headers';
import { betterAuth, Session, User } from 'better-auth';
import { firestoreAdapter } from 'better-auth-firestore';
import admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';
import { hashPassword, verifyPassword } from './password-utils';

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
const db = firestore.firestore();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },

  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  database: firestoreAdapter({
    firestore: db,
    debugLogs: true,
    namingStrategy: 'default',
    collections: {
      verificationTokens: 'verification',
      accounts: 'accounts',
      sessions: 'sessions',
      users: 'users',
    },
  }),
});

export const dbAccounts = db.collection('accounts');
export const dbUsers = db.collection('users');

export async function getServerSession(): Promise<{ session: Session | null; user: User | null }> {
  const headers = await Headers();
  const session = await auth.api.getSession({
    headers,
  });

  if (!session) {
    return { session: null, user: null };
  }
  return session;
}
