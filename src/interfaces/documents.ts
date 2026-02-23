export type DocumentCategory =
  | 'technical-rider'
  | 'stage-plot'
  | 'agibility'
  | 'siae'
  | 'songbook'
  | 'other';

export interface BandDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileUrl: string;
  uploadedAt: string; // ISO
  tags?: string[];
}
