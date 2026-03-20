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

const getBookings = async () => {
  const { data } = await http.get<{ bookings: BookingRequest[] }>('/api/bookings');

  if (!data) {
    return [];
  }

  return data.bookings;
};

const getVenues = async () => {
  const { data } = await http.get<{ venues: Venue[] }>('/api/venues');

  if (!data) {
    return [];
  }
  return data.venues;
};

const getGigs = async () => {
  const { data } = await http.get<{ gigs: GigEvent[] }>('/api/gigs');

  if (!data) {
    return [];
  }

  return data.gigs;
};

export const liveRepository = {
  list: async (): Promise<LiveData> => ({
    gigs: await getGigs(),
    venues: await getVenues(),
    bookings: await getBookings(),
  }),
  reset: () => ({
    gigs: [],
    venues: [],
    bookings: [],
  }),
};
