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
  const [currentTab, setCurrentTab] = useState(initialTab);

  const navigationReady = isNavigationReady && navigationRef.isReady();

  const getHasTabs = useCallback(() => {
    const rootState = navigationRef.getRootState();
    const routeNames = rootState?.routeNames ?? [];
    return routeNames.some(name => BOTTOM_TAB_SET.has(name));
  }, [navigationRef]);

  const updateCurrentRoutes = useCallback(() => {
    const nextRouteName = navigationRef.getCurrentRoute()?.name;
    if (nextRouteName) {
      setCurrentScreen(previous =>
        previous === nextRouteName ? previous : nextRouteName,
      );
    }
    const rootState = navigationRef.getRootState();
    const nextTab = rootState?.routes?.[rootState.index]?.name;
    if (nextTab && BOTTOM_TAB_SET.has(nextTab)) {
      setCurrentTab(nextTab);
    }
  }, [navigationRef]);

  const navigateToScreen = useCallback(
    (screenName, params) => {
      if (navigationReady) {
        const hasTabs = getHasTabs();
        if (BOTTOM_TAB_SET.has(screenName)) {
          if (params) {
            navigationRef.navigate(screenName, params);
          } else {
            navigationRef.navigate(screenName);
          }
          return;
        }
        if (hasTabs) {
          const tabTarget = currentTab ?? initialTab;
          navigationRef.navigate(tabTarget, { screen: screenName, params });
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
    [currentTab, getHasTabs, initialTab, navigationReady, navigationRef],
  );

  const flushPendingNavigation = useCallback(() => {
    if (!navigationReady || !pendingNavigationRef.current) {
      return;
    }
    const { screenName, params } = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    if (params) {
      navigateToScreen(screenName, params);
    } else {
      navigateToScreen(screenName);
    }
  }, [navigateToScreen, navigationReady]);

  useEffect(() => {
    flushPendingNavigation();
  }, [flushPendingNavigation]);

  const handleNavigationReady = useCallback(() => {
    setIsNavigationReady(true);
    updateCurrentRoutes();
  }, [updateCurrentRoutes]);

  const handleNavigationStateChange = useCallback(() => {
    updateCurrentRoutes();
  }, [updateCurrentRoutes]);

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
