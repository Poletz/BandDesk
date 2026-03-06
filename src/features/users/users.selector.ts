import { TeamUser, UserStatus } from '@/interfaces';

export const getUserCountByStatus = (users: TeamUser[]) => {
  return users.reduce<Record<UserStatus, number>>(
    (acc, user) => {
      acc[user.status] += 1;
      return acc;
    },
    {
      active: 0,
      invited: 0,
      disabled: 0,
    }
  );
};
