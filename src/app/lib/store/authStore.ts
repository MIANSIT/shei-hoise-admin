import { create } from "zustand";

interface AuthState {
  isAdminLoggedIn: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
  hydrated: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAdminLoggedIn: false,
  hydrated: false,

  // Hardcoded checkAuth (no API)
  checkAuth: async () => {
    // For now, always treat as logged out
    set({ isAdminLoggedIn: false, hydrated: true });
  },

  // Hardcoded logout (no API)
  logout: () => {
    set({ isAdminLoggedIn: false });
  },
}));
