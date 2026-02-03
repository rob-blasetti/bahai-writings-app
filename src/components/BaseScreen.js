import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNav from './TopNav';

const TABLET_MIN_SIZE = 768;
const MAX_CONTENT_WIDTH = 960;
const APP_BACKGROUND = '#f7f4ef';
const SURFACE_BACKGROUND = '#ffffff';

export default function BaseScreen({
  styles,
  children,
  variant = 'card',
  style,
  containerStyle,
  maxWidth: maxWidthOverride,
  includeBottomInset = false,
  topNav,
  ...rest
}) {
  const { width, height } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const shortestSide = Math.min(width, height);
  const isTablet = shortestSide >= TABLET_MIN_SIZE;

  const resolvedMaxWidth =
    typeof maxWidthOverride === 'number'
      ? maxWidthOverride
      : isTablet
      ? MAX_CONTENT_WIDTH
      : undefined;

  const appBackgroundColor = styles?.container?.backgroundColor ?? APP_BACKGROUND;
  const surfaceBackgroundColor =
    styles?.screenSurface?.backgroundColor ?? SURFACE_BACKGROUND;

  const resolvedTopNav = topNav === true ? {} : topNav;
  const showTopNav =
    Boolean(resolvedTopNav) && resolvedTopNav?.show !== false;

  const baseSurfaceStyle = useMemo(() => {
    const shouldUseSurface = variant !== 'plain';
    // Clamp width on tablets for ALL variants except "full".
    // This keeps layouts readable on iPad while still allowing full-bleed screens when needed.
    const shouldClampWidth = variant !== 'full';
    const shouldUseSection = variant === 'section';
    const cardPadding = isTablet ? 28 : 20;

    return [
      shouldUseSurface ? styles?.screenSurface : null,
      shouldUseSection ? styles?.sectionScreenSurface : null,
      { flex: 1, width: '100%' },
      shouldUseSurface ? { backgroundColor: surfaceBackgroundColor } : null,
      shouldClampWidth && resolvedMaxWidth
        ? { maxWidth: resolvedMaxWidth }
        : null,
      variant === 'card' ? { padding: cardPadding } : null,
      style,
    ];
  }, [
    isTablet,
    resolvedMaxWidth,
    style,
    styles,
    surfaceBackgroundColor,
    variant,
  ]);

  return (
    <View
      style={[
        {
          flex: 1,
          width: '100%',
          alignItems: 'center',
          backgroundColor: appBackgroundColor,
          paddingTop: safeAreaInsets.top,
          paddingLeft: safeAreaInsets.left,
          paddingRight: safeAreaInsets.right,
          paddingBottom: includeBottomInset ? safeAreaInsets.bottom : 0,
        },
        containerStyle,
      ]}
    >
      <View style={baseSurfaceStyle} {...rest}>
        {showTopNav ? <TopNav styles={styles} {...resolvedTopNav} /> : null}
        {children}
      </View>
    </View>
  );
}
