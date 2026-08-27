import { baseApi } from '../../api/rtk-query/baseApi';
import { Incident } from '../../types';

export interface IncidentsResponse {
  success: boolean;
  data: {
    incidents: Incident[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface IncidentDetailResponse {
  success: boolean;
  data: Incident;
}

export interface IncidentTimelineItem {
  _id: string;
  action: string;
  status?: string;
  performedBy?: {
    _id: string;
    name: string;
    role: string;
  };
  notes?: string;
  timestamp: string;
}

export interface IncidentTimelineResponse {
  success: boolean;
  data: {
    timeline: IncidentTimelineItem[];
  };
}

export interface ReportIncidentRequest {
  title: string;
  description: string;
  type: 'theft' | 'vandalism' | 'technical_issue' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  cameraId?: string;
  attachments?: Array<{
    url: string;
    fileType: string;
    fileName: string;
  }>;
}

export interface AddIncidentNoteRequest {
  id: string;
  content: string;
}

export const incidentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get incidents list (auto-filtered to reportedBy === user._id)
    getIncidents: builder.query<
      IncidentsResponse,
      { page?: number; limit?: number; status?: string; type?: string } | void
    >({
      query: (params) => ({
        url: '/incidents',
        method: 'GET',
        params: params || { page: 1, limit: 20 },
      }),
      providesTags: ['Incidents'],
    }),

    // 2. Get incident details
    getIncidentDetail: builder.query<IncidentDetailResponse, string>({
      query: (id) => ({
        url: `/incidents/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Incidents', id }],
    }),

    // 3. Get incident audit timeline
    getIncidentTimeline: builder.query<IncidentTimelineResponse, string>({
      query: (id) => ({
        url: `/incidents/${id}/timeline`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Incidents', id: `timeline-${id}` }],
    }),

    // 4. Report new incident
    reportIncident: builder.mutation<IncidentDetailResponse, ReportIncidentRequest>({
      query: (body) => ({
        url: '/incidents',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Incidents', 'Dashboard'],
    }),

    // 5. Add note to incident (guarded in UI for owner)
    addIncidentNote: builder.mutation<IncidentDetailResponse, AddIncidentNoteRequest>({
      query: ({ id, content }) => ({
        url: `/incidents/${id}/notes`,
        method: 'POST',
        data: { text: content, content },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Incidents', id },
        { type: 'Incidents', id: `timeline-${id}` },
        'Incidents',
      ],
    }),

    // 6. Upload media to incident
    uploadIncidentMedia: builder.mutation<
      IncidentDetailResponse,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/incidents/${id}/media`,
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Incidents', id },
        'Incidents',
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetIncidentsQuery,
  useGetIncidentDetailQuery,
  useGetIncidentTimelineQuery,
  useReportIncidentMutation,
  useAddIncidentNoteMutation,
  useUploadIncidentMediaMutation,
} = incidentsApi;
