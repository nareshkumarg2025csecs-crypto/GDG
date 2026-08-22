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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

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
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'student';

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

  // If already authenticated, redirect to home with notice
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

        navigate('/');
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
          toast({
            title: 'Account created successfully',
            description: `Welcome to GDG, ${response.profile.full_name || response.profile.email}.`,
          });
          navigate('/');
        } else {
          setServerSuccess(
            response.message || 'Registration successful. Please check your email to verify your account.'
          );
        }
      }
    } catch (err: any) {
      setServerError(sanitizeErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth Flow
  const handleGoogleClick = async () => {
    setServerError(null);
    if (role === 'admin' && !adminCode.trim()) {
      // Prompt for admin code
      setAdminGoogleModalOpen(true);
      return;
    }

    await executeGoogleRedirect(adminCode.trim());
  };

  const executeGoogleRedirect = async (secretCode?: string) => {
    setIsGoogleLoading(true);
    setServerError(null);
    try {
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

          {/* Role Selector Tabs (Student vs Admin) */}
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
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-border" />
            <span className="px-3 text-xs uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap">
              or with email
            </span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign in or sign up form">
            {/* Full Name field (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5" htmlFor="auth-fullname">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="auth-fullname"
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-label="Full Name"
                    aria-invalid={Boolean(formErrors.fullName)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all ${
                      formErrors.fullName
                        ? 'border-destructive focus:ring-destructive/30'
                        : 'border-input focus:ring-google-blue/30 focus:border-google-blue'
                    }`}
                  />
                </div>
                {formErrors.fullName && (
                  <p className="text-xs text-destructive mt-1" role="alert">{formErrors.fullName}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5" htmlFor="auth-email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="alex@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email Address"
                  aria-invalid={Boolean(formErrors.email)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all ${
                    formErrors.email
                      ? 'border-destructive focus:ring-destructive/30'
                      : 'border-input focus:ring-google-blue/30 focus:border-google-blue'
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="text-xs text-destructive mt-1" role="alert">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground/80" htmlFor="auth-password">
                  Password
                </label>
                {mode === 'signup' && (
                  <span className="text-[11px] text-muted-foreground">Min. 6 chars + letters, numbers, symbols</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-label="Password"
                  aria-invalid={Boolean(formErrors.password)}
                  className={`w-full pl-9 pr-10 py-2 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all ${
                    formErrors.password
                      ? 'border-destructive focus:ring-destructive/30'
                      : 'border-input focus:ring-google-blue/30 focus:border-google-blue'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-destructive mt-1" role="alert">{formErrors.password}</p>
              )}

              {/* Live Password Requirements Checklist on Signup */}
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${password.length >= 6 ? 'text-google-green font-medium' : 'text-muted-foreground'}`}>
                    <span>{password.length >= 6 ? '✓' : '•'}</span>
                    <span>At least 6 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[A-Za-z]/.test(password) ? 'text-google-green font-medium' : 'text-muted-foreground'}`}>
                    <span>{/[A-Za-z]/.test(password) ? '✓' : '•'}</span>
                    <span>Contains letters (A-Z / a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${/\d/.test(password) ? 'text-google-green font-medium' : 'text-muted-foreground'}`}>
                    <span>{/\d/.test(password) ? '✓' : '•'}</span>
                    <span>Contains numbers (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) ? 'text-google-green font-medium' : 'text-muted-foreground'}`}>
                    <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) ? '✓' : '•'}</span>
                    <span>Contains symbols / special characters (!@#$...)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Code Field (Admin Signup Only) */}
            {role === 'admin' && mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Admin Verification Code <span className="text-google-red">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-google-red">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter club secret key"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all ${
                      formErrors.adminCode
                        ? 'border-destructive focus:ring-destructive/30'
                        : 'border-input focus:ring-google-red/30 focus:border-google-red'
                    }`}
                  />
                </div>
                {formErrors.adminCode ? (
                  <p className="text-xs text-destructive mt-1">{formErrors.adminCode}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Provided by club leads to authorize administrator privileges.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
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
              className="w-full max-w-sm rounded-2xl border p-6 bg-card text-card-foreground shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4 text-google-red">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="font-bold text-lg">Admin Verification</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Please enter the secret Admin Code to link your Google account with Administrator privileges.
              </p>
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Enter admin secret code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-red/30 focus:border-google-red"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminGoogleModalOpen(false)}
                    className="flex-1 py-2 px-3 rounded-xl border text-xs font-semibold hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!adminCode.trim() || isGoogleLoading}
                    onClick={() => executeGoogleRedirect(adminCode.trim())}
                    className="flex-1 py-2 px-3 rounded-xl bg-google-red text-white text-xs font-semibold hover:bg-google-red/90 transition-colors disabled:opacity-50"
                  >
                    {isGoogleLoading ? 'Redirecting...' : 'Verify & Continue'}
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
