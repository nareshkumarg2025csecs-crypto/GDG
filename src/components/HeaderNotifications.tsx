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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { eventService } from '@/services/eventService';
import type { ClubEvent } from '@/lib/formUtils';

interface HeaderNotificationsProps {
  activeColor?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [lastOpenedAt, setLastOpenedAt] = useState<number>(0);
  const [readEventIds, setReadEventIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Storage key: user-scoped for authenticated users, guest-scoped for unauthenticated visitors
  const storageKeyPrefix = isAuthenticated && user?.id ? user.id : 'guest';
  const userStorageKey = `gdg_notifications_last_opened_${storageKeyPrefix}`;
  const userReadEventsKey = `gdg_read_event_ids_${storageKeyPrefix}`;

  // Determine user registration timestamp for authenticated users
  // Authenticated users ONLY receive notifications for events created after their account registration
  const userRegistrationTime = useMemo(() => {
    if (!isAuthenticated || !user?.id) return 0;

    // 1. Primary: profile created_at from database
    const rawCreatedAt = profile?.created_at || (user as any)?.created_at;
    if (rawCreatedAt) {
      const parsed = new Date(rawCreatedAt).getTime();
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    // 2. Fallback: persisted initial registration/session timestamp in localStorage
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

  // Load stored state on mount or when user changes
  useEffect(() => {
    try {
      const storedLastOpened = localStorage.getItem(userStorageKey);
      if (storedLastOpened) {
        setLastOpenedAt(parseInt(storedLastOpened, 10));
      } else {
        setLastOpenedAt(0);
      }

      const storedReadIds = localStorage.getItem(userReadEventsKey);
      if (storedReadIds) {
        const parsed = JSON.parse(storedReadIds);
        if (Array.isArray(parsed)) {
          setReadEventIds(new Set(parsed));
        } else {
          setReadEventIds(new Set());
        }
      } else {
        setReadEventIds(new Set());
      }
    } catch {
      // ignore storage errors
    }
  }, [userStorageKey, userReadEventsKey]);

  // Fetch events list for both unauthenticated and authenticated users
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await eventService.listEvents();
      if (res?.events) {
        // Sort descending by created_at
        const sorted = [...res.events].sort((a, b) => {
          const tA = new Date(a.created_at || a.details?.startTime || 0).getTime();
          const tB = new Date(b.created_at || b.details?.startTime || 0).getTime();
          return tB - tA;
        });
        setEvents(sorted);
      }
    } catch (err) {
      console.warn('Failed to fetch events for notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
  // - Authenticated: ONLY events created AFTER the user signed up and registered as a user
  //   (with 60-second buffer to handle minor clock skew)
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
    // For unauthenticated visitors, all events are eligible
    return events;
  }, [events, isAuthenticated, userRegistrationTime]);

  // Determine unread events:
  // An eligible event is unread if:
  // 1. Its ID has not been marked as read in readEventIds, AND
  // 2. If opened previously, it was created after lastOpenedAt
  // 3. If never opened yet:
  //    - Authenticated users: all events created since registration are unread
  //    - Guests: events created in the last 14 days are unread
  const unreadEvents = useMemo(() => {
    if (!userEligibleEvents.length) return [];
    return userEligibleEvents.filter((event) => {
      if (readEventIds.has(event.id)) return false;
      const createdTime = new Date(event.created_at).getTime();
      if (lastOpenedAt > 0) {
        return createdTime > lastOpenedAt;
      }
      if (isAuthenticated) {
        return true;
      }
      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      return createdTime > fourteenDaysAgo || isNaN(createdTime);
    });
  }, [userEligibleEvents, readEventIds, lastOpenedAt, isAuthenticated]);

  const unreadCount = unreadEvents.length;
  const hasUnread = unreadCount > 0;

  // When user opens the popover, update lastOpenedAt and persist for this user/guest
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
    const allIds = new Set(userEligibleEvents.map((ev) => ev.id));
    setReadEventIds(allIds);
    const now = Date.now();
    setLastOpenedAt(now);
    try {
      localStorage.setItem(userStorageKey, now.toString());
      localStorage.setItem(userReadEventsKey, JSON.stringify(Array.from(allIds)));
    } catch {
      // ignore
    }
  };

  const handleEventClick = (eventId: string) => {
    setReadEventIds((prev) => {
      const next = new Set(prev);
      next.add(eventId);
      try {
        localStorage.setItem(userReadEventsKey, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
    setIsOpen(false);
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleToggle}
        aria-label="View notifications about new events"
        aria-expanded={isOpen}
        title={hasUnread ? `${unreadCount} new event notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
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
            aria-label="Event notifications"
            className="fixed sm:absolute top-20 sm:top-full left-3 right-3 sm:left-auto sm:right-0 sm:mt-2.5 sm:w-96 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl z-50 overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[560px]"
            style={{
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header - Solid theme background */}
            <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-card shrink-0">
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
                      ? 'Events created since you joined'
                      : 'Newly added and upcoming GDG events'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {userEligibleEvents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification Event List */}
            <div className="overflow-y-auto divide-y divide-border/50 flex-1 overscroll-contain bg-card">
              {isLoading ? (
                <div className="p-6 text-center space-y-3 bg-card">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">Checking for newly added events...</p>
                </div>
              ) : userEligibleEvents.length === 0 ? (
                <div className="p-8 text-center space-y-2.5 bg-card">
                  <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <Calendar className="w-6 h-6 opacity-60" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {isAuthenticated ? 'No new notifications' : 'No events found'}
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    {isAuthenticated
                      ? "You're all caught up! When coordinators create new events after you joined, they'll appear here as notifications."
                      : "Check back soon! When the team schedules new workshops or hackathons, they'll show up here."}
                  </p>
                </div>
              ) : (
                userEligibleEvents.slice(0, 8).map((event) => {
                  const isItemUnread =
                    !readEventIds.has(event.id) &&
                    (lastOpenedAt === 0 || new Date(event.created_at).getTime() > lastOpenedAt);
                  const categoryStyle = getCategoryStyle(event.details?.category);
                  const formattedDate = formatEventDate(event.details?.startTime || event.details?.start_time);
                  const location = event.details?.location || event.details?.venue;
                  const relativeTime = getRelativeTime(event.created_at);

                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className={`group p-3 sm:p-3.5 transition-all cursor-pointer relative flex items-start gap-3 hover:bg-muted ${
                        isItemUnread ? 'bg-blue-500/10 dark:bg-blue-950/40' : 'bg-card'
                      }`}
                    >
                      {/* Left icon / New indicator */}
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

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${categoryStyle.bg} ${categoryStyle.border} ${categoryStyle.text}`}
                          >
                            {event.details?.category || 'Event'}
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
                          {event.title}
                        </h5>

                        {event.details?.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                            {event.details.description}
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

                      {/* Right Chevron */}
                      <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer - Solid theme background */}
            <div className="p-2.5 sm:p-3 border-t border-border bg-card flex items-center justify-between gap-2 shrink-0">
              <Link
                to="/events"
                onClick={() => setIsOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors shadow-sm"
              >
                <span>Browse All Events</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
