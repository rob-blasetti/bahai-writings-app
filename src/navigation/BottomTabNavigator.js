import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ExploreScreen from '../screens/ExploreScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyVersesScreen from '../screens/MyVersesScreen';
import { BottomNavigationBar } from '../components/BottomNavigationBar';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator({ renderScreenSurface, screenState }) {
  const { styles, scaledTypography, displayName, content, profile, verses, handlers } =
    screenState;

  const { searchableSections, renderBlockContent } = content;
  const { email: profileEmail, memberRef, isAuthenticated } = profile;
  const { items: myVerses } = verses;

  const {
    readWritings,
    openPrayers,
    chooseRandom,
    createDevotional,
    openSearchResult,
    removeVerse,
  } = handlers;

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
      <Tab.Screen name="explore">
        {() =>
          renderScreenSurface(
            <ExploreScreen
              styles={styles}
              onReadWritings={readWritings}
              onOpenPrayers={openPrayers}
              onChooseRandom={chooseRandom}
              onCreateDevotional={createDevotional}
            />,
          )
        }
      </Tab.Screen>
      <Tab.Screen name="search">
        {() =>
          renderScreenSurface(
            <SearchScreen
              styles={styles}
              scaledTypography={scaledTypography}
              searchableSections={searchableSections}
              onSelectSection={openSearchResult}
            />,
          )
        }
      </Tab.Screen>
      <Tab.Screen name="profile">
        {() =>
          renderScreenSurface(
            <ProfileScreen
              styles={styles}
              displayName={displayName}
              email={profileEmail}
              memberRef={memberRef}
              isAuthenticated={isAuthenticated}
            />,
          )
        }
      </Tab.Screen>
      <Tab.Screen name="myVerses">
        {() =>
          renderScreenSurface(
            <MyVersesScreen
              styles={styles}
              scaledTypography={scaledTypography}
              verses={myVerses}
              renderBlockContent={renderBlockContent}
              onRemoveVerse={removeVerse}
            />,
          )
        }
      </Tab.Screen>
    </Tab.Navigator>
  );
}
