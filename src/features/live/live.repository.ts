import { BookingRequest, Venue } from '@/interfaces';
import { http } from '@/utils/http';
import { LiveData, liveMockData } from './live.mock';

const cloneData = (): LiveData => {
  return {
    venues: [...liveMockData.venues],
    bookings: [...liveMockData.bookings],
    gigs: [...liveMockData.gigs],
  };
};

let inMemoryLiveData = cloneData();

type BookingApiItem = Omit<BookingRequest, 'requestedDate' | 'feeProposal' | 'notes'> & {
  requestedDate?: string | null;
  feeProposal?: number | null;
  notes?: string | null;
};

const getBookings = async () => {
  const { data } = await http.get<{ bookings: BookingApiItem[] }>('/api/bookings');

  if (!data) {
    return [];
  }

  return data.bookings.map((booking) => ({
    ...booking,
    requestedDate: booking.requestedDate ?? undefined,
    feeProposal: booking.feeProposal ?? undefined,
    notes: booking.notes ?? undefined,
  }));
};

const getVenues = async () => {
  const { data } = await http.get<{ venues: Venue[] }>('/api/venues');

  if (!data) {
    return [];
  }
  return data.venues;
};

export const liveRepository = {
  list: async (): Promise<LiveData> => ({
    ...inMemoryLiveData,
    venues: await getVenues(),
    bookings: await getBookings(),
  }),
  reset: () => {
    inMemoryLiveData = cloneData();
  },
};
