import React, { useEffect, useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Code2,
  Zap,
  CheckCircle2,
  AlertCircle,
  Radio,
  Timer,
  Flame,
  ZoomIn,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { usePromoBannerStore } from '@/store/promoBannerStore';
import { EVENT_PROMO_CONFIG } from '@/config/eventPromoConfig';
import { eventService } from '@/services/eventService';
import { formService } from '@/services/formService';
import { getEventRegistrationState, type ClubEvent, type EventForm } from '@/lib/formUtils';

export type BannerTier = 'slots_low' | 'closing_soon' | 'new_release';

interface PromoState {
  event: ClubEvent;
  tier: BannerTier;
  form?: EventForm;
  remainingSlots?: number;
  totalLimit?: number;
  percentFilled?: number;
  timeRemainingText?: string;
}

export const EventLaunchSpotlight: React.FC = () => {
  const [promo, setPromo] = useState<PromoState | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const setBannerHeight = usePromoBannerStore((state) => state.setBannerHeight);
  const setIsBannerVisibleInStore = usePromoBannerStore((state) => state.setIsBannerVisible);
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Sync banner visibility with header store
  useEffect(() => {
    setIsBannerVisibleInStore(isBannerVisible);
  }, [isBannerVisible, setIsBannerVisibleInStore]);

  // Dynamically measure banner height across screen resizes and wrapping
  useEffect(() => {
    if (!isBannerVisible || !bannerRef.current) {
      setBannerHeight(0);
      return;
    }

    const updateHeight = () => {
      if (bannerRef.current) {
        const height = bannerRef.current.offsetHeight;
        setBannerHeight(height);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(bannerRef.current);

    return () => {
      resizeObserver.disconnect();
      setBannerHeight(0);
    };
  }, [isBannerVisible, setBannerHeight]);

  // Clean store state when unmounting
  useEffect(() => {
    return () => {
      setIsBannerVisibleInStore(false);
      setBannerHeight(0);
    };
  }, [setIsBannerVisibleInStore, setBannerHeight]);

  useEffect(() => {
    // 1. Master toggle: Zero work or egress if disabled
    if (!EVENT_PROMO_CONFIG.ENABLED) {
      return;
    }

    let isMounted = true;

    const evaluatePromotionalBanners = async () => {
      try {
        const now = Date.now();

        // Cached concurrent queries (utilizes 60s in-memory client cache to preserve egress)
        const [eventsRes, formsSummaryRes] = await Promise.all([
          eventService.listEvents(false),
          formService.getFormsSummary(false).catch(() => ({ formsByEvent: {} })),
        ]);

        if (!eventsRes?.events || !Array.isArray(eventsRes.events) || eventsRes.events.length === 0) {
          return;
        }

        const formsByEvent = formsSummaryRes?.formsByEvent || {};

        // 2. Filter strictly eligible events:
        // - Published status
        // - Event banner image MUST be the event's uploaded image only
        // - Has NOT started yet
        // - Registration is strictly OPEN (not closed, not full/filled, not expired, not upcoming)
        const activePublishedEvents = eventsRes.events.filter((ev) => {
          const details = ev.details || {};
          const isPublished = details.status === 'published' || details.published === true;
          if (!isPublished) return false;

          // Must strictly have the event's uploaded image
          const uploadedBanner =
            details.coverImage ||
            details.cover_image ||
            details.banner_url ||
            details.banner;
          if (!uploadedBanner || typeof uploadedBanner !== 'string' || uploadedBanner.trim().length === 0) {
            return false;
          }

          // Check if event has already started
          const rawStart = details.startTime || details.start_time;
          if (rawStart) {
            const startTimeMs = new Date(rawStart).getTime();
            if (!isNaN(startTimeMs) && startTimeMs <= now) {
              return false;
            }
          }

          // Check if registration is explicitly closed on event
          if (details.is_registration_open === false || details.registration_closed === true) {
            return false;
          }

          // Check corresponding registration form status & unified registration state
          const form = formsByEvent[ev.id];
          const regState = getEventRegistrationState({
            isRegistered: false,
            isOpen: details.is_registration_open !== false && details.registration_closed !== true,
            opensAt: form?.opens_at || details.registration_opens_at,
            expiresAt: form?.expires_at || details.registration_deadline || details.startTime || details.start_time,
            isFull: form?.is_full === true || details.is_full === true,
            submissionLimit:
              typeof form?.submission_limit === 'number'
                ? form.submission_limit
                : typeof details.capacity === 'number'
                ? details.capacity
                : null,
            submissionCount:
              typeof form?.submission_count === 'number'
                ? form.submission_count
                : typeof details.registered_count === 'number'
                ? details.registered_count
                : 0,
            now: new Date(now),
          });

          // Must be strictly 'open' (if closed, full, or upcoming, do not show banner)
          if (regState !== 'open') {
            return false;
          }

          // Defensive capacity check: if slots are full, do not show banner
          if (form) {
            if (form.is_full === true) {
              return false;
            }
            if (
              typeof form.submission_limit === 'number' &&
              form.submission_limit > 0 &&
              typeof form.submission_count === 'number' &&
              form.submission_count >= form.submission_limit
            ) {
              return false;
            }
            if (form.expires_at) {
              const expiresMs = new Date(form.expires_at).getTime();
              if (!isNaN(expiresMs) && expiresMs <= now) {
                return false;
              }
            }
          }

          return true;
        });

        if (activePublishedEvents.length === 0) {
          return;
        }

        // 3. Multi-event urgency scanner:
        // Evaluates all active published events in order of urgency (Slots Low -> Closing Soon -> Registration Open).
        // If the user hasn't seen a banner for an eligible event/tier, it triggers the promotion immediately.

        // TIER A: Limited Capacity / Slots Low Urgency Scan
        if (EVENT_PROMO_CONFIG.ENABLE_SLOTS_LOW_BANNER) {
          for (const ev of activePublishedEvents) {
            const evForm = formsByEvent[ev.id];
            const evDetails = ev.details || {};
            const limit =
              typeof evForm?.submission_limit === 'number' && evForm.submission_limit > 0
                ? evForm.submission_limit
                : typeof evDetails.capacity === 'number' && evDetails.capacity > 0
                ? evDetails.capacity
                : null;
            const count =
              typeof evForm?.submission_count === 'number'
                ? evForm.submission_count
                : typeof evDetails.registered_count === 'number'
                ? evDetails.registered_count
                : 0;

            if (typeof limit === 'number' && limit > 0) {
              const remaining = limit - count;
              if (remaining > 0 && remaining <= (EVENT_PROMO_CONFIG.SLOTS_LOW_THRESHOLD || 15)) {
                const storageKey = `${EVENT_PROMO_CONFIG.STORAGE_KEY_PREFIX}${ev.id}_slots_low`;
                const hasSeen = localStorage.getItem(storageKey);
                if (hasSeen !== 'true') {
                  const percent = Math.min(100, Math.round((count / limit) * 100));
                  if (isMounted) {
                    triggerPromo({
                      event: ev,
                      tier: 'slots_low',
                      form: evForm,
                      remainingSlots: remaining,
                      totalLimit: limit,
                      percentFilled: percent,
                    });
                  }
                  return;
                }
              }
            }
          }
        }

        // TIER B: Registration Closing Soon Urgency Scan
        if (EVENT_PROMO_CONFIG.ENABLE_CLOSING_SOON_BANNER) {
          for (const ev of activePublishedEvents) {
            const evForm = formsByEvent[ev.id];
            const evDetails = ev.details || {};
            const expiryStr =
              evForm?.expires_at ||
              evDetails.registration_deadline ||
              evDetails.startTime ||
              evDetails.start_time;
            if (expiryStr) {
              const expiryMs = new Date(expiryStr).getTime();
              if (!isNaN(expiryMs) && expiryMs > now) {
                const msLeft = expiryMs - now;
                const hoursLeft = msLeft / (1000 * 60 * 60);

                if (hoursLeft <= (EVENT_PROMO_CONFIG.CLOSING_SOON_HOURS || 2)) {
                  const storageKey = `${EVENT_PROMO_CONFIG.STORAGE_KEY_PREFIX}${ev.id}_closing_soon`;
                  const hasSeen = localStorage.getItem(storageKey);
                  if (hasSeen !== 'true') {
                    const minutesLeft = Math.max(1, Math.round(msLeft / (1000 * 60)));
                    const timeText =
                      minutesLeft >= 60
                        ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`
                        : `${minutesLeft} min`;

                    if (isMounted) {
                      triggerPromo({
                        event: ev,
                        tier: 'closing_soon',
                        form: evForm,
                        timeRemainingText: timeText,
                      });
                    }
                    return;
                  }
                }
              }
            }
          }
        }

        // TIER C: Registration Open / New Event Release Scan
        if (EVENT_PROMO_CONFIG.ENABLE_NEW_RELEASE_BANNER) {
          const sortedCandidates = [...activePublishedEvents].sort((a, b) => {
            if (EVENT_PROMO_CONFIG.PINNED_EVENT_ID) {
              if (a.id === EVENT_PROMO_CONFIG.PINNED_EVENT_ID) return -1;
              if (b.id === EVENT_PROMO_CONFIG.PINNED_EVENT_ID) return 1;
            }
            const timeA = new Date(a.details?.startTime || a.created_at || 0).getTime();
            const timeB = new Date(b.details?.startTime || b.created_at || 0).getTime();
            return timeB - timeA;
          });

          for (const ev of sortedCandidates) {
            const evForm = formsByEvent[ev.id];
            const evDetails = ev.details || {};
            const rawStart = evDetails.startTime || evDetails.start_time;
            const startMs = rawStart ? new Date(rawStart).getTime() : 0;
            const createdMs = new Date(ev.created_at || ev.updated_at || evDetails.startTime || 0).getTime();
            const maxAgeMs = (EVENT_PROMO_CONFIG.MAX_EVENT_AGE_DAYS || 90) * 24 * 60 * 60 * 1000;
            const isRecentOrUpcoming = startMs > now || (createdMs > 0 && now - createdMs <= maxAgeMs);

            if (isRecentOrUpcoming) {
              const storageKey = `${EVENT_PROMO_CONFIG.STORAGE_KEY_PREFIX}${ev.id}_new_release`;
              const hasSeen = localStorage.getItem(storageKey);
              if (hasSeen !== 'true') {
                if (isMounted) {
                  triggerPromo({
                    event: ev,
                    tier: 'new_release',
                    form: evForm,
                  });
                }
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn('[EventLaunchSpotlight] Non-fatal promo check error:', err);
      }
    };

    const triggerPromo = (promoData: PromoState) => {
      setPromo(promoData);
      const showModal =
        EVENT_PROMO_CONFIG.DISPLAY_TYPE === 'spotlight_modal' || EVENT_PROMO_CONFIG.DISPLAY_TYPE === 'both';
      const showBanner =
        EVENT_PROMO_CONFIG.DISPLAY_TYPE === 'top_banner' || EVENT_PROMO_CONFIG.DISPLAY_TYPE === 'both';

      if (showBanner) {
        setIsBannerVisible(true);
      }

      if (showModal) {
        // 750ms gentle delay on entry so page cleanly settles first before modal appears
        const timer = setTimeout(() => {
          setIsModalOpen(true);
        }, 750);
        return () => clearTimeout(timer);
      }
    };

    evaluatePromotionalBanners();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to Escape key to dismiss modal or image lightbox cleanly
  useEffect(() => {
    if (!isModalOpen && !isImageLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isImageLightboxOpen) {
          setIsImageLightboxOpen(false);
        } else if (isModalOpen) {
          dismissModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isImageLightboxOpen, promo?.event?.id, promo?.tier]);

  const markCurrentTierAsSeen = () => {
    if (promo?.event?.id && promo.tier) {
      try {
        const storageKey = `${EVENT_PROMO_CONFIG.STORAGE_KEY_PREFIX}${promo.event.id}_${promo.tier}`;
        localStorage.setItem(storageKey, 'true');
      } catch {
        // ignore storage quota errors
      }
    }
  };

  const dismissModal = () => {
    markCurrentTierAsSeen();
    setIsModalOpen(false);
  };

  const dismissBanner = () => {
    markCurrentTierAsSeen();
    setIsBannerVisible(false);
    setIsBannerVisibleInStore(false);
    setBannerHeight(0);
  };

  const handleCtaClick = () => {
    if (!promo?.event) return;
    markCurrentTierAsSeen();
    setIsModalOpen(false);
    setIsBannerVisible(false);
    setIsBannerVisibleInStore(false);
    setBannerHeight(0);
    navigate(`/events/${promo.event.id}`);
  };

  if (!EVENT_PROMO_CONFIG.ENABLED || !promo) {
    return null;
  }

  const { event, tier, remainingSlots, totalLimit, percentFilled, timeRemainingText } = promo;
  const { details } = event;
  const bannerUrl =
    details?.banner_url ||
    details?.coverImage ||
    details?.cover_image ||
    details?.banner ||
    null;
  const category = details?.category || 'Flagship Event';
  const locationText = details?.location || details?.venue || 'Campus Venue / Online';

  // Format date cleanly
  const rawDate = details?.startTime || details?.start_time;
  let formattedDate = 'Upcoming Date';
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // fallback
    }
  }

  // Clean snippet from event description if available
  const eventSnippet = details?.description
    ? details.description.replace(/[#*`_~[\]]/g, '').trim().slice(0, 140) + (details.description.length > 140 ? '...' : '')
    : null;

  // Tier-specific Visual Style Configuration (Production Grade, Rising Color Aura, Zero Emojis)
  const tierConfig = {
    slots_low: {
      tag: 'Limited Seats',
      headline: `${remainingSlots} Seat${remainingSlots === 1 ? '' : 's'} Remaining`,
      subhead: eventSnippet || `${remainingSlots} out of ${totalLimit} total seats left for this session.`,
      badgePill: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-900',
      accentColor: '#E11D48',
      buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30',
      topBarGradient: 'from-[#4c0519] via-[#be123c] to-[#e11d48]',
      risingAura: 'radial-gradient(ellipse at 50% 135%, rgba(255, 255, 255, 0.3) 0%, rgba(244, 63, 94, 0.85) 30%, transparent 75%)',
      glowColor: 'rgba(225, 29, 72, 0.45)',
      icon: Users,
    },
    closing_soon: {
      tag: 'Closing Soon',
      headline: `Registration Closes in ${timeRemainingText || 'Less Than 2 Hours'}`,
      subhead: eventSnippet || 'Registration window is closing soon.',
      badgePill: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800',
      accentColor: '#D97706',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30',
      topBarGradient: 'from-[#451a03] via-[#c2410c] to-[#b45309]',
      risingAura: 'radial-gradient(ellipse at 50% 135%, rgba(255, 255, 255, 0.3) 0%, rgba(249, 115, 22, 0.85) 30%, transparent 75%)',
      glowColor: 'rgba(217, 119, 6, 0.45)',
      icon: Clock,
    },
    new_release: {
      tag: 'Registration Open',
      headline: 'Event Registration Open',
      subhead: eventSnippet || `Scheduled for ${formattedDate} at ${locationText}.`,
      badgePill: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-900',
      accentColor: details?.theme_color || '#2563EB',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30',
      topBarGradient: 'from-[#172554] via-[#1d4ed8] to-[#4338ca]',
      risingAura: 'radial-gradient(ellipse at 50% 135%, rgba(255, 255, 255, 0.3) 0%, rgba(99, 102, 241, 0.85) 30%, transparent 75%)',
      glowColor: 'rgba(37, 99, 235, 0.45)',
      icon: Sparkles,
    },
  }[tier];

  const TierIcon = tierConfig.icon;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. TOP ANNOUNCEMENT RIBBON BAR (Styled & Colored like the Main Cinema Card) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isBannerVisible && (
          <motion.div
            ref={bannerRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative z-40 w-full overflow-hidden border-b transition-colors duration-300 backdrop-blur-2xl"
            style={{
              background: theme === 'light'
                ? 'rgba(255, 255, 255, 0.96)'
                : 'rgba(12, 13, 18, 0.95)',
              borderColor: theme === 'light'
                ? 'rgba(226, 232, 240, 0.9)'
                : 'rgba(255, 255, 255, 0.1)',
              boxShadow: `0 8px 30px -8px ${tierConfig.glowColor}`,
            }}
          >
            {/* Google 4-Color Accent Strip (Identical to Main Banner Header) */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] z-20" />

            {/* Ambient Radial Tier Glow (Identical to Main Banner Ambience) */}
            <div
              className="absolute -top-10 left-1/4 w-80 h-24 rounded-full blur-3xl pointer-events-none opacity-25 dark:opacity-35"
              style={{ backgroundColor: tierConfig.accentColor }}
            />
            <div
              className="absolute -bottom-10 right-1/4 w-80 h-24 rounded-full blur-3xl pointer-events-none opacity-15 dark:opacity-20"
              style={{ backgroundColor: '#2563EB' }}
            />

            <div className="relative z-20 container mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
              {/* Desktop layout: Sleek single horizontal strip */}
              <div className="hidden sm:flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Event Poster Mini Showcase (Clickable with zoom preview) */}
                  {bannerUrl && (
                    <div
                      onClick={() => setIsImageLightboxOpen(true)}
                      className="relative w-12 h-8 lg:w-14 lg:h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-white/15 bg-black shrink-0 cursor-zoom-in group shadow-sm hover:scale-105 transition-transform"
                      title="Click to zoom image"
                    >
                      <img
                        src={bannerUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Status Badge Pill (Exact same style & colors as Main Banner) */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm shrink-0 ${tierConfig.badgePill}`}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: tierConfig.accentColor }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-1.5 w-1.5"
                        style={{ backgroundColor: tierConfig.accentColor }}
                      />
                    </span>
                    <TierIcon className="w-3 h-3" />
                    <span>{tierConfig.tag}</span>
                  </span>

                  {/* Category Pill */}
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hidden md:inline shrink-0">
                    {category}
                  </span>

                  <span className="text-slate-300 dark:text-zinc-700 hidden md:inline">&bull;</span>

                  {/* Event Title */}
                  <span
                    onClick={handleCtaClick}
                    className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px] truncate max-w-[280px] lg:max-w-none hover:underline cursor-pointer"
                  >
                    {event.title}
                  </span>

                  {/* Metadata Chips: Date & Venue (Matching Main Banner Chip style) */}
                  <div className="hidden lg:flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      <span>{formattedDate}</span>
                    </span>

                    {locationText && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-medium text-slate-700 dark:text-zinc-300 max-w-[180px] truncate">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span className="truncate">{locationText}</span>
                      </span>
                    )}

                    {tier === 'slots_low' && typeof remainingSlots === 'number' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                        <Users className="w-3 h-3" />
                        <span>{remainingSlots} left</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action CTA & Close Button (Exact same buttonBg & shadow as Main Banner) */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCtaClick}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all duration-200 flex items-center gap-1.5 group hover:scale-105 active:scale-95 ${tierConfig.buttonBg}`}
                  >
                    <span>View Event</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={dismissBanner}
                    aria-label="Dismiss announcement"
                    className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 border border-slate-200 dark:border-zinc-800 transition-all shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mobile layout: Compact, rich 2-tier card matching Main Banner */}
              <div className="flex sm:hidden flex-col gap-1.5">
                {/* Row 1: Poster Thumbnail + Status Badge + Category + Close button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {bannerUrl && (
                      <div
                        onClick={() => setIsImageLightboxOpen(true)}
                        className="w-9 h-7 rounded-md overflow-hidden border border-slate-200 dark:border-white/15 bg-black shrink-0 cursor-zoom-in"
                      >
                        <img
                          src={bannerUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm shrink-0 ${tierConfig.badgePill}`}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: tierConfig.accentColor }}
                        />
                        <span
                          className="relative inline-flex rounded-full h-1.5 w-1.5"
                          style={{ backgroundColor: tierConfig.accentColor }}
                        />
                      </span>
                      <TierIcon className="w-2.5 h-2.5" />
                      <span>{tierConfig.tag}</span>
                    </span>

                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate font-semibold">
                      {category}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={dismissBanner}
                    aria-label="Dismiss announcement"
                    className="p-1 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 border border-slate-200 dark:border-zinc-800 transition-colors -mr-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Row 2: Title & Date + View Event CTA Button */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {event.title}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                      {formattedDate}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCtaClick}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 shrink-0 active:scale-95 transition-all ${tierConfig.buttonBg}`}
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. PRODUCTION-GRADE SPOTLIGHT MODAL (Desktop & Mobile Adaptive)           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-spotlight-title"
          >
            {/* Backdrop Blur (Theme Sensitive) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={dismissModal}
              className="fixed inset-0 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md cursor-pointer"
            />

            {/* ------------------------------------------------------------------- */}
            {/* DESKTOP MODAL STYLE: Widescreen Horizontal Cinema Showcase          */}
            {/* ------------------------------------------------------------------- */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="hidden sm:flex relative w-full max-w-4xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-10 flex-row max-h-[88vh] backdrop-blur-2xl"
              style={{
                boxShadow: `0 25px 70px -15px ${tierConfig.glowColor}, 0 0 35px -10px ${tierConfig.glowColor}`,
              }}
            >
              {/* Subtle Ambient Radial Glow */}
              <div
                className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 dark:opacity-25"
                style={{ backgroundColor: tierConfig.accentColor }}
              />
              <div
                className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-15 dark:opacity-20"
                style={{ backgroundColor: '#2563EB' }}
              />

              {/* Google 4-Color Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] z-20" />

              {/* Close Button (X) */}
              <button
                type="button"
                onClick={dismissModal}
                aria-label="Dismiss announcement"
                className="absolute top-3.5 right-3.5 z-30 p-2 rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 border border-slate-200 dark:border-zinc-800 transition-all shadow-sm group"
              >
                <X className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>

              {/* Left Column: Full Banner Visual Showcase */}
              <div className="relative w-[46%] bg-slate-950 flex flex-col justify-between p-4 shrink-0 overflow-hidden border-r border-slate-200 dark:border-zinc-800/80">
                {/* Floating Top Header Badges */}
                <div className="relative z-20 flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${tierConfig.badgePill}`}
                  >
                    <TierIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tierConfig.tag}</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 dark:text-zinc-400">
                    {category}
                  </span>
                </div>

                {/* Banner Display: Ambient Blur Layer + Uncropped Full Banner + Zoom In Action */}
                {bannerUrl && (
                  <div
                    onClick={() => setIsImageLightboxOpen(true)}
                    className="relative w-full flex-1 min-h-[260px] rounded-2xl overflow-hidden flex items-center justify-center my-2 bg-slate-900/90 border border-white/10 group cursor-zoom-in"
                  >
                    {/* Ambient Glow Replica */}
                    <img
                      src={bannerUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none select-none"
                    />
                    {/* Full Banner Image (100% visible, no ugly cropping) */}
                    <img
                      src={bannerUrl}
                      alt={event.title}
                      className="relative z-10 w-full h-full max-h-[340px] object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-[1.03]"
                    />

                    {/* Zoom hint badge (matches Events page experience) */}
                    <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-lg">
                      <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                      <span>Click to zoom</span>
                    </div>

                    {/* Bottom Category pill */}
                    <div className="absolute bottom-2.5 left-2.5 z-20">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-black/60 text-white backdrop-blur-md border border-white/20">
                        {category}
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtitle Footnote */}
                <p className="text-[11px] text-center text-slate-400 dark:text-zinc-400 font-medium truncate pt-1 relative z-20">
                  GDG Campus Community
                </p>
              </div>

              {/* Right Column: Information, Urgency Meter & CTAs */}
              <div className="p-6 lg:p-7 flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tierConfig.accentColor }} />
                      {tierConfig.tag}
                    </span>
                  </div>

                  {/* Title & Subhead */}
                  <div>
                    <h3
                      id="event-spotlight-title"
                      className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug line-clamp-2"
                    >
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 font-medium">
                      {tierConfig.subhead}
                    </p>
                  </div>

                  {/* Metadata Chips: Date & Venue */}
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="truncate max-w-[200px]">{locationText}</span>
                    </div>
                  </div>

                  {/* DYNAMIC TIER FEATURE BLOCK (Capacity Bar / Countdown / Details) */}
                  {tier === 'slots_low' && typeof remainingSlots === 'number' && typeof totalLimit === 'number' && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Registration Capacity
                        </span>
                        <span className="font-mono text-[11px] bg-rose-200/60 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
                          {remainingSlots} of {totalLimit} slots left
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-rose-200 dark:bg-rose-900/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentFilled || 90}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {tier === 'closing_soon' && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <Timer className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          Registration Closing Soon
                        </p>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 truncate">
                          Registration ends in {timeRemainingText || 'less than 2 hours'}.
                        </p>
                      </div>
                    </div>
                  )}

                  {tier === 'new_release' && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-zinc-300 font-medium">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">Registration Open</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{category}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button (Dismissed only via top-right X) */}
                <div className="pt-5 mt-4 border-t border-slate-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={handleCtaClick}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 group ${tierConfig.buttonBg}`}
                  >
                    <span>
                      {tier === 'slots_low'
                        ? 'Register Now'
                        : tier === 'closing_soon'
                        ? 'Complete Registration'
                        : 'View Event & Register'}
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ------------------------------------------------------------------- */}
            {/* MOBILE MODAL STYLE: Centered Event Spotlight Card                  */}
            {/* ------------------------------------------------------------------- */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="sm:hidden relative w-full max-w-[365px] bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 z-10 overflow-hidden flex flex-col max-h-[92vh] my-auto"
              style={{
                boxShadow: `0 20px 60px -10px ${tierConfig.glowColor}, 0 0 30px -10px ${tierConfig.glowColor}`,
              }}
            >
              {/* Google 4-Color Accent Strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] shrink-0" />

              {/* Mobile Header Bar */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 shrink-0">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[240px]">
                  {category}
                </span>

                <button
                  type="button"
                  onClick={dismissModal}
                  aria-label="Close"
                  className="p-1 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1">
                {/* Full Banner Display: Event's uploaded image only + Zoom In Action */}
                {bannerUrl && (
                  <div
                    onClick={() => setIsImageLightboxOpen(true)}
                    className="relative w-full aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-zinc-800/80 group cursor-zoom-in"
                  >
                    {/* Ambient Glow Backdrop */}
                    <img
                      src={bannerUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none select-none"
                    />
                    {/* Full Banner (Uncropped, Complete Visual) */}
                    <img
                      src={bannerUrl}
                      alt={event.title}
                      className="relative z-10 w-full h-full object-contain drop-shadow-md select-none"
                    />

                    {/* Mobile Zoom Badge */}
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold border border-white/20 shadow-md">
                      <ZoomIn className="w-3 h-3 text-blue-400" />
                      <span>Tap to zoom</span>
                    </div>

                    {/* Floating Tier Badge on Banner */}
                    <div className="absolute bottom-2 left-2 z-20">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md bg-black/75 text-white border border-white/20 shadow-sm`}>
                        <TierIcon className="w-3 h-3 text-amber-400" />
                        <span>{tierConfig.tag}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 font-medium">
                      {tierConfig.subhead}
                    </p>
                  </div>

                  {/* Date & Venue Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {formattedDate}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-medium text-slate-700 dark:text-zinc-300 truncate max-w-[170px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {locationText}
                    </span>
                  </div>

                  {/* Dynamic Mobile Urgency Meter */}
                  {tier === 'slots_low' && typeof remainingSlots === 'number' && typeof totalLimit === 'number' && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                        <span>Only {remainingSlots} Slots Left!</span>
                        <span className="font-mono text-[10px]">{percentFilled}% Filled</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-rose-200 dark:bg-rose-900/50 overflow-hidden">
                        <div
                          style={{ width: `${percentFilled || 90}%` }}
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {tier === 'closing_soon' && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-2">
                      <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        Closes in {timeRemainingText} &bull; Register now
                      </p>
                    </div>
                  )}

                  {tier === 'new_release' && (
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 truncate">
                        Registration open for this event
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Action Footer (Dismissed only via top-right X) */}
              <div className="p-3.5 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className={`w-full h-12 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${tierConfig.buttonBg}`}
                >
                  <span>
                    {tier === 'slots_low'
                      ? 'Register Now'
                      : tier === 'closing_soon'
                      ? 'Complete Registration'
                      : 'View Event & Register'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. BANNER IMAGE LIGHTBOX ZOOM MODAL (Matches Events Page)                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isImageLightboxOpen && bannerUrl && (
          <motion.div
            key="promo-banner-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
            onClick={() => setIsImageLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsImageLightboxOpen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs font-mono bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-2 z-20">
              <span>Press <kbd className="bg-white/15 rounded px-1.5 py-0.5 font-bold">Esc</kbd> or click anywhere to close</span>
            </div>

            <motion.img
              key="promo-lightbox-img"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              src={bannerUrl}
              alt={event.title}
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain border border-white/10 cursor-zoom-out"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
