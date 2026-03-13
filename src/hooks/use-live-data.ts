import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBookingsCountByStatus, getUpcomingGigs, liveRepository } from '@/features';
import { getVenueNameMap } from '@/utils/misc';

export const useLiveData = () => {
  const query = useQuery({
    queryKey: ['live-data'],
    queryFn: liveRepository.list,
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
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
