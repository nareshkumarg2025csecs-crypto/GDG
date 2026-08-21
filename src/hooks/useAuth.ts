import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  authService,
  type UserRole,
  type LoginData,
  type StudentSignupData,
  type AdminSignupData,
} from '@/services/authService';

export function useAuth() {
  const {
    user,
    profile,
    accessToken,
    refreshToken,
    isAuthenticated,
    role,
    isLoading,
    setAuthSession,
    clearAuthSession,
    setLoading,
    updateProfile,
  } = useAuthStore();

  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  const hasRole = useCallback(
    (requiredRole: UserRole | UserRole[]): boolean => {
      if (!isAuthenticated || !role) return false;
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(role);
      }
      return role === requiredRole;
    },
    [isAuthenticated, role]
  );

  const login = useCallback(
    async (credentials: LoginData, targetRole: UserRole = 'student') => {
      setLoading(true);
      try {
        const response =
          targetRole === 'admin'
            ? await authService.adminLogin(credentials)
            : await authService.studentLogin(credentials);

        setAuthSession({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          user: response.user || {
            id: response.profile.id,
            email: response.profile.email,
          },
          profile: response.profile,
        });

        return response;
      } finally {
        setLoading(false);
      }
    },
    [setAuthSession, setLoading]
  );

  const signup = useCallback(
    async (
      data: StudentSignupData | AdminSignupData,
      targetRole: UserRole = 'student'
    ) => {
      setLoading(true);
      try {
        const response =
          targetRole === 'admin'
            ? await authService.adminSignup(data as AdminSignupData)
            : await authService.studentSignup(data as StudentSignupData);

        if (response.access_token) {
          setAuthSession({
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            user: response.user || {
              id: response.profile.id,
              email: response.profile.email,
            },
            profile: response.profile,
          });
        }

        return response;
      } finally {
        setLoading(false);
      }
    },
    [setAuthSession, setLoading]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (accessToken) {
        try {
          await authService.logout(accessToken);
        } catch {
          // Continue local cleanup even if remote logout fails
        }
      }
    } finally {
      clearAuthSession();
      setLoading(false);
    }
  }, [accessToken, clearAuthSession, setLoading]);

  const initiateGoogleLogin = useCallback(
    async (targetRole: UserRole = 'student', adminCode?: string) => {
      setLoading(true);
      try {
        const { url } = await authService.getGoogleOAuthUrl(targetRole, adminCode);
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No Google OAuth URL returned from server.');
        }
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  const syncGoogleOAuth = useCallback(
    async (
      payload: {
        provider_token?: string;
        provider_refresh_token?: string;
        role?: UserRole;
        admin_code?: string;
      },
      token: string
    ) => {
      setLoading(true);
      try {
        const response = await authService.syncGoogleProfile(payload, token);
        if (response.profile) {
          setAuthSession({
            access_token: token,
            profile: response.profile,
            user: {
              id: response.profile.id,
              email: response.profile.email,
            },
          });
        }
        return response;
      } finally {
        setLoading(false);
      }
    },
    [setAuthSession, setLoading]
  );

  return {
    user,
    profile,
    accessToken,
    refreshToken,
    isAuthenticated,
    role,
    isAdmin,
    isStudent,
    isLoading,
    hasRole,
    login,
    signup,
    logout,
    initiateGoogleLogin,
    syncGoogleOAuth,
    updateProfile,
  };
}
