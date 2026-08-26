import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SOSAlert } from '../../types';

interface UIState {
  isOffline: boolean;
  activeSosAlerts: SOSAlert[];
  globalLoading: boolean;
  rateLimitCountdown: number | null;
  unreadNotificationCount: number;
}

const initialState: UIState = {
  isOffline: false,
  activeSosAlerts: [],
  globalLoading: false,
  rateLimitCountdown: null,
  unreadNotificationCount: 0,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setOffline: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    setActiveSosAlerts: (state, action: PayloadAction<SOSAlert[]>) => {
      state.activeSosAlerts = action.payload;
    },
    addActiveSosAlert: (state, action: PayloadAction<SOSAlert>) => {
      const exists = state.activeSosAlerts.some((a) => a._id === action.payload._id);
      if (!exists) {
        state.activeSosAlerts.unshift(action.payload);
      }
    },
    removeActiveSosAlert: (state, action: PayloadAction<string>) => {
      state.activeSosAlerts = state.activeSosAlerts.filter((a) => a._id !== action.payload);
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setRateLimitCountdown: (state, action: PayloadAction<number | null>) => {
      state.rateLimitCountdown = action.payload;
    },
    setUnreadNotificationCount: (state, action: PayloadAction<number>) => {
      state.unreadNotificationCount = action.payload;
    },
  },
});

export const {
  setOffline,
  setActiveSosAlerts,
  addActiveSosAlert,
  removeActiveSosAlert,
  setGlobalLoading,
  setRateLimitCountdown,
  setUnreadNotificationCount,
} = uiSlice.actions;

export default uiSlice.reducer;
