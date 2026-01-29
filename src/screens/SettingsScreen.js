import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BaseScreen from '../components/BaseScreen';
import ScreenTitle from '../components/ScreenTitle';

export default function SettingsScreen({
  styles,
  onLogout,
}) {
  const navigation = useNavigation();
  const noop = () => {};
  const handleOpenPrivacyPolicy = () => {
    navigation.navigate('web', {
      title: 'Privacy Policy',
      url: 'https://liquidspirit.org/privacy-policy',
    });
  };
  const handleOpenEulaPolicy = () => {
    navigation.navigate('web', {
      title: 'EULA Policy',
      url: 'https://www.liquidspirit.org/eula',
    });
  };

  const sections = [
    {
      title: 'Community',
      rows: [{ label: 'Invite Friends' }],
    },
    {
      title: 'Preferences',
      rows: [{ label: 'Notifications' }],
    },
    {
      title: 'Help',
      rows: [{ label: 'Support' }],
    },
    {
      title: 'Legal',
      rows: [
        { label: 'Privacy Policy', onPress: handleOpenPrivacyPolicy },
        { label: 'EULA Policy', onPress: handleOpenEulaPolicy },
      ],
    },
    {
      title: 'Account',
      rows: [
        { label: 'Account Center' },
        { label: 'Account Verification' },
        {
          label: 'Log Out',
          onPress: onLogout,
          destructive: true,
          iconName: 'log-out-outline',
        },
      ],
    },
  ];

  return (
    <BaseScreen styles={styles} variant="plain" style={styles.homeContainer}>
      <ScreenTitle styles={styles} title="Settings" />
      <ScrollView
        contentContainerStyle={styles.settingsScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map(section => (
          <View key={section.title} style={styles.settingsGroup}>
            <Text style={styles.settingsGroupLabel}>{section.title}</Text>
            {section.rows.map(row => {
              const isDestructive = row.destructive;
              const iconColor = isDestructive ? '#b0302a' : '#8c7152';
              const iconName = row.iconName ?? 'chevron-forward';
              return (
                <TouchableOpacity
                  key={row.label}
                  onPress={row.onPress ?? noop}
                  style={[styles.settingsOption, styles.settingsRow]}
                  accessibilityRole="button"
                  accessibilityLabel={row.label}
                >
                  <Text
                    style={[
                      styles.settingsOptionLabel,
                      isDestructive && styles.settingsRowLabelDestructive,
                    ]}
                  >
                    {row.label}
                  </Text>
                  <Ionicons
                    name={iconName}
                    size={18}
                    color={iconColor}
                    style={styles.settingsRowIcon}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </BaseScreen>
  );
}
