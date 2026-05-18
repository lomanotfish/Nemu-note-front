import { create } from "zustand";

export type AuthUser = {
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
  accessToken: string | undefined;
};

type AuthStore = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
