/* eslint-env jest */
/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders empty state when no writings are available', async () => {
  let renderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const emptyStateMessage = renderer.root.findAll(
    node =>
      typeof node.props.children === 'string' &&
      node.props.children.includes('No writings available yet.'),
  );

  expect(emptyStateMessage.length).toBeGreaterThan(0);
});
