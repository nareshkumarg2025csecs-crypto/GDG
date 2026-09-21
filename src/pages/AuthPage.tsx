import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';
import { authService } from '@/services/authService';

interface AuthPageProps {
  defaultMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode = 'login' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { login, signup, initiateGoogleLogin, isAuthenticated, user, profile } = useAuth();

  // Mode and Role state
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : defaultMode;
  const isAdminParam = searchParams.get('role') === 'admin' || searchParams.get('admin') === 'true';
  const initialRole = isAdminParam ? 'admin' : 'student';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<'student' | 'admin'>(initialRole);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [adminGoogleModalOpen, setAdminGoogleModalOpen] = useState(false);
  const [adminModalError, setAdminModalError] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);
  const [resetCooldown, setResetCooldown] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Reset countdown timer
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const interval = setInterval(() => {
      setResetCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resetCooldown]);

  const handleSendPasswordReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = (forgotPasswordEmail || email).trim();
    if (!targetEmail) {
      setFormErrors({ forgotEmail: 'Email is required' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setFormErrors({ forgotEmail: 'Please enter a valid email address' });
      return;
    }

    setFormErrors({});
    setIsSendingReset(true);
    setServerError(null);

    try {
      const res = await authService.requestPasswordReset(targetEmail);
      setResetSentEmail(targetEmail);
      setResetCooldown(60);
      toast({
        title: 'Reset Link Sent! ✉️',
        description: res.message || 'Please check your email inbox for the reset link.',
      });
    } catch (err: any) {
      setServerError(err.message || 'Failed to send password reset email.');
      toast({
        title: 'Request Failed',
        description: err.message || 'Could not dispatch reset email.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = verificationSentEmail || email.trim();
    if (!targetEmail || isResending || resendCooldown > 0) return;

    setIsResending(true);
    setServerError(null);
    try {
      const res = await authService.resendStudentVerification(targetEmail);
      toast({
        title: 'Verification Link Sent! ✉️',
        description: res.message || 'Check your email inbox for the new link.',
      });
      setResendCooldown(60);
    } catch (err: any) {
      toast({
        title: 'Failed to Resend',
        description: err.message || 'Could not dispatch verification email.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  // If already authenticated, redirect to home page or requested redirect URL
  useEffect(() => {
    if (isAuthenticated) {
      const dest = searchParams.get('redirect') || '/';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Auto-dismiss server error banner after 3 seconds
  useEffect(() => {
    if (!serverError) return;
    const timer = setTimeout(() => {
      setServerError(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [serverError]);

  // Auto-dismiss client-side validation errors after 3 seconds
  useEffect(() => {
    if (Object.keys(formErrors).length === 0) return;
    const timer = setTimeout(() => {
      setFormErrors({});
    }, 3000);
    return () => clearTimeout(timer);
  }, [formErrors]);

  // Auto-dismiss server success banner after 4 seconds
  useEffect(() => {
    if (!serverSuccess) return;
    const timer = setTimeout(() => {
      setServerSuccess(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [serverSuccess]);

  // Sanitize developer/database errors into clean user-friendly messages
  const sanitizeErrorMessage = (err: any): string => {
    const raw = (err instanceof ApiError ? err.message : err?.message) || '';
    const lower = raw.toLowerCase();

    // Mask technical/database/internal errors
    if (
      lower.includes('supabase') ||
      lower.includes('postgres') ||
      lower.includes('database') ||
      lower.includes('duplicate key') ||
      lower.includes('foreign key') ||
      lower.includes('internal server error') ||
      lower.includes('sql') ||
      lower.includes('table') ||
      lower.includes('column') ||
      lower.includes('violates') ||
      lower.includes('relation') ||
      lower.includes('failed to fetch') ||
      (err instanceof ApiError && err.status >= 500)
    ) {
      return 'Unable to process your request right now. Please try again in a few moments.';
    }

    if (raw.startsWith('Validation error: ')) {
      return raw.replace('Validation error: ', '');
    }

    return raw || 'An unexpected error occurred. Please try again.';
  };

  // Clear errors on mode or role toggle
  const handleModeChange = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setFormErrors({});
    setServerError(null);
    setServerSuccess(null);
  };

  const handleRoleChange = (newRole: 'student' | 'admin') => {
    setRole(newRole);
    setFormErrors({});
    setServerError(null);
    setServerSuccess(null);
  };

  // Client Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (mode === 'signup' && !fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (mode === 'signup') {
      if (!/[A-Za-z]/.test(password)) {
        errors.password = 'Password must include at least one letter';
      } else if (!/\d/.test(password)) {
        errors.password = 'Password must include at least one number';
      } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
        errors.password = 'Password must include at least one symbol or special character';
      }
    }

    if (role === 'admin' && mode === 'signup' && !adminCode.trim()) {
      errors.adminCode = 'Admin signup code is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (searchParams.get('redirect')) {
      localStorage.setItem('auth_redirect_url', searchParams.get('redirect')!);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const response = await login(
          {
            email: email.trim(),
            password,
          },
          role
        );

        toast({
          title: `Welcome back, ${response.profile.full_name || response.profile.email}`,
          description: `Logged in as ${response.profile.role === 'admin' ? 'Administrator' : 'Student'}.`,
        });

        localStorage.removeItem('auth_redirect_url');
        navigate(redirectUrl);
      } else {
        const response = await signup(
          role === 'admin'
            ? {
                full_name: fullName.trim(),
                email: email.trim(),
                password,
                admin_code: adminCode.trim(),
              }
            : {
                full_name: fullName.trim(),
                email: email.trim(),
                password,
              },
          role
        );

        if (response.access_token) {
          if (role === 'admin' || response.profile?.role === 'admin') {
            toast({
              title: 'Admin account created successfully',
              description: 'Welcome to GDG!',
            });
            localStorage.removeItem('auth_redirect_url');
            navigate(redirectUrl);
          } else {
            toast({
              title: 'Account created successfully',
              description: `Welcome to GDG! Please complete your academic details.`,
            });
            // Preserve target destination so user is forwarded there after onboarding
            if (redirectUrl && redirectUrl !== '/' && redirectUrl !== '/auth') {
              localStorage.setItem('auth_redirect_url', redirectUrl);
            }
            navigate('/onboarding');
          }
        } else {
          setVerificationSentEmail(email.trim());
          setResendCooldown(60);
          setServerSuccess(
            response.message || 'Verification link sent. Please check your email to complete registration.'
          );
        }
      }
    } catch (err: any) {
      const msg = sanitizeErrorMessage(err);
      setServerError(msg);
      if (err?.code === 'EMAIL_NOT_VERIFIED' || msg.toLowerCase().includes('verify your email')) {
        setVerificationSentEmail(email.trim());
        setResendCooldown(30);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth Flow
  const handleGoogleClick = async () => {
    setServerError(null);
    setAdminModalError(null);

    if (role === 'admin') {
      const code = adminCode.trim();
      if (!code) {
        // Prompt for admin code in modal
        setAdminGoogleModalOpen(true);
        return;
      }

      // If code was already filled in the form, validate it first with the backend
      setIsValidatingCode(true);
      try {
        const res = await authService.validateAdminCode(code);
        if (!res.valid) {
          const errMsg = res.message || 'Invalid admin secret code. Please contact club leads.';
          setAdminModalError(errMsg);
          setAdminGoogleModalOpen(true);
          return;
        }
      } catch (err: any) {
        const errMsg = sanitizeErrorMessage(err);
        setAdminModalError(errMsg);
        setAdminGoogleModalOpen(true);
        return;
      } finally {
        setIsValidatingCode(false);
      }

      await executeGoogleRedirect(code);
      return;
    }

    await executeGoogleRedirect();
  };

  // Verify code entered inside the Admin Google Modal before moving to Google Auth
  const handleVerifyAndRedirect = async () => {
    const code = adminCode.trim();
    if (!code) {
      setAdminModalError('Please enter the admin secret code.');
      return;
    }

    setAdminModalError(null);
    setIsValidatingCode(true);

    try {
      const res = await authService.validateAdminCode(code);
      if (!res.valid) {
        setAdminModalError(res.message || 'Invalid admin secret code. Please contact club leads.');
        return;
      }

      // Code is verified valid! Proceed to Google OAuth redirect
      toast({
        title: 'Admin Code Verified',
        description: 'Redirecting to Google for administrator authentication...',
      });
      setAdminGoogleModalOpen(false);
      await executeGoogleRedirect(code);
    } catch (err: any) {
      setAdminModalError(sanitizeErrorMessage(err));
    } finally {
      setIsValidatingCode(false);
    }
  };

  const executeGoogleRedirect = async (secretCode?: string) => {
    setIsGoogleLoading(true);
    setServerError(null);
    try {
      if (secretCode) {
        sessionStorage.setItem('pending_admin_code', secretCode.trim());
      } else {
        sessionStorage.removeItem('pending_admin_code');
      }
      await initiateGoogleLogin(role, role === 'admin' ? secretCode : undefined);
    } catch (err: any) {
      setServerError(sanitizeErrorMessage(err));
      setIsGoogleLoading(false);
      setAdminGoogleModalOpen(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 selection:bg-google-blue/30 overflow-hidden">
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] w-[550px] h-[550px] rounded-full blur-[120px] opacity-25"
          style={{ background: 'radial-gradient(circle, #4285F4 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[550px] h-[550px] rounded-full blur-[120px] opacity-25"
          style={{ background: 'radial-gradient(circle, #EA4335 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[40%] right-[15%] w-[350px] h-[350px] rounded-full blur-[100px] opacity-20"
          style={{ background: 'radial-gradient(circle, #FBBC04 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Bar with Home Link & Theme Indicator */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-surface-200/50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GDG</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="font-sans font-bold text-sm">GDG</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-google-blue" />
            <span className="w-1.5 h-1.5 rounded-full bg-google-red" />
            <span className="w-1.5 h-1.5 rounded-full bg-google-yellow" />
            <span className="w-1.5 h-1.5 rounded-full bg-google-green" />
          </div>
        </div>
      </div>

      {/* Main Auth Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div
          className="rounded-2xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300"
          style={{
            background: isDark ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.92)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 225, 222, 0.8)',
            boxShadow: isDark
              ? '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              : '0 20px 50px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          }}
        >
          {verificationSentEmail ? (
            <div className="py-4 text-center space-y-6">
              {/* Animated Mail Icon */}
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-google-blue/20 animate-ping opacity-60" />
                <div className="relative w-16 h-16 rounded-full bg-google-blue/15 text-google-blue flex items-center justify-center border border-google-blue/30 shadow-inner">
                  <Mail className="w-8 h-8 text-google-blue" />
                </div>
              </div>

              {/* Title & Email Info */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
                  Check Your Inbox
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  We sent a verification link to{' '}
                  <span className="font-semibold text-foreground underline decoration-google-blue decoration-2 underline-offset-2 break-all">
                    {verificationSentEmail}
                  </span>
                  . Click the link in that email to activate your account.
                </p>
              </div>

              {/* Next Step Info Box */}
              <div className="p-4 rounded-xl bg-muted/60 border border-border/70 text-xs text-muted-foreground text-left space-y-1.5">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Sparkles className="w-4 h-4 text-google-yellow" />
                  <span>Next Step: Student Onboarding</span>
                </div>
                <p className="leading-relaxed">
                  Once you click the verification link in your email, you will be automatically verified and redirected directly to your onboarding form.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={isResending || resendCooldown > 0}
                  onClick={handleResendVerification}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-google-blue/40 bg-google-blue/10 hover:bg-google-blue/20 text-google-blue text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <span>Resend available in {resendCooldown}s</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Resend Verification Email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationSentEmail(null);
                    setMode('login');
                    setServerError(null);
                    setServerSuccess(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          ) : isForgotPassword ? (
            <div className="py-4 space-y-6">
              {resetSentEmail ? (
                /* Card: Reset Email Dispatched */
                <div className="text-center space-y-6">
                  <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-google-red/20 animate-ping opacity-60" />
                    <div className="relative w-16 h-16 rounded-full bg-google-red/15 text-google-red flex items-center justify-center border border-google-red/30 shadow-inner">
                      <Mail className="w-8 h-8 text-google-red" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
                      Check Your Inbox
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      We sent a password reset link to{' '}
                      <span className="font-semibold text-foreground underline decoration-google-red decoration-2 underline-offset-2 break-all">
                        {resetSentEmail}
                      </span>
                      . Click the link in that email to set a new password.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/60 border border-border/70 text-xs text-muted-foreground text-left space-y-1.5">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Lock className="w-4 h-4 text-google-red" />
                      <span>Security Expiry</span>
                    </div>
                    <p className="leading-relaxed">
                      This password reset link will expire in 1 hour. If you do not see it in your inbox, please check your spam or junk folder.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      disabled={isSendingReset || resetCooldown > 0}
                      onClick={() => handleSendPasswordReset()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-google-red/40 bg-google-red/10 hover:bg-google-red/20 text-google-red text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingReset ? (
                        <>
                          <div className="w-4 h-4 border-2 border-google-red/30 border-t-google-red rounded-full animate-spin" />
                          <span>Sending Link...</span>
                        </>
                      ) : resetCooldown > 0 ? (
                        <span>Resend available in {resetCooldown}s</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Resend Reset Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetSentEmail(null);
                        setServerError(null);
                        setServerSuccess(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Form: Request Reset Link */
                <form onSubmit={handleSendPasswordReset} className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-google-red/10 border border-google-red/20 text-google-red flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                      Forgot Password?
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                      Enter your registered student email address and we will send you a password reset link.
                    </p>
                  </div>

                  {serverError && (
                    <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm leading-relaxed flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{serverError}</div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="forgotEmail" className="block text-xs font-semibold text-foreground">
                      Student Email Address <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="forgotEmail"
                        type="email"
                        autoComplete="email"
                        placeholder="yourname@rajalakshmi.edu.in"
                        value={forgotPasswordEmail}
                        onChange={(e) => {
                          setForgotPasswordEmail(e.target.value);
                          if (formErrors.forgotEmail) setFormErrors({});
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
                          formErrors.forgotEmail
                            ? 'border-destructive focus:ring-destructive/30'
                            : 'border-input hover:border-border focus:ring-google-red/30 focus:border-google-red'
                        }`}
                      />
                    </div>
                    {formErrors.forgotEmail && (
                      <p className="text-xs text-destructive mt-1 font-medium">{formErrors.forgotEmail}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                    style={{
                      background: 'linear-gradient(135deg, #EA4335, #D93025)',
                      boxShadow: '0 4px 20px rgba(234, 67, 53, 0.35)',
                    }}
                  >
                    {isSendingReset ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Reset Link...</span>
                      </div>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setServerError(null);
                        setFormErrors({});
                      }}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Header Title */}
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                  {mode === 'login' ? 'Welcome Back' : 'Create GDG Account'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === 'login'
                    ? `Sign in to access your GDG ${role === 'admin' ? 'admin portal' : 'community hub'}`
                    : `Join the Google Developer Group as a ${role === 'admin' ? 'Club Administrator' : 'Student Member'}`}
                </p>
              </div>

              {/* Role Selector Tabs (Student vs Admin) - Only shown if accessed with admin param */}
              {isAdminParam && (
                <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/70 mb-5 border border-border/50">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('student')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      role === 'student'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-google-blue" />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      role === 'admin'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-google-red" />
                    <span>Admin</span>
                  </button>
                </div>
              )}

              {/* Server Error Alert Banner */}
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm leading-relaxed">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{serverError}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Server Success Alert Banner */}
              <AnimatePresence>
                {serverSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-google-green/30 bg-google-green/10 text-google-green text-sm leading-relaxed">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{serverSuccess}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Google OAuth Button */}
              <div className="mb-5">
                <button
                  type="button"
                  disabled={isGoogleLoading || isSubmitting}
                  onClick={handleGoogleClick}
                  aria-label={`Continue with Google as ${role}`}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-border/80 bg-background/80 hover:bg-surface-200 hover:border-google-blue/50 text-foreground font-medium text-sm transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {/* Google 4-color SVG Icon */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
                    />
                    <path
                      fill="#FBBC04"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span>
                    {isGoogleLoading
                      ? 'Connecting to Google...'
                      : `Continue with Google ${role === 'admin' ? '(Admin)' : ''}`}
                  </span>
                </button>
                <p className="text-[11px] text-muted-foreground text-center mt-2 px-1">
                  Please use your official college email ID (@rajalakshmi.edu.in).
                </p>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-border/80 w-full" />
                <span className="bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground absolute font-mono">
                  Or continue with email
                </span>
              </div>

              {/* Email + Password Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Full Name field (Signup only) */}
                <AnimatePresence>
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <label
                        htmlFor="fullName"
                        className="block text-xs font-semibold text-foreground/80 font-sans"
                      >
                        Full Name <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="fullName"
                          type="text"
                          autoComplete="name"
                          placeholder="e.g. Alex Johnson"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
                            formErrors.fullName
                              ? 'border-destructive focus:ring-destructive/30'
                              : 'border-input hover:border-border focus:ring-google-blue/30 focus:border-google-blue'
                          }`}
                        />
                      </div>
                      {formErrors.fullName && (
                        <p className="text-xs text-destructive mt-1 font-medium">
                          {formErrors.fullName}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-foreground/80 font-sans"
                  >
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="your.name@rajalakshmi.edu.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
                        formErrors.email
                          ? 'border-destructive focus:ring-destructive/30'
                          : 'border-input hover:border-border focus:ring-google-blue/30 focus:border-google-blue'
                      }`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-xs text-destructive mt-1 font-medium">{formErrors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-foreground/80 font-sans"
                    >
                      Password <span className="text-destructive">*</span>
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordEmail(email);
                          setIsForgotPassword(true);
                          setResetSentEmail(null);
                          setServerError(null);
                          setServerSuccess(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-google-blue transition-colors font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
                        formErrors.password
                          ? 'border-destructive focus:ring-destructive/30'
                          : 'border-input hover:border-border focus:ring-google-blue/30 focus:border-google-blue'
                      }`}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-xs text-destructive mt-1 font-medium">
                      {formErrors.password}
                    </p>
                  )}
                  {mode === 'signup' && (
                    <p className="text-[11px] text-muted-foreground">
                      Must be at least 6 characters.
                    </p>
                  )}
                </div>

                {/* Secret Admin Code Field (Admin Signup Only) */}
                <AnimatePresence>
                  {mode === 'signup' && role === 'admin' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <label
                        htmlFor="adminCode"
                        className="block text-xs font-semibold text-google-red font-sans"
                      >
                        Secret Admin Signup Code <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-google-red" />
                        <input
                          id="adminCode"
                          type="password"
                          autoComplete="off"
                          placeholder="Enter administrative authorization key"
                          value={adminCode}
                          onChange={(e) => setAdminCode(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
                            formErrors.adminCode
                              ? 'border-destructive focus:ring-destructive/30'
                              : 'border-google-red/40 hover:border-google-red/60 focus:ring-google-red/30 focus:border-google-red'
                          }`}
                        />
                      </div>
                      {formErrors.adminCode && (
                        <p className="text-xs text-destructive mt-1 font-medium">
                          {formErrors.adminCode}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Required for club administrator registration.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    role === 'admin' ? 'hover:brightness-110' : 'hover:brightness-110'
                  }`}
                  style={{
                    background:
                      role === 'admin'
                        ? 'linear-gradient(135deg, #EA4335, #D93025)'
                        : 'linear-gradient(135deg, #4285F4, #1A73E8)',
                    boxShadow:
                      role === 'admin'
                        ? '0 4px 20px rgba(234, 67, 53, 0.35)'
                        : '0 4px 20px rgba(66, 133, 244, 0.35)',
                  }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <span>
                        {mode === 'login'
                          ? `Sign In as ${role === 'admin' ? 'Admin' : 'Student'}`
                          : `Create ${role === 'admin' ? 'Admin' : 'Student'} Account`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle between Login and Signup */}
              <div className="text-center mt-6 pt-4 border-t border-border/60">
                <p className="text-xs text-muted-foreground">
                  {mode === 'login' ? "Don't have an account yet?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange(mode === 'login' ? 'signup' : 'login')}
                    className="font-semibold text-google-blue hover:underline focus:outline-none ml-1"
                  >
                    {mode === 'login' ? 'Create Account' : 'Sign In'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Admin Google Code Modal */}
      <AnimatePresence>
        {adminGoogleModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-border/80 p-6 bg-card text-card-foreground shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3 text-google-red">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="font-bold text-lg font-sans">Admin Verification</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed font-sans">
                Please enter the secret Admin Code. The code is verified first before you are redirected to Google authentication.
              </p>

              {adminModalError && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{adminModalError}</span>
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Enter admin secret code"
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value);
                    if (adminModalError) setAdminModalError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleVerifyAndRedirect();
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                    adminModalError
                      ? 'border-destructive focus:ring-destructive/30'
                      : 'border-input focus:ring-google-red/30 focus:border-google-red'
                  }`}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminGoogleModalOpen(false);
                      setAdminModalError(null);
                    }}
                    disabled={isValidatingCode || isGoogleLoading}
                    className="flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!adminCode.trim() || isValidatingCode || isGoogleLoading}
                    onClick={handleVerifyAndRedirect}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-google-red text-white text-xs font-semibold hover:bg-google-red/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isValidatingCode ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : isGoogleLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Redirecting...</span>
                      </>
                    ) : (
                      <span>Verify & Continue</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPage;
