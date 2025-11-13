import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

export function AppNavigationContainer({
  children,
  navigationRef,
  onReady,
  onStateChange,
}) {
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onReady}
      onStateChange={onStateChange}
    >
      {children}
    </NavigationContainer>
  );
}

export { default as Stack } from './StackNavigator';
export { BOTTOM_TAB_KEYS, BOTTOM_TAB_SET, isBottomTabRoute } from './BottomTabs';
