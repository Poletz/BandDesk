import { BandDocument, DocumentCategory, DocumentVisibility } from '@/interfaces';
import { http } from '@/utils/http';

export interface RequestUploadUrlParams {
  fileName: string;
  contentType: string;
  category: DocumentCategory;
  title: string;
  fileSizeBytes: number;
}

export interface CreateDocumentParams {
  key: string;
  fileName: string;
  contentType: string;
  category: DocumentCategory;
  title: string;
  fileSizeBytes: number;
  visibility?: DocumentVisibility;
}

const list = async (bandId: string): Promise<BandDocument[]> => {
  const { data } = await http.get<{ documents: BandDocument[] }>(
    `/api/bands/${bandId}/documents`
  );
  return data?.documents ?? [];
};

const requestUploadUrl = async (
  bandId: string,
  params: RequestUploadUrlParams
): Promise<{ uploadUrl: string; key: string }> => {
  const { data } = await http.post<{ uploadUrl: string; key: string }>(
    `/api/bands/${bandId}/documents/upload-url`,
    params
  );
  return data;
};

const uploadFileToStorage = async (uploadUrl: string, file: File): Promise<void> => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!response.ok) {
    throw new Error(`Storage upload failed: ${response.status}`);
  }
};

const createDocument = async (
  bandId: string,
  params: CreateDocumentParams
): Promise<BandDocument> => {
  const { data } = await http.post<{ document: BandDocument }>(
    `/api/bands/${bandId}/documents`,
    params
  );
  return data.document;
};

const getDownloadUrl = async (bandId: string, documentId: string): Promise<string> => {
  const { data } = await http.get<{ url: string }>(
    `/api/bands/${bandId}/documents/${documentId}/download-url`
  );
  return data.url;
};

const deleteDocument = async (bandId: string, documentId: string): Promise<void> => {
  await http.delete(`/api/bands/${bandId}/documents/${documentId}`);
};

export const documentsRepository = {
  list,
  requestUploadUrl,
  uploadFileToStorage,
  createDocument,
  getDownloadUrl,
  deleteDocument,
};
