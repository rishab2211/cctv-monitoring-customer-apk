import { baseApi } from '../../api/rtk-query/baseApi';
import { ApiResponse, Camera } from '../../types';

export interface LiveStreamInfo {
  streamToken: string;
  pathName: string;
  webrtcUrl: string;
  hlsUrl?: string;
  sessionId?: string;
  tokenExpiresIn?: string;
}

export interface WebRTCAnswerResponse {
  type: 'answer';
  sdp: string;
  sessionUrl?: string;
}

export interface PlaybackChunk {
  _id: string;
  recordingId?: string;
  cameraId?: string;
  cameraName?: string;
  startTime: string;
  endTime: string;
  url: string;
  playbackUrl?: string;
  s3Key?: string;
  localPath?: string;
  durationSeconds?: number;
  sizeBytes?: number;
  type?: string;
  thumbnailUrl?: string;
}

export interface PlaybackResponse {
  chunks: PlaybackChunk[];
  count: number;
}

export const cameraApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCameras: builder.query<ApiResponse<{ cameras: Camera[]; count: number }>, void>({
      query: () => ({
        url: '/customer/cameras',
        method: 'GET',
      }),
      providesTags: ['Cameras'],
    }),

    getCameraDetail: builder.query<ApiResponse<{ camera: Camera; streamEndpoints?: any }>, string>({
      query: (cameraId) => ({
        url: `/cameras/${cameraId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Cameras', id }],
    }),

    getCameraLiveInfo: builder.query<ApiResponse<LiveStreamInfo>, string>({
      query: (cameraId) => ({
        url: `/customer/cameras/${cameraId}/live`,
        method: 'GET',
      }),
    }),

    postWebRTCOffer: builder.mutation<
      ApiResponse<WebRTCAnswerResponse>,
      { cameraId: string; sdp: string; type: 'offer' }
    >({
      query: ({ cameraId, sdp, type }) => ({
        url: `/streams/${cameraId}/webrtc/offer`,
        method: 'POST',
        data: { sdp, type },
      }),
    }),

    heartbeatStream: builder.mutation<
      ApiResponse<{ sessionId: string; lastHeartbeat: string }>,
      string
    >({
      query: (sessionId) => ({
        url: `/streams/heartbeat/${sessionId}`,
        method: 'POST',
      }),
    }),

    stopStream: builder.mutation<
      ApiResponse<{ sessionId: string; endedAt: string }>,
      { cameraId: string; sessionId?: string }
    >({
      query: (data) => ({
        url: '/streams/stop',
        method: 'POST',
        data,
      }),
    }),

    getCameraPlayback: builder.query<
      ApiResponse<PlaybackResponse>,
      { cameraId: string; startTime: string; endTime: string }
    >({
      query: ({ cameraId, startTime, endTime }) => ({
        url: `/customer/cameras/${cameraId}/playback`,
        method: 'GET',
        params: { startTime, endTime, start: startTime, end: endTime },
      }),
      providesTags: (_result, _error, { cameraId }) => [{ type: 'Cameras', id: `playback-${cameraId}` }],
    }),

    getTimeline: builder.query<
      ApiResponse<PlaybackChunk[]>,
      { cameraId: string; date: string }
    >({
      query: ({ cameraId, date }) => ({
        url: `/recordings/${cameraId}/timeline`,
        method: 'GET',
        params: { date },
      }),
      providesTags: (_result, _error, { cameraId }) => [{ type: 'Cameras', id: `timeline-${cameraId}` }],
    }),

    downloadRecording: builder.mutation<
      ApiResponse<{ downloadUrl: string }>,
      { recordingId: string }
    >({
      query: ({ recordingId }) => ({
        url: `/recordings/${recordingId}/download`,
        method: 'POST',
      }),
    }),

    shareCamera: builder.mutation<
      ApiResponse<{ camera: Camera }>,
      { cameraId: string; email: string }
    >({
      query: ({ cameraId, email }) => ({
        url: `/customer/cameras/${cameraId}/share`,
        method: 'POST',
        data: { email },
      }),
      invalidatesTags: ['Cameras', 'Dashboard'],
    }),

    revokeCameraShare: builder.mutation<
      ApiResponse<null>,
      { cameraId: string; userId: string }
    >({
      query: ({ cameraId, userId }) => ({
        url: `/customer/cameras/${cameraId}/share/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cameras', 'Dashboard'],
    }),
  }),
});

export const {
  useGetCamerasQuery,
  useLazyGetCamerasQuery,
  useGetCameraDetailQuery,
  useLazyGetCameraDetailQuery,
  useGetCameraLiveInfoQuery,
  useLazyGetCameraLiveInfoQuery,
  usePostWebRTCOfferMutation,
  useHeartbeatStreamMutation,
  useStopStreamMutation,
  useGetCameraPlaybackQuery,
  useLazyGetCameraPlaybackQuery,
  useGetTimelineQuery,
  useLazyGetTimelineQuery,
  useDownloadRecordingMutation,
  useShareCameraMutation,
  useRevokeCameraShareMutation,
} = cameraApi;
