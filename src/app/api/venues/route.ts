import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { Venue as FormVenue } from '@/interfaces';
import {
  isAuthenticatedUser,
  missingBandIdError,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { db } from '@/utils/db';
import { BandAccessError, requireActiveBandMembership } from '@/utils/band-access';
import {
  validParseVenueSchema,
  Venue,
  venueResponseSchema,
  venueSchema,
} from '@/utils/zod-interfaces';

const venuesDB = db.collection('venues');

export async function GET(req: NextRequest) {
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

    const dbData = await venuesDB.where('bandId', '==', bandId).get();

    const venues: Venue[] = dbData.docs.map((doc) => {
      const data = venueSchema.parse(doc.data());

      return venueResponseSchema.parse({
        id: doc.id,
        ...data,
        city: data.city ?? null,
        address: data.address ?? null,
        contactEmail: data.contactEmail ?? null,
        contactName: data.contactName ?? null,
        contactPhone: data.contactPhone ?? null,
        notes: data.notes ?? null,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      });
    });

    return NextResponse.json<{ venues: Venue[] }>({ venues });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }

    console.error(err);
    if (isAxiosError(err)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.error();
  }
}

export async function POST(req: NextRequest) {
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

    const data: Omit<FormVenue, 'id'> = await req.json();

    const parsedData = validParseVenueSchema.safeParse(data);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    const now = dayjs().toISOString();
    const venue = {
      ...parsedData.data,
      bandId,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    const doc = await venuesDB.add(venue);

    return NextResponse.json({ id: doc.id }, { status: 200 });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }

    console.error(err);
    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }
    return NextResponse.error();
  }
}
