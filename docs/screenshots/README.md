# Screenshots

Real captures of the running game. Nothing here is a mock-up or composite.

| | |
|---|---|
| **Platform** | Android 17 (Android Emulator, AVD `Pixel_10_Pro_XL`) |
| **Resolution** | 1344 × 2992 px, density 480 dpi, portrait |
| **App version** | Tiny Repair Shop 1.0.0, development build served by Metro |
| **Runtime** | Expo Go 57.0.9 (Expo SDK 57, React Native 0.86.3) |
| **Captured** | 2026-10-10 |
| **Method** | `adb exec-out screencap -p > file.png`, while playing a fresh save on the emulator |

The status bar uses Android's SystemUI demo mode (fixed 9:41 clock, full battery, no notifications)
so that the screenshots stay clean. Demo mode only changes the status bar; it does not change the app.

| File | Screen |
|---|---|
| `01-workshop.png` | Workshop hub after two repairs and the first upgrade (the cleaning sink appears in the room) |
| `02-job-board.png` | Job board with the date-seeded daily special and waiting customers |
| `03-customer.png` | Customer request: Mia's flat city bike |
| `04-inspection.png` | Inspection: back side of the bike, one clue found, hint ring on the next |
| `05-cleaning.png` | Cleaning in progress (73 % clean) |
| `06-repair.png` | Repair mini-game: pumping the tyre |
| `07-paint.png` | Paint & customise: coral frame with the colour sheet open |
| `08-test.png` | Test ride: tap “Hop!” when the bike reaches the bump |
| `09-results.png` | Delivery: before/after slider, stars, customer reaction and rewards |
| `10-settings.png` | Settings: sound, music, vibration, reduced motion, high contrast, privacy |
| `11-collection.png` | Collection with the two restored objects |

## iOS

There are no iOS screenshots. This project was built on Windows, where neither the iOS Simulator nor
Xcode is available, so iOS captures could not be made honestly. The code has no Android-only APIs. To
capture iOS screenshots on a Mac, run `npx expo start --ios` and use
`xcrun simctl io booted screenshot <file>.png`.
