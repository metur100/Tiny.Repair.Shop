# Google Play – store listing & Play Console answers

Copy each block into Play Console. Each heading notes the field's character limit, and every text below fits within it.

## Main store listing (Grow users → Store presence → Main store listing)

**App name** (max 30)
```
Tiny Repair Shop: Cozy Fixing
```

**Short description** (max 80)
```
Fix, clean and paint treasured objects in your own cozy little repair workshop.
```

**Full description** (max 4000)
```
Welcome to your own tiny repair shop!

Customers bring in their broken treasures – a crackling kitchen radio, a bike with a flat tyre, a robot that only speaks gibberish, a ukulele with a snapped string. Inspect each object, scrub it clean, fix it with your own hands, paint it just the way they want and test it. Then hand it back and watch their face light up.

SEVEN STEPS TO A HAPPY CUSTOMER
• Job board – pick a customer, check the difficulty, reward and any special request
• Inspect – tap suspicious spots, turn the object around, zoom in and listen, then name the fault
• Clean – swipe away dust, grease, rust and mud until it sparkles
• Repair – connect wires, fit chains, pump tyres, tune strings, polish lenses, fix pixels and more
• Paint – choose colours, patterns, finishes, stickers and an accessory
• Test – tune the radio, ride the bike, play the melody, snap a photo
• Deliver – compare before and after, earn stars, coins and the customer's thanks

A COZY WORKSHOP THAT GROWS WITH YOU
• 30 handcrafted jobs across 6 stages
• 6 object types: radios, bicycles, robots, musical instruments, cameras and arcade machines
• 22 different hands-on repair mini-games
• 16 customers with 8 personalities – the perfectionist, the busy commuter, the sentimental grandparent and more each judge your work differently
• 11 workshop upgrades you can see in the room: a cleaning sink, a robot station, a music corner, an arcade room and more
• A new daily special every day
• A collection of every object you have restored

RELAXED AND FAIR
• Take your time – exploring is never punished
• Gentle hints whenever you get stuck
• Everything is earned by playing

PLAY YOUR WAY
• Works completely offline – no account, no sign-up
• No ads, no in-app purchases, no data collected
• Accessibility: high contrast mode, reduced motion, large touch targets, text labels on every colour cue and a button alternative for every drag
• Original illustrated art, cheerful music and sound effects, with haptic feedback

Fix it. Clean it. Paint it. Love it.
```

**App icon:** `store/graphics/play-store-icon-512.png` (512 × 512)
**Feature graphic:** `store/graphics/play-feature-graphic-1024x500.png` (1024 × 500)
**Header image** (Kopfzeilen-Inhalt): `store/graphics/play-header-5244x2950.png` (5244 × 2950) or `store/graphics/play-header-3840x1646.png` (3840 × 1646)

**Phone screenshots** (upload all 9 in order): `store/screenshots/android-phone/01…09.png` (1080 × 1920)
**7-inch tablet screenshots:** `store/screenshots/android-tablet-7/01…09.png` (1200 × 1920)
**10-inch tablet screenshots:** `store/screenshots/android-tablet-10/01…09.png` (1600 × 2560)

Uncaptioned versions of every screenshot are in `store/screenshots/raw/<device>/` (also valid for Play).

## Store settings (Grow users → Store presence → Store settings)

| Field | Value |
| --- | --- |
| App or game | Game |
| Category | **Simulation** (alternative: Casual) |
| Tags (up to 5) | Cozy, Simulation, Relaxing, Offline, Casual (pick the closest available tags) |
| Email address | certidevelopment@gmail.com |
| Website | https://metur100.github.io/Tiny.Repair.Shop.Landing/ |
| Phone | (optional) |

## App content (Policy → App content)

| Section | Answer |
| --- | --- |
| **Privacy policy** | https://metur100.github.io/Tiny.Repair.Shop.Landing/privacy.html |
| **Ads** | **No**, my app does not contain ads |
| **App access** | All functionality is available without special access (no login) |
| **Content rating** | Fill in the IARC questionnaire (see below) |
| **Target audience and content** | See below |
| **News app** | No |
| **Data safety** | See below |
| **Government apps** | No |
| **Financial features** | My app doesn't provide any financial features |
| **Health** | My app doesn't have any health features |
| **Advertising ID** | **No**, the app does not use an advertising ID |

### Target audience and content

The friendly cartoon style means Google may treat the game as appealing to children. You have two options:

- **Simple (recommended for the first release):** choose the age groups **13–15, 16–17, 18 and over**. When asked whether the store listing could unintentionally appeal to children, answer honestly. If Google decides the app appeals to children, it asks for the Families details below.
- **Include children (5–12):** the app already meets the Families policy. It has no ads, no data collection, no external links and no purchases. Selecting under-13 groups adds the Families review and the "Teacher Approved" eligibility questions.

### Content rating questionnaire (IARC)

- Email: certidevelopment@gmail.com · Category: **Game**
- Violence: **No** · Blood: **No** · Fear / horror: **No** · Sexuality / nudity: **No** · Language: **No**
- Controlled substances: **No** · Crude humour: **No** · Gambling or simulated gambling: **No**. The coins are earned in game and can't be bought.
- User interaction / chat / user-generated content: **No**
- Shares user location: **No** · Allows purchases of digital goods: **No**
- Expected result: **PEGI 3 / ESRB Everyone / USK 0 / IARC 3+**

### Data safety

- Does your app collect or share any of the required user data types? **No**

This answer is accurate:
- The game makes no network requests.
- Progress and settings are saved only on the device (AsyncStorage). They are removed when the app is uninstalled, or with **Settings → Reset progress**.
- There is no analytics, crash reporting, advertising or account system.

## Release

- **Countries/regions:** all (or as you prefer)
- **Price:** Free
- **App bundle:** the `.aab` from `eas build -p android --profile production` (download link printed by EAS; keep a copy in `store/builds/`)
- **Release name:** `1.0.0 (1)`
- **Release notes** (en-US):
```
<en-US>
Welcome to Tiny Repair Shop! Fix, clean, paint and test treasured objects for friendly customers – 30 cozy jobs, a daily special and a workshop that grows with you.
</en-US>
```
