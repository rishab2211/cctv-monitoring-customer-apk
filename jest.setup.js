require('react-native-gesture-handler/jestSetup');

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
