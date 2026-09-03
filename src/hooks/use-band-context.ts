import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bandsRepository } from '@/features/bands';
import type { BandContextPayload } from '@/interfaces';

const BAND_CONTEXT_QUERY_KEY = ['band-context'] as const;

export const useBandContext = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: BAND_CONTEXT_QUERY_KEY,
    queryFn: bandsRepository.getContext,
  });

  const switchBandMutation = useMutation({
    mutationFn: bandsRepository.setActiveBand,
    onSuccess: async ({ activeBandId }) => {
      queryClient.setQueryData<BandContextPayload>(BAND_CONTEXT_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          activeBandId,
        };
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['live-data'] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-data'] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['setlists'] }),
      ]);
    },
  });

  const value = useMemo(() => {
    const data: BandContextPayload = query.data ?? {
      bands: [],
      activeBandId: null,
    };

    const activeBand =
      data.bands.find((band) => band.id === data.activeBandId) ?? data.bands[0] ?? null;
    const resolvedActiveBandId = activeBand?.id ?? null;

    return {
      bands: data.bands,
      activeBandId: resolvedActiveBandId,
      activeBand,
    };
  }, [query.data]);

  return {
    ...value,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    isSwitchingBand: switchBandMutation.isPending,
    switchActiveBand: switchBandMutation.mutateAsync,
  };
};
