/**
 * Utility functions for URL slugs (human-readable identifiers)
 * Examples:
 *   "Elysium" -> "elysium"
 *   "Web Dev Workshop 2026!" -> "web-dev-workshop-2026"
 *   "AI / ML Bootcamp" -> "ai-ml-bootcamp"
 */

export interface SluggableEvent {
  id?: string | number;
  title?: string;
  [key: string]: any;
}

/**
 * Converts a text or event title to a URL-safe lowercase slug.
 * All spaces and special punctuation are converted to single hyphens.
 */
export function slugify(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-')     // Replace spaces, underscores, and consecutive hyphens with a single hyphen
    .replace(/^-+|-+$/g, '');     // Trim leading/trailing hyphens
}

/**
 * Generates the URL slug for an event.
 * Falls back to the event's raw ID if no valid title is available.
 */
export function getEventSlug(eventOrTitle?: SluggableEvent | string | null): string {
  if (!eventOrTitle) return '';
  if (typeof eventOrTitle === 'string') {
    return slugify(eventOrTitle) || eventOrTitle;
  }

  const title = eventOrTitle.title;
  const id = eventOrTitle.id ? String(eventOrTitle.id) : '';

  if (title) {
    const slug = slugify(title);
    if (slug) return slug;
  }

  return id;
}

/**
 * Checks if an event matches a given identifier (which can be a slug OR a raw ID).
 */
export function isEventMatch(event: SluggableEvent, identifier: string): boolean {
  if (!event || !identifier) return false;
  const normalizedInput = identifier.toLowerCase().trim();
  const eventIdStr = event.id ? String(event.id).toLowerCase().trim() : '';

  if (eventIdStr && eventIdStr === normalizedInput) {
    return true;
  }

  const slug = getEventSlug(event);
  if (slug && slug.toLowerCase() === normalizedInput) {
    return true;
  }

  // Also check direct title comparison if slugify differences exist
  if (event.title && slugify(event.title) === normalizedInput) {
    return true;
  }

  return false;
}
