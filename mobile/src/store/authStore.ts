import { create } from 'zustand';
import { authApi, setTokens, clearTokens } from '../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_premium: boolean;
  is_verified: boolean;
  profile?: any;
  diabetes_profile?: any;
  subscription?: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      await setTokens(data.access_token, data.refresh_token);
      await get().loadUser();
      set({ isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Login failed. Please try again.';
      set({ error: msg, isLoading: false });
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Calling register API with:', { email, fullName });
      const { data } = await authApi.register(email, password, fullName);
      console.log('Register API response:', data);
      await setTokens(data.access_token, data.refresh_token);
      console.log('Tokens saved, loading user...');
      await get().loadUser();
      set({ isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      console.error('Registration error details:', err);
      console.error('Error response:', err?.response?.data);
      const msg = err?.response?.data?.detail || err?.message || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false, error: null });
  },

  loadUser: async () => {
    try {
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true });
    } catch {
      await clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user }),
}));
