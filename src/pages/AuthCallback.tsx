import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { type UserRole } from '@/services/authService';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { syncGoogleOAuth } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
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

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const providerToken = hashParams.get('provider_token') || undefined;
        const providerRefreshToken = hashParams.get('provider_refresh_token') || undefined;

        // Check if this is a Calendar linking flow for an already logged-in account
        const isLinking =
          searchParams.get('link_identity') === 'true' ||
          hashParams.get('link_identity') === 'true';

        if (isLinking) {
          const googleAccessToken = providerToken || accessToken;
          if (!googleAccessToken) {
            throw new Error('No Google token received for calendar linking.');
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

          setStatus('success');
          toast({
            title: 'Google Services Connected',
            description: 'Google Sheets & Calendar permissions granted. Your login session is preserved.',
          });

          const returnUrl = localStorage.getItem('auth_link_redirect') || '/admin/events';
          localStorage.removeItem('auth_link_redirect');

          setTimeout(() => {
            navigate(returnUrl, { replace: true });
          }, 1200);
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
          // If neither hash nor search tokens are found
          const queryCode = searchParams.get('code');
          if (!queryCode) {
            throw new Error('No authentication token received from identity provider.');
          }
          // If code flow, message user to login
          throw new Error('OAuth authorization code flow requires direct server callback.');
        }

        // 3. Sync profile with backend API (only for full Google Login)
        const syncResponse = await syncGoogleOAuth(
          {
            provider_token: providerToken,
            provider_refresh_token: providerRefreshToken,
            role: roleParam,
            admin_code: adminCodeParam,
          },
          accessToken
        );

        // Clear temporary admin code once consumed
        sessionStorage.removeItem('pending_admin_code');

        setStatus('success');
        toast({
          title: `Welcome, ${syncResponse.profile.full_name || syncResponse.profile.email}!`,
          description: 'Successfully authenticated with Google.',
        });

        // Redirect to onboarding if personal info is incomplete (roll_no / department missing)
        const hasCompletedInfo =
          Boolean(syncResponse.profile?.details?.roll_no) &&
          Boolean(syncResponse.profile?.details?.department);

        const targetUrl =
          localStorage.getItem('auth_redirect_url') ||
          searchParams.get('redirect') ||
          '/';

        setTimeout(() => {
          if (syncResponse.profile.role === 'admin') {
            localStorage.removeItem('auth_redirect_url');
            navigate(targetUrl, { replace: true });
          } else if (!hasCompletedInfo && syncResponse.profile.role === 'student') {
            // Keep targetUrl in storage so onboarding forwards there upon saving
            if (targetUrl && targetUrl !== '/' && targetUrl !== '/onboarding') {
              localStorage.setItem('auth_redirect_url', targetUrl);
            }
            navigate('/onboarding', { replace: true });
          } else {
            localStorage.removeItem('auth_redirect_url');
            navigate(targetUrl, { replace: true });
          }
        }, 1200);
      } catch (err: any) {
        console.error('Google OAuth callback error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to complete Google authentication.');
      }
    };

    handleAuthCallback();
  }, [location, searchParams, syncGoogleOAuth, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-google-blue/30 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-2xl border bg-card text-card-foreground shadow-2xl text-center backdrop-blur-xl"
      >
        {status === 'loading' && (
          <div className="space-y-4 py-6">
            <div className="w-12 h-12 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-bold font-sans">Connecting your Google Account</h2>
            <p className="text-sm text-muted-foreground">
              Verifying credentials and setting up your GDG profile...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-6">
            <div className="w-12 h-12 rounded-full bg-google-green/10 text-google-green flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-sans text-foreground">Authentication Complete!</h2>
            <p className="text-sm text-muted-foreground">Redirecting you to the GDG portal...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5 py-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-sans text-destructive">Authentication Failed</h2>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
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
