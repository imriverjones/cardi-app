# Cardi

What to wear, how your hair will behave and when you need SPF, for the hours you're actually outside. With a "feels like" that's tuned to you.

Built with Expo (React Native) for iPhone, with native Home Screen and Lock Screen widgets.

---

## Getting it onto your iPhone (no Mac needed)

You'll do this once. It takes about 30–45 minutes, mostly waiting for the build.

### What you need

- An **Apple Developer account** (you have one)
- A free **Expo account**: sign up at [expo.dev](https://expo.dev)
- The **TestFlight** app on your iPhone (free on the App Store)

### 1. Open the project in your browser

You don't need to install anything on your laptop.

1. On GitHub, open this repo, click the green **Code** button, then the **Codespaces** tab, then **Create codespace on main**.
2. Wait a minute or two. A code editor opens in your browser and installs everything automatically.
3. At the bottom there's a **Terminal**. That's where you'll paste the commands below.

### 2. Connect to Expo

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

`init` asks to create a project called "cardi". Say yes. It adds a project ID to `app.json`.

### 3. Build the app

```bash
npx eas-cli@latest build -p ios --profile production
```

It asks a few questions. Say yes to everything, and log in with your Apple ID when asked. Expo then:

- creates the app's ID (`com.imriverjones.cardi`) and the widget's ID in your Apple account
- sets up the shared storage the widget uses (App Group `group.com.imriverjones.cardi`)
- creates the signing certificates
- builds the app in the cloud (about 15–25 minutes)

> **If the bundle ID is taken:** change `com.imriverjones.cardi` in `app.json` (both places) and `group.com.imriverjones.cardi` to something else, then run the build again.

### 4. Send it to TestFlight

```bash
npx eas-cli@latest submit -p ios --latest
```

The first time, this creates the app in App Store Connect. App Store names must be unique, so if "Cardi" is taken, it'll ask for another, for example "Cardi: What to Wear".

Apple takes 10–30 minutes to process the build. Then open **TestFlight** on your iPhone and install Cardi.

### 5. Save your changes

In the Codespace terminal:

```bash
git add app.json && git commit -m "Link Expo project" && git push
```

### 6. Add the widgets

On your Home Screen, long-press an empty spot, tap **Edit → Add Widget**, search for **Cardi**, and pick a size. There's also a **Cardi check-in** widget with "Bit chilly / Spot on / Too warm" buttons. For the Lock Screen, long-press it, tap **Customise → Lock Screen**, and add Cardi under the clock.

---

## Automatic builds (optional, after the first build)

Once step 3 has worked, every push to `main` can build and send to TestFlight on its own:

1. In the [Expo dashboard](https://expo.dev), open the **cardi** project, go to **Project settings → GitHub**, and connect this repo.
2. That's it. The workflow in `.eas/workflows/testflight.yml` runs on every push to `main`.

---

## How it works

| Part | Where |
|---|---|
| Screens (Today, Week, Me, setup, stories, place search) | `src/app/` |
| Advice engine: personal feels like, outfit, hair, rain, UV, commute, school run, drying day | `src/engine/advice.ts` |
| Weather (Open-Meteo hourly forecast) and location | `src/weather/forecast.ts` |
| Settings and app state | `src/state/app-state.tsx` |
| Home and Lock Screen widget | `src/widgets/CardiWidget.tsx` |
| Interactive check-in widget | `src/widgets/CheckInWidget.tsx` |
| Widget timeline (morning → heading home → tomorrow) | `src/widgets/sync.ts` |
| Background refresh | `src/tasks/background.ts` |
| Looks (Blush, Stone, Night) | `src/theme/skins.ts` |

**Your feels like.** The forecast's standard "feels like" (apparent temperature) for the hours you're out, adjusted by about 1.5° per step of "I run cold/warm", minus 2° if you cycle or 1° if you wait for a bus. Every "bit chilly / too warm" tap moves it one step.

**The widget** is written in React using Expo UI's SwiftUI components and runs natively. The app works out the whole day once and gives iOS a timeline, so the widget switches from the morning view to "heading home" (2 hours before you leave work) to tomorrow's outfit (after you get home) without the app being open. A background task refreshes the forecast a few times a day.

---

## Before launch

- **Weather licence.** Open-Meteo's free API is for non-commercial use. Before charging or launching publicly, switch to their paid plan, or to Apple WeatherKit (free up to 500,000 calls a month with your developer account).
- **App Store listing.** You'll need screenshots (the canvas designs work), a privacy policy URL (location is only used for weather, nothing is collected), and a support URL.
- **Android.** The app runs on Android, but the widgets are iPhone-only for now.

## Developing

```bash
npm install
npx expo start          # needs a development build for widgets; Expo Go works for the screens only
npx tsc --noEmit        # typecheck
npx expo lint           # lint
```
