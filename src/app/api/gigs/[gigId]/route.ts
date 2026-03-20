import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import {
  apiError,
  emptyUpdateError,
  forbiddenItemError,
  GigBookingRuleError,
  isAuthenticatedUser,
  notFoundError,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { db } from '@/utils/db';
import {
  bookingSchema,
  GigEvent,
  gigEventResponseSchema,
  gigEventSchema,
  parseGigEventPatchSchema,
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

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/gigs/[gigId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { gigId } = await ctx.params;
    const doc = await gigsDB.doc(gigId).get();

    if (!doc.exists) {
      return notFoundError('Gig');
    }

    const gig = gigEventSchema.parse(doc.data());

    if (gig.ownerId !== user.id) {
      return forbiddenItemError();
    }

    return NextResponse.json<{ gig: GigEvent }>({
      gig: mapGigDocToResponse(doc.id, gig),
    });
  } catch (err) {
    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}

export async function PATCH(req: Request, ctx: RouteContext<'/api/gigs/[gigId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const { gigId } = await ctx.params;
  const data = await req.json();
  const parsedData = parseGigEventPatchSchema.safeParse(data);

  if (!parsedData.success) {
    return validationError(parsedData.error);
  }

  if (Object.keys(parsedData.data).length === 0) {
    return emptyUpdateError();
  }

  try {
    await db.runTransaction(async (transaction) => {
      const gigRef = gigsDB.doc(gigId);
      const gigSnapshot = await transaction.get(gigRef);
      if (!gigSnapshot.exists) {
        throw new GigBookingRuleError('Gig not found', 404, 'NOT_FOUND');
      }
      const currentGig = gigEventSchema.parse(gigSnapshot.data());

      if (currentGig.ownerId !== user.id) {
        throw new GigBookingRuleError('You cannot access this item.', 403, 'UNAUTHORIZED');
      }

      const rawHasBookingId = Object.hasOwn(data, 'bookingId');
      const nextBookingId = rawHasBookingId
        ? (parsedData.data.bookingId ?? null)
        : (currentGig.bookingId ?? null);
      const nextDate = parsedData.data.date ?? currentGig.date;
      const now = new Date().toISOString();

      if (
        currentGig.bookingId &&
        Object.hasOwn(parsedData.data, 'date') &&
        nextDate !== currentGig.date
      ) {
        throw new GigBookingRuleError(
          'Change the booking requested date from the booking instead of editing a linked gig date.'
        );
      }
      if (
        currentGig.bookingId &&
        Object.hasOwn(parsedData.data, 'status') &&
        parsedData.data.status !== currentGig.status
      ) {
        throw new GigBookingRuleError(
          'Change the booking status from the booking instead of editing a linked gig status.'
        );
      }

      if (currentGig.bookingId && currentGig.bookingId !== nextBookingId) {
        const previousBookingRef = bookingsDB.doc(currentGig.bookingId);
        const previousBookingSnapshot = await transaction.get(previousBookingRef);

        if (previousBookingSnapshot.exists) {
          const previousBooking = bookingSchema.parse(previousBookingSnapshot.data());

          if (previousBooking.ownerId === user.id && previousBooking.gigId === gigId) {
            transaction.update(previousBookingRef, {
              gigId: null,
              updatedAt: now,
            });
          }
        }
      }

      let enforcedStatus = parsedData.data.status ?? currentGig.status;
      let enforcedVenueId = parsedData.data.venueId ?? currentGig.venueId;
      let enforcedDate = nextDate;

      if (nextBookingId) {
        const bookingRef = bookingsDB.doc(nextBookingId);
        const [bookingSnapshot, conflictingGigsSnapshot] = await Promise.all([
          transaction.get(bookingRef),
          transaction.get(gigsDB.where('bookingId', '==', nextBookingId)),
        ]);

        if (!bookingSnapshot.exists) {
          throw new GigBookingRuleError('Booking not found', 404, 'NOT_FOUND');
        }

        const booking = bookingSchema.parse(bookingSnapshot.data());

        if (booking.ownerId !== user.id) {
          throw new GigBookingRuleError('You cannot access this item.', 403, 'UNAUTHORIZED');
        }
        if (booking.status !== 'confirmed') {
          throw new GigBookingRuleError('Only confirmed bookings can be linked to a gig.');
        }
        if (booking.gigId && booking.gigId !== gigId) {
          throw new GigBookingRuleError('This booking already has a linked gig.');
        }

        const conflictingGig = conflictingGigsSnapshot.docs.find((doc) => doc.id !== gigId);

        if (conflictingGig) {
          throw new GigBookingRuleError('This booking already has a linked gig.');
        }
        if (booking.requestedDate && booking.requestedDate !== nextDate) {
          throw new GigBookingRuleError('Gig date must match the confirmed booking date.');
        }

        transaction.update(bookingRef, {
          gigId,
          updatedAt: now,
        });

        enforcedStatus = booking.status;
        enforcedVenueId = booking.venueId;
        enforcedDate = booking.requestedDate ?? nextDate;
      }

      transaction.update(gigRef, {
        ...parsedData.data,
        bookingId: nextBookingId,
        venueId: enforcedVenueId,
        date: enforcedDate,
        status: enforcedStatus,
        updatedAt: now,
      });
    });

    const updatedDoc = await gigsDB.doc(gigId).get();
    const updatedGig = gigEventSchema.parse(updatedDoc.data());

    return NextResponse.json<{ gig: GigEvent }>({
      gig: mapGigDocToResponse(updatedDoc.id, updatedGig),
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

export async function DELETE(_req: Request, ctx: RouteContext<'/api/gigs/[gigId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const { gigId } = await ctx.params;

  try {
    await db.runTransaction(async (transaction) => {
      const gigRef = gigsDB.doc(gigId);
      const gigSnapshot = await transaction.get(gigRef);

      if (!gigSnapshot.exists) {
        throw new GigBookingRuleError('Gig not found', 404, 'NOT_FOUND');
      }

      const gig = gigEventSchema.parse(gigSnapshot.data());

      if (gig.ownerId !== user.id) {
        throw new GigBookingRuleError('You cannot access this item.', 403, 'UNAUTHORIZED');
      }

      if (gig.bookingId) {
        const bookingRef = bookingsDB.doc(gig.bookingId);
        const bookingSnapshot = await transaction.get(bookingRef);

        if (bookingSnapshot.exists) {
          const booking = bookingSchema.parse(bookingSnapshot.data());

          if (booking.ownerId === user.id && booking.gigId === gigId) {
            transaction.update(bookingRef, {
              gigId: null,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      transaction.delete(gigRef);
    });

    return NextResponse.json({ ok: true });
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
