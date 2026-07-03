import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import {
  apiError,
  GigBookingRuleError,
  isAuthenticatedUser,
  missingBandIdError,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { db } from '@/utils/db';
import { BandAccessError, requireActiveBandMembership } from '@/utils/band-access';
import {
  bookingSchema,
  GigEvent,
  gigEventResponseSchema,
  gigEventSchema,
  validParseGigEventSchema,
} from '@/utils/zod-interfaces';

const gigsDB = db.collection('gigs');
const bookingsDB = db.collection('bookings');

type GigDocument = ReturnType<typeof gigEventSchema.parse>;

const mapGigDocToResponse = (id: string, gig: GigDocument): GigEvent =>
  gigEventResponseSchema.parse({
    id,
    venueId: gig.venueId,
    date: gig.date,
    status: gig.status,
    title: gig.title,
    ...(gig.setlistName ? { setlistName: gig.setlistName } : {}),
    ...(gig.notes ? { notes: gig.notes } : {}),
    ...(gig.bookingId ? { bookingId: gig.bookingId } : {}),
  });

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

    const dbData = await gigsDB.where('bandId', '==', bandId).get();

    const gigs: GigEvent[] = dbData.docs.map((doc) => {
      const data = gigEventSchema.parse(doc.data());

      return mapGigDocToResponse(doc.id, data);
    });

    return NextResponse.json<{ gigs: GigEvent[] }>({ gigs });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }

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

    const parsedData = validParseGigEventSchema.safeParse(data);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    const now = dayjs().toISOString();
    let createdGigId = '';

    await db.runTransaction(async (transaction) => {
      const requestedBookingId = parsedData.data.bookingId ?? null;
      const gigRef = gigsDB.doc();

      if (!requestedBookingId) {
        transaction.create(gigRef, {
          ...parsedData.data,
          bandId,
          ownerId: user.id,
          createdAt: now,
          updatedAt: now,
        });
        createdGigId = gigRef.id;
        return;
      }

      const bookingRef = bookingsDB.doc(requestedBookingId);
      const [bookingSnapshot, conflictingGigsSnapshot] = await Promise.all([
        transaction.get(bookingRef),
        transaction.get(gigsDB.where('bookingId', '==', requestedBookingId)),
      ]);

      if (!bookingSnapshot.exists) {
        throw new GigBookingRuleError('Booking not found', 404, 'NOT_FOUND');
      }

      const booking = bookingSchema.parse(bookingSnapshot.data());

      if (booking.bandId !== bandId) {
        throw new GigBookingRuleError('You cannot access this item.', 403, 'UNAUTHORIZED');
      }

      if (booking.status !== 'confirmed') {
        throw new GigBookingRuleError('Only confirmed bookings can create a linked gig.');
      }

      if (booking.gigId) {
        throw new GigBookingRuleError('This booking already has a linked gig.');
      }

      if (conflictingGigsSnapshot.docs.length > 0) {
        throw new GigBookingRuleError('This booking already has a linked gig.');
      }

      if (booking.requestedDate && booking.requestedDate !== parsedData.data.date) {
        throw new GigBookingRuleError('Gig date must match the confirmed booking date.');
      }

      transaction.create(gigRef, {
        ...parsedData.data,
        venueId: booking.venueId,
        date: booking.requestedDate ?? parsedData.data.date,
        status: booking.status,
        bookingId: requestedBookingId,
        bandId,
        ownerId: user.id,
        createdAt: now,
        updatedAt: now,
      });

      transaction.update(bookingRef, {
        gigId: gigRef.id,
        updatedAt: now,
      });

      createdGigId = gigRef.id;
    });

    return NextResponse.json({ id: createdGigId }, { status: 200 });
  } catch (err) {
    if (err instanceof GigBookingRuleError) {
      return apiError(err.message, err.code, err.status);
    }

    if (err instanceof BandAccessError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }

    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}
