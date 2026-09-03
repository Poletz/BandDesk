import { z } from 'zod/v4';
import {
  ALLOWED_AVATAR_CONTENT_TYPES,
  ALLOWED_CONTENT_TYPES,
  MAX_AVATAR_SIZE_BYTES,
  MAX_FILE_SIZE_BYTES,
} from '@/utils/storage';

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === '' ? undefined : val), schema);

const valueToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === undefined || val === '' ? null : val), schema);

export const bandRoleSchema = z.enum(['admin', 'member', 'guest']);
export const bandMembershipStatusSchema = z.enum(['active', 'invited', 'disabled']);
export const bandVisibilitySchema = z.enum(['public', 'private']);
export const bandInviteStatusSchema = z.enum(['pending', 'accepted', 'revoked', 'expired']);
export const setlistStatusSchema = z.enum(['draft', 'published']);

export const bandSocialLinksSchema = z.object({
  instagram: z.string().trim().nullable().optional(),
  facebook: z.string().trim().nullable().optional(),
  youtube: z.string().trim().nullable().optional(),
  spotify: z.string().trim().nullable().optional(),
  tiktok: z.string().trim().nullable().optional(),
  website: z.string().trim().nullable().optional(),
});

export const bandSchema = z.object({
  name: z.string().trim().min(2),
  bio: z.string().trim().nullable().optional(),
  genres: z.array(z.string().trim().min(1)).max(10).default([]),
  city: z.string().trim().nullable().optional(),
  socials: bandSocialLinksSchema.nullable().optional(),
  image: z.string().trim().nullable().optional(),
  visibility: bandVisibilitySchema.default('private'),
  createdByUserId: z.string().trim().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const bandResponseSchema = bandSchema.extend({
  id: z.string().trim().min(1),
});

export const bandMembershipSchema = z.object({
  userId: z.string().trim().min(1),
  bandId: z.string().trim().min(1),
  role: bandRoleSchema,
  status: bandMembershipStatusSchema,
  invitedByUserId: z.string().trim().nullable().optional(),
  invitedAt: z.string().nullable().optional(),
  acceptedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const bandMembershipResponseSchema = bandMembershipSchema.extend({
  id: z.string().trim().min(1),
});

export const bandInviteSchema = z.object({
  bandId: z.string().trim().min(1),
  email: z.email(),
  emailLower: z.email(),
  role: bandRoleSchema,
  status: bandInviteStatusSchema,
  tokenHash: z.string().trim().min(16),
  expiresAt: z.string(),
  invitedByUserId: z.string().trim().min(1),
  invitedAt: z.string(),
  acceptedAt: z.string().nullable().optional(),
  acceptedByUserId: z.string().trim().nullable().optional(),
  revokedAt: z.string().nullable().optional(),
});

export const setlistSongSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  artist: z.string().trim().nullable().optional(),
  key: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  position: z.number().int().min(1),
});

export const setlistSchema = z.object({
  bandId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  status: setlistStatusSchema,
  songs: z.array(setlistSongSchema).default([]),
  createdByUserId: z.string().trim().min(1),
  lastModifiedByUserId: z.string().trim().min(1),
  lastModifiedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const setlistResponseSchema = setlistSchema.extend({
  id: z.string().trim().min(1),
});

const setlistSongInputSchema = z.object({
  id: emptyToUndefined(z.string().trim().min(1).optional()),
  title: z.string().trim().min(1, { error: 'Song title is required' }),
  artist: valueToNull(z.string().trim().nullable()).optional(),
  key: valueToNull(z.string().trim().nullable()).optional(),
  notes: valueToNull(z.string().trim().nullable()).optional(),
});

export const createBandSchema = z.object({
  name: z.string().trim().min(2, { error: 'Band name must be at least 2 characters' }),
  bio: valueToNull(z.string().trim().nullable()).optional(),
  genres: z.array(z.string().trim().min(1)).max(10).default([]),
  city: valueToNull(z.string().trim().nullable()).optional(),
  socials: z
    .object({
      instagram: valueToNull(z.string().trim().nullable()).optional(),
      facebook: valueToNull(z.string().trim().nullable()).optional(),
      youtube: valueToNull(z.string().trim().nullable()).optional(),
      spotify: valueToNull(z.string().trim().nullable()).optional(),
      tiktok: valueToNull(z.string().trim().nullable()).optional(),
      website: valueToNull(z.string().trim().nullable()).optional(),
    })
    .optional(),
  visibility: bandVisibilitySchema.default('private'),
});

export const patchBandSchema = z.object({
  bio: valueToNull(z.string().trim().nullable()).optional(),
  genres: z.array(z.string().trim().min(1)).max(10).optional(),
  city: valueToNull(z.string().trim().nullable()).optional(),
  socials: z
    .object({
      instagram: valueToNull(z.string().trim().nullable()).optional(),
      facebook: valueToNull(z.string().trim().nullable()).optional(),
      youtube: valueToNull(z.string().trim().nullable()).optional(),
      spotify: valueToNull(z.string().trim().nullable()).optional(),
      tiktok: valueToNull(z.string().trim().nullable()).optional(),
      website: valueToNull(z.string().trim().nullable()).optional(),
    })
    .optional(),
});

export const requestAvatarUploadUrlSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(ALLOWED_AVATAR_CONTENT_TYPES, {
    error: 'File type not allowed',
  }),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_AVATAR_SIZE_BYTES, { error: 'File too large (max 5 MB)' }),
});

export const commitAvatarSchema = z.object({
  key: z.string().trim().min(1),
});

export const setActiveBandSchema = z.object({
  bandId: z.string().trim().min(1, { error: 'bandId is required' }),
});

export const createBandInviteSchema = z.object({
  email: z.email({ error: 'Invalid email' }),
  role: bandRoleSchema,
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const patchBandInviteSchema = z.object({
  action: z.enum(['revoke', 'resend']),
  role: bandRoleSchema.optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7).optional(),
});

export const acceptBandInviteSchema = z.object({
  token: z.string().trim().min(16, { error: 'Invalid invite token' }),
});

export const createSetlistSchema = z.object({
  title: z.string().trim().min(2, { error: 'Setlist title must be at least 2 characters' }),
  status: setlistStatusSchema.default('draft'),
  songs: z.array(setlistSongInputSchema).default([]),
});

export const patchSetlistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { error: 'Setlist title must be at least 2 characters' })
    .optional(),
  status: setlistStatusSchema.optional(),
  songs: z.array(setlistSongInputSchema).optional(),
});

// #region DOCUMENTS
export const documentCategorySchema = z.enum([
  'technical-rider',
  'stage-plot',
  'agibility',
  'siae',
  'songbook',
  'other',
]);

export const documentVisibilitySchema = z.enum(['public', 'members', 'admins']);

export const bandDocumentSchema = z.object({
  bandId: z.string().min(1),
  bucket: z.string().min(1),
  key: z.string().min(1),
  title: z.string().min(1),
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  contentType: z.string().min(1),
  category: documentCategorySchema,
  visibility: documentVisibilitySchema,
  uploadedByUserId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const bandDocumentResponseSchema = bandDocumentSchema.extend({
  id: z.string().min(1),
});

export const requestUploadUrlSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(ALLOWED_CONTENT_TYPES, {
    error: 'File type not allowed',
  }),
  category: documentCategorySchema,
  title: z.string().trim().min(1, { error: 'Title is required' }).max(100),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE_BYTES, { error: 'File too large (max 10 MB)' }),
});

export const createDocumentSchema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  category: documentCategorySchema,
  title: z.string().trim().min(1).max(100),
  fileSizeBytes: z.number().int().positive(),
  visibility: documentVisibilitySchema.default('members'),
});
// #endregion

export type CreateBandInput = z.infer<typeof createBandSchema>;
export type PatchBandInput = z.infer<typeof patchBandSchema>;
export type CreateBandInviteInput = z.infer<typeof createBandInviteSchema>;
export type CreateSetlistInput = z.infer<typeof createSetlistSchema>;
export type PatchSetlistInput = z.infer<typeof patchSetlistSchema>;
export type RequestAvatarUploadUrlInput = z.infer<typeof requestAvatarUploadUrlSchema>;
