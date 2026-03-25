import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { Venue } from '@/interfaces';
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
import { validParseVenueSchema } from '@/utils/zod-interfaces';

const venuesDB = db.collection('venues');

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/venues/[venueId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { venueId } = await ctx.params;
    const doc = await venuesDB.doc(venueId).get();

    if (!doc.exists) {
      return notFoundError('Venue');
    }

    const venue = doc.data();

    if (venue?.ownerId !== user.id) {
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
    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}

export async function PATCH(req: Request, ctx: RouteContext<'/api/venues/[venueId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

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

  if (doc.data()?.ownerId !== user.id) {
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
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/venues/[venueId]'>) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  const { venueId } = await ctx.params;
  const doc = await venuesDB.doc(venueId).get();

  if (!doc.exists) {
    return notFoundError('Venue');
  }

  if (doc.data()?.ownerId !== user.id) {
    return forbiddenItemError();
  }

  await venuesDB.doc(venueId).delete();

  return NextResponse.json({ ok: true });
}
