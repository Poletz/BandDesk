import { NextRequest, NextResponse } from 'next/server';
import {
  apiError,
  forbiddenItemError,
  isAuthenticatedUser,
  notFoundError,
  sessionExpiredError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { BandAccessError, requireActiveBandMembership } from '@/utils/band-access';
import { bandDocumentsDB } from '@/utils/band-collections';
import { deleteStorageFile } from '@/utils/storage';
import { bandDocumentSchema } from '@/utils/zod-band';

type Context = { params: Promise<{ bandId: string; documentId: string }> };

export async function DELETE(_req: NextRequest, ctx: Context) {
  const { user } = await getServerSession();
  if (!isAuthenticatedUser(user)) {return sessionExpiredError();}

  const { bandId, documentId } = await ctx.params;

  try {
    await requireActiveBandMembership(user.id, bandId);

    const docRef = bandDocumentsDB.doc(documentId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {return notFoundError('Document');}

    const document = bandDocumentSchema.parse(snapshot.data());

    if (document.bandId !== bandId) {return forbiddenItemError();}

    // Delete from Storage, then from Firestore
    await deleteStorageFile(document.key);
    await docRef.delete();

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }
    console.error(err);
    return NextResponse.error();
  }
}
