import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBookingsCountByStatus, getUpcomingGigs, liveRepository } from '@/features';
import { useBandContext } from '@/hooks/use-band-context';
import { getVenueNameMap } from '@/utils/misc';

export const useLiveData = () => {
  const { activeBandId, isLoading: isBandContextLoading } = useBandContext();

  const query = useQuery({
    queryKey: ['live-data', activeBandId],
    queryFn: () => liveRepository.list(activeBandId ?? undefined),
    enabled: Boolean(activeBandId),
  });

  const computed = useMemo(() => {
    const liveData = query.data ?? { venues: [], bookings: [], gigs: [] };
    const venueNameById = getVenueNameMap(liveData.venues);

    return {
      ...liveData,
      venueNameById,
      upcomingGigs: getUpcomingGigs(liveData.gigs),
      bookingCountByStatus: getBookingsCountByStatus(liveData.bookings),
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
