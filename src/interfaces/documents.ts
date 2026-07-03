export type DocumentCategory =
  | 'technical-rider'
  | 'stage-plot'
  | 'agibility'
  | 'siae'
  | 'songbook'
  | 'other';

export type DocumentVisibility = 'public' | 'members' | 'admins';

export const categoryLabel: Record<DocumentCategory, string> = {
  'technical-rider': 'Technical rider',
  'stage-plot': 'Stage plot',
  agibility: 'Agibility',
  siae: 'SIAE',
  songbook: 'Songbook',
  other: 'Other',
};

export interface BandDocument {
  id: string;
  bandId: string;
  bucket: string;
  key: string;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
  category: DocumentCategory;
  visibility: DocumentVisibility;
  uploadedByUserId: string;
  createdAt: string;
  updatedAt: string;
}
