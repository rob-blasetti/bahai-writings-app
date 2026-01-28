import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Stack from './StackNavigator';
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import { useAppNavigation } from './useAppNavigation';
import BottomTabNavigator from './BottomTabNavigator';

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

export { Stack };
export { AppNavigator, AuthNavigator, BottomTabNavigator, useAppNavigation };
export { BOTTOM_TAB_KEYS, BOTTOM_TAB_SET, isBottomTabRoute } from './BottomTabs';
