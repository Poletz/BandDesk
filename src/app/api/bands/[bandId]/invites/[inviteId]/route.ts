import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import {
  apiError,
  isAuthenticatedUser,
  notFoundError,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { BandAccessError, requireBandPermission } from '@/utils/band-access';
import { auditLogsDB, bandInvitesDB, bandsDB } from '@/utils/band-collections';
import { BAND_PERMISSIONS } from '@/utils/band-permissions';
import { buildInviteAcceptUrl, sendBandInviteEmail } from '@/utils/invite-email';
import { bandInviteSchema, patchBandInviteSchema } from '@/utils/zod-band';

type BandInviteByIdRouteContext = { params: Promise<{ bandId: string; inviteId: string }> };

const hashInviteToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function PATCH(req: NextRequest, ctx: BandInviteByIdRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId, inviteId } = await ctx.params;
    await requireBandPermission(user.id, bandId, BAND_PERMISSIONS.BAND_INVITES_MANAGE);

    const rawData = await req.json();
    const parsedData = patchBandInviteSchema.safeParse(rawData);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    const inviteRef = bandInvitesDB.doc(inviteId);
    const inviteSnapshot = await inviteRef.get();

    if (!inviteSnapshot.exists) {
      return notFoundError('Invite');
    }

    const invite = bandInviteSchema.parse(inviteSnapshot.data());

    if (invite.bandId !== bandId) {
      return notFoundError('Invite');
    }

    if (parsedData.data.action === 'revoke') {
      if (invite.status !== 'pending') {
        return apiError('Only pending invites can be revoked.', 'VALIDATION_ERROR', 400);
      }

      const revokedAt = new Date().toISOString();
      await inviteRef.update({
        status: 'revoked',
        revokedAt,
      });

      await auditLogsDB.add({
        bandId,
        actorUserId: user.id,
        action: 'invite.revoked',
        entityType: 'band_invite',
        entityId: inviteId,
        metadata: {
          email: invite.emailLower,
        },
        createdAt: revokedAt,
      });

      return NextResponse.json({ ok: true, status: 'revoked' });
    }

    const inviteToken = randomBytes(32).toString('hex');
    const inviteTokenHash = hashInviteToken(inviteToken);
    const expiresAt = dayjs().add(parsedData.data.expiresInDays ?? 7, 'day').toISOString();

    await inviteRef.update({
      role: parsedData.data.role ?? invite.role,
      status: 'pending',
      tokenHash: inviteTokenHash,
      expiresAt,
      invitedByUserId: user.id,
      invitedAt: new Date().toISOString(),
      acceptedAt: null,
      acceptedByUserId: null,
      revokedAt: null,
    });

    const bandDoc = await bandsDB.doc(bandId).get();
    const bandName = bandDoc.data()?.name ?? 'Band';
    const acceptUrl = buildInviteAcceptUrl(inviteToken);

    const sendMailResult = await sendBandInviteEmail({
      toEmail: invite.email,
      invitedByName: user.name || user.email || 'Band admin',
      bandName,
      acceptUrl,
      role: parsedData.data.role ?? invite.role,
      expiresAt,
    });

    await auditLogsDB.add({
      bandId,
      actorUserId: user.id,
      action: 'invite.resent',
      entityType: 'band_invite',
      entityId: inviteId,
      metadata: {
        email: invite.emailLower,
        role: parsedData.data.role ?? invite.role,
        expiresAt,
        emailDelivery: sendMailResult.sent ? 'sent' : 'not_sent',
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      status: 'pending',
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
