import { NextRequest, NextResponse } from 'next/server';
import {
  apiError,
  emptyUpdateError,
  isAuthenticatedUser,
  notFoundError,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { BandAccessError, requireBandPermission } from '@/utils/band-access';
import { bandsDB } from '@/utils/band-collections';
import { BAND_PERMISSIONS } from '@/utils/band-permissions';
import { bandSchema, patchBandSchema } from '@/utils/zod-band';

type BandRouteContext = { params: Promise<{ bandId: string }> };

export async function PATCH(req: NextRequest, ctx: BandRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId } = await ctx.params;
    await requireBandPermission(user.id, bandId, BAND_PERMISSIONS.BAND_PROFILE_WRITE);

    const rawData = await req.json();
    const parsedData = patchBandSchema.safeParse(rawData);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    if (Object.keys(parsedData.data).length === 0) {
      return emptyUpdateError();
    }

    const bandRef = bandsDB.doc(bandId);
    const bandSnapshot = await bandRef.get();

    if (!bandSnapshot.exists) {
      return notFoundError('Band');
    }

    const updatePayload: Record<string, unknown> = {
      ...parsedData.data,
      updatedAt: new Date().toISOString(),
    };

    await bandRef.update(updatePayload);
    const updatedBandSnapshot = await bandRef.get();
    const updatedBand = bandSchema.parse(updatedBandSnapshot.data());

    return NextResponse.json({
      band: {
        id: updatedBandSnapshot.id,
        ...updatedBand,
      },
    });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}
