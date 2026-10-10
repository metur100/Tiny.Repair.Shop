# Tiny Repair Shop – store release kit

Everything needed to publish on **Google Play** and the **Apple App Store**.

```
app.json / eas.json             app identity, icons, splash, permissions, build + submit profiles
credentials.json                Android upload-key config  (NOT in git – back it up!)
credentials/android/*.jks       Android upload keystore    (NOT in git – back it up!)
store/
  listing/google-play.md        all Play Console texts + Data safety / content rating / app content answers
  listing/app-store.md          all App Store Connect texts + App Privacy / age rating / review notes
  privacy-policy.html           copy of the privacy policy (the live one is on the website, see section 0)
  graphics/                     Play icon 512, feature graphic 1024×500, header images, App Store icon 1024
  screenshots/<device>/         captioned store screenshots (9 per device size)  ← upload these
  screenshots/raw/<device>/     the same moments without captions (real emulator captures)
  builds/                       downloaded .aab / .ipa files (not in git)
  tools/                        scripts that recapture the screenshots and redraw the graphics
```

| Identity | Value |
| --- | --- |
| App name | Tiny Repair Shop (store name "Tiny Repair Shop: Cozy Fixing") |
| Android package / iOS bundle ID | `com.certidevelopment.tinyrepairshop` |
| Version | 1.0.0 (Android versionCode 1, iOS buildNumber 1) |
| Expo project | `@certi-development/tiny-repair-shop` (ID `8b1cef67-9150-4c8e-8c96-2cbd9b6d4ebd`) |

---

## 0. Website, privacy policy and support URL

The website lives in the separate repo [Tiny.Repair.Shop.Landing](https://github.com/metur100/Tiny.Repair.Shop.Landing), hosted on GitHub Pages:

| Field | URL |
| --- | --- |
| Privacy policy (Play + App Store) | https://metur100.github.io/Tiny.Repair.Shop.Landing/privacy.html |
| Support URL (App Store) | https://metur100.github.io/Tiny.Repair.Shop.Landing/#support |
| Website / Marketing URL | https://metur100.github.io/Tiny.Repair.Shop.Landing/ |

## 1. Android – Google Play

### Build the AAB

```bash
npm install -g eas-cli          # once
eas login                       # account certidevelopment@gmail.com (owner of certi-development)
eas build -p android --profile production
```

The AAB is signed with the **upload key** from `credentials.json` (local credentials, see section 5).

When the build finishes, EAS prints a download link for the `.aab`. The 1.0.0 (1) bundle is in `store/builds/tiny-repair-shop-1.0.0-1.aab`.

### First upload (must be done by hand once)

1. **Create the app.** In Play Console, choose **Create app**:
   - name: *Tiny Repair Shop: Cozy Fixing*
   - default language: English (US)
   - type: **Game**
   - price: **Free**
   - accept the declarations
2. **App signing.** Keep the default **Play App Signing**. The EAS keystore is the *upload key*; Google holds the app signing key.
3. **Listing and policies.** Fill in everything in **Policy → App content** and **Store presence** from `store/listing/google-play.md`.
4. **Test release.** Go to **Testing → Internal testing** (or Closed testing) and create a release:
   1. Upload the `.aab`.
   2. Add the release notes from the listing file.
   3. Choose Review, then Roll out.

   *New personal developer accounts* must run a **closed test with at least 12 testers for 14 days** before Google grants Production access. Organisation accounts can go to Production directly.
5. **Production.** Under **Production**, create a release, promote the same build and send it for review.

Later uploads can go through EAS: `eas submit -p android --latest` uploads to the internal track as a draft (see `eas.json`). This needs a Google service-account key. The very first upload must always be done by hand.

Before every new upload, raise `android.versionCode` (and `version`) in `app.json`.

## 2. iOS – App Store (built and uploaded with Expo, no Mac needed)

You need a paid **Apple Developer Program** membership.

```bash
eas build -p ios --profile production
eas submit -p ios --latest
```

**First build:**

- EAS asks you to log in with your Apple ID.
- It then creates the **distribution certificate**, the **provisioning profile** and the bundle ID `com.certidevelopment.tinyrepairshop`, and stores them on Expo's servers. Answer *Yes* when it offers to generate them.

**Submitting:**

- `submit` uploads the `.ipa` to **App Store Connect / TestFlight**.
- If the app record doesn't exist yet, EAS Submit creates it and asks for the app name and language. Use *Tiny Repair Shop: Cozy Fixing* and English (U.S.).
- To build and upload in one step, use `eas build -p ios --profile production --auto-submit`.

Then, in **App Store Connect**:

1. Open the app and fill in **App Information**, **Pricing** and **App Privacy** from `store/listing/app-store.md`.
2. In version 1.0, upload the screenshots (6.9" iPhone and 13" iPad are required), then add the description, keywords, support URL and review notes.
3. Select the build. It appears about 10–30 minutes after upload, once processing finishes. Then choose **Add for Review** and **Submit**.

Before every new upload, raise `ios.buildNumber` (and `version` for a new store version) in `app.json`.

### What was set up for review

- **iPad:** `supportsTablet` + `requireFullScreen`. The game is portrait only, and iPad multitasking would require every orientation.
- **No background audio:** `expo-audio` has `enableBackgroundPlayback: false`. Without it, iOS gets `UIBackgroundModes: audio`, which Apple rejects for a game that doesn't play in the background. On Android the same setting avoids the foreground-service permission, which needs its own Play declaration.
- **Privacy manifest:** `NSPrivacyTracking: false`, no tracking domains, no collected data types.
- **Export compliance:** `ITSAppUsesNonExemptEncryption: false`.
- **Android permissions:** recording, overlay, storage and foreground-service permissions are blocked in `app.json`.

## 3. Checklist

**Google Play**
- [ ] Privacy policy URL
- [ ] App icon 512 × 512 – `graphics/play-store-icon-512.png`
- [ ] Feature graphic 1024 × 500 – `graphics/play-feature-graphic-1024x500.png`
- [ ] Header image 5244 × 2950 or 3840 × 1646 – `graphics/play-header-*.png`
- [ ] Phone screenshots – `screenshots/android-phone/`
- [ ] 7" tablet screenshots – `screenshots/android-tablet-7/`
- [ ] 10" tablet screenshots – `screenshots/android-tablet-10/`
- [ ] Short and full description
- [ ] Category Simulation, contact e-mail
- [ ] Content rating (IARC) questionnaire
- [ ] Target audience
- [ ] Ads = No
- [ ] Data safety = no data collected
- [ ] App access = no login
- [ ] AAB uploaded to a testing track, then to production

**App Store**
- [ ] Privacy policy URL + support URL
- [ ] iPhone 6.9" screenshots – `screenshots/ios-iphone-6.9/`
- [ ] iPad 13" screenshots – `screenshots/ios-ipad-13/`
- [ ] (optional) iPhone 6.5" / 6.3" – `screenshots/ios-iphone-6.5/`, `screenshots/ios-iphone-6.3/`
- [ ] Name, subtitle, promotional text, description, keywords
- [ ] Category Games → Simulation / Casual
- [ ] Age rating 4+
- [ ] Copyright
- [ ] App Privacy → Data Not Collected
- [ ] Review notes, contact details
- [ ] Build uploaded with EAS and selected for the version

## 4. Regenerating assets

The screenshots are real captures of the app running in Expo Go on an Android emulator. For each store size the display is resized with `wm size` / `wm density`, so the phone, tablet and iPad shots are true layouts of the app, not scaled copies.

```bash
npx expo start --go                            # Metro; then open exp://127.0.0.1:8081 in Expo Go once
adb reverse tcp:8081 tcp:8081
node store/tools/capture-screenshots.mjs       # raw captures for every size (or pass one device key)
npm install --no-save playwright-core
node store/tools/render-graphics.mjs           # captions, feature graphic, store icons (needs Edge or Chrome)
```

The capture script loads a mid-game save through the development-only `/?demo=1` route ([src/dev/demoSave.ts](../src/dev/demoSave.ts)). Production builds ignore this route.

## 5. Keep these safe

The Android upload keystore and its password are not committed to git. Both are on this PC only:

- `credentials/android/tiny-repair-shop-upload.jks`, alias `tiny-repair-shop`
- the store and key passwords, in `credentials.json`

Keep copies in a password manager or another secure backup. If the upload key is lost, it can be reset through Play Console support (Play App Signing), but that takes days.

Upload key fingerprints (Play Console shows these under **App integrity**):
- SHA-1 `72:70:21:C6:FA:C7:37:88:22:8D:BF:68:D2:2D:37:7F:D9:CA:2E:66`
- SHA-256 `80:7F:E1:B9:4B:CF:0E:68:82:B7:45:72:55:97:47:F0:9B:8E:AD:89:DE:19:80:79:30:5D:60:CD:9D:FC:24:FE`

## Troubleshooting

- **"Failed to download remote update" in Expo Go:** the emulator clock is behind. Expo signs the manifest with a certificate the device then treats as not yet valid. Fix the clock with `adb root` and `adb shell date -u MMDDhhmmYYYY.ss`.
- **Expo Go's floating developer button shows in shots:** turn off *Tools button* in the Expo Go developer menu.
