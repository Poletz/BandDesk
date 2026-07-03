import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  apiError,
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { BandAccessError, requireActiveBandMembership } from '@/utils/band-access';
import { getSignedUploadUrl } from '@/utils/storage';
import { requestUploadUrlSchema } from '@/utils/zod-band';

type Context = { params: Promise<{ bandId: string }> };

export async function POST(req: NextRequest, ctx: Context) {
  const { user } = await getServerSession();
  if (!isAuthenticatedUser(user)) return sessionExpiredError();

  const { bandId } = await ctx.params;

  try {
    await requireActiveBandMembership(user.id, bandId);

    const rawData = await req.json();
    const parsed = requestUploadUrlSchema.safeParse(rawData);
    if (!parsed.success) return validationError(parsed.error);

    // Sanitize filename: keep extension, replace unsafe chars
    const ext = parsed.data.fileName.split('.').pop() ?? '';
    const safeName = parsed.data.fileName
      .replace(/\.[^/.]+$/, '') // remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);
    const key = `bands/${bandId}/documents/${randomUUID()}-${safeName}${ext ? `.${ext}` : ''}`;

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
