import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentsRepository, getDocumentCountByCategory, getRecentDocuments } from '@/features/documents';
import { useBandContext } from '@/hooks/use-band-context';

export const DOCUMENTS_QUERY_KEY = (bandId: string) => ['documents', bandId] as const;

export const useDocumentsData = () => {
  const { activeBandId, isLoading: isBandContextLoading } = useBandContext();

  const query = useQuery({
    queryKey: ['documents', activeBandId],
    queryFn: () => documentsRepository.list(activeBandId!),
    enabled: Boolean(activeBandId),
  });

  const computed = useMemo(() => {
    const documents = query.data ?? [];
    return {
      documents,
      recentDocuments: getRecentDocuments(documents),
      documentCountByCategory: getDocumentCountByCategory(documents),
    };
  }, [query.data]);

  return {
    ...computed,
    activeBandId,
    isLoading: isBandContextLoading || query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
