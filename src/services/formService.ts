import { apiRequest } from '@/lib/api';
import type { EventForm, FormSchema, FormSubmission } from '@/lib/formUtils';

export interface FormsListResponse {
  message: string;
  count: number;
  forms: EventForm[];
}

export interface SingleFormResponse {
  message: string;
  form: EventForm;
}

export interface SubmitFormResponse {
  message: string;
  submission: FormSubmission;
  confirmation_email_sent_to?: string;
}

export interface SubmissionsListResponse {
  message: string;
  count: number;
  submissions: FormSubmission[];
}

let cachedFormsSummary: { data: { message: string; formsByEvent: Record<string, EventForm>; cached?: boolean }; expiresAt: number } | null = null;
let cachedMySubmissions: { data: SubmissionsListResponse; expiresAt: number } | null = null;
let inFlightMySubmissions: Promise<SubmissionsListResponse> | null = null;
const cachedFormsByEvent = new Map<string, { data: FormsListResponse; expiresAt: number }>();

export const FORM_QUERY_KEYS = {
  all: ['forms'] as const,
  summary: () => ['forms', 'summary'] as const,
  byEvent: (eventId: string) => ['forms', 'event', eventId] as const,
  detail: (id: string) => ['forms', 'detail', id] as const,
  mySubmissions: () => ['forms', 'my-submissions'] as const,
  submissions: (formId: string) => ['forms', 'submissions', formId] as const,
};

export function clearFormsSummaryCache() {
  cachedFormsSummary = null;
}

export function clearMySubmissionsCache() {
  cachedMySubmissions = null;
}

export function clearFormsCache() {
  cachedFormsSummary = null;
  cachedMySubmissions = null;
  cachedFormsByEvent.clear();
}

export const formService = {
  clearFormsSummaryCache,
  clearMySubmissionsCache,
  clearFormsCache,

  async getFormsSummary(forceRefresh = false): Promise<{ message: string; formsByEvent: Record<string, EventForm>; cached?: boolean }> {
    if (!forceRefresh && cachedFormsSummary && cachedFormsSummary.expiresAt > Date.now()) {
      return cachedFormsSummary.data;
    }

    const data = await apiRequest<{ message: string; formsByEvent: Record<string, EventForm>; cached?: boolean }>('/api/forms/summary', {
      method: 'GET',
    });

    cachedFormsSummary = {
      data,
      expiresAt: Date.now() + 300 * 1000,
    };

    return data;
  },

  async getFormsByEvent(eventId: string, forceRefresh = false): Promise<FormsListResponse> {
    const cached = cachedFormsByEvent.get(eventId);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const data = await apiRequest<FormsListResponse>(`/api/events/${eventId}/forms`, {
      method: 'GET',
    });

    cachedFormsByEvent.set(eventId, {
      data,
      expiresAt: Date.now() + 300 * 1000,
    });

    return data;
  },

  async getFormById(id: string): Promise<SingleFormResponse> {
    return apiRequest<SingleFormResponse>(`/api/forms/${id}`, {
      method: 'GET',
    });
  },

  async createForm(data: {
    event_id: string;
    title: string;
    schema: FormSchema;
    opens_at?: string | null;
    expires_at?: string | null;
    submission_limit?: number | null;
    show_submission_count?: boolean;
  }): Promise<SingleFormResponse> {
    const res = await apiRequest<SingleFormResponse>('/api/forms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    clearFormsCache();
    return res;
  },

  async updateForm(
    id: string,
    data: {
      title?: string;
      schema?: FormSchema;
      opens_at?: string | null;
      expires_at?: string | null;
      submission_limit?: number | null;
      show_submission_count?: boolean;
    }
  ): Promise<SingleFormResponse> {
    const res = await apiRequest<SingleFormResponse>(`/api/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    clearFormsCache();
    return res;
  },

  async deleteForm(id: string): Promise<{ message: string; deleted_form: EventForm }> {
    const res = await apiRequest<{ message: string; deleted_form: EventForm }>(`/api/forms/${id}`, {
      method: 'DELETE',
    });
    clearFormsCache();
    return res;
  },

  async submitForm(formId: string, answers: Record<string, any>): Promise<SubmitFormResponse> {
    const res = await apiRequest<SubmitFormResponse>(`/api/forms/${formId}/submissions`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    clearFormsCache();
    return res;
  },

  async getMySubmissions(forceRefresh = false): Promise<SubmissionsListResponse> {
    if (!forceRefresh && cachedMySubmissions && cachedMySubmissions.expiresAt > Date.now()) {
      return cachedMySubmissions.data;
    }

    if (!forceRefresh && inFlightMySubmissions) {
      return inFlightMySubmissions;
    }

    inFlightMySubmissions = (async () => {
      try {
        const data = await apiRequest<SubmissionsListResponse>('/api/forms/submissions/my', {
          method: 'GET',
        });

        cachedMySubmissions = {
          data,
          expiresAt: Date.now() + 300 * 1000,
        };

        return data;
      } finally {
        inFlightMySubmissions = null;
      }
    })();

    return inFlightMySubmissions;
  },

  async getFormSubmissions(formId: string): Promise<SubmissionsListResponse> {
    return apiRequest<SubmissionsListResponse>(`/api/forms/${formId}/submissions`, {
      method: 'GET',
    });
  },

  async updateSubmissionAttendance(
    submissionId: string,
    attended: boolean
  ): Promise<{ message: string; submission: FormSubmission }> {
    const res = await apiRequest<{ message: string; submission: FormSubmission }>(
      `/api/forms/submissions/${submissionId}/attendance`,
      {
        method: 'PATCH',
        body: JSON.stringify({ attended }),
      }
    );
    clearMySubmissionsCache();
    return res;
  },

  async getTicketPass(ticketId: string): Promise<{
    message: string;
    ticket_id: string;
    submission: FormSubmission;
    form: EventForm;
    event: any;
  }> {
    return apiRequest(`/api/forms/ticket/${encodeURIComponent(ticketId)}`, {
      method: 'GET',
    });
  },

  getTicketQrDownloadUrl(ticketId: string): string {
    const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${baseUrl}/api/forms/ticket/${encodeURIComponent(ticketId)}/qr-download`;
  },

  async uploadRegistrationFile(
    formId: string,
    file: File,
    fieldName?: string
  ): Promise<{
    message: string;
    file: {
      id: string;
      name: string;
      original_name: string;
      webViewLink: string;
      webContentLink?: string;
      size: number;
      mimeType: string;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (fieldName) {
      formData.append('fieldName', fieldName);
    }

    return apiRequest(`/api/forms/${formId}/upload`, {
      method: 'POST',
      body: formData,
    });
  },
};
