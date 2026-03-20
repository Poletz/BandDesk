import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import {
  emptyUpdateError,
  forbiddenItemError,
  isAuthenticatedUser,
  notFoundError,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { db } from '@/utils/db';
import { Booking, gigEventResponseSchema, parseBookingSchema } from '@/utils/zod-interfaces';

const bookingsDB = db.collection('bookings');
const gigsDB = db.collection('gigs');
const venueDB = db.collection('venues');

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/bookings/[bookingId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bookingId } = await ctx.params;
    const doc = await bookingsDB.doc(bookingId).get();

    if (!doc.exists) {
      return notFoundError('Venue');
    }

    const booking = doc.data();

    if (booking?.ownerId !== user.id) {
      return forbiddenItemError();
    }

    const gig = booking?.gigId ? await gigsDB.doc(booking.gigId).get() : null;
    const venueName = booking?.venueId ? await venueDB.doc(booking.venueId).get() : null;

    const parsedGig = gigEventResponseSchema.safeParse(gig?.data());

    return NextResponse.json<{ booking: Booking }>({
      booking: {
        id: doc.id,
        venueId: booking.venueId,
        status: booking.status,
        venueName: venueName?.data()?.name,
        requestedDate: booking.requestedDate ?? null,
        feeProposal: booking.feeProposal ?? null,
        notes: booking.notes ?? null,
        gigId: booking.gigId ?? null,
        gig: parsedGig.success ? { ...parsedGig.data } : null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (err) {
    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}

export async function PATCH(req: Request, ctx: RouteContext<'/api/bookings/[bookingId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const { bookingId } = await ctx.params;
  const data = await req.json();
  const parsedData = parseBookingSchema.partial().safeParse(data);

  if (!parsedData.success) {
    return validationError(parsedData.error);
  }

  if (Object.keys(parsedData.data).length === 0) {
    return emptyUpdateError();
  }

  const doc = await bookingsDB.doc(bookingId).get();

  if (!doc.exists) {
    return notFoundError('Venue');
  }

  if (doc.data()?.ownerId !== user.id) {
    return forbiddenItemError();
  }

  await bookingsDB.doc(bookingId).update({
    ...parsedData.data,
    updatedAt: new Date().toISOString(),
  });

  const updatedDoc = await bookingsDB.doc(bookingId).get();
  const booking = updatedDoc.data()!;

  return NextResponse.json<{ booking: Booking }>({
    booking: {
      id: updatedDoc.id,
      venueId: booking.venueId,
      requestedDate: booking.requestedDate ?? null,
      status: booking.status,
      feeProposal: booking.feeProposal ?? null,
      notes: booking.notes ?? null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    },
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/bookings/[bookingId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const { bookingId } = await ctx.params;
  const doc = await bookingsDB.doc(bookingId).get();

  if (!doc.exists) {
    return notFoundError('Venue');
  }

  if (doc.data()?.ownerId !== user.id) {
    return forbiddenItemError();
  }

  await bookingsDB.doc(bookingId).delete();

  return NextResponse.json({ ok: true });
}
