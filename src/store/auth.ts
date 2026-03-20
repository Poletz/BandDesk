import { User } from 'better-auth';
import { createStore } from '@/utils/misc';

interface AuthStore {
  authLoading: boolean;
  setAuthLoading: (val: boolean) => void;
  user: User | null;
  setUser: (val: User) => void;
}

export const useAuthStore = createStore<AuthStore>((set) => ({
  authLoading: false,
  setAuthLoading: (val) => {
    set(() => ({
      authLoading: val,
    }));
  },
  user: null,
  setUser: (val) => {
    set(() => ({
      user: val,
    }));
  },
}));
