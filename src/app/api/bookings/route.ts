import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { z } from 'zod/v4';
import { apiError } from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { db } from '@/utils/db';
import {
  Booking,
  bookingResponseSchema,
  bookingSchema,
  validParseBookingSchema,
} from '@/utils/zod-interfaces';

const bookingsDB = db.collection('bookings');

export async function GET() {
  const { user } = await getServerSession();

  if (!user) {
    return apiError('Session expired! Please login again.', 'SESSION_EXPIRED', 401);
  }

  try {
    const dbData = await bookingsDB.where('ownerId', '==', user.id).get();

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
    console.error(err);
    if (isAxiosError(err)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }

    return NextResponse.error();
  }
}

export async function POST(req: NextRequest) {
  const { user } = await getServerSession();

  if (!user) {
    return apiError('Session expired! Please login again.', 'SESSION_EXPIRED', 401);
  }

  try {
    const data = await req.json();

    const parsedData = validParseBookingSchema.safeParse(data);

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: z.treeifyError(parsedData.error),
        },
        { status: 400 }
      );
    }

    const now = dayjs().toISOString();

    const booking = {
      ...parsedData.data,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    const doc = await bookingsDB.add(booking);

    return NextResponse.json({ id: doc.id }, { status: 200 });
  } catch (err) {
    console.error(err);
    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}
