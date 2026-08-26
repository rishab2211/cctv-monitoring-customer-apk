import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { CONFIG } from '../constants/config';
import { useAppDispatch, useAppSelector } from './redux';
import {
  removeActiveSosAlert,
} from '../app/slices/uiSlice';
import { baseApi } from '../api/rtk-query/baseApi';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket | null => socketInstance;

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    // Connect to Socket.IO backend with auth payload and extraHeaders
    const socket = io(CONFIG.SOCKET_URL, {
      auth: {
        token: bearerToken,
      },
      extraHeaders: {
        Authorization: bearerToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;
    socketInstance = socket;

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected with id:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });

    // 1. General notification event (Backend routes to user's private room)
    socket.on('notification', (data) => {
      console.log('[Socket.IO] Notification received:', data);
      dispatch(baseApi.util.invalidateTags(['Notifications', 'Dashboard']));
    });

    // 2. SOS Acknowledged event
    socket.on('sos_acknowledged', (data) => {
      console.log('[Socket.IO] SOS Acknowledged:', data);
      if (data && (data.triggeredBy === user?._id || data.userId === user?._id)) {
        dispatch(baseApi.util.invalidateTags(['SOS', 'Dashboard']));
      }
    });

    // 3. SOS Resolved event
    socket.on('sos_resolved', (data) => {
      console.log('[Socket.IO] SOS Resolved:', data);
      if (data && (data.triggeredBy === user?._id || data.userId === user?._id)) {
        if (data._id) {
          dispatch(removeActiveSosAlert(data._id));
        }
        dispatch(baseApi.util.invalidateTags(['SOS', 'Dashboard']));
      }
    });

    // 4. Incident Updated event
    socket.on('incident_updated', (data) => {
      console.log('[Socket.IO] Incident updated:', data);
      dispatch(baseApi.util.invalidateTags(['Incidents', 'Dashboard']));
    });

    // 5. Incident Closed event
    socket.on('incident_closed', (data) => {
      console.log('[Socket.IO] Incident closed:', data);
      dispatch(baseApi.util.invalidateTags(['Incidents', 'Dashboard']));
    });

    return () => {
      socket.disconnect();
      socketInstance = null;
    };
  }, [isAuthenticated, token, user?._id, dispatch]);

  return {
    socket: socketRef.current,
  };
};
