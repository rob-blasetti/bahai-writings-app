import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';
import { BOTTOM_TAB_SET } from './BottomTabs';

export function useAppNavigation({
  initialRouteName = 'start',
  initialTab = 'explore',
} = {}) {
  const navigationRef = useNavigationContainerRef();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const pendingNavigationRef = useRef(null);
  const [currentScreen, setCurrentScreen] = useState(initialRouteName);

  const navigationReady = isNavigationReady && navigationRef.isReady();

  const flushPendingNavigation = useCallback(() => {
    if (!navigationReady || !pendingNavigationRef.current) {
      return;
    }
    const { screenName, params } = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    if (BOTTOM_TAB_SET.has(screenName)) {
      navigationRef.navigate('tabs', { screen: screenName, params });
      return;
    }
    if (params) {
      navigationRef.navigate(screenName, params);
    } else {
      navigationRef.navigate(screenName);
    }
  }, [navigationReady, navigationRef]);

  useEffect(() => {
    flushPendingNavigation();
  }, [flushPendingNavigation]);

  const navigateToScreen = useCallback(
    (screenName, params) => {
      if (navigationReady) {
        if (BOTTOM_TAB_SET.has(screenName)) {
          navigationRef.navigate('tabs', { screen: screenName, params });
          return;
        }
        if (params) {
          navigationRef.navigate(screenName, params);
        } else {
          navigationRef.navigate(screenName);
        }
        return;
      }
      pendingNavigationRef.current = { screenName, params };
    },
    [navigationReady, navigationRef],
  );

  const handleNavigationReady = useCallback(() => {
    setIsNavigationReady(true);
    const initialRoute = navigationRef.getCurrentRoute();
    if (initialRoute?.name) {
      setCurrentScreen(initialRoute.name);
    }
  }, [navigationRef]);

  const handleNavigationStateChange = useCallback(() => {
    const nextRouteName = navigationRef.getCurrentRoute()?.name;
    if (nextRouteName) {
      setCurrentScreen(previous =>
        previous === nextRouteName ? previous : nextRouteName,
      );
    }
  }, [navigationRef]);

  const goBack = useCallback(() => {
    if (navigationReady) {
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return;
      }
      navigateToScreen(initialTab);
      return;
    }
    pendingNavigationRef.current = { screenName: initialTab, params: null };
  }, [initialTab, navigateToScreen, navigationReady, navigationRef]);

  return {
    navigationRef,
    currentScreen,
    navigateToScreen,
    handleNavigationReady,
    handleNavigationStateChange,
    goBack,
  };
}
