import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  CalendarPlus,
  CalendarCheck,
  ArrowLeft,
  FileText,
  Share2,
  QrCode,
  Sparkles,
  AlignLeft,
  ZoomIn,
  X as XIcon,
  Loader2,
  User,
  Users,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eventService, EVENT_QUERY_KEYS, type EventsResponse } from '@/services/eventService';
import { formService, FORM_QUERY_KEYS } from '@/services/formService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { EventQrModal } from '@/components/EventQrModal';
import {
  type ClubEvent,
  type EventForm,
  type FormSubmission,
  getEventRegistrationState,
  formatEventDateRange,
  formatEventTimeRange,
  calculateRemainingTime,
} from '@/lib/formUtils';
import EventTicketPass from '@/components/events/EventTicketPass';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();
  const queryClient = useQueryClient();

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [bannerZoomOpen, setBannerZoomOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCalendarConnectModal, setShowCalendarConnectModal] = useState(false);
  const [calendarConnectUrl, setCalendarConnectUrl] = useState<string | null>(null);

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

  // 1. Instant cache lookup from existing events list (zero spinner when navigating from /events or home)
  const cachedList = queryClient.getQueryData<EventsResponse>(EVENT_QUERY_KEYS.list());
  const initialEvent = useMemo(() => {
    return cachedList?.events?.find((e) => e.id === id);
  }, [cachedList, id]);

  // 2. Event detail query with instant initialData
  const {
    data: eventRes,
    isLoading: isEventLoading,
  } = useQuery({
    queryKey: EVENT_QUERY_KEYS.detail(id || ''),
    queryFn: () => eventService.getEventById(id!),
    enabled: !!id,
    initialData: initialEvent ? { message: 'Cached list item', event: initialEvent } : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const event = eventRes?.event || null;

  // 3. Form for this event (cached 5 min)
  const { data: formsRes } = useQuery({
    queryKey: FORM_QUERY_KEYS.byEvent(id || ''),
    queryFn: () => formService.getFormsByEvent(id!).catch(() => ({ message: 'ok', count: 0, forms: [] })),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const form = useMemo(() => {
    return formsRes?.forms && formsRes.forms.length > 0 ? formsRes.forms[0] : null;
  }, [formsRes]);

  // 4. User submissions query (re-uses existing cache from EventsPage without extra network requests)
  const { data: subsRes } = useQuery({
    queryKey: FORM_QUERY_KEYS.mySubmissions(),
    queryFn: () => formService.getMySubmissions().catch(() => ({ message: 'ok', count: 0, submissions: [] })),
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // 5. Calendar reminders query (re-uses existing cache from EventsPage)
  const { data: calRes } = useQuery({
    queryKey: EVENT_QUERY_KEYS.calendar(),
    queryFn: () => eventService.getMyCalendarEvents().catch(() => ({ event_ids: [], count: 0 })),
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const userSubmission = useMemo(() => {
    if (!form || !subsRes?.submissions) return null;
    return subsRes.submissions.find((s) => s.form_id === form.id) || null;
  }, [form, subsRes]);

  const isRegistered = Boolean(userSubmission);
  const submissionDate = userSubmission?.submitted_at || null;

  const [localCalendarAdded, setLocalCalendarAdded] = useState(() => {
    return id ? localStorage.getItem(`gdg_calendar_added_${id}`) === 'true' : false;
  });

  const calendarAdded = useMemo(() => {
    if (localCalendarAdded) return true;
    if (id && calRes?.event_ids?.includes(id)) return true;
    return false;
  }, [localCalendarAdded, id, calRes]);

  const isLoading = isEventLoading && !initialEvent;

  const details = event?.details || {};
  const banner = details.banner_url || details.coverImage || details.cover_image;
  const customSections = details.custom_sections || [];

  // Live ticker for accurate real-time countdown when registration opening is scheduled
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const regState = useMemo(() => {
    if (!form) return 'hidden';
    const opensAt = form.opens_at || form.schema?.opens_at;
    return getEventRegistrationState({
      isRegistered,
      isOpen: form.schema?.is_open !== false && details.is_registration_open !== false,
      opensAt,
      expiresAt: form.expires_at || form.schema?.expires_at,
      isFull: form.is_full,
      submissionLimit: form.submission_limit ?? form.schema?.submission_limit,
      submissionCount: form.submission_count,
      now,
    });
  }, [form, isRegistered, details, now]);

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
        try {
          const linkRes = await eventService.getGoogleLinkUrl();
          setCalendarConnectUrl(linkRes.url || null);
        } catch {
          setCalendarConnectUrl(null);
        }
        setShowCalendarConnectModal(true);
        return;
      }

      if (res.success || res.calendar_event_id) {
        setLocalCalendarAdded(true);
        try {
          localStorage.setItem(`gdg_calendar_added_${id}`, 'true');
        } catch (_) {}
        toast({
          title: 'Event Synced to Google Calendar',
          description: res.message || 'Check your primary Google Calendar.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Calendar Sync Failed',
        description: 'Could not sync event. Please try again later.',
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
        text: 'Check out this event!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied', description: 'Event link copied to your clipboard.' });
    }
  };

  // Determine if event has already ended
  const eventEndTime = useMemo(() => {
    const et = details?.endTime || details?.end_time;
    if (!et) return null;
    return new Date(et);
  }, [details]);
  const eventEnded = useMemo(() => {
    if (!eventEndTime) return false;
    return new Date() > eventEndTime;
  }, [eventEndTime]);

  // Show Added to Calendar badge only while event hasn't ended
  const showCalendarAddedBadge = calendarAdded && !eventEnded;

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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              aria-label="Share as QR Code"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share QR</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Main Event Card */}
        <div className="rounded-3xl border border-border bg-card text-card-foreground shadow-xl overflow-hidden">
          {/* Banner Image (if added by Admin) — click to zoom */}
          {banner && (
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black group cursor-zoom-in aspect-[16/9]" onClick={() => setBannerZoomOpen(true)}>
              <img
                src={banner}
                alt={event.title}
                loading="eager"
                decoding="async"
                fetchPriority="high"
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

                {details.participation_type && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                    details.participation_type.toLowerCase() === 'team'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  }`}>
                    {details.participation_type.toLowerCase() === 'team' ? (
                      <>
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>Team Event</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span>Individual Event</span>
                      </>
                    )}
                  </span>
                )}

                {regState === 'registered' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-google-green/10 text-google-green border border-google-green/30 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Registration Confirmed</span>
                  </span>
                )}

                {regState === 'upcoming' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Registration Opens Soon ({calculateRemainingTime(form?.opens_at || form?.schema?.opens_at, now).formattedShort})</span>
                  </span>
                )}

                {regState === 'full' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30 font-mono">
                    <Users className="w-3.5 h-3.5" />
                    <span>Slots Full</span>
                  </span>
                )}

                {regState === 'closed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/30 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Registration Closed</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold font-sans tracking-tight leading-tight text-foreground">
                {event.title}
              </h1>
            </div>

            {/* Quick Meta Details Grid */}
            {(() => {
              const showCount = form && form.show_submission_count !== false && form.schema?.show_submission_count !== false;
              return (
                <div className={`grid grid-cols-1 ${showCount ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-4 p-5 rounded-2xl bg-muted/40 border border-border/60`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-google-blue/10 border border-google-blue/20 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-google-blue" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono uppercase font-bold text-muted-foreground">
                        Date
                      </span>
                      <span className="text-sm font-semibold">
                        {formatEventDateRange(
                          details.startTime || details.start_time,
                          details.endTime || details.end_time
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-google-yellow/10 border border-google-yellow/20 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-google-yellow" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono uppercase font-bold text-muted-foreground">
                        Time
                      </span>
                      <span className="text-sm font-semibold">
                        {formatEventTimeRange(
                          details.startTime || details.start_time,
                          details.endTime || details.end_time
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-google-red/10 border border-google-red/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-google-red" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono uppercase font-bold text-muted-foreground">
                        Venue
                      </span>
                      <span className="text-sm font-semibold truncate">
                        {details.location || details.venue || 'Campus Hall'}
                      </span>
                    </div>
                  </div>

                  {details.participation_type && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        {details.participation_type.toLowerCase() === 'team' ? (
                          <Users className="w-5 h-5 text-purple-500" />
                        ) : (
                          <User className="w-5 h-5 text-google-blue" />
                        )}
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono uppercase font-bold text-muted-foreground">
                          Format
                        </span>
                        <span className="text-sm font-semibold capitalize">
                          {details.participation_type.toLowerCase() === 'team' ? 'Team Event' : 'Individual Event'}
                        </span>
                      </div>
                    </div>
                  )}

                  {showCount && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-google-green/10 border border-google-green/20 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-google-green" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono uppercase font-bold text-muted-foreground">
                          Registrations
                        </span>
                        {(() => {
                          const count = form.submission_count ?? 0;
                          const limit = form.submission_limit || form.schema?.submission_limit;
                          if (limit && Number(limit) > 0) {
                            const remaining = Math.max(0, Number(limit) - count);
                            return (
                              <div>
                                <span className="text-sm font-semibold">
                                  {count} <span className="text-xs font-normal text-muted-foreground">registered</span>
                                </span>
                                <div className="text-[11px] font-medium">
                                  {remaining === 0 ? (
                                    <span className="text-rose-500 font-semibold">No spots left</span>
                                  ) : (
                                    <span className="text-google-green font-semibold">
                                      {remaining} spot{remaining === 1 ? '' : 's'} left
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div>
                              <span className="text-sm font-semibold">
                                {count} <span className="text-xs font-normal text-muted-foreground">registered</span>
                              </span>
                              <div className="text-[11px] text-muted-foreground">Unlimited spots</div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Custom Sections Added by Admin (No fixed template) */}
            {customSections.length > 0 ? (
              <div className="space-y-6 pt-2">
                {customSections.map((section, idx) => (
                  <div key={section.id || idx} className="p-6 sm:p-7 rounded-3xl bg-muted/20 border border-border/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-google-blue" />
                      <h2 className="text-lg font-bold font-sans text-foreground">{section.title}</h2>
                    </div>
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
              {/* Calendar action: show Added badge or button */}
              {showCalendarAddedBadge ? (
                <div className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl border border-google-green/30 bg-google-green/10 text-google-green text-sm font-semibold">
                  <CalendarCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Added to Calendar</span>
                </div>
              ) : eventEnded ? (
                <div className="text-xs font-mono text-muted-foreground flex items-center gap-2 py-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Event has ended</span>
                </div>
              ) : regState !== 'closed' ? (
                <button
                  type="button"
                  disabled={isCalendarLoading}
                  onClick={handleAddToCalendar}
                  className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-border bg-background hover:bg-muted text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {isCalendarLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-google-blue" />
                      <span>Adding to Calendar...</span>
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-4 h-4 text-google-yellow" />
                      <span>Add to Google Calendar</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="text-xs font-mono text-muted-foreground flex items-center gap-2 py-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Registration is closed</span>
                </div>
              )}

              {/* Registration CTA — only shown if event has a form */}
              {form && regState === 'open' && (
                <div className="flex flex-col items-center sm:items-end gap-1.5">
                  {isAuthenticated ? (
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/events/${id}/form`)}`)}
                      className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #4285F4, #1A73E8)',
                        boxShadow: '0 4px 20px rgba(66, 133, 244, 0.35)',
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Sign in to Register</span>
                    </button>
                  )}
                  {(form.show_submission_count !== false && form.schema?.show_submission_count !== false) && (() => {
                    const count = form.submission_count ?? 0;
                    const limit = form.submission_limit || form.schema?.submission_limit;
                    if (limit && Number(limit) > 0) {
                      const remaining = Math.max(0, Number(limit) - count);
                      return (
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <span className="text-muted-foreground">
                            <strong className="text-foreground">{count}</strong> / {limit} registered
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className={remaining <= 5 ? 'text-amber-500 font-semibold' : 'text-google-green font-semibold'}>
                            {remaining === 0 ? 'Slots Full' : `${remaining} spot${remaining === 1 ? '' : 's'} remaining`}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">{count}</strong> registered so far
                      </div>
                    );
                  })()}
                  <span className="text-[11px] text-muted-foreground">
                    Includes instant check-in QR pass & confirmation email
                  </span>
                </div>
              )}

              {form && regState === 'upcoming' && (
                <div className="flex flex-col items-center sm:items-end gap-2">
                  <div className="p-3.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex flex-col items-center sm:items-end gap-1 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider">
                      <Clock className="w-4 h-4 animate-pulse text-amber-500 shrink-0" />
                      <span>Registration Opens In:</span>
                      <span className="text-sm font-extrabold text-foreground font-mono">
                        {calculateRemainingTime(form.opens_at || form.schema?.opens_at, now).formatted}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Opens on{' '}
                      {new Date(form.opens_at || form.schema?.opens_at!).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(form.opens_at || form.schema?.opens_at!).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>

                  <div className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-muted/80 text-muted-foreground font-semibold text-sm border border-border cursor-not-allowed select-none">
                    <Clock className="w-4 h-4" />
                    <span>Registration Opens Soon</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Form will unlock automatically when opening time arrives
                  </span>
                </div>
              )}

              {form && regState === 'registered' && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-google-green/10 text-google-green border border-google-green/30 text-sm font-semibold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>You are Registered</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTicketModal(true)}
                    className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-google-blue hover:bg-google-blue/90 text-white text-sm font-semibold shadow-md transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View QR Ticket</span>
                  </button>
                </div>
              )}

              {form && regState === 'full' && (
                <div className="flex flex-col items-center sm:items-end gap-1.5">
                  <div className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30 text-sm font-semibold font-mono">
                    <Users className="w-4 h-4" />
                    <span>Event Slots Are Full</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Capacity reached{form.submission_count !== undefined ? ` (${form.submission_count}/${form.submission_limit || form.schema?.submission_limit || form.submission_count} registered)` : ''}. No more registrations allowed.
                  </span>
                </div>
              )}

              {form && regState === 'closed' && !eventEnded && (
                <div className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-google-yellow/10 text-google-yellow border border-google-yellow/30 text-sm font-semibold font-mono">
                  <Clock className="w-4 h-4" />
                  <span>Registration Closed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Share Modal */}
      <EventQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        eventTitle={event?.title || 'Event'}
        eventUrl={window.location.href}
      />

      {/* Ticket Pass QR Modal */}
      {showTicketModal && event && (
        <EventTicketPass
          isModal
          onClose={() => setShowTicketModal(false)}
          event={event}
          submissionId={userSubmission?.id}
          submittedAt={userSubmission?.submitted_at}
          answers={userSubmission?.answers || {}}
          fields={form?.schema?.fields || []}
          attendeeName={profile?.full_name}
          attendeeEmail={profile?.email}
        />
      )}

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
            <button
              type="button"
              onClick={() => setBannerZoomOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors backdrop-blur-sm z-10"
              aria-label="Close image"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-mono bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              Press <kbd className="bg-white/10 rounded px-1.5 py-0.5 font-bold">Esc</kbd> or click anywhere to close
            </div>
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

      {/* ── Google Calendar Connect Modal ── */}
      <AnimatePresence>
        {showCalendarConnectModal && (
          <motion.div
            key="cal-connect-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setShowCalendarConnectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-7 space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-google-blue/10 border border-google-blue/20 flex items-center justify-center flex-shrink-0">
                    <CalendarPlus className="w-5 h-5 text-google-blue" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Connect Google Account</h3>
                    <p className="text-xs text-muted-foreground font-mono">For Google Calendar access</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalendarConnectModal(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Your <span className="font-semibold text-foreground">email &amp; password login is kept</span> — connecting Google only grants calendar access.
                </p>
                <p>
                  You'll be redirected to Google to approve calendar permissions. Once done, you'll return here.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {calendarConnectUrl ? (
                  <a
                    href={calendarConnectUrl}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-google-blue text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Connect Google Calendar
                  </a>
                ) : (
                  <div className="flex-1 text-xs text-muted-foreground text-center py-2.5 rounded-xl bg-muted border border-border">
                    Could not generate connect URL. Please try again.
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowCalendarConnectModal(false)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetailPage;

