import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import {
  apiError,
  emptyUpdateError,
  forbiddenItemError,
  GigBookingRuleError,
  isAuthenticatedUser,
  missingBandIdError,
  notFoundError,
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
  gigEventResponseSchema,
  gigEventSchema,
  parseBookingPatchSchema,
} from '@/utils/zod-interfaces';

const bookingsDB = db.collection('bookings');
const gigsDB = db.collection('gigs');
const venueDB = db.collection('venues');

type BookingDocument = ReturnType<typeof bookingSchema.parse>;
type GigDocument = ReturnType<typeof gigEventSchema.parse>;
type BookingRouteContext = { params: Promise<{ bookingId: string }> };

const mapGigDocToResponse = (id: string, gig: GigDocument) =>
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

const getGigLinkStatus = (
  bookingId: string,
  bookingGigId?: string | null,
  gig?: GigDocument | null
) => {
  if (!bookingGigId) {
    return 'unlinked' as const;
  }

  if (!gig) {
    return 'broken' as const;
  }

  return gig.bookingId === bookingId ? ('linked' as const) : ('broken' as const);
};

const mapBookingDetailResponse = async (
  bookingId: string,
  booking: BookingDocument
): Promise<Booking> => {
  const [gigDoc, venueDoc] = await Promise.all([
    booking.gigId ? gigsDB.doc(booking.gigId).get() : Promise.resolve(null),
    booking.venueId ? venueDB.doc(booking.venueId).get() : Promise.resolve(null),
  ]);

  const linkedGig = gigDoc?.exists ? gigEventSchema.parse(gigDoc.data()) : null;
  const gig = linkedGig && gigDoc ? mapGigDocToResponse(gigDoc.id, linkedGig) : null;

  return bookingResponseSchema.parse({
    id: bookingId,
    venueId: booking.venueId,
    status: booking.status,
    venueName: venueDoc?.data()?.name ?? null,
    requestedDate: booking.requestedDate ?? null,
    feeProposal: booking.feeProposal ?? null,
    notes: booking.notes ?? null,
    gigId: booking.gigId ?? null,
    gig,
    gigLinkStatus: getGigLinkStatus(bookingId, booking.gigId ?? null, linkedGig),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  });
};

export async function GET(req: NextRequest, ctx: BookingRouteContext) {
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

    const { bookingId } = await ctx.params;
    const doc = await bookingsDB.doc(bookingId).get();

    if (!doc.exists) {
      return notFoundError('Booking');
    }

    const booking = bookingSchema.parse(doc.data());

    if (booking.bandId !== bandId) {
      return forbiddenItemError();
    }

    return NextResponse.json<{ booking: Booking }>({
      booking: await mapBookingDetailResponse(doc.id, booking),
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

export async function PATCH(req: NextRequest, ctx: BookingRouteContext) {
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
  } catch (err) {
    if (err instanceof BandAccessError) {
      return NextResponse.json({ message: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.error();
  }

  const { bookingId } = await ctx.params;
  const data = await req.json();
  const parsedData = parseBookingPatchSchema.safeParse(data);

  if (!parsedData.success) {
    return validationError(parsedData.error);
  }

  if (Object.keys(parsedData.data).length === 0) {
    return emptyUpdateError();
  }

  try {
    await db.runTransaction(async (transaction) => {
      const bookingRef = bookingsDB.doc(bookingId);
      const bookingSnapshot = await transaction.get(bookingRef);
      if (!bookingSnapshot.exists) {
        throw new GigBookingRuleError('Booking not found', 404, 'NOT_FOUND');
      }
      const currentBooking = bookingSchema.parse(bookingSnapshot.data());
      if (currentBooking.bandId !== bandId) {
        throw new GigBookingRuleError('You cannot access this item.', 403, 'UNAUTHORIZED');
      }
      const rawHasGigId = Object.hasOwn(data, 'gigId');
      const nextGigId = rawHasGigId
        ? (parsedData.data.gigId ?? null)
        : (currentBooking.gigId ?? null);
      const nextStatus = parsedData.data.status ?? currentBooking.status;
      const nextRequestedDate = Object.hasOwn(parsedData.data, 'requestedDate')
        ? (parsedData.data.requestedDate ?? null)
        : (currentBooking.requestedDate ?? null);
      const requestedDateChanged =
        Object.hasOwn(parsedData.data, 'requestedDate') &&
        nextRequestedDate !== (currentBooking.requestedDate ?? null);

      if (requestedDateChanged && nextGigId) {
        throw new GigBookingRuleError(
          'Cannot change the requested date while this booking is linked to a gig.'
        );
      }

      const now = new Date().toISOString();

      if (rawHasGigId && nextGigId && nextStatus !== 'confirmed') {
        throw new GigBookingRuleError('Only confirmed bookings can be linked to a gig.');
      }

      if (rawHasGigId && currentBooking.gigId && currentBooking.gigId !== nextGigId) {
        const previousGigRef = gigsDB.doc(currentBooking.gigId);
        const previousGigSnapshot = await transaction.get(previousGigRef);

        if (previousGigSnapshot.exists) {
          const previousGig = gigEventSchema.parse(previousGigSnapshot.data());

          if (previousGig.bandId === bandId && previousGig.bookingId === bookingId) {
            transaction.update(previousGigRef, {
              bookingId: null,
              updatedAt: now,
            });
          }
        }
      }

      if (nextGigId) {
        const linkedGigRef = gigsDB.doc(nextGigId);
        const [linkedGigSnapshot, conflictingGigsSnapshot] = await Promise.all([
          transaction.get(linkedGigRef),
          transaction.get(gigsDB.where('bookingId', '==', bookingId)),
        ]);

        if (!linkedGigSnapshot.exists) {
          throw new GigBookingRuleError('Gig not found', 404, 'NOT_FOUND');
        }

        const linkedGig = gigEventSchema.parse(linkedGigSnapshot.data());

        if (linkedGig.bandId !== bandId) {
          throw new GigBookingRuleError('You cannot access this item.', 403, 'UNAUTHORIZED');
        }

        if (linkedGig.bookingId && linkedGig.bookingId !== bookingId) {
          throw new GigBookingRuleError('This gig is already linked to another booking.');
        }

        const conflictingGig = conflictingGigsSnapshot.docs.find((doc) => doc.id !== nextGigId);

        if (conflictingGig) {
          throw new GigBookingRuleError('This booking already has a linked gig.');
        }

        if (nextRequestedDate && linkedGig.date !== nextRequestedDate) {
          throw new GigBookingRuleError(
            'The linked gig date must match the booking requested date.'
          );
        }

        transaction.update(linkedGigRef, {
          bookingId,
          status: nextStatus,
          updatedAt: now,
        });
      }

      transaction.update(bookingRef, {
        ...parsedData.data,
        ...(rawHasGigId ? { gigId: nextGigId } : {}),
        updatedAt: now,
      });
    });

    const updatedDoc = await bookingsDB.doc(bookingId).get();
    const booking = bookingSchema.parse(updatedDoc.data());

    return NextResponse.json<{ booking: Booking }>({
      booking: await mapBookingDetailResponse(updatedDoc.id, booking),
    });
  } catch (err) {
    if (err instanceof GigBookingRuleError) {
      return apiError(err.message, err.code, err.status);
    }

    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}

export async function DELETE(req: NextRequest, ctx: BookingRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const bandId = req.headers.get('x-band-id');
  if (!bandId) {
    return missingBandIdError();
  }

  const { bookingId } = await ctx.params;

  try {
    await requireActiveBandMembership(user.id, bandId);

    await db.runTransaction(async (transaction) => {
      const bookingRef = bookingsDB.doc(bookingId);
      const bookingSnapshot = await transaction.get(bookingRef);
      if (!bookingSnapshot.exists) {
        throw new GigBookingRuleError('Booking not found', 404, 'NOT_FOUND');
      }

      const booking = bookingSchema.parse(bookingSnapshot.data());

      if (booking.bandId !== bandId) {
        throw new GigBookingRuleError('You cannot access this item.', 403, 'UNAUTHORIZED');
      }

      if (booking.gigId) {
        const gigRef = gigsDB.doc(booking.gigId);
        const gigSnapshot = await transaction.get(gigRef);
        if (gigSnapshot.exists) {
          const gig = gigEventSchema.parse(gigSnapshot.data());
          if (gig.bandId === bandId && gig.bookingId === bookingId) {
            transaction.update(gigRef, {
              bookingId: null,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      transaction.delete(bookingRef);
    });

    return NextResponse.json({ ok: true });
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
