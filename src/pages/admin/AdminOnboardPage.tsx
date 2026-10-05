import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Layers,
  Briefcase,
  User,
  Mail,
  Hash,
  GraduationCap,
  BookOpen,
  Phone,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { dashboardService } from '@/services/dashboardService';
import { DEPARTMENT_OPTIONS, YEAR_OF_STUDY_OPTIONS } from '@/lib/profileConstants';
import {
  TEAM_DOMAINS,
  POSITIONS_BY_DOMAIN,
  ALL_TEAM_POSITIONS,
  Department,
} from '@/data/team';
import { toast } from '@/hooks/use-toast';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export const AdminOnboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, isAuthenticated, isLoading } = useAuth();
  const updateStoreProfile = useAuthStore((s) => s.updateProfile);

  // Form State
  // 1. Admin Specific Fields (placed first before name as requested)
  const [domain, setDomain] = useState<Department | ''>('');
  const [position, setPosition] = useState('');
  const [customPosition, setCustomPosition] = useState('');

  // 2. Personal & Academic Fields (same as student onboarding)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [collegeDepartment, setCollegeDepartment] = useState('');
  const [customCollegeDepartment, setCustomCollegeDepartment] = useState('');
  const [year, setYear] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Prepopulate if details exist
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      const details = profile.details || {};
      setEmail(details.email || profile.email || user?.email || '');
      if (details.domain) setDomain(details.domain as Department);
      if (details.position) setPosition(details.position);
      if (details.roll_no) setRollNo(details.roll_no);
      if (details.year) setYear(details.year);
      if (details.phone_number || details.phone) {
        setPhoneNumber(details.phone_number || details.phone);
      }

      const existingDept = details.department || '';
      if (existingDept) {
        if ((DEPARTMENT_OPTIONS as readonly string[]).includes(existingDept)) {
          setCollegeDepartment(existingDept);
        } else {
          setCollegeDepartment('Other');
          setCustomCollegeDepartment(existingDept);
        }
      }
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);

  // Auth Guard: Only accessible to authenticated admins
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/admin/gateway', { replace: true });
      } else if (profile && profile.role !== 'admin') {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, profile, navigate]);

  // Dynamically derive positions based on selected domain
  const availablePositions = domain && POSITIONS_BY_DOMAIN[domain]
    ? POSITIONS_BY_DOMAIN[domain]
    : ALL_TEAM_POSITIONS;

  const validate = () => {
    const errors: Record<string, string> = {};

    // Admin Domain & Position validations
    if (!domain) {
      errors.domain = 'Please select your GDG Team Domain';
    }
    if (!position) {
      errors.position = 'Please select your Team Position / Role';
    } else if (position === 'Other' && !customPosition.trim()) {
      errors.customPosition = 'Please specify your official position title';
    }

    // Student/Personal validations
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!email.trim() || !email.includes('@')) {
      errors.email = 'Valid email address is required';
    }
    if (!rollNo.trim()) {
      errors.rollNo = 'College roll number / register number is required';
    }
    if (!collegeDepartment) {
      errors.collegeDepartment = 'Please select your college academic department';
    } else if (collegeDepartment === 'Other' && !customCollegeDepartment.trim()) {
      errors.customCollegeDepartment = 'Please specify your department';
    }
    if (!year) {
      errors.year = 'Please select your current year of study';
    }
    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Contact phone number is required';
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
    const resolvedPosition = position === 'Other' ? customPosition.trim() : position;
    const resolvedDept =
      collegeDepartment === 'Other' ? customCollegeDepartment.trim() : collegeDepartment;

    try {
      const payload = {
        full_name: fullName.trim(),
        details: {
          domain: domain,
          position: resolvedPosition,
          role: resolvedPosition,
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
        title: 'Admin Onboarding Completed! 🎉',
        description: `Welcome to GDG Team Leadership, ${fullName.trim()} (${resolvedPosition}).`,
      });

      // Navigate to saved redirect URL or Admin Events Dashboard
      const targetUrl =
        localStorage.getItem('auth_redirect_url') ||
        (location.state as any)?.redirect ||
        '/admin/events';
      localStorage.removeItem('auth_redirect_url');
      navigate(targetUrl, { replace: true });
    } catch (err: any) {
      toast({
        title: 'Failed to save admin onboarding details',
        description: err.message || 'Could not save admin profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-start sm:justify-center items-center px-3.5 py-6 sm:px-6 sm:py-12 relative overflow-y-auto selection:bg-google-red/20">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-google-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-google-blue/10 rounded-full blur-3xl pointer-events-none" />

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
            <div className="flex-1 bg-google-red" />
            <div className="flex-1 bg-google-blue" />
            <div className="flex-1 bg-google-green" />
            <div className="flex-1 bg-google-yellow" />
          </div>

          <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            {/* Header */}
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-google-red/10 text-google-red border border-google-red/20">
                <Shield className="w-3.5 h-3.5" />
                <span>• GDG Administrator Onboarding</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-bold font-sans tracking-tight text-foreground">
                Set Up Your Admin Profile
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Configure your official chapter team domain and position from the GDG roster. This information synchronizes with the event pass scanner and admin console.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ========================================================================= */}
              {/* ADMIN SPECIFIC FIELDS: DOMAIN & POSITION (PLACED FIRST BEFORE NAME)       */}
              {/* ========================================================================= */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-3.5">
                <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                  <Sparkles className="w-3.5 h-3.5 text-google-yellow" />
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-foreground">
                    GDG Chapter Roster Information
                  </span>
                </div>

                {/* 1. Domain Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-google-blue" />
                    <span>GDG Team Domain</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <SearchableSelect
                    id="admin-domain"
                    value={domain}
                    onChange={(val) => {
                      setDomain(val as Department);
                      setPosition(''); // Reset position when domain changes
                      if (formErrors.domain) setFormErrors((prev) => ({ ...prev, domain: '' }));
                    }}
                    options={TEAM_DOMAINS.map((d) => d.id)}
                    placeholder="Select Team Domain (e.g. TechOps, Leads, Design...)"
                    searchable={false}
                    error={!!formErrors.domain}
                    accentColor="blue"
                  />
                  {formErrors.domain && (
                    <p className="text-[11px] text-destructive font-medium">{formErrors.domain}</p>
                  )}
                </div>

                {/* 2. Position Dropdown (filtered by selected domain from team.ts) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-google-red" />
                      <span>Chapter Position / Role</span>
                      <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Shown on Mobile Scanner
                    </span>
                  </div>
                  <SearchableSelect
                    id="admin-position"
                    value={position}
                    onChange={(val) => {
                      setPosition(val);
                      if (formErrors.position) setFormErrors((prev) => ({ ...prev, position: '' }));
                    }}
                    options={[...availablePositions, 'Other']}
                    placeholder={
                      domain
                        ? `Select ${domain} position (e.g. Lead, Associate...)`
                        : 'Select domain first to view positions'
                    }
                    searchable={true}
                    error={!!formErrors.position}
                    accentColor="red"
                  />
                  {formErrors.position && (
                    <p className="text-[11px] text-destructive font-medium">{formErrors.position}</p>
                  )}
                </div>

                {/* If Position === "Other", allow custom input */}
                <AnimatePresence>
                  {position === 'Other' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-google-red" />
                        <span>Specify Official Position</span>
                        <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chapter Technical Director"
                        value={customPosition}
                        onChange={(e) => {
                          setCustomPosition(e.target.value);
                          if (formErrors.customPosition) {
                            setFormErrors((prev) => ({ ...prev, customPosition: '' }));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-red/30 focus:border-google-red transition-all"
                      />
                      {formErrors.customPosition && (
                        <p className="text-[11px] text-destructive font-medium">
                          {formErrors.customPosition}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ========================================================================= */}
              {/* PERSONAL & ACADEMIC DETAILS (IDENTICAL TO STUDENT ONBOARDING)              */}
              {/* ========================================================================= */}

              {/* 3. Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-google-blue" />
                  <span>Full Name</span>
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sabithulla Sharieff M"
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

              {/* 4. College Roll Number */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-google-yellow" />
                    <span>College Roll Number / Register Number</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-muted-foreground">Format: 240801202</span>
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

              {/* 5. College Department */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-google-green" />
                  <span>College Department / Branch</span>
                  <span className="text-destructive">*</span>
                </label>
                <SearchableSelect
                  id="college-dept"
                  value={collegeDepartment}
                  onChange={(val) => {
                    setCollegeDepartment(val);
                    if (formErrors.collegeDepartment) {
                      setFormErrors((prev) => ({ ...prev, collegeDepartment: '' }));
                    }
                  }}
                  options={DEPARTMENT_OPTIONS}
                  placeholder="Select college department"
                  searchPlaceholder="Search department name or acronym..."
                  searchable={true}
                  error={!!formErrors.collegeDepartment}
                  accentColor="green"
                />
                {formErrors.collegeDepartment && (
                  <p className="text-[11px] text-destructive font-medium">
                    {formErrors.collegeDepartment}
                  </p>
                )}
              </div>

              {/* Dynamic If "Other" department */}
              <AnimatePresence>
                {collegeDepartment === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 overflow-hidden"
                  >
                    <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-google-blue" />
                      <span>Specify College Department Name</span>
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Electronics and Communication Engineering"
                      value={customCollegeDepartment}
                      onChange={(e) => {
                        setCustomCollegeDepartment(e.target.value);
                        if (formErrors.customCollegeDepartment) {
                          setFormErrors((prev) => ({ ...prev, customCollegeDepartment: '' }));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all"
                    />
                    {formErrors.customCollegeDepartment && (
                      <p className="text-[11px] text-destructive font-medium">
                        {formErrors.customCollegeDepartment}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 6. Current Year of Study */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Current Year of Study</span>
                  <span className="text-destructive">*</span>
                </label>
                <SearchableSelect
                  id="admin-year"
                  value={year}
                  onChange={(val) => {
                    setYear(val);
                    if (formErrors.year) setFormErrors((prev) => ({ ...prev, year: '' }));
                  }}
                  options={YEAR_OF_STUDY_OPTIONS}
                  placeholder="Select current year"
                  searchable={false}
                  error={!!formErrors.year}
                  accentColor="purple"
                />
                {formErrors.year && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.year}</p>
                )}
              </div>

              {/* 7. Contact Phone Number */}
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
                    if (formErrors.phoneNumber) {
                      setFormErrors((prev) => ({ ...prev, phoneNumber: '' }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all ${
                    formErrors.phoneNumber ? 'border-destructive' : 'border-input'
                  }`}
                />
                {formErrors.phoneNumber && (
                  <p className="text-[11px] text-destructive font-medium">
                    {formErrors.phoneNumber}
                  </p>
                )}
              </div>

              {/* 8. Admin Email ID */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-google-red" />
                    <span>Administrator Email Address</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">Admin Account Email</span>
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@rajalakshmi.edu.in"
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
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-google-red hover:bg-google-red/90 text-white font-semibold text-sm transition-all shadow-lg shadow-google-red/20 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Admin Setup & Enter Console</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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

export default AdminOnboardPage;
