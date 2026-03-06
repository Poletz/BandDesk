import { useMemo } from 'react';
import {
  documentsRepository,
  getDocumentCountByCategory,
  getRecentDocuments,
} from '@/features/documents';

export const useDocumentsData = () => {
  const documents = documentsRepository.list();

  return useMemo(() => {
    return {
      documents,
      recentDocuments: getRecentDocuments(documents),
      documentCountByCategory: getDocumentCountByCategory(documents),
    };
  }, [documents]);
};
