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
import { getSignedDownloadUrl } from '@/utils/storage';
import { bandDocumentSchema } from '@/utils/zod-band';

type Context = { params: Promise<{ bandId: string; documentId: string }> };

export async function GET(_req: NextRequest, ctx: Context) {
  const { user } = await getServerSession();
  if (!isAuthenticatedUser(user)) return sessionExpiredError();

  const { bandId, documentId } = await ctx.params;

  try {
    await requireActiveBandMembership(user.id, bandId);

    const snapshot = await bandDocumentsDB.doc(documentId).get();
    if (!snapshot.exists) return notFoundError('Document');

    const document = bandDocumentSchema.parse(snapshot.data());
    if (document.bandId !== bandId) return forbiddenItemError();

    const url = await getSignedDownloadUrl(document.key);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }
    console.error(err);
    return NextResponse.error();
  }
}
