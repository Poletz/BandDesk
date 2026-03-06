import { useMemo } from 'react';
import { getUserCountByStatus, teamRepository } from '@/features/users';

export const useTeamData = () => {
  const users = teamRepository.list();

  return useMemo(() => {
    return {
      users,
      userCountByStatus: getUserCountByStatus(users),
    };
  }, [users]);
};
