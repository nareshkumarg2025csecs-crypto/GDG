import { apiRequest } from '@/lib/api';
import type { UserProfile } from './authService';

export interface DashboardResponse {
  message: string;
  dashboard: UserProfile;
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
};
