import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BaseModal from './BaseModal';

export function ReflectionModal({
  visible,
  styles,
  context,
  inputValue,
  onChangeInput,
  onCancel,
  onSubmit,
}) {
  const trimmedInput =
    typeof inputValue === 'string' ? inputValue.trim() : '';

  const isOpen = Boolean(visible && context);

  return (
    <BaseModal
      visible={isOpen}
      onClose={onCancel}
      styles={styles}
      animationType="slide"
      backdropStyle={styles.reflectionModalBackdrop}
      contentStyle={styles.reflectionModalCard}
      closeAccessibilityLabel="Close reflection"
    >
      <Text style={styles.reflectionModalTitle}>Share your reflection</Text>
      {context?.writingTitle ? (
        <Text style={styles.reflectionModalMeta}>
          {context.writingTitle}
          {context.sectionTitle ? ` · ${context.sectionTitle}` : ''}
        </Text>
      ) : null}
      <Text style={styles.reflectionModalPassageLabel}>Selected passage</Text>
      <ScrollView
        style={styles.reflectionModalPassageScroll}
        contentContainerStyle={styles.reflectionModalPassageContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.reflectionModalPassageText}>
          {context?.blockText}
        </Text>
      </ScrollView>
      <TextInput
        value={inputValue}
        onChangeText={onChangeInput}
        placeholder="Share your reflection"
        placeholderTextColor="#b8a58b"
        multiline
        textAlignVertical="top"
        style={styles.reflectionModalInput}
      />
      <View style={styles.reflectionModalActions}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.reflectionModalButtonSecondary}
        >
          <Text style={styles.reflectionModalButtonSecondaryLabel}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSubmit}
          style={[
            styles.reflectionModalButtonPrimary,
            trimmedInput.length === 0 && styles.buttonDisabled,
          ]}
          disabled={trimmedInput.length === 0}
        >
          <Text style={styles.reflectionModalButtonPrimaryLabel}>
            Post reflection
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}

export default ReflectionModal;
