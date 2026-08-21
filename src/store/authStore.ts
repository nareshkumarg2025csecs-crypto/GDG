import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile, UserRole } from '@/services/authService';

export interface AuthState {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isLoading: boolean;

  // Actions
  setAuthSession: (data: {
    access_token: string | null;
    refresh_token?: string | null;
    user?: { id: string; email: string } | null;
    profile: UserProfile;
  }) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  clearAuthSession: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
      isLoading: false,

      setAuthSession: ({ access_token, refresh_token = null, user = null, profile }) => {
        set({
          accessToken: access_token,
          refreshToken: refresh_token,
          user: user || { id: profile.id, email: profile.email },
          profile,
          role: profile.role,
          isAuthenticated: Boolean(access_token || profile.id),
          isLoading: false,
        });
      },

      updateProfile: (updatedFields) => {
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updatedFields } : null,
          role: updatedFields.role || state.role,
        }));
      },

      clearAuthSession: () => {
        set({
          user: null,
          profile: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'gdg_auth_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);
