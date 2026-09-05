module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  resolver: 'react-native-worklets/jest/resolver.js',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?(@react-native|react-native|react-native-gesture-handler|@hugeicons|react-redux|@reduxjs|immer|redux-persist|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-paper|react-native-reanimated|react-native-worklets)/)',
  ],
};
