import { liveRepository } from '@/features/live';

export const calendarRepository = {
  listSourceData: () => {
    const { bookings, gigs, venues } = liveRepository.list();

    return {
      bookings,
      gigs,
      venues,
    };
  },
};
