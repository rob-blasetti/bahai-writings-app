import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'search', label: 'Search', icon: 'search-outline', activeIcon: 'search' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  {
    key: 'myVerses',
    label: 'My Verses',
    icon: 'bookmark-outline',
    activeIcon: 'bookmark',
  },
];

export function BottomNavigationBar({
  activeTab = 'home',
  onTabPress,
  style,
  safeAreaInsets,
  iconSize = 22,
}) {
  const bottomInset = Math.max(safeAreaInsets?.bottom ?? 0, 8);

  return (
    <View style={[styles.container, style, { paddingBottom: bottomInset }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const tintColor = isActive ? '#3b2a15' : '#a28a6c';
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress?.(tab.key)}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={iconSize}
              color={tintColor}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fffdf8',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d7c7a9',
    paddingHorizontal: 16,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#8c7152',
  },
  tabLabelActive: {
    color: '#3b2a15',
  },
});

