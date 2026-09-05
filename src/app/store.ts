import { configureStore, combineReducers, UnknownAction } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer, { logout } from './slices/authSlice';
import uiReducer, { setRateLimitCountdown } from './slices/uiSlice';
import { baseApi } from '../api/rtk-query/baseApi';
import { setAuthCallbacks } from '../api/axiosInstance';

// Exclude sensitive JWT tokens from AsyncStorage. Keychain is the sole token authority.
const authPersistConfig = {
  key: 'cctv_customer_auth',
  storage: AsyncStorage,
  blacklist: ['token', 'refreshToken'],
};

const appReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  ui: uiReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

// Root reducer that completely resets state and cache on logout
const rootReducer = (state: any, action: UnknownAction) => {
  if (action.type === 'auth/logout') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

export const persistor = persistStore(store);

// Wire axiosInstance callbacks with Redux store to avoid circular imports
setAuthCallbacks(
  () => {
    store.dispatch(logout());
  },
  (seconds: number) => {
    store.dispatch(setRateLimitCountdown(seconds));
  }
);

export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = typeof store.dispatch;
