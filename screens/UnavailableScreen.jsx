import React from 'react';
import { Text, View } from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';
import { NavigationTopBar } from '../components/NavigationTopBar';

export default function UnavailableScreen({
  styles,
  onBack,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
}) {
  return (
    <View style={styles.screenSurface}>
      <NavigationTopBar
        styles={styles}
        onBack={onBack}
        backAccessibilityLabel="Back to library"
        rightAccessory={
          <ProgramIconButton
            styles={styles}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
            onPress={onOpenProgram}
          />
        }
      />
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          The selected content is not available.
        </Text>
      </View>
    </View>
  );
}
