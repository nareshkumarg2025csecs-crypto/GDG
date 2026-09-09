import { DEPARTMENT_OPTIONS, YEAR_OF_STUDY_OPTIONS } from './profileConstants';

export type RegistrationState = 'open' | 'registered' | 'closed' | 'full' | 'hidden' | 'upcoming';

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

export const DEFAULT_FORM_FIELDS: FormField[] = [
  {
    id: 'f_name',
    name: 'full_name',
    label: 'Full Name',
    type: 'text',
    required: true,
    placeholder: 'Enter your full name',
  },
  {
    id: 'f_email',
    name: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'your.name@example.com',
  },
  {
    id: 'f_phone',
    name: 'phone_number',
    label: 'Phone Number',
    type: 'text',
    required: true,
    placeholder: 'e.g. +91 9876543210',
  },
  {
    id: 'f_roll_no',
    name: 'roll_no',
    label: 'Roll Number',
    type: 'text',
    required: true,
    placeholder: 'e.g. 240801202',
  },
  {
    id: 'f_department',
    name: 'department',
    label: 'Department',
    type: 'select',
    required: true,
    placeholder: 'Select your department',
    options: [...DEPARTMENT_OPTIONS],
  },
  {
    id: 'f_year',
    name: 'year_of_study',
    label: 'Year of Study',
    type: 'select',
    required: true,
    placeholder: 'Select year of study',
    options: [...YEAR_OF_STUDY_OPTIONS],
  },
];

export interface FormSchema {
  fields: FormField[];
  opens_at?: string | null;
  expires_at?: string | null;
  submission_limit?: number | null;
  show_submission_count?: boolean;
  description?: string;
  [key: string]: any;
}

export interface EventForm {
  id: string;
  event_id: string;
  title: string;
  schema: FormSchema;
  opens_at?: string | null;
  is_upcoming?: boolean;
  expires_at?: string | null;
  submission_limit?: number | null;
  show_submission_count?: boolean;
  submission_count?: number;
  is_full?: boolean;
  created_by?: string;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  user_id: string;
  answers: Record<string, any>;
  attended?: boolean;
  ticket_id?: string;
  email_sent?: boolean;
  submitted_at: string;
}

/**
 * Computes the unified state of an event's registration action.
 * Priority:
 * 1. If explicit manual closed state (isOpen === false), return "closed"
 * 2. Hide registration completely if now > expires_at + 24 hours
 * 3. If past deadline, show "closed" badge
 * 4. If registered, show "registered" badge (user can view ticket pass)
 * 5. If opening time (opens_at) is set and in the future, return "upcoming"
 * 6. If event capacity / slot limit is reached, show "full"
 * 7. Otherwise, show "open" (Register / Fill Form active)
 */
export function getEventRegistrationState(params: {
  isRegistered: boolean;
  isOpen?: boolean | null;
  opensAt?: string | null;
  expiresAt?: string | null;
  isFull?: boolean | null;
  submissionLimit?: number | null;
  submissionCount?: number | null;
  now?: Date;
}): RegistrationState {
  const { isRegistered, isOpen, opensAt, expiresAt, isFull, submissionLimit, submissionCount, now = new Date() } = params;

  // 1. Explicit manual closed toggle set by admin
  if (isOpen === false) {
    return 'closed';
  }

  // 2. Check deadline expiration: if deadline is reached, show closed
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

  // 3. If user has already submitted, prioritize registered state so they can view ticket pass
  if (isRegistered) {
    return 'registered';
  }

  // 4. Check if registration has not opened yet (scheduled future opens_at)
  if (opensAt) {
    const openDate = new Date(opensAt);
    if (!isNaN(openDate.getTime()) && now < openDate) {
      return 'upcoming';
    }
  }

  // 5. Check if event capacity / slot limit is full
  const reachedCapacity = isFull === true || (
    submissionLimit !== undefined &&
    submissionLimit !== null &&
    submissionLimit > 0 &&
    submissionCount !== undefined &&
    submissionCount !== null &&
    submissionCount >= submissionLimit
  );

  if (reachedCapacity) {
    return 'full';
  }

  return 'open';
}

export interface RemainingCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
  formatted: string;
  formattedShort: string;
}

/**
 * Calculates live remaining countdown time until a target ISO datetime.
 */
export function calculateRemainingTime(targetIso?: string | null, now = new Date()): RemainingCountdown {
  if (!targetIso) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isPast: true,
      formatted: 'Passed',
      formattedShort: 'Passed',
    };
  }

  const target = new Date(targetIso);
  if (isNaN(target.getTime())) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isPast: true,
      formatted: 'Invalid date',
      formattedShort: 'Invalid date',
    };
  }

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isPast: true,
      formatted: 'Now',
      formattedShort: 'Now',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  let formattedShort = '';
  if (days > 0) {
    formattedShort = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formattedShort = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formattedShort = `${minutes}m`;
  } else {
    formattedShort = `${seconds}s`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diffMs,
    isPast: false,
    formatted,
    formattedShort,
  };
}

/**
 * Safely parses an event date/time string without unwanted UTC timezone shifts.
 * Strips trailing 'Z' if present so that wall-clock times entered by the admin
 * (e.g. 12:00 PM) are displayed as entered, not shifted by local timezone offsets.
 */
export function parseEventDate(isoDate?: string | null): Date | null {
  if (!isoDate) return null;
  try {
    const clean = typeof isoDate === 'string' ? isoDate.replace(/Z$/i, '') : isoDate;
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Formats ISO date string to a human-readable date.
 */
export function formatEventDate(isoDate?: string | null): string {
  if (!isoDate) return 'Date TBA';
  try {
    const d = parseEventDate(isoDate);
    if (!d) return 'Date TBA';
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
    const start = parseEventDate(startIso);
    if (!start) return 'Date TBA';

    const formatOpts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };

    const startStr = start.toLocaleDateString('en-US', formatOpts);

    if (!endIso) return startStr;

    const end = parseEventDate(endIso);
    if (!end) return startStr;

    // Compare calendar day (year+month+day)
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (sameDay) return startStr;

    const endStr = end.toLocaleDateString('en-US', formatOpts);
    return `${startStr} - ${endStr}`;
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
    const start = parseEventDate(startIso);
    if (!start) return 'Time TBA';

    const startTimeStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (!endIso) return startTimeStr;

    const end = parseEventDate(endIso);
    if (!end) return startTimeStr;

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
