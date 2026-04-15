export type BandRole = 'admin' | 'member' | 'guest';
export type BandMembershipStatus = 'active' | 'invited' | 'disabled';
export type BandVisibility = 'public' | 'private';
export type BandInviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type SetlistStatus = 'draft' | 'published';
export type BandDocumentVisibility = 'public' | 'members' | 'admins';

export interface BandSocialLinks {
  instagram?: string | null;
  youtube?: string | null;
  spotify?: string | null;
  tiktok?: string | null;
  website?: string | null;
}

export interface Band {
  id: string;
  name: string;
  bio?: string | null;
  genres: string[];
  city?: string | null;
  socials?: BandSocialLinks | null;
  visibility: BandVisibility;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BandMembership {
  id: string;
  userId: string;
  bandId: string;
  role: BandRole;
  status: BandMembershipStatus;
  invitedByUserId?: string | null;
  invitedAt?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BandInvite {
  id: string;
  bandId: string;
  email: string;
  emailLower: string;
  role: BandRole;
  status: BandInviteStatus;
  tokenHash: string;
  expiresAt: string;
  invitedByUserId: string;
  invitedAt: string;
  acceptedAt?: string | null;
  acceptedByUserId?: string | null;
  revokedAt?: string | null;
}

export interface SetlistSong {
  id: string;
  title: string;
  artist?: string | null;
  key?: string | null;
  notes?: string | null;
  position: number;
}

export interface Setlist {
  id: string;
  bandId: string;
  title: string;
  status: SetlistStatus;
  songs: SetlistSong[];
  createdByUserId: string;
  lastModifiedByUserId: string;
  lastModifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BandDocumentMeta {
  id: string;
  bandId: string;
  bucket: string;
  key: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
  category: string;
  visibility: BandDocumentVisibility;
  uploadedByUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
