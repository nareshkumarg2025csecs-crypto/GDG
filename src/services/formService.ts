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
}

export interface SubmissionsListResponse {
  message: string;
  count: number;
  submissions: FormSubmission[];
}

export const formService = {
  async getFormsByEvent(eventId: string): Promise<FormsListResponse> {
    return apiRequest<FormsListResponse>(`/api/events/${eventId}/forms`, {
      method: 'GET',
    });
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
    expires_at?: string | null;
  }): Promise<SingleFormResponse> {
    return apiRequest<SingleFormResponse>('/api/forms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateForm(
    id: string,
    data: {
      title?: string;
      schema?: FormSchema;
      expires_at?: string | null;
    }
  ): Promise<SingleFormResponse> {
    return apiRequest<SingleFormResponse>(`/api/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteForm(id: string): Promise<{ message: string; deleted_form: EventForm }> {
    return apiRequest<{ message: string; deleted_form: EventForm }>(`/api/forms/${id}`, {
      method: 'DELETE',
    });
  },

  async submitForm(formId: string, answers: Record<string, any>): Promise<SubmitFormResponse> {
    return apiRequest<SubmitFormResponse>(`/api/forms/${formId}/submissions`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  async getMySubmissions(): Promise<SubmissionsListResponse> {
    return apiRequest<SubmissionsListResponse>('/api/forms/submissions/my', {
      method: 'GET',
    });
  },

  async getFormSubmissions(formId: string): Promise<SubmissionsListResponse> {
    return apiRequest<SubmissionsListResponse>(`/api/forms/${formId}/submissions`, {
      method: 'GET',
    });
  },
};
