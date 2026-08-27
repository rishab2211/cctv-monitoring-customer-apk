import { baseApi } from '../../api/rtk-query/baseApi';
import { User, Session, ApiResponse } from '../../types';

export interface CustomerProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface SessionsListResponse {
  success: boolean;
  data: {
    currentSessionId?: string;
    sessions: Session[];
  };
}

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Customer Profile
    getCustomerProfile: builder.query<CustomerProfileResponse, void>({
      query: () => ({
        url: '/customer/profile',
        method: 'GET',
      }),
      providesTags: ['Profile', 'Auth'],
    }),

    // 2. Update Customer Profile
    updateCustomerProfile: builder.mutation<ApiResponse<{ user: User }>, UpdateProfileRequest>({
      query: (data) => ({
        url: '/customer/profile',
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Profile', 'Auth', 'Dashboard'],
    }),

    // 3. Upload Profile Avatar
    uploadProfileAvatar: builder.mutation<ApiResponse<{ avatar: string }>, FormData>({
      query: (formData) => ({
        url: '/users/profile/avatar',
        method: 'PUT',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      invalidatesTags: ['Profile', 'Auth', 'Dashboard'],
    }),

    // 4. Change Password
    changePassword: builder.mutation<ApiResponse<null>, ChangePasswordRequest>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PUT',
        data: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword || data.newPassword,
        },
      }),
    }),

    // 5. List Active Sessions
    getActiveSessions: builder.query<SessionsListResponse, void>({
      query: () => ({
        url: '/auth/sessions',
        method: 'GET',
      }),
      providesTags: ['Auth'],
    }),

    // 6. Revoke Specific Session
    revokeSession: builder.mutation<ApiResponse<{ revoked: boolean }>, string>({
      query: (sessionId) => ({
        url: `/auth/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth'],
    }),

    // 7. Revoke All Other Sessions (Mass Sign-out)
    revokeAllOtherSessions: builder.mutation<ApiResponse<{ revokedCount: number }>, void>({
      query: () => ({
        url: '/auth/sessions',
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
  useUploadProfileAvatarMutation,
  useChangePasswordMutation,
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllOtherSessionsMutation,
} = profileApi;
