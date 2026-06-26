import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(persist(
  (set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: (user, token) => set({ user, token, isAuthenticated: true }),
    logout: () => set({ user: null, token: null, isAuthenticated: false }),
    updateUser: (patch) => set(s => ({ user: { ...s.user, ...patch } })),
    getState: () => get(),
  }),
  { name: 'latent_auth' }
));
