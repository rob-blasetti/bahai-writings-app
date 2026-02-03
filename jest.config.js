module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Some RN dependencies ship modern ESM/TS; allow Jest/Babel to transform them.
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-vector-icons|react-native-webview|react-native-image-picker|react-native-view-shot|react-native-video|react-native-config|@react-native-async-storage)/)',
  ],
};
