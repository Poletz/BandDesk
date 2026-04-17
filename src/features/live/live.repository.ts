import { BookingRequest, GigEvent, Venue } from '@/interfaces';
import { http } from '@/utils/http';
import { LiveData } from './live.mock';

// const cloneData = (): LiveData => {
//   return {
//     venues: [...liveMockData.venues],
//     bookings: [...liveMockData.bookings],
//     gigs: [...liveMockData.gigs],
//   };
// };

// let inMemoryLiveData = cloneData();

const getBandScopedRequestConfig = (bandId?: string) => {
  if (!bandId) {
    return undefined;
  }

  return {
    params: { bandId },
    headers: { 'x-band-id': bandId },
  };
};

const getBookings = async (bandId?: string) => {
  const { data } = await http.get<{ bookings: BookingRequest[] }>(
    '/api/bookings',
    getBandScopedRequestConfig(bandId)
  );

  if (!data) {
    return [];
  }

  return data.bookings;
};

const getVenues = async (bandId?: string) => {
  const { data } = await http.get<{ venues: Venue[] }>(
    '/api/venues',
    getBandScopedRequestConfig(bandId)
  );

  if (!data) {
    return [];
  }
  return data.venues;
};

const getGigs = async (bandId?: string) => {
  const { data } = await http.get<{ gigs: GigEvent[] }>(
    '/api/gigs',
    getBandScopedRequestConfig(bandId)
  );

  if (!data) {
    return [];
  }

  return data.gigs;
};

export const liveRepository = {
  list: async (bandId?: string): Promise<LiveData> => {
    const [gigs, venues, bookings] = await Promise.all([
      getGigs(bandId),
      getVenues(bandId),
      getBookings(bandId),
    ]);

    return {
      gigs,
      venues,
      bookings,
    };
  },
  reset: () => ({
    gigs: [],
    venues: [],
    bookings: [],
  }),
};
