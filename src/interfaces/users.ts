export type UserRole = 'owner' | 'manager' | 'member';
export type UserStatus = 'active' | 'invited' | 'disabled';

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastAccessAt?: string;
}
