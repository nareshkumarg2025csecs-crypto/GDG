import { apiRequest } from '@/lib/api';
import type { UserProfile } from './authService';

export interface DashboardResponse {
  message: string;
  dashboard: UserProfile;
}

export interface AppNotification {
  id: string;
  type: 'attendance' | 'certificate' | 'event';
  title: string;
  message: string;
  timestamp: string;
  event_id?: string | null;
  event_title?: string;
  certificate_id?: string | null;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  notifications: AppNotification[];
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardResponse> {
    return apiRequest<DashboardResponse>('/api/dashboard', {
      method: 'GET',
    });
  },

  async updateDashboard(data: {
    full_name?: string;
    details?: Record<string, any>;
  }): Promise<DashboardResponse> {
    return apiRequest<DashboardResponse>('/api/dashboard', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getNotifications(): Promise<NotificationsResponse> {
    return apiRequest<NotificationsResponse>('/api/dashboard/notifications', {
      method: 'GET',
    });
  },
};
