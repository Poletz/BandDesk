import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import {
  apiError,
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { dbUsers, getServerSession } from '@/utils/auth';
import { bandInvitesDB, bandMembershipsDB, buildBandMembershipDocId } from '@/utils/band-collections';
import { acceptBandInviteSchema, bandInviteSchema, bandMembershipSchema } from '@/utils/zod-band';

const hashInviteToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function POST(req: NextRequest) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const rawData = await req.json();
    const parsedData = acceptBandInviteSchema.safeParse(rawData);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    const tokenHash = hashInviteToken(parsedData.data.token);
    const invitesSnapshot = await bandInvitesDB.where('tokenHash', '==', tokenHash).limit(1).get();

    if (invitesSnapshot.empty) {
      return apiError('Invite token is invalid or expired.', 'NOT_FOUND', 404);
    }

    const inviteDoc = invitesSnapshot.docs[0];
    const invite = bandInviteSchema.parse(inviteDoc.data());

    if (invite.status === 'revoked') {
      return apiError('Invite has been revoked.', 'UNAUTHORIZED', 403);
    }

    if (invite.status !== 'pending') {
      return apiError('Invite has already been used.', 'VALIDATION_ERROR', 400);
    }

    if (dayjs(invite.expiresAt).isBefore(dayjs())) {
      await inviteDoc.ref.update({
        status: 'expired',
      });
      return apiError('Invite token is invalid or expired.', 'NOT_FOUND', 404);
    }

    const currentUserEmail = user.email?.toLowerCase();
    if (!currentUserEmail || currentUserEmail !== invite.emailLower) {
      return apiError('You are not authorized to accept this invite.', 'UNAUTHORIZED', 403);
    }

    const membershipId = buildBandMembershipDocId(invite.bandId, user.id);
    const membershipRef = bandMembershipsDB.doc(membershipId);
    const inviteRef = inviteDoc.ref;
    const now = new Date().toISOString();

    await bandInvitesDB.firestore.runTransaction(async (transaction) => {
      const [freshInviteSnapshot, membershipSnapshot] = await Promise.all([
        transaction.get(inviteRef),
        transaction.get(membershipRef),
      ]);

      if (!freshInviteSnapshot.exists) {
        throw new Error('Invite not found');
      }

      const freshInvite = bandInviteSchema.parse(freshInviteSnapshot.data());

      if (freshInvite.status !== 'pending') {
        throw new Error('Invite already used');
      }

      if (dayjs(freshInvite.expiresAt).isBefore(dayjs())) {
        transaction.update(inviteRef, {
          status: 'expired',
        });
        throw new Error('Invite expired');
      }

      if (membershipSnapshot.exists) {
        const membership = bandMembershipSchema.parse(membershipSnapshot.data());
        transaction.update(membershipRef, {
          role: freshInvite.role,
          status: 'active',
          acceptedAt: membership.acceptedAt ?? now,
          invitedAt: membership.invitedAt ?? freshInvite.invitedAt,
          invitedByUserId: membership.invitedByUserId ?? freshInvite.invitedByUserId,
          updatedAt: now,
        });
      } else {
        transaction.set(membershipRef, {
          bandId: freshInvite.bandId,
          userId: user.id,
          role: freshInvite.role,
          status: 'active',
          invitedByUserId: freshInvite.invitedByUserId,
          invitedAt: freshInvite.invitedAt,
          acceptedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }

      transaction.update(inviteRef, {
        status: 'accepted',
        acceptedAt: now,
        acceptedByUserId: user.id,
      });

      transaction.set(
        dbUsers.doc(user.id),
        {
          activeBandId: freshInvite.bandId,
        },
        { merge: true }
      );
    });

    return NextResponse.json({ ok: true, bandId: invite.bandId });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Invite already used') {
        return apiError('Invite has already been used.', 'VALIDATION_ERROR', 400);
      }
      if (err.message === 'Invite expired') {
        return apiError('Invite token is invalid or expired.', 'NOT_FOUND', 404);
      }
    }

    console.error(err);
    return NextResponse.error();
  }
}
