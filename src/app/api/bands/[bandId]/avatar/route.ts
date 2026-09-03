import { NextRequest, NextResponse } from 'next/server';
import {
  apiError,
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { BandAccessError, requireBandPermission } from '@/utils/band-access';
import { bandsDB } from '@/utils/band-collections';
import { BAND_PERMISSIONS } from '@/utils/band-permissions';
import { makeFilePublic } from '@/utils/storage';
import { commitAvatarSchema } from '@/utils/zod-band';

type Context = { params: Promise<{ bandId: string }> };

export async function POST(req: NextRequest, ctx: Context) {
  const { user } = await getServerSession();
  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const { bandId } = await ctx.params;

  try {
    await requireBandPermission(user.id, bandId, BAND_PERMISSIONS.BAND_PROFILE_WRITE);

    const rawData = await req.json();
    const parsed = commitAvatarSchema.safeParse(rawData);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    if (!parsed.data.key.startsWith(`bands/${bandId}/`)) {
      return apiError('You cannot access this item.', 'UNAUTHORIZED', 403);
    }

    const url = await makeFilePublic(parsed.data.key);

    await bandsDB.doc(bandId).update({
      image: url,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }
    console.error(err);
    return NextResponse.error();
  }
}
