import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import {
  apiError,
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { dbUsers, getServerSession } from '@/utils/auth';
import { BandAccessError, requireBandPermission } from '@/utils/band-access';
import { auditLogsDB, bandInvitesDB, bandMembershipsDB, bandsDB } from '@/utils/band-collections';
import { BAND_PERMISSIONS } from '@/utils/band-permissions';
import { buildInviteAcceptUrl, sendBandInviteEmail } from '@/utils/invite-email';
import { bandInviteSchema, bandMembershipSchema, createBandInviteSchema } from '@/utils/zod-band';

type BandInviteRouteContext = { params: Promise<{ bandId: string }> };

const hashInviteToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function GET(_req: NextRequest, ctx: BandInviteRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId } = await ctx.params;
    await requireBandPermission(user.id, bandId, BAND_PERMISSIONS.BAND_INVITES_MANAGE);

    const invitesSnapshot = await bandInvitesDB.where('bandId', '==', bandId).get();
    const invites = invitesSnapshot.docs
      .map((doc) => {
        const invite = bandInviteSchema.parse(doc.data());
        return {
          id: doc.id,
          bandId: invite.bandId,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiresAt: invite.expiresAt,
          invitedByUserId: invite.invitedByUserId,
          invitedAt: invite.invitedAt,
          acceptedAt: invite.acceptedAt ?? null,
          acceptedByUserId: invite.acceptedByUserId ?? null,
          revokedAt: invite.revokedAt ?? null,
        };
      })
      .sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));

    return NextResponse.json({ invites });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}

export async function POST(req: NextRequest, ctx: BandInviteRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId } = await ctx.params;
    await requireBandPermission(user.id, bandId, BAND_PERMISSIONS.BAND_INVITES_MANAGE);

    const bandSnapshot = await bandsDB.doc(bandId).get();
    if (!bandSnapshot.exists) {
      return apiError('Band not found', 'NOT_FOUND', 404);
    }

    const rawData = await req.json();
    const parsedData = createBandInviteSchema.safeParse(rawData);
    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    const now = dayjs();
    const inviteeEmail = parsedData.data.email.toLowerCase();
    const expiresAt = now.add(parsedData.data.expiresInDays, 'day').toISOString();

    const existingInvitesSnapshot = await bandInvitesDB
      .where('bandId', '==', bandId)
      .where('emailLower', '==', inviteeEmail)
      .get();

    const hasPendingInvite = existingInvitesSnapshot.docs.some((doc) => {
      const invite = bandInviteSchema.parse(doc.data());
      return invite.status === 'pending' && dayjs(invite.expiresAt).isAfter(now);
    });

    if (hasPendingInvite) {
      return apiError('An active invite already exists for this email.', 'VALIDATION_ERROR', 409);
    }

    const activeMembershipsSnapshot = await bandMembershipsDB
      .where('bandId', '==', bandId)
      .where('status', '==', 'active')
      .get();

    if (!activeMembershipsSnapshot.empty) {
      const memberUserDocs = await Promise.all(
        activeMembershipsSnapshot.docs.map((doc) => {
          const membership = bandMembershipSchema.parse(doc.data());
          return dbUsers.doc(membership.userId).get();
        })
      );

      const inviteeIsAlreadyMember = memberUserDocs.some((doc) => {
        const email = doc.data()?.email;
        return typeof email === 'string' && email.toLowerCase() === inviteeEmail;
      });

      if (inviteeIsAlreadyMember) {
        return apiError('This user is already active in the band.', 'VALIDATION_ERROR', 409);
      }
    }

    const inviteToken = randomBytes(32).toString('hex');
    const inviteTokenHash = hashInviteToken(inviteToken);
    const inviteRef = bandInvitesDB.doc();

    await inviteRef.set({
      bandId,
      email: parsedData.data.email,
      emailLower: inviteeEmail,
      role: parsedData.data.role,
      status: 'pending',
      tokenHash: inviteTokenHash,
      expiresAt,
      invitedByUserId: user.id,
      invitedAt: now.toISOString(),
      acceptedAt: null,
      acceptedByUserId: null,
      revokedAt: null,
    });

    const acceptUrl = buildInviteAcceptUrl(inviteToken);
    const bandData = bandSnapshot.data();
    const bandName = typeof bandData?.name === 'string' ? bandData.name : 'Band';

    const sendMailResult = await sendBandInviteEmail({
      toEmail: parsedData.data.email,
      invitedByName: user.name || user.email || 'Band admin',
      bandName,
      acceptUrl,
      role: parsedData.data.role,
      expiresAt,
    });

    await auditLogsDB.add({
      bandId,
      actorUserId: user.id,
      action: 'invite.sent',
      entityType: 'band_invite',
      entityId: inviteRef.id,
      metadata: {
        email: inviteeEmail,
        role: parsedData.data.role,
        expiresAt,
        emailDelivery: sendMailResult.sent ? 'sent' : 'not_sent',
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      inviteId: inviteRef.id,
      expiresAt,
      emailSent: sendMailResult.sent,
      acceptUrl,
      ...(sendMailResult.sent ? {} : { emailWarning: sendMailResult.reason }),
    });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}
