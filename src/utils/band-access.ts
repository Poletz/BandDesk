import { BandMembership } from '@/interfaces/bands';
import { dbUsers } from '@/utils/auth';
import { bandMembershipsDB, buildBandMembershipDocId } from '@/utils/band-collections';
import { BAND_PERMISSIONS, BandPermission, hasBandPermission } from '@/utils/band-permissions';
import { ApiErrorCode } from '@/utils/http';
import { bandMembershipSchema } from '@/utils/zod-band';

export class BandAccessError extends Error {
  constructor(
    message: string,
    readonly status = 403,
    readonly code: ApiErrorCode = 'UNAUTHORIZED'
  ) {
    super(message);
  }
}

export const getBandMembership = async (
  userId: string,
  bandId: string
): Promise<BandMembership | null> => {
  const docId = buildBandMembershipDocId(bandId, userId);
  const doc = await bandMembershipsDB.doc(docId).get();

  if (!doc.exists) {
    return null;
  }

  const membership = bandMembershipSchema.parse(doc.data());
  return {
    id: doc.id,
    ...membership,
  };
};

export const requireActiveBandMembership = async (userId: string, bandId: string) => {
  const membership = await getBandMembership(userId, bandId);

  if (!membership || membership.status !== 'active') {
    throw new BandAccessError('You are not an active member of this band.');
  }

  return membership;
};

export const requireBandPermission = async (
  userId: string,
  bandId: string,
  permission: BandPermission
) => {
  const membership = await requireActiveBandMembership(userId, bandId);

  if (!hasBandPermission(membership.role, permission)) {
    throw new BandAccessError(`Missing permission: ${permission}`);
  }

  return membership;
};

export const listActiveMembershipsForUser = async (userId: string): Promise<BandMembership[]> => {
  const snapshot = await bandMembershipsDB
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  return snapshot.docs.map((doc) => {
    const membership = bandMembershipSchema.parse(doc.data());
    return {
      id: doc.id,
      ...membership,
    };
  });
};

export const resolveUserActiveBandId = async (userId: string) => {
  const [userDoc, memberships] = await Promise.all([
    dbUsers.doc(userId).get(),
    listActiveMembershipsForUser(userId),
  ]);

  const preferredBandId = userDoc.data()?.activeBandId;
  const activeBandIds = new Set(memberships.map((membership) => membership.bandId));

  if (typeof preferredBandId === 'string' && activeBandIds.has(preferredBandId)) {
    return preferredBandId;
  }

  return memberships[0]?.bandId ?? null;
};

export const canReadSetlist = (role: BandMembership['role'], status: 'draft' | 'published') => {
  if (status === 'published') {
    return (
      hasBandPermission(role, BAND_PERMISSIONS.SETLIST_READ_PUBLISHED) ||
      hasBandPermission(role, BAND_PERMISSIONS.SETLIST_READ_ALL)
    );
  }

  return hasBandPermission(role, BAND_PERMISSIONS.SETLIST_READ_ALL);
};
