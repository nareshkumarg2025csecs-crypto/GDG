export type RegistrationState = 'open' | 'registered' | 'closed' | 'hidden';

export type EventFieldType = 'markdown' | 'text' | 'key_value' | 'link' | 'list';

export interface EventSection {
  id: string;
  title: string;
  type?: EventFieldType;
  content: string;
  url?: string;
  items?: string[];
}

export interface EventDetails {
  description?: string;
  location?: string;
  venue?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  status?: 'draft' | 'published';
  published?: boolean;
  category?: string;
  capacity?: number | string;
  coverImage?: string;
  cover_image?: string;
  banner_url?: string;
  theme_color?: string;
  custom_sections?: EventSection[];
  tags?: string[];
  [key: string]: any;
}

export interface ClubEvent {
  id: string;
  title: string;
  details: EventDetails;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface FormSchema {
  fields: FormField[];
  expires_at?: string | null;
  description?: string;
  [key: string]: any;
}

export interface EventForm {
  id: string;
  event_id: string;
  title: string;
  schema: FormSchema;
  expires_at?: string | null;
  created_by?: string;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  user_id: string;
  answers: Record<string, any>;
  attended?: boolean;
  submitted_at: string;
}

/**
 * Computes the unified state of an event's registration action.
 * Priority:
 * 1. If explicit manual closed state (isOpen === false), return "closed" (or "registered" if already registered)
 * 2. Hide registration completely if now > expires_at + 24 hours
 * 3. If registered, show "registered" badge
 * 4. If past deadline, show "closed" badge
 * 5. Otherwise, show "open" (Register / Fill Form active)
 */
export function getEventRegistrationState(params: {
  isRegistered: boolean;
  isOpen?: boolean | null;
  expiresAt?: string | null;
  now?: Date;
}): RegistrationState {
  const { isRegistered, isOpen, expiresAt, now = new Date() } = params;

  // 1. Explicit manual closed toggle set by admin
  if (isOpen === false) {
    return 'closed';
  }

  // 2. Check deadline expiration: if deadline is reached, show closed (overrides registered label)
  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    if (!isNaN(expiryDate.getTime())) {
      const hideThreshold = new Date(expiryDate.getTime() + 24 * 60 * 60 * 1000);

      // If more than 24 hours past expiry, completely hide registration UI
      if (now > hideThreshold) {
        return 'hidden';
      }

      // If past expiry/deadline reached, show closed badge
      if (now > expiryDate) {
        return 'closed';
      }
    }
  }

  // 3. If within deadline and user has already submitted
  if (isRegistered) {
    return 'registered';
  }

  return 'open';
}

/**
 * Formats ISO date string to a human-readable date.
 */
export function formatEventDate(isoDate?: string | null): string {
  if (!isoDate) return 'Date TBA';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'Date TBA';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Date TBA';
  }
}

/**
 * Formats a start/end date pair smartly:
 * - Same calendar day → shows single date (e.g. "Sat, Aug 23, 2026")
 * - Different calendar days → shows "From [date] to [date]"
 */
export function formatEventDateRange(
  startIso?: string | null,
  endIso?: string | null
): string {
  if (!startIso) return 'Date TBA';
  try {
    const start = new Date(startIso);
    if (isNaN(start.getTime())) return 'Date TBA';

    const formatOpts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };

    const startStr = start.toLocaleDateString('en-US', formatOpts);

    if (!endIso) return startStr;

    const end = new Date(endIso);
    if (isNaN(end.getTime())) return startStr;

    // Compare calendar day (year+month+day)
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (sameDay) return startStr;

    const endStr = end.toLocaleDateString('en-US', formatOpts);
    return `From ${startStr} to ${endStr}`;
  } catch {
    return 'Date TBA';
  }
}

/**
 * Formats start and end times into a readable range (e.g. "10:00 AM - 12:30 PM").
 */
export function formatEventTimeRange(startIso?: string | null, endIso?: string | null): string {
  if (!startIso) return 'Time TBA';
  try {
    const start = new Date(startIso);
    const startTimeStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (!endIso) return startTimeStr;

    const end = new Date(endIso);
    const endTimeStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${startTimeStr} – ${endTimeStr}`;
  } catch {
    return 'Time TBA';
  }
}

/**
 * Strips raw Markdown syntax (headers, bold, italics, links, lists) into clean readable text for card teasers.
 */
export function stripMarkdown(markdown?: string | null): string {
  if (!markdown) return '';
  return markdown
    .replace(/#{1,6}\s+/g, '') // remove headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
    .replace(/\*(.*?)\*/g, '$1') // remove italics
    .replace(/`{1,3}(.*?)`{1,3}/gs, '$1') // remove inline/fenced code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove markdown links
    .replace(/^\s*[-*+]\s+/gm, '• ') // replace list dashes with bullet dots
    .replace(/^\s*>\s+/gm, '') // remove blockquotes
    .replace(/\n+/g, ' ') // collapse multi-lines
    .replace(/\s{2,}/g, ' ')
    .trim();
}
