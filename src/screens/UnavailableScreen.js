import React from 'react';
import { Text, View } from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';
import { NavigationTopBar } from '../components/NavigationTopBar';
import BaseScreen from '../components/BaseScreen';

export default function UnavailableScreen({
  styles,
  onBack,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
}) {
  return (
    <BaseScreen styles={styles}>
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
    </BaseScreen>
  );
}
