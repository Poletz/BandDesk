import { BandDocument, DocumentCategory } from '@/interfaces';

export const getRecentDocuments = (documents: BandDocument[], limit = 3) => {
  return [...documents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

export const getDocumentCountByCategory = (documents: BandDocument[]) => {
  return documents.reduce<Record<DocumentCategory, number>>(
    (acc, document) => {
      acc[document.category] += 1;
      return acc;
    },
    {
      'technical-rider': 0,
      'stage-plot': 0,
      agibility: 0,
      siae: 0,
      songbook: 0,
      other: 0,
    }
  );
};
