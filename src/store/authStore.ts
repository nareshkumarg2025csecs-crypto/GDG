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
  updateTokens: (accessToken: string, refreshToken?: string | null) => void;
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

      setAuthSession: ({ access_token, refresh_token, user = null, profile }) => {
        set((state) => ({
          accessToken: access_token,
          // CRITICAL: Preserve existing refreshToken if not explicitly provided
          refreshToken: refresh_token !== undefined ? refresh_token : state.refreshToken,
          user: user || { id: profile.id, email: profile.email },
          profile,
          role: profile.role,
          // CRITICAL: True ONLY when a valid access token is present
          isAuthenticated: Boolean(access_token),
          isLoading: false,
        }));
      },

      updateTokens: (newAccessToken: string, newRefreshToken?: string | null) => {
        set((state) => ({
          accessToken: newAccessToken,
          refreshToken:
            newRefreshToken !== undefined && newRefreshToken !== null
              ? newRefreshToken
              : state.refreshToken,
          isAuthenticated: Boolean(newAccessToken),
        }));
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
      onRehydrateStorage: () => (state) => {
        // Enforce that session is authenticated only if valid tokens actually exist
        if (state) {
          const hasAccessToken = Boolean(state.accessToken && state.accessToken.trim());
          const hasRefreshToken = Boolean(state.refreshToken && state.refreshToken.trim());

          if (!hasAccessToken && !hasRefreshToken) {
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
          } else if (!hasAccessToken && hasRefreshToken) {
            // Can be silently refreshed upon the first API call
            state.isAuthenticated = true;
          } else {
            state.isAuthenticated = hasAccessToken;
          }
        }
      },
    }
  )
);
