import { Setlist, SetlistStatus } from '@/interfaces';

export const getSetlistCountByStatus = (setlists: Setlist[]): Record<SetlistStatus, number> => {
  return setlists.reduce<Record<SetlistStatus, number>>(
    (acc, setlist) => {
      acc[setlist.status] += 1;
      return acc;
    },
    { draft: 0, published: 0 }
  );
};
