import { baseApi } from '../../api/rtk-query/baseApi';
import { Ticket } from '../../types';

export interface TicketsResponse {
  success: boolean;
  data: {
    tickets: Ticket[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TicketDetailResponse {
  success: boolean;
  data: Ticket;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'general' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AddTicketCommentRequest {
  ticketId: string;
  text: string;
}

export const ticketsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get customer tickets (auto-filtered to createdBy === user._id)
    getTickets: builder.query<
      TicketsResponse,
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (params) => ({
        url: '/tickets',
        method: 'GET',
        params: params || { page: 1, limit: 20 },
      }),
      providesTags: ['Tickets'],
    }),

    // 2. Get ticket detail with comments thread
    getTicketDetail: builder.query<TicketDetailResponse, string>({
      query: (id) => ({
        url: `/tickets/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Tickets', id }],
    }),

    // 3. Create new support ticket
    createTicket: builder.mutation<TicketDetailResponse, CreateTicketRequest>({
      query: (body) => ({
        url: '/tickets',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Tickets'],
    }),

    // 4. Add comment to ticket thread (auto-reopens closed ticket on backend)
    addTicketComment: builder.mutation<TicketDetailResponse, AddTicketCommentRequest>({
      query: ({ ticketId, text }) => ({
        url: `/tickets/${ticketId}/comments`,
        method: 'POST',
        data: { text },
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: 'Tickets', id: ticketId },
        'Tickets',
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetTicketsQuery,
  useGetTicketDetailQuery,
  useCreateTicketMutation,
  useAddTicketCommentMutation,
} = ticketsApi;
