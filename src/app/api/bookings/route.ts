import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
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
  Booking,
  bookingResponseSchema,
  bookingSchema,
  validParseBookingSchema,
} from '@/utils/zod-interfaces';

const bookingsDB = db.collection('bookings');

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

    const dbData = await bookingsDB.where('bandId', '==', bandId).get();

    const bookings: Booking[] = dbData.docs.map((doc) => {
      const data = bookingSchema.parse(doc.data());

      return bookingResponseSchema.parse({
        id: doc.id,
        ...data,
        requestedDate: data.requestedDate ?? null,
        feeProposal: data.feeProposal ?? null,
        notes: data.notes ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        gigId: data.gigId,
      });
    });

    return NextResponse.json<{ bookings: Booking[] }>({ bookings });
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

    const data = await req.json();

    const parsedData = validParseBookingSchema.safeParse(data);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    const now = dayjs().toISOString();

    const booking = {
      ...parsedData.data,
      bandId,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    const doc = await bookingsDB.add(booking);

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
