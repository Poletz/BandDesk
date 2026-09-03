import { getStorage } from 'firebase-admin/storage';
import { betterAuthApp } from '@/utils/db';

export const getStorageBucket = () => {
  return getStorage(betterAuthApp).bucket(process.env.FIREBASE_STORAGE_BUCKET!);
};

export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_AVATAR_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export type AllowedAvatarContentType = (typeof ALLOWED_AVATAR_CONTENT_TYPES)[number];

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const getSignedUploadUrl = async (key: string, contentType: string): Promise<string> => {
  const bucket = getStorageBucket();
  const [url] = await bucket.file(key).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 min
    contentType,
  });
  return url;
};

export const getSignedDownloadUrl = async (key: string): Promise<string> => {
  const bucket = getStorageBucket();
  const [url] = await bucket.file(key).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });
  return url;
};

export const deleteStorageFile = async (key: string): Promise<void> => {
  const bucket = getStorageBucket();
  await bucket.file(key).delete({ ignoreNotFound: true });
};

export const getPublicUrl = (key: string): string => {
  const bucket = getStorageBucket();
  return `https://storage.googleapis.com/${bucket.name}/${key}`;
};

export const makeFilePublic = async (key: string): Promise<string> => {
  const bucket = getStorageBucket();
  await bucket.file(key).makePublic();
  return getPublicUrl(key);
};
