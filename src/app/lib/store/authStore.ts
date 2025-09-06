import { create } from "zustand";

interface AuthState {
  isAdminLoggedIn: boolean;
  hydrated: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAdminLoggedIn: false,
  hydrated: false,

  // Check localStorage for persisted login
  checkAuth: async () => {
    const stored = localStorage.getItem("isAdminLoggedIn") === "true";
    set({ isAdminLoggedIn: stored, hydrated: true });
  },

  // Hardcoded login for now
  login: async (email, password) => {
    const ADMIN_EMAIL = "admin@sheihoise.com";
    const ADMIN_PASSWORD = "admin123";
    const success = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;

    set({ isAdminLoggedIn: success });
    localStorage.setItem("isAdminLoggedIn", success ? "true" : "false");
    return success;
  },

  // Logout
  logout: () => {
    set({ isAdminLoggedIn: false });
    localStorage.setItem("isAdminLoggedIn", "false");
  },
}));
