import { apiRequest } from '@/lib/api';
import type { ClubEvent, EventDetails } from '@/lib/formUtils';
import { clearFormsSummaryCache } from '@/services/formService';

export interface EventsResponse {
  message: string;
  count: number;
  events: ClubEvent[];
}

export interface SingleEventResponse {
  message: string;
  event: ClubEvent;
}

export interface CalendarReminderResponse {
  success?: boolean;
  connected: boolean;
  action_required?: 'CONNECT_GOOGLE_CALENDAR' | 'RECONNECT_GOOGLE_CALENDAR';
  message: string;
  calendar_event_id?: string;
  calendar_event_link?: string;
  connect_endpoint?: string;
}

export interface GoogleLinkStatusResponse {
  connected: boolean;
  has_refresh_token: boolean;
  expires_at: string | null;
}

export interface GoogleLinkUrlResponse {
  message: string;
  url: string;
  provider: string;
  scopes: string[];
}

// Low-egress client cache (60s TTL) to prevent repeated network trips
let cachedEventsList: { data: EventsResponse; expiresAt: number } | null = null;
let inFlightEventsList: Promise<EventsResponse> | null = null;
const cachedSingleEvents = new Map<string, { data: SingleEventResponse; expiresAt: number }>();

export const eventService = {
  async listEvents(forceRefresh = false): Promise<EventsResponse> {
    if (!forceRefresh && cachedEventsList && cachedEventsList.expiresAt > Date.now()) {
      return cachedEventsList.data;
    }

    if (!forceRefresh && inFlightEventsList) {
      return inFlightEventsList;
    }

    inFlightEventsList = (async () => {
      try {
        const data = await apiRequest<EventsResponse>('/api/events', {
          method: 'GET',
        });

        cachedEventsList = {
          data,
          expiresAt: Date.now() + 300 * 1000,
        };

        return data;
      } finally {
        inFlightEventsList = null;
      }
    })();

    return inFlightEventsList;
  },

  async getEventById(id: string, forceRefresh = false): Promise<SingleEventResponse> {
    const cached = cachedSingleEvents.get(id);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const data = await apiRequest<SingleEventResponse>(`/api/events/${id}`, {
      method: 'GET',
    });

    cachedSingleEvents.set(id, {
      data,
      expiresAt: Date.now() + 300 * 1000,
    });

    return data;
  },

  async createEvent(data: { title: string; details: EventDetails }): Promise<SingleEventResponse> {
    const res = await apiRequest<SingleEventResponse>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    cachedEventsList = null;
    clearFormsSummaryCache();
    return res;
  },

  async updateEvent(
    id: string,
    data: { title?: string; details?: EventDetails }
  ): Promise<SingleEventResponse> {
    const res = await apiRequest<SingleEventResponse>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    cachedEventsList = null;
    cachedSingleEvents.delete(id);
    clearFormsSummaryCache();
    return res;
  },

  async deleteEvent(id: string): Promise<{ message: string; deleted_event: ClubEvent }> {
    const res = await apiRequest<{ message: string; deleted_event: ClubEvent }>(`/api/events/${id}`, {
      method: 'DELETE',
    });
    cachedEventsList = null;
    cachedSingleEvents.delete(id);
    clearFormsSummaryCache();
    return res;
  },

  async createCalendarReminder(eventId: string): Promise<CalendarReminderResponse> {
    return apiRequest<CalendarReminderResponse>(`/api/events/${eventId}/calendar-reminder`, {
      method: 'POST',
    });
  },

  async createEventReminder(eventId: string): Promise<CalendarReminderResponse> {
    return this.createCalendarReminder(eventId);
  },

  async getGoogleLinkUrl(role?: string, scope?: string): Promise<GoogleLinkUrlResponse> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (scope) params.append('scope', scope);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<GoogleLinkUrlResponse>(`/api/auth/google/link${queryString}`, {
      method: 'GET',
    });
  },

  async getGoogleLinkStatus(): Promise<GoogleLinkStatusResponse> {
    return apiRequest<GoogleLinkStatusResponse>('/api/auth/google/status', {
      method: 'GET',
    });
  },

  async getMyCalendarEvents(): Promise<{ event_ids: string[]; count: number }> {
    return apiRequest<{ event_ids: string[]; count: number }>(
      '/api/events/calendar-reminders/me',
      { method: 'GET' }
    );
  },

  async syncSheetForAdmin(formId: string): Promise<{ message: string; rows_synced: number }> {
    return apiRequest<{ message: string; rows_synced: number }>(
      `/api/forms/${formId}/sync-sheet`,
      { method: 'POST' }
    );
  },

  async uploadPoster(
    file: File,
    eventId?: string
  ): Promise<{ message: string; url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (eventId) {
      formData.append('eventId', eventId);
    }

    return apiRequest<{ message: string; url: string; path: string }>('/api/events/upload-poster', {
      method: 'POST',
      body: formData,
    });
  },
};

