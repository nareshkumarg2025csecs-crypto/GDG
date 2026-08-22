import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Edit3,
  Save,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CalendarPlus,
  BookOpen,
  Award,
  Layers,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { dashboardService } from '@/services/dashboardService';
import { eventService } from '@/services/eventService';
import { formService } from '@/services/formService';
import { toast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/common/UserAvatar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  type ClubEvent,
  type EventForm,
  type FormSubmission,
  formatEventDate,
  formatEventTimeRange,
  stripMarkdown,
} from '@/lib/formUtils';

export const StudentDashboardPage: React.FC = () => {
  const { profile, user, isAuthenticated, role } = useAuth();
  const updateStoreProfile = useAuthStore((s) => s.updateProfile);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form Fields
  const [fullName, setFullName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [yearOfPassing, setYearOfPassing] = useState('');

  // Events & Submissions State
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [mySubmissions, setMySubmissions] = useState<FormSubmission[]>([]);
  const [formsByEvent, setFormsByEvent] = useState<Record<string, EventForm>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'registered' | 'participated'>('registered');
  const [calendarProcessingId, setCalendarProcessingId] = useState<string | null>(null);

  // Sync profile data into local state
  const syncProfileFields = (p = profile) => {
    if (!p) return;
    const details = p.details || {};
    setFullName(p.full_name || '');
    setProfileEmail(details.email || p.email || '');
    setPhoneNumber(details.phone_number || details.phone || '');
    setDepartment(details.department || '');
    setYear(details.year || '');
    setYearOfPassing(details.year_of_passing || details.passout_year || '');
  };

  useEffect(() => {
    syncProfileFields(profile);
  }, [profile]);

  // Load Dashboard Data (Profile, Events, Forms, Submissions)
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch latest profile
      try {
        const dashRes = await dashboardService.getDashboard();
        if (dashRes?.dashboard) {
          updateStoreProfile(dashRes.dashboard);
          syncProfileFields(dashRes.dashboard);
        }
      } catch {
        // Fallback to existing auth store profile
      }

      // 2. Fetch events and user's submissions in parallel
      const [eventsRes, subsRes] = await Promise.all([
        eventService.listEvents().catch(() => ({ events: [] })),
        formService.getMySubmissions().catch(() => ({ submissions: [] })),
      ]);

      const fetchedEvents = eventsRes.events || [];
      setEvents(fetchedEvents);
      setMySubmissions(subsRes.submissions || []);

      // 3. Fetch forms for events to map submission form_ids to events
      const formMap: Record<string, EventForm> = {};
      await Promise.all(
        fetchedEvents.map(async (ev) => {
          try {
            const { forms } = await formService.getFormsByEvent(ev.id);
            if (forms && forms.length > 0) {
              formMap[ev.id] = forms[0];
            }
          } catch {
            // Ignore single form failure
          }
        })
      );
      setFormsByEvent(formMap);
    } catch (err: any) {
      toast({
        title: 'Error loading dashboard',
        description: err.message || 'Could not retrieve your event history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        details: {
          email: profileEmail.trim() || undefined,
          phone_number: phoneNumber.trim() || undefined,
          department: department.trim() || undefined,
          year: year.trim() || undefined,
          year_of_passing: yearOfPassing.trim() || undefined,
        },
      };

      const res = await dashboardService.updateDashboard(payload);
      if (res?.dashboard) {
        updateStoreProfile(res.dashboard);
        syncProfileFields(res.dashboard);
      }

      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your student details have been saved successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to update profile',
        description: err.message || 'Could not save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    syncProfileFields(profile);
    setIsEditing(false);
  };

  // ── Derive Registered vs Participated Events ─────────────────────────────
  const { registeredEvents, participatedEvents } = useMemo(() => {
    const now = new Date();
    const registered: Array<{ event: ClubEvent; submission: FormSubmission }> = [];
    const participated: Array<{ event: ClubEvent; submission: FormSubmission }> = [];

    // Map form_id to event
    const eventByFormId: Record<string, ClubEvent> = {};
    Object.entries(formsByEvent).forEach(([eventId, form]) => {
      const ev = events.find((e) => e.id === eventId);
      if (ev && form.id) {
        eventByFormId[form.id] = ev;
      }
    });

    mySubmissions.forEach((sub) => {
      const matchedEvent = eventByFormId[sub.form_id];
      if (!matchedEvent) return;

      const details = matchedEvent.details || {};
      const endStr = details.endTime || details.end_time || details.startTime || details.start_time;
      const eventEnd = endStr ? new Date(endStr) : null;
      const isPast = eventEnd ? now > eventEnd : false;

      // 1. Registered (Upcoming, not yet ended)
      if (!isPast) {
        registered.push({ event: matchedEvent, submission: sub });
      }

      // 2. Participated (Admin confirmed attendance, persists regardless of time)
      if (sub.attended === true) {
        participated.push({ event: matchedEvent, submission: sub });
      }
    });

    return {
      registeredEvents: registered,
      participatedEvents: participated,
    };
  }, [events, mySubmissions, formsByEvent]);

  // Calendar sync for upcoming events
  const handleAddToCalendar = async (eventId: string) => {
    setCalendarProcessingId(eventId);
    try {
      const res = await eventService.createCalendarReminder(eventId);
      if (res.success) {
        toast({
          title: 'Added to Google Calendar',
          description: res.message || 'Event is synced with your primary calendar.',
        });
      } else if (res.action_required === 'CONNECT_GOOGLE_CALENDAR') {
        const linkRes = await eventService.getGoogleLinkUrl();
        if (linkRes?.url) {
          window.location.href = linkRes.url;
        }
      }
    } catch {
      toast({
        title: 'Calendar Sync Notice',
        description: 'Could not sync event to Google Calendar at this moment.',
      });
    } finally {
      setCalendarProcessingId(null);
    }
  };

  const currentDetails = profile?.details || {};
  const googleAvatarUrl = currentDetails.avatar_url || currentDetails.picture;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-google-blue/20">
      <Header />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-google-blue/10 text-google-blue border border-google-blue/20">
                {role === 'admin' ? 'Admin Portal' : 'Student Portal'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-foreground">
              Welcome, {profile?.full_name || 'Student'}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your personal student profile and track your registered & verified GDG event participation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-sm"
            >
              <Search className="w-4 h-4 text-google-yellow" />
              <span>Browse Events</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Banner — Hidden on small screens, visible on md+ (large screens) */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-google-blue/10 border border-google-blue/20 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-google-blue" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase font-bold text-muted-foreground">Upcoming Registrations</p>
              <p className="text-2xl font-bold font-sans text-foreground mt-0.5">{registeredEvents.length}</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-google-green/10 border border-google-green/20 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-google-green" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase font-bold text-muted-foreground">Verified Participations</p>
              <p className="text-2xl font-bold font-sans text-foreground mt-0.5">{participatedEvents.length}</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-google-yellow/10 border border-google-yellow/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-google-yellow" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase font-bold text-muted-foreground">Total Form Submissions</p>
              <p className="text-2xl font-bold font-sans text-foreground mt-0.5">{mySubmissions.length}</p>
            </div>
          </div>
        </div>

        {/* ── 1. Student Profile Section (View / Edit) ── */}
        <div className="rounded-3xl border border-border/80 bg-card text-card-foreground shadow-md overflow-hidden">
          {/* Profile Card Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-muted/50 via-card to-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <UserAvatar
                name={profile?.full_name}
                email={profile?.email}
                avatarUrl={googleAvatarUrl}
                userId={user?.id}
                size="xl"
                className="shadow-lg ring-4 ring-background"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-sans text-foreground">
                    {profile?.full_name || 'GDG Student'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-google-green/10 text-google-green border border-google-green/30">
                    Active Profile
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-google-blue" />
                  <span>{profile?.email}</span>
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-google-blue text-white text-xs sm:text-sm font-semibold shadow-md hover:bg-google-blue/90 transition-all shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Profile Body: View Mode or Edit Form */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {!isEditing ? (
                /* ── VIEW MODE ── */
                <motion.div
                  key="view-profile"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  {/* Name Tile */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                      <User className="w-4 h-4 text-google-blue" />
                      <span>Full Name</span>
                    </div>
                    <p className="text-sm font-bold text-foreground pt-0.5">
                      {profile?.full_name || 'Not provided'}
                    </p>
                  </div>

                  {/* Profile Email Tile */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                      <Mail className="w-4 h-4 text-google-red" />
                      <span>Profile Contact Email</span>
                    </div>
                    <p className="text-sm font-bold text-foreground pt-0.5 truncate">
                      {currentDetails.email || profile?.email || 'Not provided'}
                    </p>
                  </div>

                  {/* Phone Number Tile */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                      <Phone className="w-4 h-4 text-google-green" />
                      <span>Phone Number</span>
                    </div>
                    <p className="text-sm font-bold text-foreground pt-0.5">
                      {currentDetails.phone_number || currentDetails.phone || 'Not provided'}
                    </p>
                  </div>

                  {/* Department Tile */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                      <GraduationCap className="w-4 h-4 text-google-yellow" />
                      <span>Department</span>
                    </div>
                    <p className="text-sm font-bold text-foreground pt-0.5">
                      {currentDetails.department || 'Not provided'}
                    </p>
                  </div>

                  {/* Year of Study Tile (Free Text) */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span>Current Year of Study</span>
                    </div>
                    <p className="text-sm font-bold text-foreground pt-0.5">
                      {currentDetails.year || 'Not provided'}
                    </p>
                  </div>

                  {/* Year of Passing Tile */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                      <Calendar className="w-4 h-4 text-teal-500" />
                      <span>Year of Passing</span>
                    </div>
                    <p className="text-sm font-bold text-foreground pt-0.5">
                      {currentDetails.year_of_passing || currentDetails.passout_year || 'Not provided'}
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* ── EDIT MODE ── */
                <motion.form
                  key="edit-profile"
                  onSubmit={handleSaveProfile}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Full Name Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">
                        Full Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Johnson"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                      />
                    </div>

                    {/* Profile Email Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-foreground">
                          Profile Email
                        </label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          (Saved in profile record)
                        </span>
                      </div>
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                      />
                    </div>

                    {/* Phone Number Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 555-0199 or 9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                      />
                    </div>

                    {/* Department Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">
                        Department / Major
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science, IT, ECE"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                      />
                    </div>

                    {/* Year of Study Input (Free Text) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-foreground">
                          Current Year of Study
                        </label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          (e.g. 2nd Year, Final Year)
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 2nd Year, 3rd Year, Final Year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                      />
                    </div>

                    {/* Year of Passing Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">
                        Year of Passing (Graduation)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2026, 2027"
                        value={yearOfPassing}
                        onChange={(e) => setYearOfPassing(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
                      />
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 2. Event History Tabs: Registered vs Participated ── */}
        <div className="space-y-6">
          {/* Section Header & Tab Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-google-yellow" />
                <span>My GDG Events & Participation</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track your active registrations and officially verified event participation records.
              </p>
            </div>

            {/* Segmented Tab Controls */}
            <div className="flex items-center p-1 bg-muted/60 rounded-2xl border border-border shrink-0" role="tablist" aria-label="Event participation views">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'registered'}
                aria-label={`View ${registeredEvents.length} registered upcoming events`}
                onClick={() => setActiveTab('registered')}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'registered'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Registered Events</span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-google-blue/15 text-google-blue">
                  {registeredEvents.length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'participated'}
                aria-label={`View ${participatedEvents.length} verified participated events`}
                onClick={() => setActiveTab('participated')}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'participated'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Participated Events</span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-google-green/15 text-google-green">
                  {participatedEvents.length}
                </span>
              </button>
            </div>
          </div>

          {/* ── TAB CONTENT ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-muted/30 border border-border animate-pulse" />
              ))}
            </div>
          ) : activeTab === 'registered' ? (
            /* TAB 1: Registered Events (Upcoming, not yet ended) */
            registeredEvents.length === 0 ? (
              <div className="text-center py-16 px-4 border border-dashed rounded-3xl bg-card/40 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-google-blue/10 text-google-blue flex items-center justify-center mx-auto">
                  <Calendar className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold font-sans text-foreground">No Upcoming Registered Events</h3>
                  <p className="text-xs text-muted-foreground">
                    You don't have any active registrations for upcoming events. Browse the events page to register for workshops and meetups!
                  </p>
                </div>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-google-blue text-white text-xs font-bold shadow-md hover:bg-google-blue/90 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>Explore Upcoming Events</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registeredEvents.map(({ event, submission }) => {
                  const details = event.details || {};
                  const banner = details.banner_url || details.coverImage || details.cover_image;
                  const accentColor = details.theme_color || '#4285F4';

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col justify-between rounded-3xl border bg-card text-card-foreground shadow-md hover:shadow-xl transition-all overflow-hidden"
                      style={{ borderColor: `${accentColor}30` }}
                    >
                      {/* Banner Image or Category Header */}
                      {banner ? (
                        <div className="relative h-44 w-full overflow-hidden bg-black">
                          <img
                            src={banner}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase text-white shadow-sm"
                              style={{ backgroundColor: accentColor }}
                            >
                              {details.category || 'Workshop'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-google-blue text-white shadow-sm">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Registered</span>
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-base font-bold text-white line-clamp-1 font-sans">
                              {event.title}
                            </h3>
                          </div>
                        </div>
                      ) : (
                        <div className="p-5 pb-3 border-b border-border/60">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase"
                              style={{
                                backgroundColor: `${accentColor}20`,
                                color: accentColor,
                                border: `1px solid ${accentColor}40`,
                              }}
                            >
                              {details.category || 'Workshop'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-google-blue/15 text-google-blue">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Registered</span>
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-foreground line-clamp-1 font-sans">
                            {event.title}
                          </h3>
                        </div>
                      )}

                      {/* Event Details snippet */}
                      <div className="p-5 space-y-3 flex-1">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {stripMarkdown(
                            details.description ||
                            (details.custom_sections && details.custom_sections[0]?.content) ||
                            'GDG community session'
                          )}
                        </p>

                        <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/60">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-google-blue shrink-0" />
                            <span>{formatEventDate(details.startTime || details.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-google-yellow shrink-0" />
                            <span>
                              {formatEventTimeRange(
                                details.startTime || details.start_time,
                                details.endTime || details.end_time
                              )}
                            </span>
                          </div>
                          {(details.location || details.venue) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-google-red shrink-0" />
                              <span className="truncate">{details.location || details.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3.5 bg-muted/40 border-t border-border flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={calendarProcessingId === event.id}
                          onClick={() => handleAddToCalendar(event.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-sm"
                          title="Add to Google Calendar"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-google-yellow" />
                          <span>{calendarProcessingId === event.id ? 'Adding...' : 'Add to Cal'}</span>
                        </button>

                        <Link
                          to={`/events/${event.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-google-blue/10 text-google-blue hover:bg-google-blue/20 text-xs font-semibold transition-colors"
                        >
                          <span>Event Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          ) : (
            /* TAB 2: Participated Events (Verified Attendance) */
            participatedEvents.length === 0 ? (
              <div className="text-center py-16 px-4 border border-dashed rounded-3xl bg-card/40 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-google-green/10 text-google-green flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold font-sans text-foreground">No Verified Participations Yet</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When you attend GDG workshops, hackathons, and study jams, event organizers will verify your attendance on-site. Verified participation records will appear here as your official GDG activity history!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {participatedEvents.map(({ event, submission }) => {
                  const details = event.details || {};
                  const banner = details.banner_url || details.coverImage || details.cover_image;
                  const accentColor = details.theme_color || '#34A853';

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col justify-between rounded-3xl border bg-card text-card-foreground shadow-md hover:shadow-xl transition-all overflow-hidden border-google-green/30"
                    >
                      {/* Banner Image or Header */}
                      {banner ? (
                        <div className="relative h-44 w-full overflow-hidden bg-black">
                          <img
                            src={banner}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase text-white shadow-sm"
                              style={{ backgroundColor: accentColor }}
                            >
                              {details.category || 'Event'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-google-green text-white shadow-sm">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Attended & Verified</span>
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-base font-bold text-white line-clamp-1 font-sans">
                              {event.title}
                            </h3>
                          </div>
                        </div>
                      ) : (
                        <div className="p-5 pb-3 border-b border-border/60">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase"
                              style={{
                                backgroundColor: `${accentColor}20`,
                                color: accentColor,
                                border: `1px solid ${accentColor}40`,
                              }}
                            >
                              {details.category || 'Event'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-google-green text-white shadow-sm">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Attended</span>
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-foreground line-clamp-1 font-sans">
                            {event.title}
                          </h3>
                        </div>
                      )}

                      {/* Event Details */}
                      <div className="p-5 space-y-3 flex-1">
                        <div className="p-2.5 rounded-xl bg-google-green/10 border border-google-green/20 text-google-green flex items-center gap-2 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Official Participation Confirmed</span>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-google-blue shrink-0" />
                            <span>{formatEventDate(details.startTime || details.start_time)}</span>
                          </div>
                          {(details.location || details.venue) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-google-red shrink-0" />
                              <span className="truncate">{details.location || details.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="p-3.5 bg-muted/40 border-t border-border flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Registered: {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                        <Link
                          to={`/events/${event.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                        >
                          <span>View Event</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboardPage;
