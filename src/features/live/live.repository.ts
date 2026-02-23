import { liveMockData, LiveMockData } from './live.mock';

const cloneData = (): LiveMockData => {
  return {
    venues: [...liveMockData.venues],
    bookings: [...liveMockData.bookings],
    gigs: [...liveMockData.gigs],
  };
};

let inMemoryLiveData = cloneData();

export const liveRepository = {
  list: () => inMemoryLiveData,
  reset: () => {
    inMemoryLiveData = cloneData();
  },
};
