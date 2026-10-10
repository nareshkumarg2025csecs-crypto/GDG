import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  ArrowRight,
  CalendarPlus,
  CalendarCheck,
  QrCode,
  CheckCircle2,
  Sparkles,
  Timer,
} from 'lucide-react';
import {
  type ClubEvent,
  type EventForm,
  getEventRegistrationState,
  formatEventDateRange,
  formatEventTimeRange,
  stripMarkdown,
  calculateRemainingTime,
  parseEventDate,
} from '@/lib/formUtils';

interface EventCardProps {
  event: ClubEvent;
  index: number;
  attachedForm?: EventForm | null;
  isRegistered?: boolean;
  isAddedToCal?: boolean;
  isCalendarProcessing?: boolean;
  isAuthenticated: boolean;
  onAddToCalendar: (eventId: string) => void;
  onShareQr: (event: { title: string; url: string }) => void;
  onNavigate: () => void;
}

const DEFAULT_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

export const EventCard: React.FC<EventCardProps> = ({
  event,
  index,
  attachedForm,
  isRegistered = false,
  isAddedToCal = false,
  isCalendarProcessing = false,
  isAuthenticated,
  onAddToCalendar,
  onShareQr,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const details = event.details || {};

  const startDate = details.startTime || details.start_time;
  const endDate = details.endTime || details.end_time;

  // Determine if event has ended
  const eventEnd = endDate || startDate;
  const isEnded = eventEnd ? new Date() > new Date(eventEnd) : false;

  // Upcoming start countdown
  const startDateObj = startDate ? parseEventDate(startDate) : null;
  const isUpcomingStart = !isEnded && startDateObj ? startDateObj.getTime() > Date.now() : false;
  const startCountdown = isUpcomingStart ? calculateRemainingTime(startDate) : null;
  const formattedCountdown = startCountdown && !startCountdown.isPast
    ? startCountdown.days > 0
      ? `${startCountdown.days}d ${startCountdown.hours}h`
      : startCountdown.hours > 0
      ? `${startCountdown.hours}h ${startCountdown.minutes}m`
      : `${startCountdown.minutes}m`
    : '';

  const opensAt = attachedForm?.opens_at || attachedForm?.schema?.opens_at;
  const regState = attachedForm
    ? getEventRegistrationState({
        isRegistered,
        isOpen: attachedForm.schema?.is_open !== false && details.is_registration_open !== false,
        opensAt,
        expiresAt: attachedForm.expires_at || attachedForm.schema?.expires_at,
        isFull: attachedForm.is_full,
        submissionLimit: attachedForm.submission_limit || attachedForm.schema?.submission_limit,
        submissionCount: attachedForm.submission_count,
      })
    : 'hidden';

  const accentColor = details.theme_color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  const banner = details.thumbnail_url || details.banner_url || details.coverImage || details.cover_image;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
      className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card text-card-foreground shadow-xs hover:shadow-xl hover:border-border transition-all duration-300 overflow-hidden"
    >
      {/* 16:9 Media Banner Section */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/40">
        {banner ? (
          <img
            src={banner}
            alt={event.title}
            loading={index < 3 ? 'eager' : 'lazy'}
            decoding="async"
            {...(index === 0 ? { fetchpriority: 'high' } : {})}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className="w-full h-full p-6 flex flex-col justify-between"
            style={{
              background: `radial-gradient(circle at 80% 20%, ${accentColor}30 0%, transparent 80%)`,
            }}
          >
            <div className="flex justify-end">
              <span className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center border border-border/60">
                <Sparkles className="w-4 h-4 text-foreground/70" />
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                GDG Campus Event
              </span>
              <span className="text-lg font-display font-bold text-foreground line-clamp-1">
                {event.title}
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

        {/* Top Badges (Category & Registration Status) */}
        <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between gap-2">
          {/* Category Pill */}
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono uppercase backdrop-blur-md shadow-xs"
            style={{
              backgroundColor: `${accentColor}dd`,
              color: '#ffffff',
            }}
          >
            {details.category || 'Workshop'}
          </span>

          {/* Registration Status Pill */}
          <div>
            {regState === 'registered' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-google-green text-white font-mono shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Registered</span>
              </span>
            )}

            {regState === 'upcoming' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white font-mono shadow-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Opens in {calculateRemainingTime(opensAt).formattedShort}</span>
              </span>
            )}

            {regState === 'full' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white font-mono shadow-xs">
                <Users className="w-3.5 h-3.5" />
                <span>Slots Full</span>
              </span>
            )}

            {isEnded && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white/90 border border-white/20 font-mono backdrop-blur-sm">
                <span>Concluded</span>
              </span>
            )}

            {!isEnded && regState === 'closed' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-google-yellow text-black font-mono shadow-xs">
                <span>Closed</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Format Badge (Individual vs Team) & Start Countdown */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
          {details.participation_type ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono uppercase bg-black/75 backdrop-blur-md text-white border border-white/20">
              {details.participation_type.toLowerCase() === 'team' ? (
                <>
                  <Users className="w-3 h-3 text-google-yellow" />
                  <span>Team Event</span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-google-blue" />
                  <span>Individual</span>
                </>
              )}
            </span>
          ) : <div />}

          {isUpcomingStart && formattedCountdown && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-black/80 backdrop-blur-md text-white border border-google-blue/40 shadow-xs">
              <Timer className="w-3 h-3 text-google-yellow animate-pulse shrink-0" />
              <span>Starts in {formattedCountdown}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Date & Time Header Row */}
          <div className="flex items-center gap-2 text-xs font-semibold text-google-blue mb-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5 text-google-blue shrink-0" />
            <span>{formatEventDateRange(startDate, endDate)}</span>
            <span className="text-muted-foreground/60">•</span>
            <Clock className="w-3.5 h-3.5 text-google-yellow shrink-0" />
            <span className="text-muted-foreground">{formatEventTimeRange(startDate, endDate)}</span>
          </div>

          {/* Event Title */}
          <Link
            to={`/events/${event.id}`}
            onClick={onNavigate}
            className="group/title block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue rounded-lg"
          >
            <h3 className="text-lg sm:text-xl font-display font-bold text-foreground group-hover/title:text-google-blue transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>
          </Link>

          {/* Description Snippet */}
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {stripMarkdown(
              details.description ||
              (details.custom_sections && details.custom_sections[0]?.content) ||
              'Join us for this exciting Google Developer Group campus event.'
            )}
          </p>
        </div>

        {/* Metadata Details Row (Location & Spots) */}
        <div className="space-y-1.5 pt-3 border-t border-border/60 text-xs text-muted-foreground">
          {/* Location / Venue */}
          {(details.location || details.venue) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-google-red shrink-0" />
              <span className="truncate font-medium text-foreground/90">
                {details.location || details.venue}
              </span>
            </div>
          )}

          {/* Registration Telemetry */}
          {attachedForm && (attachedForm.show_submission_count !== false && attachedForm.schema?.show_submission_count !== false) && (
            <div className="flex items-center gap-2 pt-0.5">
              <Users className="w-3.5 h-3.5 text-google-green shrink-0" />
              <span>
                {(() => {
                  const count = attachedForm.submission_count ?? 0;
                  const limit = attachedForm.submission_limit || attachedForm.schema?.submission_limit;
                  if (limit && Number(limit) > 0) {
                    const remaining = Math.max(0, Number(limit) - count);
                    return (
                      <>
                        <strong className="text-foreground font-semibold">{count}</strong> registered
                        <span className="text-muted-foreground mx-1">•</span>
                        <span className={remaining === 0 ? 'text-rose-500 font-semibold' : 'text-google-green font-semibold'}>
                          {remaining === 0 ? 'No spots left' : `${remaining} spot${remaining === 1 ? '' : 's'} left`}
                        </span>
                      </>
                    );
                  }
                  return (
                    <>
                      <strong className="text-foreground font-semibold">{count}</strong> registered
                      <span className="text-muted-foreground mx-1">•</span>
                      <span>Unlimited spots</span>
                    </>
                  );
                })()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-5 py-3.5 bg-muted/30 border-t border-border/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Add to Google Calendar Action */}
          {isAddedToCal ? (
            <span className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-google-green/30 bg-google-green/10 text-google-green text-xs font-semibold shadow-xs">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Added</span>
            </span>
          ) : isEnded ? (
            <span className="text-[11px] font-mono text-muted-foreground font-semibold px-2.5 py-1 rounded-lg bg-muted/60">
              Concluded
            </span>
          ) : regState !== 'closed' ? (
            <button
              type="button"
              disabled={isCalendarProcessing}
              onClick={() => onAddToCalendar(event.id)}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Add to Google Calendar"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-google-yellow" />
              <span>{isCalendarProcessing ? 'Syncing...' : 'Add to Cal'}</span>
            </button>
          ) : (
            <span className="text-[11px] font-mono text-muted-foreground font-semibold px-2.5 py-1 rounded-lg bg-muted/60">
              Closed
            </span>
          )}

          {/* QR Code Share Button (44px min touch target) */}
          <button
            type="button"
            onClick={() =>
              onShareQr({
                title: event.title,
                url: `${window.location.origin}/events/${event.id}`,
              })
            }
            className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
            title="Share event as QR Code"
            aria-label="Share as QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        {/* Primary CTA (Register / Details) */}
        <div>
          {attachedForm && regState === 'open' && !isEnded ? (
            isAuthenticated ? (
              <Link
                to={`/events/${event.id}/form`}
                onClick={onNavigate}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <span>Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onNavigate();
                  navigate(`/login?redirect=${encodeURIComponent(`/events/${event.id}/form`)}`);
                }}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <Link
              to={`/events/${event.id}`}
              onClick={onNavigate}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border/80 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
};
