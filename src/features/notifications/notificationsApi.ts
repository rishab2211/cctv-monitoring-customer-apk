import { baseApi } from '../../api/rtk-query/baseApi';
import { AppNotification, NotificationPreferences, ApiResponse } from '../../types';

export interface NotificationsListResponse {
  success: boolean;
  data: {
    notifications: AppNotification[];
    total?: number;
    page?: number;
    limit?: number;
    unreadCount?: number;
  };
}

export interface RegisterDeviceRequest {
  token: string;
  deviceType: 'android' | 'ios';
}

export interface UpdatePreferencesRequest {
  alerts?: Partial<NotificationPreferences['alerts']>;
  system?: Partial<NotificationPreferences['system']>;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. List Notifications (Paginated)
    getNotifications: builder.query<
      NotificationsListResponse,
      { page?: number; limit?: number; isRead?: boolean } | void
    >({
      query: (params) => ({
        url: '/notifications',
        method: 'GET',
        params: params || { page: 1, limit: 20 },
      }),
      providesTags: (result) =>
        result?.data?.notifications
          ? [
              ...result.data.notifications.map(({ _id }) => ({
                type: 'Notifications' as const,
                id: _id,
              })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),

    // 2. Get Single Notification Detail
    getNotificationDetail: builder.query<ApiResponse<AppNotification>, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Notifications', id }],
    }),

    // 3. Mark Single Notification as Read
    markNotificationAsRead: builder.mutation<ApiResponse<AppNotification>, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'LIST' },
        'Dashboard',
      ],
    }),

    // 4. Mark All Notifications as Read
    markAllNotificationsAsRead: builder.mutation<ApiResponse<{ modifiedCount: number }>, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }, 'Dashboard'],
    }),

    // 5. Delete Notification
    deleteNotification: builder.mutation<ApiResponse<{ deleted: boolean }>, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'LIST' },
        'Dashboard',
      ],
    }),

    // 6. Register Device FCM Token
    registerDeviceToken: builder.mutation<ApiResponse<{ registered: boolean }>, RegisterDeviceRequest>({
      query: (data) => ({
        url: '/notifications/register-device',
        method: 'POST',
        data,
      }),
    }),

    // 7. Get Notification Preferences
    getNotificationPreferences: builder.query<ApiResponse<NotificationPreferences>, void>({
      query: () => ({
        url: '/notifications/preferences',
        method: 'GET',
      }),
      providesTags: ['Notifications'],
    }),

    // 8. Update Notification Preferences
    updateNotificationPreferences: builder.mutation<
      ApiResponse<NotificationPreferences>,
      UpdatePreferencesRequest
    >({
      query: (data) => ({
        url: '/notifications/preferences',
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetNotificationsQuery,
  useGetNotificationDetailQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useRegisterDeviceTokenMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationsApi;
