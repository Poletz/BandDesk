import { useMemo } from 'react';
import {
  getBookingsCountByStatus,
  getUpcomingGigs,
  getVenueNameMap,
  liveRepository,
} from '@/features';

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
