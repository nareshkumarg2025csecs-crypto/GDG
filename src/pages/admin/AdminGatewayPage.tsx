import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, KeyRound, Eye, EyeOff, AlertCircle, ArrowLeft, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';

export const AdminGatewayPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isAuthenticated, role, isLoading, login, signup, initiateGoogleLogin, logout } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [adminGoogleModalOpen, setAdminGoogleModalOpen] = useState(false);

  // If already authenticated as admin, immediately redirect to admin panel
  if (!isLoading && isAuthenticated && role === 'admin') {
    return <Navigate to="/admin/events" replace />;
  }

  // If authenticated but NOT admin (student account logged in)
  if (!isLoading && isAuthenticated && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-8 rounded-3xl border border-destructive/30 bg-card text-card-foreground shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-sans">Admin Access Required</h2>
            <p className="text-sm text-muted-foreground">
              You are currently signed in as a <strong className="text-foreground">Student / Member</strong>.
              This area is strictly reserved for Google Developer Groups administrators.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                await logout();
              }}
              className="w-full py-3 px-4 rounded-xl bg-google-red hover:bg-google-red/90 text-white font-semibold text-xs transition-all shadow-md"
            >
              Sign Out & Log In as Admin
            </button>
            <Link
              to="/"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-xs text-foreground transition-all"
            >
              Return to Homepage
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-google-red/30 border-t-google-red rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground font-mono">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setServerError('Please enter your full name.');
        return;
      }
      if (!adminCode.trim()) {
        setServerError('Secret Admin Verification Code is required to create an administrator account.');
        return;
      }
    }

    if (!email.trim() || !password) {
      setServerError('Please enter your administrator email and password.');
      return;
    }

    if (password.length < 6) {
      setServerError('Password must be at least 6 characters.');
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
          'admin'
        );

        toast({
          title: `Welcome, ${response.profile.full_name || response.profile.email}`,
          description: 'Successfully authenticated to the GDG Admin Portal.',
        });

        navigate('/admin/events', { replace: true });
      } else {
        const response = await signup(
          {
            full_name: fullName.trim(),
            email: email.trim(),
            password,
            admin_code: adminCode.trim(),
          },
          'admin'
        );

        if (response.access_token) {
          toast({
            title: 'Admin Account Created',
            description: `Welcome to GDG Administration, ${response.profile.full_name || response.profile.email}.`,
          });
          navigate('/admin/events', { replace: true });
        } else {
          setServerSuccess(
            response.message || 'Admin registration successful! Please check your email to verify your account.'
          );
        }
      }
    } catch (err: any) {
      setServerError(err.message || 'Admin authentication failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAdminLogin = async (secretCode?: string) => {
    setIsGoogleLoading(true);
    setServerError(null);
    try {
      if (secretCode) {
        sessionStorage.setItem('pending_admin_code', secretCode.trim());
      } else {
        sessionStorage.removeItem('pending_admin_code');
      }
      await initiateGoogleLogin('admin', secretCode);
    } catch (err: any) {
      setServerError(err.message || 'Google administrator authentication failed.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: isDark ? 'radial-gradient(circle, rgba(234, 67, 53, 0.08) 0%, transparent 70%)' : 'transparent' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Header Badge & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-google-red/10 border border-google-red/20 text-google-red text-xs font-mono font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>GDG Administrator Gateway</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-sans">
            {mode === 'login' ? 'Admin Portal Sign In' : 'Create Admin Account'}
          </h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {mode === 'login'
              ? 'Sign in to access event management, dynamic registration forms, and submissions.'
              : 'Register as a GDG club administrator using your secret verification code.'}
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl border border-border bg-card text-card-foreground shadow-2xl space-y-6">
          {/* Mode Switcher Tabs (Sign In vs Create Account) */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/70 border border-border/50">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setServerError(null);
                setServerSuccess(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-google-red" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setServerError(null);
                setServerSuccess(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-3.5 h-3.5 text-google-blue" />
              <span>Create Account</span>
            </button>
          </div>

          <AnimatePresence>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </motion.div>
            )}

            {serverSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 rounded-xl bg-google-green/10 border border-google-green/20 text-google-green text-xs flex items-center gap-2 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{serverSuccess}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            {/* Full Name Field (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-red/30 focus:border-google-red"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@gdg.community"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-red/30 focus:border-google-red"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-red/30 focus:border-google-red"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Admin Verification Code (Required for Signup) */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground">
                    Admin Verification Code <span className="text-google-red">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">Secret Code</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter admin verification code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-red/30 focus:border-google-red font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Provided by club leads to authorize administrator privileges.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #EA4335, #C5221F)',
                boxShadow: '0 4px 14px rgba(234, 67, 53, 0.3)',
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === 'login' ? 'Signing In as Admin...' : 'Creating Admin Account...'}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{mode === 'login' ? 'Enter Admin Portal' : 'Create Admin Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-3 text-[11px] font-mono text-muted-foreground uppercase">
              Or
            </span>
            <div className="border-t border-border w-full" />
          </div>

          {/* Google Admin Login Button */}
          <button
            type="button"
            disabled={isGoogleLoading}
            onClick={() => setAdminGoogleModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Connecting...' : `Continue with Google Admin (${mode === 'login' ? 'Sign In' : 'Sign Up'})`}</span>
          </button>

          {/* Toggle between Sign In & Create Account text link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setServerError(null);
                setServerSuccess(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'login' ? (
                <>
                  Need to register as an administrator?{' '}
                  <span className="font-semibold text-google-red underline">Create Admin Account</span>
                </>
              ) : (
                <>
                  Already registered as an administrator?{' '}
                  <span className="font-semibold text-google-red underline">Sign In</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 text-center border-t border-border/70">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Site</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Google Admin Code Verification Modal */}
      {adminGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-google-red/10 text-google-red flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground font-sans">Admin Code Verification</h3>
              <p className="text-xs text-muted-foreground">
                Enter your secret Admin Verification Code to authorize your Google Administrator privileges.
              </p>
            </div>
            <input
              type="password"
              placeholder="Enter secret admin code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-red/30 focus:border-google-red font-mono"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdminGoogleModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!adminCode.trim() || isGoogleLoading}
                onClick={async () => {
                  setAdminGoogleModalOpen(false);
                  await handleGoogleAdminLogin(adminCode.trim());
                }}
                className="flex-1 py-2.5 rounded-xl bg-google-red hover:bg-google-red/90 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminGatewayPage;
