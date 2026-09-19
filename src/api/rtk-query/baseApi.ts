import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { axiosInstance } from '../axiosInstance';

const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
      headers?: AxiosRequestConfig['headers'];
    },
    unknown,
    unknown
  > =>
  async ({ url, method = 'GET', data, params, headers }) => {
    try {
      const result = await axiosInstance({
        url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError<{ message?: string; error?: string; errors?: any }>;
      const responseData = err.response?.data;
      const fallbackMessage = err.message || 'Network request failed. Please check your connection.';

      return {
        error: {
          status: err.response?.status,
          data:
            responseData && typeof responseData === 'object'
              ? responseData
              : { message: typeof responseData === 'string' ? responseData : fallbackMessage },
          message:
            (typeof responseData === 'object' && responseData?.message) ||
            fallbackMessage,
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    'Auth',
    'Dashboard',
    'Cameras',
    'SOS',
    'Incidents',
    'Billing',
    'Tickets',
    'Notifications',
    'Profile',
  ],
  endpoints: () => ({}),
});
