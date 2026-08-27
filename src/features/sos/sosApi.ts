import { baseApi } from '../../api/rtk-query/baseApi';
import { SOSAlert } from '../../types';

export interface TriggerSOSRequest {
  cameraId?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface SOSHistoryResponse {
  success: boolean;
  data: {
    alerts: SOSAlert[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SOSDetailResponse {
  success: boolean;
  data: SOSAlert;
}

export interface SOSTimelineItem {
  _id: string;
  action: 'triggered' | 'acknowledged' | 'resolved' | 'note_added' | 'false_alarm';
  performedBy?: {
    _id: string;
    name: string;
    role: string;
  };
  notes?: string;
  timestamp: string;
}

export interface SOSTimelineResponse {
  success: boolean;
  data: {
    timeline: SOSTimelineItem[];
  };
}

export const sosApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Trigger SOS emergency
    triggerSOS: builder.mutation<SOSDetailResponse, TriggerSOSRequest>({
      query: (body) => ({
        url: '/sos',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['SOS', 'Dashboard'],
    }),

    // 2. Get SOS emergency history (auto-filtered to customer)
    getSOSHistory: builder.query<SOSHistoryResponse, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/sos',
        method: 'GET',
        params: params || { page: 1, limit: 20 },
      }),
      providesTags: ['SOS'],
    }),

    // 3. Get active SOS alerts
    getActiveSOSAlerts: builder.query<{ success: boolean; data: { alerts: SOSAlert[] } }, void>({
      query: () => ({
        url: '/sos/active',
        method: 'GET',
      }),
      providesTags: ['SOS'],
    }),

    // 4. Get SOS Detail
    getSOSDetail: builder.query<SOSDetailResponse, string>({
      query: (id) => ({
        url: `/sos/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'SOS', id }],
    }),

    // 5. Get SOS Timeline
    getSOSTimeline: builder.query<SOSTimelineResponse, string>({
      query: (id) => ({
        url: `/sos/${id}/timeline`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'SOS', id: `timeline-${id}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useTriggerSOSMutation,
  useGetSOSHistoryQuery,
  useGetActiveSOSAlertsQuery,
  useGetSOSDetailQuery,
  useGetSOSTimelineQuery,
} = sosApi;
