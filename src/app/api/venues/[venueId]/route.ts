import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { Venue } from '@/interfaces';
import {
  emptyUpdateError,
  forbiddenItemError,
  isAuthenticatedUser,
  missingBandIdError,
  notFoundError,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { db } from '@/utils/db';
import { BandAccessError, requireActiveBandMembership } from '@/utils/band-access';
import { validParseVenueSchema } from '@/utils/zod-interfaces';

const venuesDB = db.collection('venues');
type VenueRouteContext = { params: Promise<{ venueId: string }> };

export async function GET(req: NextRequest, ctx: VenueRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const bandId = req.headers.get('x-band-id');
  if (!bandId) {
    return missingBandIdError();
  }

  try {
    await requireActiveBandMembership(user.id, bandId);

    const { venueId } = await ctx.params;
    const doc = await venuesDB.doc(venueId).get();

    if (!doc.exists) {
      return notFoundError('Venue');
    }

    const venue = doc.data();

    if (venue?.bandId !== bandId) {
      return forbiddenItemError();
    }

    return NextResponse.json<{ venue: Venue }>({
      venue: {
        id: doc.id,
        name: venue.name,
        ...venue,
      },
    });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }

    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}

export async function PATCH(req: NextRequest, ctx: VenueRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const bandId = req.headers.get('x-band-id');
  if (!bandId) {
    return missingBandIdError();
  }

  try {
    await requireActiveBandMembership(user.id, bandId);

    const { venueId } = await ctx.params;
    const data = await req.json();
    const parsedData = validParseVenueSchema.safeParse(data);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    if (Object.keys(parsedData.data).length === 0) {
      return emptyUpdateError();
    }

    const doc = await venuesDB.doc(venueId).get();

    if (!doc.exists) {
      return notFoundError('Venue');
    }

    if (doc.data()?.bandId !== bandId) {
      return forbiddenItemError();
    }

    await venuesDB.doc(venueId).update({
      ...parsedData.data,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await venuesDB.doc(venueId).get();

    return NextResponse.json<{ venue: Venue }>({
      venue: {
        id: updatedDoc.id,
        name: updatedDoc.data()!.name,
        ...updatedDoc.data(),
      },
    });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }

    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}

export async function DELETE(req: NextRequest, ctx: VenueRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const bandId = req.headers.get('x-band-id');
  if (!bandId) {
    return missingBandIdError();
  }

  try {
    await requireActiveBandMembership(user.id, bandId);

    const { venueId } = await ctx.params;
    const doc = await venuesDB.doc(venueId).get();

    if (!doc.exists) {
      return notFoundError('Venue');
    }

    if (doc.data()?.bandId !== bandId) {
      return forbiddenItemError();
    }

    await venuesDB.doc(venueId).delete();

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }

    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}
