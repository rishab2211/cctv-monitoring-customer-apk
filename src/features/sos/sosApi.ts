import { baseApi } from '../../api/rtk-query/baseApi';
import { SOSAlert } from '../../types';

export interface TriggerSOSRequest {
  cameraId?: string;
  location?:
    | string
    | {
        latitude?: number;
        longitude?: number;
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
      query: (body) => {
        let locationString: string | undefined;
        if (typeof body.location === 'string') {
          locationString = body.location;
        } else if (body.location) {
          if (body.location.address) {
            locationString = body.location.address;
          } else if (body.location.latitude && body.location.longitude) {
            locationString = `GPS (${body.location.latitude.toFixed(5)}, ${body.location.longitude.toFixed(5)})`;
          }
        }

        const payload: Record<string, any> = {};
        if (body.cameraId && /^[0-9a-fA-F]{24}$/.test(body.cameraId)) {
          payload.cameraId = body.cameraId;
        }
        if (locationString) {
          payload.location = locationString;
        }

        return {
          url: '/sos',
          method: 'POST',
          data: payload,
        };
      },
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
