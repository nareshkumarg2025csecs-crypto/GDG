import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Sparkles,
  Calendar,
  MapPin,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  X,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { eventService } from '@/services/eventService';
import { dashboardService, type AppNotification } from '@/services/dashboardService';
import { formService } from '@/services/formService';
import type { ClubEvent } from '@/lib/formUtils';

interface HeaderNotificationsProps {
  activeColor?: string;
}

export interface UnifiedNotification {
  id: string;
  type: 'attendance' | 'certificate' | 'event';
  title: string;
  message: string;
  timestamp: string;
  category?: string;
  eventId?: string | null;
  eventTitle?: string;
  certificateId?: string | null;
  actionUrl: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  workshop: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  hackathon: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  seminar: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  meetup: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  tech: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
};

function getCategoryStyle(category?: string) {
  const key = (category || '').toLowerCase();
  for (const [k, style] of Object.entries(CATEGORY_STYLES)) {
    if (key.includes(k)) return style;
  }
  return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' };
}

function getRelativeTime(dateString?: string) {
  if (!dateString) return 'Recently';
  const time = new Date(dateString).getTime();
  if (isNaN(time)) return 'Recently';
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatEventDate(dateString?: string) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const HeaderNotifications: React.FC<HeaderNotificationsProps> = ({
  activeColor = '#4285F4',
}) => {
  const { user, profile, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [personalNotifications, setPersonalNotifications] = useState<UnifiedNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'alerts' | 'events'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastOpenedAt, setLastOpenedAt] = useState<number>(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const navigate = useNavigate();

  // Storage key: user-scoped for authenticated users, guest-scoped for unauthenticated visitors
  const storageKeyPrefix = isAuthenticated && user?.id ? user.id : 'guest';
  const userStorageKey = `gdg_notifications_last_opened_${storageKeyPrefix}`;
  const userReadIdsKey = `gdg_read_notification_ids_${storageKeyPrefix}`;

  // Determine user registration timestamp for authenticated users
  // Authenticated users only receive generic event notifications for events created after registration
  const userRegistrationTime = useMemo(() => {
    if (!isAuthenticated || !user?.id) return 0;

    const rawCreatedAt = profile?.created_at || (user as any)?.created_at;
    if (rawCreatedAt) {
      const parsed = new Date(rawCreatedAt).getTime();
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    const storageKey = `gdg_user_registered_time_${user.id}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      const now = Date.now();
      localStorage.setItem(storageKey, now.toString());
      return now;
    } catch {
      return Date.now();
    }
  }, [isAuthenticated, user?.id, profile?.created_at, (user as any)?.created_at]);

  // Load stored read states on mount or when user changes
  useEffect(() => {
    try {
      const storedLastOpened = localStorage.getItem(userStorageKey);
      setLastOpenedAt(storedLastOpened ? parseInt(storedLastOpened, 10) : 0);

      const storedRead = localStorage.getItem(userReadIdsKey);
      if (storedRead) {
        const parsed = JSON.parse(storedRead);
        if (Array.isArray(parsed)) {
          setReadIds(new Set(parsed));
        } else {
          setReadIds(new Set());
        }
      } else {
        setReadIds(new Set());
      }
    } catch {
      // ignore
    }
  }, [userStorageKey, userReadIdsKey]);

  // Main data fetch: events + attendance/certificate notifications
  // Background interval polls ONLY personal notifications (includeEvents = false) to drastically preserve Supabase egress
  const fetchAllNotifications = async (includeEvents = true) => {
    try {
      setIsLoading(true);

      // 1. Fetch Events (only on mount, manual refresh, or window focus)
      const eventsPromise = includeEvents
        ? eventService.listEvents().catch(() => ({ events: [] }))
        : Promise.resolve(null);

      // 2. Fetch Personal Notifications (if authenticated)
      let personalPromise: Promise<UnifiedNotification[]> = Promise.resolve([]);
      if (isAuthenticated) {
        personalPromise = dashboardService
          .getNotifications()
          .then((res) => {
            if (res?.notifications && Array.isArray(res.notifications)) {
              return res.notifications.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                timestamp: n.timestamp,
                eventId: n.event_id,
                eventTitle: n.event_title,
                certificateId: n.certificate_id,
                actionUrl: n.action_url || '/dashboard',
              }));
            }
            return [];
          })
          .catch(async () => {
            // Fallback: Synthesize from getMySubmissions()
            try {
              const subRes = await formService.getMySubmissions();
              const synthesized: UnifiedNotification[] = [];
              if (subRes?.submissions) {
                for (const sub of subRes.submissions) {
                  const evTitle = (sub as any).event_title || 'GDG Event';
                  const evId = (sub as any).event_id || null;

                  if (sub.attended) {
                    synthesized.push({
                      id: `attendance_${sub.id}`,
                      type: 'attendance',
                      title: 'Attendance Marked Present',
                      message: `You were marked present for "${evTitle}". Your attendance has been verified!`,
                      timestamp: (sub as any).attended_at || sub.submitted_at,
                      eventId: evId,
                      eventTitle: evTitle,
                      actionUrl: '/dashboard',
                    });
                  }

                  if (sub.certificate_sent) {
                    synthesized.push({
                      id: `certificate_${sub.id}`,
                      type: 'certificate',
                      title: 'Certificate Dispatched & Sent',
                      message: `Your certificate of participation for "${evTitle}" has been generated and sent to your email.`,
                      timestamp: sub.certificate_sent_at || sub.submitted_at,
                      eventId: evId,
                      eventTitle: evTitle,
                      certificateId: sub.certificate_id,
                      actionUrl: '/dashboard',
                    });
                  }
                }
              }
              return synthesized;
            } catch {
              return [];
            }
          });
      }

      const [eventsRes, personalList] = await Promise.all([eventsPromise, personalPromise]);

      if (eventsRes?.events) {
        const sortedEvents = [...eventsRes.events].sort((a, b) => {
          const tA = new Date(a.created_at || a.details?.startTime || 0).getTime();
          const tB = new Date(b.created_at || b.details?.startTime || 0).getTime();
          return tB - tA;
        });
        setEvents(sortedEvents);
      }

      setPersonalNotifications(personalList);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and auto-refresh on window focus or 90s polling (paused when tab is hidden)
  useEffect(() => {
    fetchAllNotifications(true);
    lastFetchTimeRef.current = Date.now();

    const handleFocus = () => {
      const now = Date.now();
      // Throttle window focus refetch: require at least 90s since last fetch to protect Supabase egress
      if (now - lastFetchTimeRef.current >= 90000) {
        lastFetchTimeRef.current = now;
        fetchAllNotifications(false);
      }
    };

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - lastFetchTimeRef.current >= 90000) {
        lastFetchTimeRef.current = now;
        fetchAllNotifications(false);
      }
    };

    const handleForceRefresh = () => {
      lastFetchTimeRef.current = Date.now();
      fetchAllNotifications(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('gdg:notifications-refresh', handleForceRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let interval: NodeJS.Timeout | null = null;
    if (isAuthenticated) {
      // 90 seconds interval (only runs if tab is active to preserve Supabase egress)
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          lastFetchTimeRef.current = Date.now();
          fetchAllNotifications(false);
        }
      }, 90000);
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('gdg:notifications-refresh', handleForceRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Eligible events:
  // - Authenticated: ONLY events created AFTER the user joined (with 60-second buffer)
  // - Unauthenticated: all recent GDG events
  const userEligibleEvents = useMemo(() => {
    if (!events.length) return [];
    if (isAuthenticated && userRegistrationTime > 0) {
      return events.filter((event) => {
        const eventCreatedTime = new Date(event.created_at).getTime();
        if (isNaN(eventCreatedTime)) return false;
        return eventCreatedTime >= userRegistrationTime - 60000;
      });
    }
    return events;
  }, [events, isAuthenticated, userRegistrationTime]);

  // Combine into unified notification list
  const unifiedNotifications = useMemo(() => {
    const eventItems: UnifiedNotification[] = userEligibleEvents.map((ev) => ({
      id: `event_${ev.id}`,
      type: 'event',
      title: ev.title,
      message: ev.details?.description || 'Newly announced event in Google Developer Group.',
      timestamp: ev.created_at,
      category: ev.details?.category || 'Event',
      eventId: ev.id,
      eventTitle: ev.title,
      actionUrl: `/events/${ev.id}`,
    }));

    const combined = [...personalNotifications, ...eventItems];
    return combined.sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return tB - tA;
    });
  }, [personalNotifications, userEligibleEvents]);

  // Filtered list according to active tab
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'alerts') {
      return unifiedNotifications.filter((n) => n.type === 'attendance' || n.type === 'certificate');
    }
    if (activeFilter === 'events') {
      return unifiedNotifications.filter((n) => n.type === 'event');
    }
    return unifiedNotifications;
  }, [unifiedNotifications, activeFilter]);

  // Unread items logic:
  // Unread if ID not in readIds AND created after lastOpenedAt (or last 14 days)
  const unreadItems = useMemo(() => {
    if (!unifiedNotifications.length) return [];
    return unifiedNotifications.filter((item) => {
      if (readIds.has(item.id)) return false;
      const createdTime = new Date(item.timestamp).getTime();
      if (lastOpenedAt > 0) {
        return createdTime > lastOpenedAt;
      }
      if (isAuthenticated) {
        return true;
      }
      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      return createdTime > fourteenDaysAgo || isNaN(createdTime);
    });
  }, [unifiedNotifications, readIds, lastOpenedAt, isAuthenticated]);

  const unreadCount = unreadItems.length;
  const hasUnread = unreadCount > 0;

  const alertsCount = personalNotifications.length;
  const eventsCount = userEligibleEvents.length;

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      const now = Date.now();
      setLastOpenedAt(now);
      try {
        localStorage.setItem(userStorageKey, now.toString());
      } catch {
        // ignore
      }
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIds = new Set(unifiedNotifications.map((n) => n.id));
    setReadIds(allIds);
    const now = Date.now();
    setLastOpenedAt(now);
    try {
      localStorage.setItem(userStorageKey, now.toString());
      localStorage.setItem(userReadIdsKey, JSON.stringify(Array.from(allIds)));
    } catch {
      // ignore
    }
  };

  const handleItemClick = (item: UnifiedNotification) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      try {
        localStorage.setItem(userReadIdsKey, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
    setIsOpen(false);
    navigate(item.actionUrl);
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleToggle}
        aria-label="View notifications about events, attendance, and certificates"
        aria-expanded={isOpen}
        title={hasUnread ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
        className={`relative p-2 rounded-full border transition-all duration-200 shadow-sm flex items-center justify-center ${
          isOpen
            ? 'border-blue-500/50 bg-blue-500/10 text-blue-500'
            : hasUnread
            ? 'border-amber-500/40 bg-card hover:bg-muted text-foreground'
            : 'border-border bg-card hover:bg-muted text-foreground/80 hover:text-foreground'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Notify Indicator Pill / Dot */}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center rounded-full h-3.5 min-w-3.5 px-1 bg-gradient-to-r from-rose-500 to-amber-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-card">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </motion.button>

      {/* Notifications Popover Dropdown (Responsive Desktop + Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="region"
            aria-label="Event and attendance notifications"
            className="fixed sm:absolute top-20 sm:top-full left-3 right-3 sm:left-auto sm:right-0 sm:mt-2.5 sm:w-[420px] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl z-50 overflow-hidden flex flex-col max-h-[84vh] sm:max-h-[580px]"
            style={{
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-border bg-card shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">Notifications</h4>
                      {hasUnread && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {isAuthenticated
                        ? 'Attendance, certificates, and event updates'
                        : 'Newly added and upcoming GDG events'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {unifiedNotifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      aria-label="Mark all notifications as read"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                      <span className="hidden sm:inline">Mark read</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close notifications"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Close notifications"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs (All, Alerts: Attendance & Certificates, Events) */}
              {isAuthenticated && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50 text-xs">
                  <button
                    type="button"
                    aria-label={`Show all notifications (${unifiedNotifications.length})`}
                    aria-pressed={activeFilter === 'all'}
                    onClick={() => setActiveFilter('all')}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all text-center ${
                      activeFilter === 'all'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All ({unifiedNotifications.length})
                  </button>
                  <button
                    type="button"
                    aria-label={`Show alert notifications (${alertsCount})`}
                    aria-pressed={activeFilter === 'alerts'}
                    onClick={() => setActiveFilter('alerts')}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all text-center flex items-center justify-center gap-1 ${
                      activeFilter === 'alerts'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Award className="w-3 h-3 text-amber-500" aria-hidden="true" />
                    <span>Alerts ({alertsCount})</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Show event notifications (${eventsCount})`}
                    aria-pressed={activeFilter === 'events'}
                    onClick={() => setActiveFilter('events')}
                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all text-center flex items-center justify-center gap-1 ${
                      activeFilter === 'events'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Calendar className="w-3 h-3 text-blue-500" aria-hidden="true" />
                    <span>Events ({eventsCount})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto divide-y divide-border/50 flex-1 overscroll-contain bg-card">
              {isLoading ? (
                <div className="p-6 text-center space-y-3 bg-card">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">Checking for notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center space-y-2.5 bg-card">
                  <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <Bell className="w-6 h-6 opacity-60" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {activeFilter === 'alerts'
                      ? 'No attendance or certificate alerts yet'
                      : isAuthenticated
                      ? 'No notifications at this time'
                      : 'No events found'}
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    {activeFilter === 'alerts'
                      ? "When coordinators mark your attendance or dispatch event certificates, you'll receive real-time notifications here."
                      : isAuthenticated
                      ? "You're all caught up! When you attend events, receive certificates, or new events launch, notifications will appear here."
                      : "Check back soon! When the team schedules new workshops or hackathons, they'll show up here."}
                  </p>
                </div>
              ) : (
                filteredNotifications.slice(0, 10).map((item) => {
                  const isItemUnread =
                    !readIds.has(item.id) &&
                    (lastOpenedAt === 0 || new Date(item.timestamp).getTime() > lastOpenedAt);
                  const relativeTime = getRelativeTime(item.timestamp);

                  // 1. Attendance Verified Notification Item
                  if (item.type === 'attendance') {
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`group p-3 sm:p-3.5 transition-all cursor-pointer relative flex items-start gap-3 hover:bg-muted ${
                          isItemUnread ? 'bg-emerald-500/10 dark:bg-emerald-950/30' : 'bg-card'
                        }`}
                      >
                        <div className="relative shrink-0 mt-0.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all bg-emerald-500/15 border-emerald-500/30 text-emerald-500">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          {isItemUnread && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-sm animate-pulse" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-emerald-500/15 border-emerald-500/30 text-emerald-500">
                              Attended & Verified
                            </span>
                            {isItemUnread && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                NEW
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {relativeTime}
                            </span>
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-1 leading-snug">
                            {item.title}
                          </h5>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>

                          <div className="flex items-center gap-2 pt-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span>View Attendance in Dashboard</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>

                        <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  }

                  // 2. Certificate Sent Notification Item
                  if (item.type === 'certificate') {
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`group p-3 sm:p-3.5 transition-all cursor-pointer relative flex items-start gap-3 hover:bg-muted ${
                          isItemUnread ? 'bg-amber-500/10 dark:bg-amber-950/30' : 'bg-card'
                        }`}
                      >
                        <div className="relative shrink-0 mt-0.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all bg-amber-500/15 border-amber-500/30 text-amber-500">
                            <Award className="w-5 h-5" />
                          </div>
                          {isItemUnread && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-card shadow-sm animate-pulse" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-amber-500/15 border-amber-500/30 text-amber-500">
                              Certificate Sent
                            </span>
                            {isItemUnread && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                NEW
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {relativeTime}
                            </span>
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-amber-500 transition-colors line-clamp-1 leading-snug">
                            {item.title}
                          </h5>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>

                          <div className="flex items-center gap-2 pt-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <span>Open Certificate in Dashboard</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>

                        <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  }

                  // 3. New Event Notification Item
                  const categoryStyle = getCategoryStyle(item.category);
                  const matchingEvent = events.find((e) => e.id === item.eventId);
                  const formattedDate = formatEventDate(matchingEvent?.details?.startTime || matchingEvent?.details?.start_time);
                  const location = matchingEvent?.details?.location || matchingEvent?.details?.venue;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`group p-3 sm:p-3.5 transition-all cursor-pointer relative flex items-start gap-3 hover:bg-muted ${
                        isItemUnread ? 'bg-blue-500/10 dark:bg-blue-950/40' : 'bg-card'
                      }`}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${categoryStyle.bg} ${categoryStyle.border} ${categoryStyle.text}`}
                        >
                          <Calendar className="w-4 h-4" />
                        </div>
                        {isItemUnread && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-card shadow-sm animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${categoryStyle.bg} ${categoryStyle.border} ${categoryStyle.text}`}
                          >
                            {item.category || 'Event'}
                          </span>

                          {isItemUnread && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              NEW
                            </span>
                          )}

                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {relativeTime}
                          </span>
                        </div>

                        <h5 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-blue-500 transition-colors line-clamp-1 leading-snug">
                          {item.title}
                        </h5>

                        {item.message && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                            {item.message}
                          </p>
                        )}

                        <div className="flex items-center gap-3 pt-0.5 text-[10px] text-muted-foreground flex-wrap">
                          {formattedDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground/70" />
                              <span>{formattedDate}</span>
                            </span>
                          )}
                          {location && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <MapPin className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                              <span className="truncate">{location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>



          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
