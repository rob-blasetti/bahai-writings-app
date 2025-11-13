export const BOTTOM_TAB_KEYS = ['home', 'search', 'profile', 'myVerses'];
export const BOTTOM_TAB_SET = new Set(BOTTOM_TAB_KEYS);

export function isBottomTabRoute(routeName) {
  return BOTTOM_TAB_SET.has(routeName);
}
