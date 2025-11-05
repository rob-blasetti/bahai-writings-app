import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';

export default function UnavailableScreen({
  styles,
  onBack,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
}) {
  return (
    <View style={styles.screenSurface}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonLabel}>Back to library</Text>
        </TouchableOpacity>
        <ProgramIconButton
          styles={styles}
          hasProgramPassages={hasProgramPassages}
          programBadgeLabel={programBadgeLabel}
          onPress={onOpenProgram}
        />
      </View>
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          The selected content is not available.
        </Text>
      </View>
    </View>
  );
}
