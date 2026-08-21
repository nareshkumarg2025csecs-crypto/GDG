import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  CalendarPlus,
  ArrowLeft,
  FileText,
  Share2,
  Sparkles,
  AlignLeft,
  ZoomIn,
  X as XIcon,
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import { formService } from '@/services/formService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import {
  type ClubEvent,
  type EventForm,
  getEventRegistrationState,
  formatEventDate,
  formatEventTimeRange,
} from '@/lib/formUtils';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [form, setForm] = useState<EventForm | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [submissionDate, setSubmissionDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [bannerZoomOpen, setBannerZoomOpen] = useState(false);

  // Close lightbox on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setBannerZoomOpen(false);
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = bannerZoomOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [bannerZoomOpen]);

  useEffect(() => {
    if (!id) return;

    const loadEventDetails = async () => {
      setIsLoading(true);
      try {
        const [eventRes, formsRes, subsRes] = await Promise.all([
          eventService.getEventById(id),
          formService.getFormsByEvent(id).catch(() => ({ forms: [] })),
          isAuthenticated
            ? formService.getMySubmissions().catch(() => ({ submissions: [] }))
            : Promise.resolve({ submissions: [] }),
        ]);

        setEvent(eventRes.event);

        const attachedForm = formsRes.forms && formsRes.forms.length > 0 ? formsRes.forms[0] : null;
        setForm(attachedForm);

        if (attachedForm) {
          const userSub = (subsRes.submissions || []).find((s) => s.form_id === attachedForm.id);
          if (userSub) {
            setIsRegistered(true);
            setSubmissionDate(userSub.submitted_at);
          }
        }
      } catch (err: any) {
        toast({
          title: 'Event not found',
          description: err.message || 'Could not retrieve event details.',
          variant: 'destructive',
        });
        navigate('/events');
      } finally {
        setIsLoading(false);
      }
    };

    loadEventDetails();
  }, [id, isAuthenticated, navigate]);

  const details = event?.details || {};
  const banner = details.banner_url || details.coverImage || details.cover_image;
  const customSections = details.custom_sections || [];

  const regState = useMemo(() => {
    if (!form) return 'hidden';
    return getEventRegistrationState({
      isRegistered,
      expiresAt: form.expires_at || form.schema?.expires_at,
    });
  }, [form, isRegistered]);

  const handleAddToCalendar = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign In Required',
        description: 'Please log in to add events to your Google Calendar.',
      });
      navigate(`/login?redirect=${encodeURIComponent(`/events/${id}`)}`);
      return;
    }

    if (!id) return;
    setIsCalendarLoading(true);

    try {
      const res = await eventService.createCalendarReminder(id);

      if (
        res.action_required === 'CONNECT_GOOGLE_CALENDAR' ||
        res.action_required === 'RECONNECT_GOOGLE_CALENDAR'
      ) {
        toast({
          title: 'Connect Google Calendar',
          description: 'Redirecting to connect your Google Calendar...',
        });
        const { url } = await eventService.getGoogleLinkUrl();
        if (url) window.location.href = url;
        return;
      }

      if (res.success) {
        toast({
          title: 'Event Synced to Google Calendar! 📅',
          description: res.message || 'Check your primary Google Calendar.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Calendar Sync Failed',
        description: err.message || 'Could not sync event.',
        variant: 'destructive',
      });
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'GDG Event',
        text: details.description || 'Check out this event by GDG!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied!',
        description: 'Event link copied to your clipboard.',
      });
    }
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3.5 py-1.5 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Events</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-muted transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Event</span>
          </button>
        </div>

        {/* Main Event Card */}
        <div className="rounded-3xl border border-border bg-card text-card-foreground shadow-xl overflow-hidden">
          {/* Banner Image (if added by Admin) — click to zoom */}
          {banner && (
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black group cursor-zoom-in" onClick={() => setBannerZoomOpen(true)}>
              <img
                src={banner}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
              {/* Zoom hint badge */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-semibold border border-white/20">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Click to zoom</span>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-10 space-y-8">
            {/* Header / Category / Status */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-google-blue/10 text-google-blue border border-google-blue/20">
                  {details.category || 'Workshop'}
                </span>

                {regState === 'registered' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-google-green/10 text-google-green border border-google-green/30 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Registration Confirmed</span>
                  </span>
                )}

                {regState === 'closed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-google-yellow/10 text-google-yellow border border-google-yellow/30 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Registration Closed</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold font-sans tracking-tight text-foreground">
                {event.title}
              </h1>
            </div>

            {/* Quick Meta Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/80">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50">
                <Calendar className="w-5 h-5 text-google-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-mono font-bold">Date</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {formatEventDate(details.startTime || details.start_time)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50">
                <Clock className="w-5 h-5 text-google-yellow shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-mono font-bold">Time</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {formatEventTimeRange(
                      details.startTime || details.start_time,
                      details.endTime || details.end_time
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50">
                <MapPin className="w-5 h-5 text-google-red shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-mono font-bold">Venue</p>
                  <p className="text-sm font-semibold mt-0.5 truncate">
                    {details.location || details.venue || 'Campus Auditorium'}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Sections Added by Admin (No fixed template) */}
            {customSections.length > 0 ? (
              <div className="space-y-6 pt-2">
                {customSections.map((section) => (
                  <div key={section.id} className="space-y-3 p-6 rounded-3xl bg-muted/30 border border-border/60">
                    <h2 className="text-lg font-bold font-sans flex items-center gap-2 text-foreground">
                      <AlignLeft className="w-4 h-4 text-google-blue" />
                      <span>{section.title}</span>
                    </h2>
                    {section.type === 'link' ? (
                      <a
                        href={section.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-google-blue hover:underline font-semibold"
                      >
                        <span>{section.content || section.url || 'Open Resource'}</span>
                        <Share2 className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <MarkdownRenderer content={section.content} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              details.description && (
                <div className="space-y-3 p-6 rounded-3xl bg-muted/30 border border-border/60">
                  <h2 className="text-lg font-bold font-sans">About this Event</h2>
                  <MarkdownRenderer content={details.description} />
                </div>
              )
            )}

            {/* Actions Bar */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <button
                type="button"
                disabled={isCalendarLoading}
                onClick={handleAddToCalendar}
                className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-border bg-background hover:bg-muted text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                <CalendarPlus className="w-4 h-4 text-google-yellow" />
                <span>{isCalendarLoading ? 'Connecting Calendar...' : 'Add to Google Calendar'}</span>
              </button>

              {/* Registration CTA */}
              {regState === 'open' && (
                <Link
                  to={`/events/${id}/form`}
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #4285F4, #1A73E8)',
                    boxShadow: '0 4px 20px rgba(66, 133, 244, 0.35)',
                  }}
                >
                  <FileText className="w-4 h-4" />
                  <span>Fill Registration Form</span>
                </Link>
              )}

              {regState === 'registered' && (
                <div className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-google-green/10 text-google-green border border-google-green/30 text-sm font-semibold font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>You are Registered</span>
                </div>
              )}

              {regState === 'closed' && (
                <div className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-google-yellow/10 text-google-yellow border border-google-yellow/30 text-sm font-semibold font-mono">
                  <Clock className="w-4 h-4" />
                  <span>Registration Closed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Full-screen Image Lightbox ── */}
      <AnimatePresence>
        {bannerZoomOpen && banner && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 backdrop-blur-lg p-4"
            onClick={() => setBannerZoomOpen(false)}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setBannerZoomOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors backdrop-blur-sm z-10"
              aria-label="Close image"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {/* Caption */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-mono bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              Press <kbd className="bg-white/10 rounded px-1.5 py-0.5 font-bold">Esc</kbd> or click anywhere to close
            </div>

            {/* Zoomed image */}
            <motion.img
              key="lightbox-img"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              src={banner}
              alt={event.title}
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain border border-white/10 cursor-zoom-out"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetailPage;
