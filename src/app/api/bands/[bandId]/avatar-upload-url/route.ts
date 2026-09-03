import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  apiError,
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { BandAccessError, requireBandPermission } from '@/utils/band-access';
import { BAND_PERMISSIONS } from '@/utils/band-permissions';
import { getSignedUploadUrl } from '@/utils/storage';
import { requestAvatarUploadUrlSchema } from '@/utils/zod-band';

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
    const parsed = requestAvatarUploadUrlSchema.safeParse(rawData);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const ext = parsed.data.fileName.split('.').pop() ?? '';
    const key = `bands/${bandId}/avatar-${randomUUID()}${ext ? `.${ext}` : ''}`;

    const uploadUrl = await getSignedUploadUrl(key, parsed.data.contentType);

    return NextResponse.json({ uploadUrl, key });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }
    console.error(err);
    return NextResponse.error();
  }
}
