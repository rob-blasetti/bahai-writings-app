# Baha'i Writings App

A React Native application for reading and searching from a curated collection of Baha'i writings. The app parses source XHTML files, generates an in-app JSON library, and serves the texts through a mobile-friendly interface.

## Features

- Parses XHTML source documents into a searchable JSON catalog.
- Supports both Android and iOS builds with the standard React Native toolchain.
- Ships with scripts for updating the writings library and bundling assets.
- Written in modern JavaScript with Jest tests and Metro bundling.

## Requirements

- Node.js 18+ and npm (or Yarn) installed.
- iOS builds: Xcode with Command Line Tools, Ruby, and CocoaPods.
- Android builds: Android Studio, SDK platform tools, and an emulator or device.

Complete the official React Native [environment setup](https://reactnative.dev/docs/environment-setup) before continuing.

## Getting Started

```sh
npm install
npm start           # starts Metro in watch mode
npm run ios         # runs the iOS app (Metro must be running)
npm run android     # runs the Android app (Metro must be running)
```

Start Metro in one terminal, then launch the desired platform from another terminal or directly inside Xcode/Android Studio.

## Updating the Writings Library

1. Drop XHTML source files into `assets/writings/`.
2. Install dependencies for the parser if you have not already: `npm install`.
3. Run `npm run process:writings` to regenerate `assets/generated/writings.json`. This script scans every XHTML file, extracts metadata and body text, and writes the consolidated JSON payload consumed by the app.
4. Restart the app or reload the simulator to see the new content.

Any time you add, remove, or modify a writing, rerun the script so the manifest stays consistent.

## Project Structure

- `src/app/` – top-level `App.js` and `AppContent.js` plus navigation wiring.
- `src/screens/` – all user-facing screens (Start, SignIn, Library, etc.).
- `src/components/` – shared UI pieces like navigation bars and modals.
- `src/auth`, `src/programs`, `src/sharing`, `src/myVerses`, `src/reflection` – domain contexts, services, and utilities.
- `src/writings/` – helpers for parsing, searching, and formatting writings.
- `src/styles/` – shared color palettes, typography, and component style sheets.
- `assets/writings/` – raw XHTML source files to ingest.
- `assets/generated/writings.json` – auto-generated library used at runtime.
- `scripts/` – helper utilities, including the writings processing script.
- `__tests__/` – Jest test suites.

## Useful Scripts

- `npm test` – run the Jest test suite.
- `npm run lint` – lint the JavaScript codebase (if configured).
- `npm run process:writings` – regenerate the writings JSON library.
- `npm run bundle:ios` / `npm run bundle:android` – generate release bundles (when defined).

## Troubleshooting

- Metro stuck? Stop running instances and clear caches with `npx react-native start --reset-cache`.
- iOS build failures related to pods: `bundle install && bundle exec pod install --project-directory=ios`.
- Android build issues: ensure the emulator is running and that `ANDROID_HOME` points to your SDK directory.

## TestFlight Distribution

Fastlane lives in `ios/fastlane/` and mirrors the `liquid_spirit_memorise` workflow, targeting the bundle ID `com.liquidspirit.kali` (SKU `com.liquidspirit.kali` in App Store Connect).

1. Install Ruby dependencies from the `ios` folder: `cd ios && bundle install`.
2. Provide credentials in the project root `.env` (git-ignored) or another env file referenced via `FASTLANE_ENVFILE`. Required keys: `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, and `ASC_KEY_FILE`.
3. (Optional) duplicate your `.env` to variants like `.env.production` and launch Fastlane with `FASTLANE_ENVFILE=.env.production`.
4. From the `ios` directory run `bundle exec fastlane ios beta` to build and upload, or `bundle exec fastlane ios beta_dry` for a rehearsal.

The lane automatically pulls signing assets with `match`, bumps the build number, compiles `bahai_writings_app.xcworkspace`, and uploads through your App Store Connect API key.

For deeper debugging tips, consult the official [React Native troubleshooting guide](https://reactnative.dev/docs/troubleshooting).
