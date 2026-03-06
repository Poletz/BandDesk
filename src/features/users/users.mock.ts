import { TeamUser } from '@/interfaces';

export const teamMockData: TeamUser[] = [
  {
    id: 'user-1',
    name: 'Luca Rossi',
    email: 'luca@band.dev',
    role: 'owner',
    status: 'active',
    lastAccessAt: '2026-02-10T10:30:00.000Z',
  },
  {
    id: 'user-2',
    name: 'Martina Bianchi',
    email: 'martina@band.dev',
    role: 'manager',
    status: 'active',
    lastAccessAt: '2026-02-11T09:20:00.000Z',
  },
  {
    id: 'user-3',
    name: 'Alex Verdi',
    email: 'alex@band.dev',
    role: 'member',
    status: 'invited',
  },
  {
    id: 'user-4',
    name: 'Guest Account',
    email: 'guest@band.dev',
    role: 'member',
    status: 'disabled',
  },
];
