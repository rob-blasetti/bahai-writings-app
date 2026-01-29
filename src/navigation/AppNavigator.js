import React from 'react';
import BottomTabNavigator from './BottomTabNavigator';

export default function AppNavigator({ renderScreenSurface, screenState }) {
  return (
    <BottomTabNavigator
      renderScreenSurface={renderScreenSurface}
      screenState={screenState}
    />
  );
}
