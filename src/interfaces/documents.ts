export type DocumentCategory =
  | 'technical-rider'
  | 'stage-plot'
  | 'agibility'
  | 'siae'
  | 'songbook'
  | 'other';

export const categoryLabel: Record<string, string> = {
  'technical-rider': 'Technical rider',
  'stage-plot': 'Stage plot',
  agibility: 'Agibility',
  siae: 'SIAE',
  songbook: 'Songbook',
  other: 'Other',
};

export interface BandDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileUrl: string;
  uploadedAt: string; // ISO
  tags?: string[];
}
