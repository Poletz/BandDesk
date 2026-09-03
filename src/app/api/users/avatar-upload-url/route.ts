import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { getSignedUploadUrl } from '@/utils/storage';
import { requestAvatarUploadUrlSchema } from '@/utils/zod-band';

export async function POST(req: NextRequest) {
  const { user } = await getServerSession();
  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const rawData = await req.json();
    const parsed = requestAvatarUploadUrlSchema.safeParse(rawData);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const ext = parsed.data.fileName.split('.').pop() ?? '';
    const key = `users/${user.id}/avatar-${randomUUID()}${ext ? `.${ext}` : ''}`;

    const uploadUrl = await getSignedUploadUrl(key, parsed.data.contentType);

    return NextResponse.json({ uploadUrl, key });
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}
