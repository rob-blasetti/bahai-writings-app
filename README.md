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

- `App.jsx` – main application entry point and navigation.
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

For deeper debugging tips, consult the official [React Native troubleshooting guide](https://reactnative.dev/docs/troubleshooting).
