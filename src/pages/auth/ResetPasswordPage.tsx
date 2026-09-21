import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, KeyRound, Check, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Parse token from hash fragment (#access_token=...) or search query (?access_token=...)
  useEffect(() => {
    const hash = location.hash.startsWith('#') ? location.hash.substring(1) : location.hash;
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(location.search);

    const accessToken =
      hashParams.get('access_token') ||
      searchParams.get('access_token') ||
      hashParams.get('token') ||
      searchParams.get('token');

    if (accessToken) {
      setToken(accessToken);
    } else {
      // Also check if user has an active token in localStorage from callback
      const storedToken = localStorage.getItem('gdg_auth_token');
      if (storedToken) {
        setToken(storedToken);
      }
    }
  }, [location]);

  // Real-time security criteria checks
  const hasMinLength = newPassword.length >= 6;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasLetter && hasNumber && hasSymbol && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const errors: Record<string, string> = {};

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (!hasMinLength) {
      errors.newPassword = 'Password must be at least 6 characters';
    } else if (!hasSymbol) {
      errors.newPassword = 'Password must contain at least one symbol or special character';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!token) {
      setServerError('Reset token not found or link has expired. Please request a new reset link.');
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const res = await authService.resetPassword(newPassword, token);
      setIsSuccess(true);
      toast({
        title: 'Password Updated! 🎉',
        description: res.message || 'Your new password has been set. Redirecting to login...',
      });

      // Clear any temporary tokens and redirect to login after short celebration
      localStorage.removeItem('gdg_auth_token');
      localStorage.removeItem('gdg_refresh_token');

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err: any) {
      console.error('Reset password error:', err);
      const errMsg = err.message || 'Failed to update password. Your reset link may have expired.';
      setServerError(errMsg);
      toast({
        title: 'Reset Failed',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-google-red/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-google-blue/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <div
          className="rounded-3xl border border-border/80 p-8 sm:p-10 backdrop-blur-xl bg-card/85 text-card-foreground shadow-2xl relative overflow-hidden"
          style={{
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              : '0 20px 50px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          }}
        >
          {/* Top Google Colors Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-google-blue via-google-red to-google-yellow" />

          {isSuccess ? (
            /* Success View */
            <div className="text-center py-6 space-y-6">
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-google-green/20 animate-ping opacity-60" />
                <div className="relative w-16 h-16 rounded-full bg-google-green/15 text-google-green flex items-center justify-center border border-google-green/30 shadow-inner">
                  <CheckCircle2 className="w-9 h-9 text-google-green" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
                  Password Reset Complete!
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Your new password has been set successfully. You will be redirected to the sign in page in a moment.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all shadow-md hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #34A853, #1E8E3E)',
                  boxShadow: '0 4px 20px rgba(52, 168, 83, 0.35)',
                }}
              >
                <span>Go to Sign In Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : !token ? (
            /* Missing or Expired Token View */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20 shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
                  Invalid or Expired Link
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  We could not find a valid password recovery token. The link may have expired or has already been used.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all shadow-md hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, #4285F4, #1A73E8)',
                    boxShadow: '0 4px 20px rgba(66, 133, 244, 0.35)',
                  }}
                >
                  <span>Request New Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-2xl bg-google-red/10 border border-google-red/20 text-google-red flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                  Set New Password
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a secure new password for your GDG student account.
                </p>
              </div>

              {serverError && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm leading-relaxed flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{serverError}</div>
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="block text-xs font-semibold text-foreground">
                  New Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (formErrors.newPassword) setFormErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
                      formErrors.newPassword
                        ? 'border-destructive focus:ring-destructive/30'
                        : 'border-input hover:border-border focus:ring-google-red/30 focus:border-google-red'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.newPassword && (
                  <p className="text-xs text-destructive mt-1 font-medium">{formErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-foreground">
                  Confirm New Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formErrors.confirmPassword) setFormErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
                      formErrors.confirmPassword
                        ? 'border-destructive focus:ring-destructive/30'
                        : 'border-input hover:border-border focus:ring-google-red/30 focus:border-google-red'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1 font-medium">{formErrors.confirmPassword}</p>
                )}
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/70 space-y-2 text-xs">
                <p className="font-semibold text-foreground/90">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-google-green font-medium' : 'text-muted-foreground'}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>6+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-google-green font-medium' : 'text-muted-foreground'}`}>
                    {hasLetter ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least 1 letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-google-green font-medium' : 'text-muted-foreground'}`}>
                    {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least 1 number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-google-green font-medium' : 'text-muted-foreground'}`}>
                    {hasSymbol ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Special symbol</span>
                  </div>
                </div>
                {confirmPassword && (
                  <div className={`flex items-center gap-1.5 text-[11px] pt-1 border-t border-border/40 ${passwordsMatch ? 'text-google-green font-medium' : 'text-destructive font-medium'}`}>
                    {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #EA4335, #D93025)',
                  boxShadow: '0 4px 20px rgba(234, 67, 53, 0.35)',
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </div>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel and return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
