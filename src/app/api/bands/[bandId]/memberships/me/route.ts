import { NextRequest, NextResponse } from 'next/server';
import { apiError, isAuthenticatedUser, sessionExpiredError } from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { BandAccessError, requireActiveBandMembership } from '@/utils/band-access';
import { listBandPermissionsByRole } from '@/utils/band-permissions';

type MembershipRouteContext = { params: Promise<{ bandId: string }> };

export async function GET(_req: NextRequest, ctx: MembershipRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId } = await ctx.params;
    const membership = await requireActiveBandMembership(user.id, bandId);

    return NextResponse.json({
      membership: {
        id: membership.id,
        userId: membership.userId,
        bandId: membership.bandId,
        role: membership.role,
        status: membership.status,
        acceptedAt: membership.acceptedAt ?? null,
      },
      permissions: listBandPermissionsByRole(membership.role),
    });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}
