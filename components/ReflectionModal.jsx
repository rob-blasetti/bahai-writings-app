import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

  if (!visible || !context) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.reflectionModalBackdrop}>
        <View style={styles.reflectionModalCard}>
          <Text style={styles.reflectionModalTitle}>Share your reflection</Text>
          {context?.writingTitle ? (
            <Text style={styles.reflectionModalMeta}>
              {context.writingTitle}
              {context.sectionTitle ? ` · ${context.sectionTitle}` : ''}
            </Text>
          ) : null}
          <Text style={styles.reflectionModalPassageLabel}>
            Selected passage
          </Text>
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
        </View>
      </View>
    </Modal>
  );
}

export default ReflectionModal;
