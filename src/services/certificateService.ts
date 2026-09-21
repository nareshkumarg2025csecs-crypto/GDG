import { apiRequest, API_BASE_URL } from '@/lib/api';

export interface CertificateField {
  key: string;
  label: string;
  sample: string;
}

export interface CertificateAsset {
  filename: string;
  size: number;
  updatedAt: string;
  isDefault: boolean;
}

export interface EventCertificateConfig {
  eventId: string;
  eventTitle: string;
  scriptCode: string;
  defaultScriptCode?: string;
  defaultEmailSubject?: string;
  defaultEmailBody?: string;
  hasCustomCode?: boolean;
  outputFormat: 'pdf' | 'png' | 'jpg';
  emailSubject: string;
  emailBody: string;
  updatedAt?: string | null;
  availableFields: CertificateField[];
}

export interface AttendedParticipant {
  id: string;
  userId: string;
  name: string;
  email: string;
  ticketId?: string;
  submittedAt: string;
  certificateSent: boolean;
  certificateSentAt?: string | null;
  certificateId?: string | null;
  answers?: Record<string, any>;
}

export interface AttendedParticipantsResponse {
  participants: AttendedParticipant[];
  totalAttended: number;
  totalCertificatesSent: number;
}

export interface CertificatePreviewResponse {
  contentType: string;
  dataUrl: string;
}

export interface BatchDispatchResponse {
  message: string;
  jobId: string;
  total: number;
}

export interface JobProgressResponse {
  jobId: string;
  eventId: string;
  eventTitle: string;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  percentage: number;
  errors: string[];
}

export const certificateService = {
  async getDefaultTemplate(
    token?: string | null,
    eventTitle?: string
  ): Promise<{ defaultScriptCode: string; defaultEmailSubject?: string; defaultEmailBody?: string }> {
    const query = eventTitle ? `?eventTitle=${encodeURIComponent(eventTitle)}` : '';
    return apiRequest<{ defaultScriptCode: string; defaultEmailSubject?: string; defaultEmailBody?: string }>(
      `/api/certificates/default-template${query}`,
      {
        method: 'GET',
        token,
      }
    );
  },

  async getEventConfig(eventId: string, token?: string | null): Promise<EventCertificateConfig> {
    return apiRequest<EventCertificateConfig>(`/api/certificates/event/${eventId}`, {
      method: 'GET',
      token,
    });
  },

  async saveEventConfig(
    eventId: string,
    payload: {
      scriptCode: string;
      outputFormat?: string;
      emailSubject?: string;
      emailBody?: string;
    },
    token?: string | null
  ): Promise<{ success: boolean; message: string; updatedAt?: string }> {
    return apiRequest(`/api/certificates/event/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    });
  },

  async previewCertificate(
    payload: { eventId: string; scriptCode?: string },
    token?: string | null
  ): Promise<CertificatePreviewResponse> {
    return apiRequest<CertificatePreviewResponse>('/api/certificates/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    });
  },

  async listAssets(token?: string | null): Promise<{ assets: CertificateAsset[] }> {
    return apiRequest<{ assets: CertificateAsset[] }>('/api/certificates/assets', {
      method: 'GET',
      token,
    });
  },

  async uploadAsset(file: File, token?: string | null): Promise<{ message: string; asset: CertificateAsset }> {
    const formData = new FormData();
    formData.append('file', file);

    const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/api/certificates/assets`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to upload graphic asset.');
    }
    return data;
  },

  async getAttendedParticipants(eventId: string, token?: string | null): Promise<AttendedParticipantsResponse> {
    return apiRequest<AttendedParticipantsResponse>(`/api/certificates/event/${eventId}/attended`, {
      method: 'GET',
      token,
    });
  },

  async dispatchCertificates(
    payload: { eventId: string; submissionIds?: string[] },
    token?: string | null
  ): Promise<BatchDispatchResponse> {
    return apiRequest<BatchDispatchResponse>('/api/certificates/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    });
  },

  async cancelJob(jobId: string, token?: string | null): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/certificates/jobs/${jobId}/cancel`, {
      method: 'POST',
      token,
    });
  },

  async getJobProgress(jobId: string, token?: string | null): Promise<JobProgressResponse> {
    return apiRequest<JobProgressResponse>(`/api/certificates/jobs/${jobId}`, {
      method: 'GET',
      token,
    });
  },

  async getMyCertificates(token?: string | null): Promise<{ certificates: any[] }> {
    return apiRequest<{ certificates: any[] }>('/api/certificates/my-certificates', {
      method: 'GET',
      token,
    });
  },

  async downloadCertificate(submissionId: string, eventTitle?: string, token?: string | null): Promise<void> {
    const headers: Record<string, string> = {};
    let authToken = token;
    if (!authToken) {
      try {
        const storedAuth = localStorage.getItem('gdg_auth_storage');
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          authToken = parsed?.state?.accessToken || null;
        }
      } catch (_) {}
    }
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const downloadUrl = `${API_BASE_URL}/api/certificates/download/submission/${submissionId}`;
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `Failed to download certificate (${response.statusText}).`);
    }

    const blob = await response.blob();
    // Validate that the returned blob is actually a PDF binary and not an HTML page
    const textSample = await blob.slice(0, 10).text();
    if (textSample.startsWith('<!doctype') || textSample.startsWith('<html')) {
      throw new Error('Server returned an invalid document instead of a PDF certificate.');
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = (eventTitle || 'GDG_Event').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `Certificate_${cleanTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
