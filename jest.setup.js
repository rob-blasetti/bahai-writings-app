// Jest setup for React Native.

// Many native modules need mocks in a pure JS test environment.
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: props => React.createElement('WebView', props, props.children),
  };
});

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(async () => ({ didCancel: true })),
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));

jest.mock('react-native-view-shot', () => {
  const React = require('react');
  return props => React.createElement('ViewShot', props, props.children);
});

jest.mock('react-native-video', () => {
  const React = require('react');
  return props => React.createElement('Video', props, props.children);
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const DateTimePicker = props => React.createElement('DateTimePicker', props, props.children);
  const DateTimePickerAndroid = { open: jest.fn() };
  return {
    __esModule: true,
    default: DateTimePicker,
    DateTimePickerAndroid,
  };
});

jest.mock('react-native-config', () => ({
  DEV_API: '',
}));
