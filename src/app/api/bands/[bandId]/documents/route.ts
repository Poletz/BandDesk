import { NextRequest, NextResponse } from 'next/server';
import {
  apiError,
  isAuthenticatedUser,
  sessionExpiredError,
  validationError,
} from '@/utils/api-response-helper';
import { getServerSession } from '@/utils/auth';
import { BandAccessError, requireActiveBandMembership } from '@/utils/band-access';
import { bandDocumentsDB } from '@/utils/band-collections';
import { getStorageBucket } from '@/utils/storage';
import { bandDocumentResponseSchema, bandDocumentSchema, createDocumentSchema } from '@/utils/zod-band';

type Context = { params: Promise<{ bandId: string }> };

export async function GET(_req: NextRequest, ctx: Context) {
  const { user } = await getServerSession();
  if (!isAuthenticatedUser(user)) return sessionExpiredError();

  const { bandId } = await ctx.params;

  try {
    await requireActiveBandMembership(user.id, bandId);

    const snapshot = await bandDocumentsDB.where('bandId', '==', bandId).get();

    const documents = snapshot.docs.map((doc) => {
      const data = bandDocumentSchema.parse(doc.data());
      return bandDocumentResponseSchema.parse({ id: doc.id, ...data });
    });

    return NextResponse.json({ documents });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }
    console.error(err);
    return NextResponse.error();
  }
}

export async function POST(req: NextRequest, ctx: Context) {
  const { user } = await getServerSession();
  if (!isAuthenticatedUser(user)) return sessionExpiredError();

  const { bandId } = await ctx.params;

  try {
    await requireActiveBandMembership(user.id, bandId);

    const rawData = await req.json();
    const parsed = createDocumentSchema.safeParse(rawData);
    if (!parsed.success) return validationError(parsed.error);

    // Verify the file actually exists in Storage before saving metadata
    const bucket = getStorageBucket();
    const [exists] = await bucket.file(parsed.data.key).exists();
    if (!exists) {
      return apiError('File not found in storage. Upload the file first.', 'NOT_FOUND', 404);
    }

    const now = new Date().toISOString();
    const docRef = bandDocumentsDB.doc();

    const documentData = {
      bandId,
      bucket: bucket.name,
      key: parsed.data.key,
      title: parsed.data.title,
      fileName: parsed.data.fileName,
      fileSizeBytes: parsed.data.fileSizeBytes,
      contentType: parsed.data.contentType,
      category: parsed.data.category,
      visibility: parsed.data.visibility,
      uploadedByUserId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(documentData);

    const document = bandDocumentResponseSchema.parse({ id: docRef.id, ...documentData });
    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    if (err instanceof BandAccessError) {
      return apiError(err.message, err.code, err.status);
    }
    console.error(err);
    return NextResponse.error();
  }
}
