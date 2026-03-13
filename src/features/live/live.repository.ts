import { Venue } from '@/interfaces';
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

const getVenues = async () => {
  const { data } = await http.get<{ venues: Venue[] }>('/api/venues');

  if (!data) {
    return [];
  }
  return data.venues;
};

export const liveRepository = {
  list: async (): Promise<LiveData> => ({ ...inMemoryLiveData, venues: await getVenues() }),
  reset: () => {
    inMemoryLiveData = cloneData();
  },
};
