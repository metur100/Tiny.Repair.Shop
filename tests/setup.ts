/* Jest setup: lightweight mocks for native modules so screens and logic run in Node. */
/* eslint-disable @typescript-eslint/no-require-imports */

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => {
  const mock = require('react-native-reanimated/mock');
  return { ...mock, useReducedMotion: () => false, default: { ...mock.default } };
});

// Icon fonts load asynchronously; in tests an icon is a plain element carrying its name.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name }: { name: string }) => React.createElement(Text, { accessible: false }, `icon:${name}`);
  Icon.glyphMap = {};
  return { __esModule: true, MaterialCommunityIcons: Icon };
});

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Skia draws on a GPU canvas. In tests the canvas is a plain View (keeping its accessibility props) and
// every drawing primitive renders nothing; path builders are chainable no-ops.
jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const { View } = require('react-native');
  const chain: object = new Proxy({}, { get: (_t, key) => (key === 'build' ? () => ({}) : () => chain) });
  const Skia = {
    PathBuilder: { Make: () => chain },
    Path: { Make: () => chain, MakeFromSVGString: () => ({}) },
    RRectXY: () => ({}),
    XYWHRect: () => ({}),
    Color: (c: unknown) => c,
    Point: (x: number, y: number) => ({ x, y }),
  };
  const Canvas = ({ children: _children, ...props }: Record<string, unknown>) => React.createElement(View, props);
  const Null = () => null;
  const named: Record<string, unknown> = {
    __esModule: true,
    Skia,
    Canvas,
    vec: (x: number, y: number) => ({ x, y }),
    rect: (x: number, y: number, width: number, height: number) => ({ x, y, width, height }),
    useFont: () => null,
    matchFont: () => null,
  };
  return new Proxy(named, { get: (target, key: string) => (key in target ? target[key] : Null) });
});

jest.mock('expo-audio', () => {
  const player = { play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(() => Promise.resolve()), setPlaybackRate: jest.fn(), remove: jest.fn(), volume: 1, loop: false, playing: false };
  return { createAudioPlayer: jest.fn(() => player), setAudioModeAsync: jest.fn(() => Promise.resolve()) };
});

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-router', () => {
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
  return { router, useRouter: () => router, useLocalSearchParams: jest.fn(() => ({})), Stack: () => null, Tabs: () => null, Link: () => null };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: unknown }) => children,
    SafeAreaView: ({ children }: { children: unknown }) => React.createElement(require('react-native').View, null, children),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});
