import { apiRequest } from '@/lib/api';
import type { ClubEvent, EventDetails } from '@/lib/formUtils';

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

export const eventService = {
  async listEvents(): Promise<EventsResponse> {
    return apiRequest<EventsResponse>('/api/events', {
      method: 'GET',
    });
  },

  async getEventById(id: string): Promise<SingleEventResponse> {
    return apiRequest<SingleEventResponse>(`/api/events/${id}`, {
      method: 'GET',
    });
  },

  async createEvent(data: { title: string; details: EventDetails }): Promise<SingleEventResponse> {
    return apiRequest<SingleEventResponse>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEvent(
    id: string,
    data: { title?: string; details?: EventDetails }
  ): Promise<SingleEventResponse> {
    return apiRequest<SingleEventResponse>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEvent(id: string): Promise<{ message: string; deleted_event: ClubEvent }> {
    return apiRequest<{ message: string; deleted_event: ClubEvent }>(`/api/events/${id}`, {
      method: 'DELETE',
    });
  },

  async createCalendarReminder(eventId: string): Promise<CalendarReminderResponse> {
    return apiRequest<CalendarReminderResponse>(`/api/events/${eventId}/calendar-reminder`, {
      method: 'POST',
    });
  },

  async createEventReminder(eventId: string): Promise<CalendarReminderResponse> {
    return this.createCalendarReminder(eventId);
  },

  async getGoogleLinkUrl(): Promise<GoogleLinkUrlResponse> {
    return apiRequest<GoogleLinkUrlResponse>('/api/auth/google/link', {
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
};
