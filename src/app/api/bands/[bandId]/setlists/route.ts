import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  apiError,
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { BandAccessError, requireActiveBandMembership, requireBandPermission } from '@/utils/band-access';
import { bandsDB, setlistsDB } from '@/utils/band-collections';
import { BAND_PERMISSIONS } from '@/utils/band-permissions';
import { createSetlistSchema, setlistSchema } from '@/utils/zod-band';

type BandSetlistsRouteContext = { params: Promise<{ bandId: string }> };

const normalizeSongs = (
  songs: Array<{
    id?: string;
    title: string;
    artist?: string | null;
    key?: string | null;
    notes?: string | null;
  }>
) => {
  return songs.map((song, index) => ({
    id: song.id ?? randomUUID(),
    title: song.title.trim(),
    artist: song.artist ?? null,
    key: song.key ?? null,
    notes: song.notes ?? null,
    position: index + 1,
  }));
};

export async function GET(_req: NextRequest, ctx: BandSetlistsRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId } = await ctx.params;
    const membership = await requireActiveBandMembership(user.id, bandId);
    const snapshot = await setlistsDB.where('bandId', '==', bandId).get();

    const setlists = snapshot.docs
      .map((doc) => {
        const setlist = setlistSchema.parse(doc.data());
        return {
          id: doc.id,
          ...setlist,
        };
      })
      .filter((setlist) => {
        if (membership.role === 'guest') {
          return setlist.status === 'published';
        }
        return true;
      });

    return NextResponse.json({ setlists });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}

export async function POST(req: NextRequest, ctx: BandSetlistsRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId } = await ctx.params;
    await requireBandPermission(user.id, bandId, BAND_PERMISSIONS.SETLIST_WRITE);

    const bandDoc = await bandsDB.doc(bandId).get();
    if (!bandDoc.exists) {
      return apiError('Band not found', 'NOT_FOUND', 404);
    }

    const rawData = await req.json();
    const parsedData = createSetlistSchema.safeParse(rawData);
    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    const now = new Date().toISOString();
    const setlistRef = setlistsDB.doc();
    const normalizedSongs = normalizeSongs(parsedData.data.songs);

    await setlistRef.set({
      bandId,
      title: parsedData.data.title,
      status: parsedData.data.status,
      songs: normalizedSongs,
      createdByUserId: user.id,
      lastModifiedByUserId: user.id,
      lastModifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ setlistId: setlistRef.id }, { status: 201 });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}
