import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const DEFAULT_INSETS = {
  top: 0,
  bottom: 24,
  horizontal: 24,
};

const normalizeInsets = insets => {
  if (typeof insets === 'number') {
    return {
      top: insets,
      bottom: insets,
      horizontal: insets,
    };
  }
  if (!insets || typeof insets !== 'object') {
    return DEFAULT_INSETS;
  }
  return {
    top:
      typeof insets.top === 'number'
        ? insets.top
        : typeof insets.vertical === 'number'
        ? insets.vertical
        : DEFAULT_INSETS.top,
    bottom:
      typeof insets.bottom === 'number'
        ? insets.bottom
        : typeof insets.vertical === 'number'
        ? insets.vertical
        : DEFAULT_INSETS.bottom,
    horizontal:
      typeof insets.horizontal === 'number'
        ? insets.horizontal
        : typeof insets.left === 'number' || typeof insets.right === 'number'
        ? Math.max(
            typeof insets.left === 'number' ? insets.left : DEFAULT_INSETS.horizontal,
            typeof insets.right === 'number' ? insets.right : DEFAULT_INSETS.horizontal,
          )
        : DEFAULT_INSETS.horizontal,
  };
};

const renderTextContent = (content, defaultStyle, overrideStyle) => {
  if (content == null || content === false) {
    return null;
  }
  if (typeof content === 'string') {
    return (
      <Text style={[defaultStyle, overrideStyle]}>
        {content}
      </Text>
    );
  }
  return content;
};

export function Passage({
  eyebrow,
  eyebrowStyle,
  title,
  titleStyle,
  subtitle,
  subtitleStyle,
  meta,
  metaStyle,
  rightAccessory = null,
  children,
  style,
  contentStyle,
  contentInsets,
}) {
  const insetValues = normalizeInsets(contentInsets);
  const headerHasContent =
    eyebrow || title || subtitle || meta || Boolean(rightAccessory);
  const bodyTopPadding = insetValues.top + 8;

  return (
    <View style={[styles.container, style]}>
      {headerHasContent ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {renderTextContent(eyebrow, styles.eyebrow, eyebrowStyle)}
            {renderTextContent(title, styles.title, titleStyle)}
            {renderTextContent(subtitle, styles.subtitle, subtitleStyle)}
            {renderTextContent(meta, styles.meta, metaStyle)}
          </View>
          {rightAccessory ? (
            <View style={styles.headerAccessory}>{rightAccessory}</View>
          ) : null}
        </View>
      ) : null}
      <View
        style={[
          styles.body,
          {
            paddingTop: bodyTopPadding,
            paddingBottom: insetValues.bottom,
            paddingHorizontal: insetValues.horizontal,
          },
          contentStyle,
        ]}
      >
        {typeof children === 'string' ? (
          <Text style={styles.bodyText}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

export default Passage;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e3dfd7',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  headerAccessory: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: '#555555',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#111111',
    marginTop: 2,
  },
  meta: {
    fontSize: 14,
    color: '#2e2e2e',
    marginTop: 6,
  },
  body: {
    paddingHorizontal: DEFAULT_INSETS.horizontal,
    paddingTop: DEFAULT_INSETS.top,
    paddingBottom: DEFAULT_INSETS.bottom,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#000000',
    marginTop: 4,
  },
});
