import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  apiError,
  emptyUpdateError,
  isAuthenticatedUser,
  notFoundError,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import {
  BandAccessError,
  canReadSetlist,
  requireActiveBandMembership,
  requireBandPermission,
} from '@/utils/band-access';
import { setlistsDB } from '@/utils/band-collections';
import { BAND_PERMISSIONS } from '@/utils/band-permissions';
import { patchSetlistSchema, setlistSchema } from '@/utils/zod-band';

type BandSetlistRouteContext = { params: Promise<{ bandId: string; setlistId: string }> };

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

export async function GET(_req: NextRequest, ctx: BandSetlistRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId, setlistId } = await ctx.params;
    const membership = await requireActiveBandMembership(user.id, bandId);
    const doc = await setlistsDB.doc(setlistId).get();

    if (!doc.exists) {
      return notFoundError('Setlist');
    }

    const setlist = setlistSchema.parse(doc.data());

    if (setlist.bandId !== bandId) {
      return notFoundError('Setlist');
    }

    if (!canReadSetlist(membership.role, setlist.status)) {
      return apiError('You cannot access this setlist.', 'UNAUTHORIZED', 403);
    }

    return NextResponse.json({
      setlist: {
        id: doc.id,
        ...setlist,
      },
    });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}

export async function PATCH(req: NextRequest, ctx: BandSetlistRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId, setlistId } = await ctx.params;
    await requireBandPermission(user.id, bandId, BAND_PERMISSIONS.SETLIST_WRITE);

    const rawData = await req.json();
    const parsedData = patchSetlistSchema.safeParse(rawData);

    if (!parsedData.success) {
      return validationError(parsedData.error);
    }

    if (Object.keys(parsedData.data).length === 0) {
      return emptyUpdateError();
    }

    const setlistRef = setlistsDB.doc(setlistId);
    const setlistSnapshot = await setlistRef.get();

    if (!setlistSnapshot.exists) {
      return notFoundError('Setlist');
    }

    const currentSetlist = setlistSchema.parse(setlistSnapshot.data());

    if (currentSetlist.bandId !== bandId) {
      return notFoundError('Setlist');
    }

    const updatePayload: Record<string, unknown> = {
      ...parsedData.data,
      lastModifiedByUserId: user.id,
      lastModifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (parsedData.data.songs) {
      updatePayload.songs = normalizeSongs(parsedData.data.songs);
    }

    await setlistRef.update(updatePayload);
    const updatedSetlistSnapshot = await setlistRef.get();
    const updatedSetlist = setlistSchema.parse(updatedSetlistSnapshot.data());

    return NextResponse.json({
      setlist: {
        id: updatedSetlistSnapshot.id,
        ...updatedSetlist,
      },
    });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}

export async function DELETE(_req: NextRequest, ctx: BandSetlistRouteContext) {
  const { user } = await getServerSession();

  if (!isAuthenticatedUser(user)) {
    return sessionExpiredError();
  }

  try {
    const { bandId, setlistId } = await ctx.params;
    await requireBandPermission(user.id, bandId, BAND_PERMISSIONS.SETLIST_WRITE);

    const setlistRef = setlistsDB.doc(setlistId);
    const setlistSnapshot = await setlistRef.get();

    if (!setlistSnapshot.exists) {
      return notFoundError('Setlist');
    }

    const setlist = setlistSchema.parse(setlistSnapshot.data());
    if (setlist.bandId !== bandId) {
      return notFoundError('Setlist');
    }

    await setlistRef.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }

    console.error(err);
    return NextResponse.error();
  }
}
