import { NextRequest, NextResponse } from 'next/server';
import {
  apiError,
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { dbUsers, getServerSession } from '@/utils/auth';
import { BandAccessError, requireActiveBandMembership } from '@/utils/band-access';
import { setActiveBandSchema } from '@/utils/zod-band';

export async function PATCH(req: NextRequest) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const rawData = await req.json();
    const parsedData = setActiveBandSchema.safeParse(rawData);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    await requireActiveBandMembership(user.id, parsedData.data.bandId);

    await dbUsers.doc(user.id).set(
      {
        activeBandId: parsedData.data.bandId,
      },
      { merge: true }
    );

    return NextResponse.json({ activeBandId: parsedData.data.bandId });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}
