require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => {
  try {
    const { ReanimatedModule } = require('react-native-reanimated/src/ReanimatedModule');
    if (ReanimatedModule) {
      ReanimatedModule.setCSSEventHandler = () => {};
    }
    const { createJSReanimatedModule } = require('react-native-reanimated/src/ReanimatedModule/js-reanimated');
    if (createJSReanimatedModule) {
      const instance = createJSReanimatedModule();
      if (instance) {
        Object.getPrototypeOf(instance).setCSSEventHandler = () => {};
      }
    }
  } catch {
    // ignore
  }
  return require('react-native-reanimated/mock');
});

jest.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => 'HugeiconsIcon',
}));

jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  Rect: 'Rect',
  Circle: 'Circle',
  G: 'G',
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));


jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn((key, value) => {
        store[key] = value;
        return Promise.resolve(null);
      }),
      getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
      removeItem: jest.fn((key) => {
        delete store[key];
        return Promise.resolve(null);
      }),
      clear: jest.fn(() => {
        store = {};
        return Promise.resolve(null);
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
      multiGet: jest.fn((keys) =>
        Promise.resolve(keys.map((k) => [k, store[k] || null]))
      ),
      multiSet: jest.fn((pairs) => {
        pairs.forEach(([k, v]) => {
          store[k] = v;
        });
        return Promise.resolve(null);
      }),
      multiRemove: jest.fn((keys) => {
        keys.forEach((k) => {
          delete store[k];
        });
        return Promise.resolve(null);
      }),
    },
  };
});

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(null),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

jest.mock('@react-native-firebase/messaging', () => {
  const mockMessaging = () => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
    onMessage: jest.fn().mockReturnValue(jest.fn()),
    onNotificationOpenedApp: jest.fn().mockReturnValue(jest.fn()),
    onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    requestPermission: jest.fn().mockResolvedValue(1),
  });
  mockMessaging.AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2 };
  return {
    __esModule: true,
    default: mockMessaging,
    getMessaging: mockMessaging,
    getToken: jest.fn().mockResolvedValue('mock-token'),
    onMessage: jest.fn().mockReturnValue(jest.fn()),
    onNotificationOpenedApp: jest.fn().mockReturnValue(jest.fn()),
    onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    requestPermission: jest.fn().mockResolvedValue(1),
    AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
  };
});

jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('react-native-webrtc', () => ({
  RTCPeerConnection: jest.fn(),
  RTCView: 'RTCView',
  RTCSessionDescription: jest.fn(),
  MediaStream: jest.fn(),
}));

jest.mock('react-native-video', () => 'Video');

jest.mock('react-native-razorpay', () => ({
  open: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: {
      DocumentDir: '/mock/docs',
    },
  },
  config: jest.fn().mockReturnThis(),
  fetch: jest.fn(),
}));

