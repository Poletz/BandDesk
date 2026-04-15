import { NextRequest, NextResponse } from 'next/server';
import {
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { dbUsers, getServerSession } from '@/utils/auth';
import {
  bandMembershipsDB,
  bandsDB,
  buildBandMembershipDocId,
} from '@/utils/band-collections';
import { listActiveMembershipsForUser, resolveUserActiveBandId } from '@/utils/band-access';
import { bandSchema, createBandSchema } from '@/utils/zod-band';

type BandContextResponse = {
  id: string;
  name: string;
  bio: string | null;
  genres: string[];
  city: string | null;
  socials: Record<string, string | null> | null;
  visibility: 'public' | 'private';
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  membership: {
    id: string;
    role: 'admin' | 'member' | 'guest';
    status: 'active' | 'invited' | 'disabled';
    acceptedAt: string | null;
  };
};

export async function GET() {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const memberships = await listActiveMembershipsForUser(user.id);
    const bandDocs = await Promise.all(memberships.map((membership) => bandsDB.doc(membership.bandId).get()));

    const bands: BandContextResponse[] = memberships.flatMap((membership) => {
      const bandDoc = bandDocs.find((doc) => doc.id === membership.bandId);

      if (!bandDoc?.exists) {
        return [];
      }

      const band = bandSchema.parse(bandDoc.data());

      return [
        {
          id: bandDoc.id,
          name: band.name,
          bio: band.bio ?? null,
          genres: band.genres ?? [],
          city: band.city ?? null,
          socials: band.socials ?? null,
          visibility: band.visibility,
          createdByUserId: band.createdByUserId,
          createdAt: band.createdAt,
          updatedAt: band.updatedAt,
          membership: {
            id: membership.id,
            role: membership.role,
            status: membership.status,
            acceptedAt: membership.acceptedAt ?? null,
          },
        },
      ];
    });

    const activeBandId = await resolveUserActiveBandId(user.id);

    if (!activeBandId && bands.length > 0) {
      await dbUsers.doc(user.id).set(
        {
          activeBandId: bands[0].id,
        },
        { merge: true }
      );
    }

    return NextResponse.json({
      bands,
      activeBandId: activeBandId ?? bands[0]?.id ?? null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}

export async function POST(req: NextRequest) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const rawData = await req.json();
    const parsedData = createBandSchema.safeParse(rawData);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    const now = new Date().toISOString();
    const bandRef = bandsDB.doc();
    const membershipRef = bandMembershipsDB.doc(buildBandMembershipDocId(bandRef.id, user.id));

    await bandsDB.firestore.runTransaction(async (transaction) => {
      transaction.set(bandRef, {
        name: parsedData.data.name,
        bio: parsedData.data.bio ?? null,
        genres: parsedData.data.genres,
        city: parsedData.data.city ?? null,
        socials: parsedData.data.socials ?? null,
        visibility: parsedData.data.visibility,
        createdByUserId: user.id,
        createdAt: now,
        updatedAt: now,
      });

      transaction.set(membershipRef, {
        userId: user.id,
        bandId: bandRef.id,
        role: 'admin',
        status: 'active',
        invitedByUserId: user.id,
        invitedAt: now,
        acceptedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      transaction.set(
        dbUsers.doc(user.id),
        {
          activeBandId: bandRef.id,
        },
        { merge: true }
      );
    });

    return NextResponse.json({ bandId: bandRef.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}
