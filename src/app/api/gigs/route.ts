import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { GigEvent } from '@/interfaces';
import {
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { db } from '@/utils/db';
import {
  gigEventResponseSchema,
  gigEventSchema,
  validParseGigEventSchema,
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
    setlistName: gig.setlistName,
    notes: gig.notes,
    bookingId: gig.bookingId,
  });

export async function GET() {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const dbData = await gigsDB.where('ownerId', '==', user.id).get();

    const gigs: GigEvent[] = dbData.docs.map((doc) => {
      const data = gigEventSchema.parse(doc.data());

      return mapGigDocToResponse(doc.id, data);
    });

    return NextResponse.json<{ gigs: GigEvent[] }>({ gigs });
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

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const data = await req.json();

    const parsedData = validParseGigEventSchema.safeParse(data);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    const now = dayjs().toISOString();
    const gig = {
      ...parsedData.data,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    const doc = await gigsDB.add(gig);

    return NextResponse.json({ id: doc.id }, { status: 200 });
  } catch (err) {
    console.error(err);
    if (isAxiosError(err)) {
      return NextResponse.json(err, { status: err.status });
    }

    return NextResponse.error();
  }
}
