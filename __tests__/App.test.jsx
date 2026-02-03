/* eslint-env jest */
/**
 * @format
 */

// This is a lightweight smoke test to ensure the JS entry point loads under Jest.
// Rendering the full app tree requires extensive native module mocks.

const AppModule = require('../src/app/App');
const App = AppModule.default ?? AppModule;

test('App module loads', () => {
  expect(App).toBeTruthy();
  expect(typeof App).toBe('function');
});
