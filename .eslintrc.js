module.exports = {
  root: true,
  extends: '@react-native',
  globals: {
    // RN/JSC supports globalThis, but some eslint configs don't declare it.
    globalThis: 'readonly',
  },
};
