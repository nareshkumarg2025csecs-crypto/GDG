/**
 * Global Configuration for Event Promotion & Urgency Banner System.
 *
 * Production-grade launch & scarcity announcement billboard.
 *
 * ⚙️ CONTROLS:
 * - Set `ENABLED: true` to activate promotional banners; `false` to turn off completely.
 * - Set specific banner triggers (New Release, Closing Soon, Slots Low) to true/false.
 * - Each banner tier is displayed exactly ONCE per user per event.
 * - Automatically hides when the event has started or when registration is closed.
 * - Zero emojis; 100% theme-adaptive with Lucide vector icons.
 */
export const EVENT_PROMO_CONFIG = {
  /**
   * Master Toggle:
   * true  => Promotional banner system is ACTIVE.
   * false => Promotional banner system is COMPLETELY DISABLED (zero egress/render).
   */
  ENABLED: true,

  /**
   * Format of presentation:
   * - 'spotlight_modal' => Centered high-impact billboard modal on visit (once per user).
   * - 'top_banner'      => Sleek top header announcement bar.
   * - 'both'            => Launch modal first, with top ticker bar.
   */
  DISPLAY_TYPE: 'both' as 'spotlight_modal' | 'top_banner' | 'both',

  /**
   * Banner Tier 1: New Event Release Spotlight
   * Shows when a new event is published within the last N days.
   */
  ENABLE_NEW_RELEASE_BANNER: true,
  MAX_EVENT_AGE_DAYS: 90,

  /**
   * Banner Tier 2: Registration Closing Soon Urgency Banner
   * Shows when registration deadline (or event start) is within this many hours.
   */
  ENABLE_CLOSING_SOON_BANNER: true,
  CLOSING_SOON_HOURS: 2, // Trigger when <= 2 hours remaining before registration closes

  /**
   * Banner Tier 3: Limited Capacity / Low Slots Urgency Banner
   * Shows when a form limit is configured and remaining slots fall at or below this threshold.
   */
  ENABLE_SLOTS_LOW_BANNER: true,
  SLOTS_LOW_THRESHOLD: 15, // Trigger when <= 15 slots remaining

  /**
   * Optional: Pin a specific event by UUID to always promote that event.
   * Set to `null` to automatically evaluate the latest active published event.
   */
  PINNED_EVENT_ID: null as string | null,

  /**
   * Storage prefix for tracking one-time view per user per tier.
   */
  STORAGE_KEY_PREFIX: 'gdg_event_banner_',
};
