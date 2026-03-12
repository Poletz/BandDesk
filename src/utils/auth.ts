import { headers as Headers } from 'next/headers';
import { betterAuth, Session, User } from 'better-auth';
import { firestoreAdapter } from 'better-auth-firestore';
import { db as firestore } from './db';
import { hashPassword, verifyPassword } from './password-utils';

const db = firestore;

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
