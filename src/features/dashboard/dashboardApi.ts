import { baseApi } from '../../api/rtk-query/baseApi';
import { ApiResponse, Camera, Incident, SOSAlert } from '../../types';

export interface DashboardPayload {
  customer: {
    name: string;
    email: string;
    phone?: string;
    franchiseContact?: {
      name: string;
      phone: string;
    };
  };
  subscription?: {
    planName: string;
    status: 'active' | 'past_due' | 'canceled' | 'pending_payment' | 'expired';
    endDate: string;
    daysRemaining?: number;
  };
  cameraStats: {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
  };
  cameras: Camera[];
  recentIncidents: Incident[];
  activeSosAlerts: SOSAlert[];
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<ApiResponse<DashboardPayload>, void>({
      query: () => ({
        url: '/customer/dashboard',
        method: 'GET',
      }),
      providesTags: ['Dashboard', 'Cameras', 'SOS', 'Incidents'],
    }),
  }),
});

export const { useGetDashboardQuery, useLazyGetDashboardQuery } = dashboardApi;
