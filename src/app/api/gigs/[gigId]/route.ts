import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { GigEvent } from '@/interfaces';
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
import {
  gigEventResponseSchema,
  gigEventSchema,
  parseGigEventSchema,
} from '@/utils/zod-interfaces';

const gigsDB = db.collection('gigs');

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
  const parsedData = parseGigEventSchema.partial().safeParse(data);

  if (!parsedData.success) {
    return validationError(parsedData.error);
  }

  if (Object.keys(parsedData.data).length === 0) {
    return emptyUpdateError();
  }

  const doc = await gigsDB.doc(gigId).get();

  if (!doc.exists) {
    return notFoundError('Gig');
  }

  const gig = gigEventSchema.parse(doc.data());

  if (gig.ownerId !== user.id) {
    return forbiddenItemError();
  }

  await gigsDB.doc(gigId).update({
    ...parsedData.data,
    updatedAt: new Date().toISOString(),
  });

  const updatedDoc = await gigsDB.doc(gigId).get();
  const updatedGig = gigEventSchema.parse(updatedDoc.data());

  return NextResponse.json<{ gig: GigEvent }>({
    gig: mapGigDocToResponse(updatedDoc.id, updatedGig),
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/gigs/[gigId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const { gigId } = await ctx.params;
  const doc = await gigsDB.doc(gigId).get();

  if (!doc.exists) {
    return notFoundError('Gig');
  }

  const gig = gigEventSchema.parse(doc.data());

  if (gig.ownerId !== user.id) {
    return forbiddenItemError();
  }

  await gigsDB.doc(gigId).delete();

  return NextResponse.json({ ok: true });
}
