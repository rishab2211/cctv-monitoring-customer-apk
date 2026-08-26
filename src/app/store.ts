import { configureStore, combineReducers, AnyAction } from '@reduxjs/toolkit';
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

const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

// Root reducer that completely resets state and cache on logout
const rootReducer = (state: any, action: AnyAction) => {
  if (action.type === 'auth/logout') {
    // Reset state to initial state on logout to prevent data leaking
    state = undefined;
  }
  return appReducer(state, action);
};

const persistConfig = {
  key: 'cctv_customer_root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth state across reloads
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
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
