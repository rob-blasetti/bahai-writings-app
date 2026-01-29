import { isBottomTabRoute } from './BottomTabs';

export const DEFAULT_STACK_OPTIONS = {
  headerShown: false,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  animation: 'slide_from_right',
};

export function getStackScreenOptions({ route }) {
  if (isBottomTabRoute(route?.name)) {
    return {
      ...DEFAULT_STACK_OPTIONS,
      gestureEnabled: false,
      fullScreenGestureEnabled: false,
      animation: 'none',
    };
  }
  return DEFAULT_STACK_OPTIONS;
}
