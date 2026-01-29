import React from 'react';
import { Text, View } from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';
import BaseScreen from '../components/BaseScreen';

export default function UnavailableScreen({
  styles,
  onBack,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
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
        onBack,
      }}
    >
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          The selected content is not available.
        </Text>
      </View>
    </BaseScreen>
  );
}
