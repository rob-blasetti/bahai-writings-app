import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNavigationBar } from '../components/BottomNavigationBar';
import { BOTTOM_TAB_KEYS } from './BottomTabs';
import TabStackNavigator from './TabStackNavigator';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator({ renderScreenSurface, screenState }) {
  const tabBar = useCallback(
    ({ state, navigation, insets }) => {
      const activeTab = state.routeNames[state.index];
      return (
        <BottomNavigationBar
          activeTab={activeTab}
          onTabPress={tabKey => {
            const route = state.routes.find(item => item.name === tabKey);
            if (!route) {
              return;
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(tabKey);
            }
          }}
          safeAreaInsets={insets}
        />
      );
    },
    [],
  );

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={tabBar}>
      {BOTTOM_TAB_KEYS.map(tabKey => (
        <Tab.Screen key={tabKey} name={tabKey}>
          {() => (
            <TabStackNavigator
              tabKey={tabKey}
              renderScreenSurface={renderScreenSurface}
              screenState={screenState}
            />
          )}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}
