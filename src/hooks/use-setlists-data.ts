import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSetlistCountByStatus, setlistsRepository } from '@/features/setlists';
import { useBandContext } from '@/hooks/use-band-context';

export const useSetlistsData = () => {
  const { activeBandId, activeBand, isLoading: isBandContextLoading } = useBandContext();

  const query = useQuery({
    queryKey: ['setlists', activeBandId],
    queryFn: () => setlistsRepository.list(activeBandId!),
    enabled: Boolean(activeBandId),
  });

  const computed = useMemo(() => {
    const setlists = query.data ?? [];
    return {
      setlists,
      setlistCountByStatus: getSetlistCountByStatus(setlists),
    };
  }, [query.data]);

  return {
    ...computed,
    activeBandId,
    role: activeBand?.membership.role ?? null,
    isLoading: isBandContextLoading || query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
