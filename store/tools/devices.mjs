import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '../..');

/**
 * Store screenshot sizes. `px` is the exact pixel size the store expects; `density` (Android dpi, 160 = 1×)
 * sets the layout size in dp, e.g. 1320 × 2868 at 480 dpi lays out like a 440 × 956 pt iPhone.
 * `css` / `dpr` are the same size for the HTML compositor (render-graphics.mjs).
 */
export const DEVICES = [
  // App Store Connect
  { key: 'ios-iphone-6.9', store: 'App Store – iPhone 6.9" (required)', px: [1320, 2868], density: 480, css: [440, 956], dpr: 3 },
  { key: 'ios-iphone-6.5', store: 'App Store – iPhone 6.5"', px: [1242, 2688], density: 480, css: [414, 896], dpr: 3 },
  { key: 'ios-iphone-6.3', store: 'App Store – iPhone 6.3"', px: [1206, 2622], density: 480, css: [402, 874], dpr: 3 },
  { key: 'ios-ipad-13', store: 'App Store – iPad 13" (required, iPad supported)', px: [2064, 2752], density: 320, css: [1032, 1376], dpr: 2 },
  // Google Play
  { key: 'android-phone', store: 'Google Play – Phone', px: [1080, 1920], density: 420, css: [360, 640], dpr: 3 },
  { key: 'android-tablet-7', store: 'Google Play – 7" tablet', px: [1200, 1920], density: 320, css: [600, 960], dpr: 2 },
  { key: 'android-tablet-10', store: 'Google Play – 10" tablet', px: [1600, 2560], density: 320, css: [800, 1280], dpr: 2 },
];
