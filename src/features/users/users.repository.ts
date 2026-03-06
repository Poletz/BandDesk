import { TeamUser } from '@/interfaces';
import { teamMockData } from './users.mock';

let inMemoryTeam: TeamUser[] = [...teamMockData];

export const teamRepository = {
  list: () => inMemoryTeam,
  reset: () => {
    inMemoryTeam = [...teamMockData];
  },
};
