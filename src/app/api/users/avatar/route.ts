import { NextRequest, NextResponse } from 'next/server';
import {
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { makeFilePublic } from '@/utils/storage';
import { commitAvatarSchema } from '@/utils/zod-band';

export async function POST(req: NextRequest) {
  const { user } = await getServerSession();
  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const rawData = await req.json();
    const parsed = commitAvatarSchema.safeParse(rawData);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    if (!parsed.data.key.startsWith(`users/${user.id}/`)) {
      return NextResponse.json({ message: 'You cannot access this item.' }, { status: 403 });
    }

    const url = await makeFilePublic(parsed.data.key);

    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}
