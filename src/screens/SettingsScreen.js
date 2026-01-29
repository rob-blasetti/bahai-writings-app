import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';
import BaseScreen from '../components/BaseScreen';

export default function SettingsScreen({
  styles,
  scaledTypography,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
  fontOptions,
  fontScale,
  onSelectFontScale,
  onLogout,
}) {
  return (
    <BaseScreen
      styles={styles}
      topNav={{
        backAccessibilityLabel: 'Back',
        rightAccessory: (
          <ProgramIconButton
            styles={styles}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
            onPress={onOpenProgram}
          />
        ),
      }}
    >
      <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
        Settings
      </Text>
      <Text style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}>
        Adjust your reading experience.
      </Text>
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupLabel}>Font size</Text>
        {fontOptions.map(option => {
          const isSelected = fontScale === option.value;
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => onSelectFontScale(option.value)}
              style={[
                styles.settingsOption,
                isSelected && styles.settingsOptionSelected,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.settingsOptionHeader}>
                <Text style={styles.settingsOptionLabel}>{option.label}</Text>
                {isSelected ? (
                  <View style={styles.settingsOptionBadge}>
                    <Text style={styles.settingsOptionBadgeLabel}>Selected</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.settingsOptionDescription}>
                {option.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupLabel}>Account</Text>
        <TouchableOpacity
          onPress={onLogout}
          style={styles.authSecondaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.authSecondaryButtonLabel}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </BaseScreen>
  );
}
