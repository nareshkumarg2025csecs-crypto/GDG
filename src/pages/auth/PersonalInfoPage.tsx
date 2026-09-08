import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Hash,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  ChevronDown,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { dashboardService } from '@/services/dashboardService';
import { DEPARTMENT_OPTIONS, YEAR_OF_STUDY_OPTIONS } from '@/lib/profileConstants';
import { toast } from '@/hooks/use-toast';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export const PersonalInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, isAuthenticated, isLoading } = useAuth();
  const updateStoreProfile = useAuthStore((s) => s.updateProfile);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [year, setYear] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Populate existing data if available
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      const details = profile.details || {};
      setEmail(details.email || profile.email || user?.email || '');
      if (details.roll_no) setRollNo(details.roll_no);
      if (details.year) setYear(details.year);
      if (details.phone_number || details.phone) {
        setPhoneNumber(details.phone_number || details.phone);
      }

      const existingDept = details.department || '';
      if (existingDept) {
        if ((DEPARTMENT_OPTIONS as readonly string[]).includes(existingDept)) {
          setDepartment(existingDept);
        } else {
          setDepartment('Other');
          setCustomDepartment(existingDept);
        }
      }
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);

  // If unauthenticated and not loading, redirect to auth page; if admin, redirect to admin portal
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/auth', { replace: true });
      } else if (profile?.role === 'admin') {
        navigate('/', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, profile, navigate]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!email.trim() || !email.includes('@')) {
      errors.email = 'Valid email address is required';
    }
    if (!rollNo.trim()) {
      errors.rollNo = 'Roll number is required (e.g. 240801202)';
    }
    if (!department) {
      errors.department = 'Please select your department';
    } else if (department === 'Other' && !customDepartment.trim()) {
      errors.customDepartment = 'Please specify your department';
    }
    if (!year) {
      errors.year = 'Please select your current year of study';
    }
    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(phoneNumber.trim())) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const resolvedDept = department === 'Other' ? customDepartment.trim() : department;

    try {
      const payload = {
        full_name: fullName.trim(),
        details: {
          roll_no: rollNo.trim().toUpperCase(),
          department: resolvedDept,
          year: year,
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          phone: phoneNumber.trim(),
        },
      };

      const res = await dashboardService.updateDashboard(payload);
      if (res?.dashboard) {
        updateStoreProfile(res.dashboard);
      } else {
        updateStoreProfile({
          full_name: payload.full_name,
          details: {
            ...(profile?.details || {}),
            ...payload.details,
          },
        });
      }

      toast({
        title: 'Profile Completed!',
        description: 'Your personal information has been saved successfully.',
      });

      // Navigate to saved redirect URL or home
      const targetUrl =
        localStorage.getItem('auth_redirect_url') ||
        (location.state as any)?.redirect ||
        '/';
      localStorage.removeItem('auth_redirect_url');
      navigate(targetUrl, { replace: true });
    } catch (err: any) {
      toast({
        title: 'Failed to save profile',
        description: err.message || 'Could not save personal info. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-start sm:justify-center items-center px-3.5 py-6 sm:px-6 sm:py-12 relative overflow-y-auto selection:bg-google-blue/20">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-google-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-google-green/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl my-auto relative"
      >
        {/* Card Container */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Top Google Colors Stripe */}
          <div className="h-1.5 sm:h-2 flex w-full">
            <div className="flex-1 bg-google-blue" />
            <div className="flex-1 bg-google-red" />
            <div className="flex-1 bg-google-yellow" />
            <div className="flex-1 bg-google-green" />
          </div>

          <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            {/* Header */}
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-google-blue/10 text-google-blue border border-google-blue/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>• Personal Information</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-bold font-sans tracking-tight text-foreground">
                Complete Your Profile
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Provide your roll number and department to enable 1-click event registration and auto-fill your verified passes.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              {/* 1. Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-google-blue" />
                  <span>Full Name</span>
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (formErrors.fullName) setFormErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all ${
                    formErrors.fullName ? 'border-destructive' : 'border-input'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.fullName}</p>
                )}
              </div>

              {/* 2. Roll Number with hidden example (placeholder="e.g. 240801202") */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-google-yellow" />
                    <span>Roll Number / Register Number</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Format: 240801202
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 240801202"
                  value={rollNo}
                  onChange={(e) => {
                    setRollNo(e.target.value);
                    if (formErrors.rollNo) setFormErrors((prev) => ({ ...prev, rollNo: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-background font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-google-yellow/30 focus:border-google-yellow transition-all ${
                    formErrors.rollNo ? 'border-destructive' : 'border-input'
                  }`}
                />
                {formErrors.rollNo && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.rollNo}</p>
                )}
              </div>

              {/* 3. Department as Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-google-green" />
                  <span>Department</span>
                  <span className="text-destructive">*</span>
                </label>
                <SearchableSelect
                  id="department"
                  value={department}
                  onChange={(val) => {
                    setDepartment(val);
                    if (formErrors.department) setFormErrors((prev) => ({ ...prev, department: '' }));
                  }}
                  options={DEPARTMENT_OPTIONS}
                  placeholder="Select your Department / Branch"
                  searchPlaceholder="Search department name or acronym..."
                  searchable={true}
                  error={!!formErrors.department}
                  accentColor="green"
                />
                {formErrors.department && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.department}</p>
                )}
              </div>

              {/* Dynamic Field: If "Other" department is selected */}
              <AnimatePresence>
                {department === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 overflow-hidden"
                  >
                    <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-google-blue" />
                      <span>Specify Department Name</span>
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Robotics and Automation Engineering"
                      value={customDepartment}
                      onChange={(e) => {
                        setCustomDepartment(e.target.value);
                        if (formErrors.customDepartment)
                          setFormErrors((prev) => ({ ...prev, customDepartment: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all ${
                        formErrors.customDepartment ? 'border-destructive' : 'border-input'
                      }`}
                    />
                    {formErrors.customDepartment && (
                      <p className="text-[11px] text-destructive font-medium">
                        {formErrors.customDepartment}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 4. Year of Study as Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Current Year of Study</span>
                  <span className="text-destructive">*</span>
                </label>
                <SearchableSelect
                  id="year"
                  value={year}
                  onChange={(val) => {
                    setYear(val);
                    if (formErrors.year) setFormErrors((prev) => ({ ...prev, year: '' }));
                  }}
                  options={YEAR_OF_STUDY_OPTIONS}
                  placeholder="Select your current year"
                  searchable={false}
                  error={!!formErrors.year}
                  accentColor="purple"
                />
                {formErrors.year && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.year}</p>
                )}
              </div>

              {/* 5. Phone Number */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-google-blue" />
                  <span>Phone Number</span>
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210 or +91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (formErrors.phoneNumber) setFormErrors((prev) => ({ ...prev, phoneNumber: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all ${
                    formErrors.phoneNumber ? 'border-destructive ring-1 ring-destructive/30' : 'border-input'
                  }`}
                />
                {formErrors.phoneNumber && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.phoneNumber}</p>
                )}
              </div>

              {/* 6. Email ID (Editable) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-google-red" />
                    <span>Email Address</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Profile Contact Email
                  </span>
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-google-red/30 focus:border-google-red transition-all ${
                    formErrors.email ? 'border-destructive' : 'border-input'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.email}</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Event confirmation passes and notifications will be dispatched to this email.
                </p>
              </div>

              {/* Submit Action Button */}
              <div className="pt-2 sm:pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #4285F4, #1A73E8)',
                    boxShadow: '0 4px 14px rgba(66, 133, 244, 0.35)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Continue to GDG</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PersonalInfoPage;
