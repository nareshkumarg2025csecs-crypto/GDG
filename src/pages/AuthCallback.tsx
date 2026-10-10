import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { apiRequest, getStoredToken } from '@/lib/api';
import { type UserRole } from '@/services/authService';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { syncGoogleOAuth } = useAuth();

  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1. Check for errors in search parameters or hash
        const searchError = searchParams.get('error_description') || searchParams.get('error');
        if (searchError) {
          throw new Error(searchError);
        }

        // 2. Parse hash params (Supabase returns tokens in the URL hash fragment)
        const hash = location.hash.startsWith('#') ? location.hash.substring(1) : location.hash;
        const hashParams = new URLSearchParams(hash);

        const accessTokenFromUrl = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshTokenFromUrl =
          hashParams.get('refresh_token') ||
          searchParams.get('refresh_token') ||
          undefined;
        const accessToken = accessTokenFromUrl || getStoredToken();
        const providerToken =
          hashParams.get('provider_token') ||
          searchParams.get('provider_token') ||
          undefined;
        const providerRefreshToken =
          hashParams.get('provider_refresh_token') ||
          searchParams.get('provider_refresh_token') ||
          undefined;

        // Check if this is a Google Sheets/Calendar linking flow for an already logged-in account
        const isLinking =
          searchParams.get('link_identity') === 'true' ||
          hashParams.get('link_identity') === 'true';

        if (isLinking) {
          const googleAccessToken = providerToken || accessToken;
          if (!googleAccessToken) {
            throw new Error('No Google token received for service linking.');
          }

          // Save Google tokens for the currently authenticated user without overwriting login session
          await apiRequest('/api/auth/google/tokens', {
            method: 'POST',
            body: JSON.stringify({
              access_token: googleAccessToken,
              refresh_token: providerRefreshToken,
              expires_in: 3600,
            }),
          });

          toast({
            title: 'Google Services Connected',
            description: 'Google permissions granted. Your login session is preserved.',
          });

          const returnUrl = localStorage.getItem('auth_link_redirect') || '/admin/events';
          localStorage.removeItem('auth_link_redirect');

          const separator = returnUrl.includes('?') ? '&' : '?';
          navigate(`${returnUrl}${separator}google_connected=true`, { replace: true });
          return;
        }

        // Determine requested role from query or hash for regular Google OAuth Sign-in/Sign-up
        const roleParam = (searchParams.get('role') || hashParams.get('role') || 'student') as UserRole;
        const adminCodeParam =
          searchParams.get('admin_code') ||
          hashParams.get('admin_code') ||
          sessionStorage.getItem('pending_admin_code') ||
          undefined;

        if (!accessToken) {
          const queryCode = searchParams.get('code');
          if (!queryCode) {
            console.warn('[AuthCallback] No access token found in URL or storage. Redirecting to /auth.');
            navigate('/auth', { replace: true });
            return;
          }
          throw new Error('OAuth authorization code flow requires direct server callback.');
        }

        const isRecovery =
          searchParams.get('type') === 'recovery' ||
          hashParams.get('type') === 'recovery';

        if (isRecovery) {
          navigate(`/auth/reset-password#access_token=${accessToken}`, { replace: true });
          return;
        }

        const isEmailVerification =
          searchParams.get('type') === 'signup' ||
          hashParams.get('type') === 'signup' ||
          searchParams.get('type') === 'magiclink' ||
          hashParams.get('type') === 'magiclink';

        // 3. Sync profile with backend API (creates or retrieves profile row)
        // Uses automatic retry with progressive backoff so nodemon reloads or server start-up latency
        // never show "Authentication Failed" to the user.
        let syncResponse: any = null;
        const maxSyncAttempts = 4;
        let lastSyncError: any = null;

        for (let attempt = 1; attempt <= maxSyncAttempts; attempt++) {
          try {
            syncResponse = await syncGoogleOAuth(
              {
                provider_token: providerToken,
                provider_refresh_token: providerRefreshToken,
                role: roleParam,
                admin_code: adminCodeParam,
              },
              accessToken,
              refreshTokenFromUrl
            );

            if (syncResponse?.profile) {
              lastSyncError = null;
              break;
            }
          } catch (syncErr: any) {
            lastSyncError = syncErr;
            console.warn(`[OAuth Callback] Sync attempt ${attempt}/${maxSyncAttempts} failed:`, syncErr?.message);

            // Abort immediately on genuine authentication rejections (e.g. wrong admin code 403, invalid token 401, validation 400)
            if (syncErr?.status === 403 || syncErr?.status === 401 || syncErr?.status === 400) {
              throw syncErr;
            }

            // For transient network connection drops (ECONNREFUSED / 503 / 502 / 504), wait and retry
            if (attempt < maxSyncAttempts) {
              await new Promise((resolve) => setTimeout(resolve, attempt * 800));
            }
          }
        }

        if (lastSyncError && !syncResponse?.profile) {
          throw lastSyncError;
        }

        // Clear temporary admin code once consumed
        sessionStorage.removeItem('pending_admin_code');

        if (isEmailVerification) {
          toast({
            title: 'Email Verified Successfully! 🎉',
            description: `Welcome, ${syncResponse.profile.full_name || 'Student'}!`,
          });
        } else {
          toast({
            title: `Welcome, ${syncResponse.profile.full_name || syncResponse.profile.email}!`,
            description: 'Successfully authenticated.',
          });
        }

        // Direct, instant redirection without intermediate redirecting screens or app download banners
        const hasCompletedInfo =
          Boolean(syncResponse.profile?.details?.roll_no) &&
          Boolean(syncResponse.profile?.details?.department);

        const hasAdminOnboarded =
          Boolean(syncResponse.profile?.details?.position) &&
          Boolean(syncResponse.profile?.details?.domain);

        const rawTargetUrl =
          localStorage.getItem('auth_redirect_url') ||
          searchParams.get('redirect') ||
          (syncResponse.profile.role === 'admin' ? '/admin/events' : '/');

        localStorage.removeItem('auth_redirect_url');

        // Strict internal path validation to prevent open redirects
        const defaultFallback = syncResponse.profile.role === 'admin' ? '/admin/events' : '/';
        const targetUrl =
          rawTargetUrl &&
          rawTargetUrl.startsWith('/') &&
          !rawTargetUrl.startsWith('//') &&
          !rawTargetUrl.startsWith('/\\')
            ? rawTargetUrl
            : defaultFallback;

        if (syncResponse.profile.role === 'admin') {
          if (!hasAdminOnboarded) {
            if (targetUrl && targetUrl !== '/' && targetUrl !== '/admin/onboard') {
              localStorage.setItem('auth_redirect_url', targetUrl);
            }
            navigate('/admin/onboard', { replace: true });
          } else {
            navigate(targetUrl, { replace: true });
          }
        } else if (isEmailVerification || (!hasCompletedInfo && syncResponse.profile.role === 'student')) {
          if (targetUrl && targetUrl !== '/' && targetUrl !== '/onboarding') {
            localStorage.setItem('auth_redirect_url', targetUrl);
          }
          navigate('/onboarding', { replace: true });
        } else {
          navigate(targetUrl, { replace: true });
        }
      } catch (err: any) {
        console.error('Authentication callback error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to complete authentication verification.');
      }
    };

    handleAuthCallback();
  }, [location, searchParams, syncGoogleOAuth, navigate]);

  const isVerifying =
    searchParams.get('type') === 'signup' ||
    location.hash.includes('type=signup') ||
    searchParams.get('type') === 'magiclink' ||
    location.hash.includes('type=magiclink');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-google-blue/30 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-2xl border bg-card text-card-foreground shadow-2xl text-center backdrop-blur-xl"
      >
        {status === 'loading' && (
          <div className="space-y-4 py-6">
            <div className="w-12 h-12 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-bold font-sans">
              {isVerifying ? 'Verifying Account...' : 'Signing in...'}
            </h2>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5 py-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-sans text-destructive">Authentication Failed</h2>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-md"
              >
                <span>Retry Authentication</span>
              </button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl border border-border text-foreground/80 hover:bg-muted font-medium text-xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;
