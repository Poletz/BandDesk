import { BandRole } from '@/interfaces/bands';

export const OWNER_RUNTIME_ROLE: BandRole = 'admin';

export const BAND_PERMISSIONS = {
  BAND_PROFILE_READ: 'band.profile.read',
  BAND_PROFILE_WRITE: 'band.profile.write',
  BAND_MEMBERS_READ: 'band.members.read',
  BAND_MEMBERS_MANAGE: 'band.members.manage',
  BAND_INVITES_MANAGE: 'band.invites.manage',
  BAND_SETTINGS_SENSITIVE_WRITE: 'band.settings.sensitive.write',
  SETLIST_READ_ALL: 'setlist.read.all',
  SETLIST_READ_PUBLISHED: 'setlist.read.published',
  SETLIST_WRITE: 'setlist.write',
  DOCUMENT_UPLOAD_OPERATIONAL: 'document.upload.operational',
  DOCUMENT_READ_PUBLIC: 'document.read.public',
  DOCUMENT_DELETE_SENSITIVE: 'document.delete.sensitive',
} as const;

export type BandPermission = (typeof BAND_PERMISSIONS)[keyof typeof BAND_PERMISSIONS];

const permissionMatrix: Record<BandRole, Set<BandPermission>> = {
  admin: new Set<BandPermission>([
    BAND_PERMISSIONS.BAND_PROFILE_READ,
    BAND_PERMISSIONS.BAND_PROFILE_WRITE,
    BAND_PERMISSIONS.BAND_MEMBERS_READ,
    BAND_PERMISSIONS.BAND_MEMBERS_MANAGE,
    BAND_PERMISSIONS.BAND_INVITES_MANAGE,
    BAND_PERMISSIONS.BAND_SETTINGS_SENSITIVE_WRITE,
    BAND_PERMISSIONS.SETLIST_READ_ALL,
    BAND_PERMISSIONS.SETLIST_READ_PUBLISHED,
    BAND_PERMISSIONS.SETLIST_WRITE,
    BAND_PERMISSIONS.DOCUMENT_UPLOAD_OPERATIONAL,
    BAND_PERMISSIONS.DOCUMENT_READ_PUBLIC,
    BAND_PERMISSIONS.DOCUMENT_DELETE_SENSITIVE,
  ]),
  member: new Set<BandPermission>([
    BAND_PERMISSIONS.BAND_PROFILE_READ,
    BAND_PERMISSIONS.SETLIST_READ_ALL,
    BAND_PERMISSIONS.SETLIST_READ_PUBLISHED,
    BAND_PERMISSIONS.SETLIST_WRITE,
    BAND_PERMISSIONS.DOCUMENT_UPLOAD_OPERATIONAL,
    BAND_PERMISSIONS.DOCUMENT_READ_PUBLIC,
  ]),
  guest: new Set<BandPermission>([
    BAND_PERMISSIONS.BAND_PROFILE_READ,
    BAND_PERMISSIONS.SETLIST_READ_PUBLISHED,
    BAND_PERMISSIONS.DOCUMENT_READ_PUBLIC,
  ]),
};

export const hasBandPermission = (role: BandRole, permission: BandPermission) => {
  return permissionMatrix[role].has(permission);
};

export const listBandPermissionsByRole = (role: BandRole): BandPermission[] => {
  return Array.from(permissionMatrix[role]);
};
