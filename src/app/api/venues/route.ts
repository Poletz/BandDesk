import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { z } from 'zod/v4';
import { getServerSession } from '@/utils/auth';
import { db } from '@/utils/db';
import { parseVenueSchema, Venue, venueResponseSchema, venueSchema } from '@/utils/zod-interfaces';

const venuesDB = db.collection('venues');

export async function GET() {
  const { user } = await getServerSession();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbData = await venuesDB.where('ownerId', '==', user.id).get();

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
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    const now = dayjs().toISOString();
    const venue = {
      ...parsedData,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    const doc = await venuesDB.add(venue);

    return NextResponse.json({ id: doc.id }, { status: 200 });
  } catch (err) {
    console.error(err);
    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}
