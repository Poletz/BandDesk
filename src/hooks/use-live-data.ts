import { useMemo } from 'react';
import { getBookingsCountByStatus, getUpcomingGigs, liveRepository } from '@/features';
import { getVenueNameMap } from '@/utils/misc';

export const useLiveData = () => {
  const liveData = liveRepository.list();

  return useMemo(() => {
    const venueNameById = getVenueNameMap(liveData.venues);

    return {
      ...liveData,
      venueNameById,
      upcomingGigs: getUpcomingGigs(liveData.gigs),
      bookingCountByStatus: getBookingsCountByStatus(liveData.bookings),
    };
  }, [liveData]);
};
