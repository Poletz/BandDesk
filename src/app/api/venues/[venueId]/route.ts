import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { z } from 'zod/v4';
import { Venue } from '@/interfaces';
import { getServerSession } from '@/utils/auth';
import { db } from '@/utils/db';
import { parseVenueSchema } from '@/utils/zod-interfaces';

const venuesDB = db.collection('venues');

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/venues/[venueId]'>) {
  const { user } = await getServerSession();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { venueId } = await ctx.params;
    const doc = await venuesDB.doc(venueId).get();

    if (!doc.exists) {
      return NextResponse.json({ message: 'Venue not found' }, { status: 404 });
    }

    const venue = doc.data();

    if (venue?.ownerId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
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

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { venueId } = await ctx.params;
  const data = await req.json();
  const parsedData = parseVenueSchema.safeParse(data);

  if (!parsedData.success) {
    return NextResponse.json(
      {
        message: 'Validation error',
        errors: z.treeifyError(parsedData.error),
      },
      { status: 400 }
    );
  }

  if (Object.keys(parsedData.data).length === 0) {
    return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
  }

  const doc = await venuesDB.doc(venueId).get();

  if (!doc.exists) {
    return NextResponse.json({ message: 'Venue not found' }, { status: 404 });
  }

  if (doc.data()?.ownerId !== user.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
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

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { venueId } = await ctx.params;
  const doc = await venuesDB.doc(venueId).get();

  if (!doc.exists) {
    return NextResponse.json({ message: 'Venue not found' }, { status: 404 });
  }

  if (doc.data()?.ownerId !== user.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await venuesDB.doc(venueId).delete();

  return NextResponse.json({ ok: true });
}
