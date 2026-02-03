import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BaseModal from './BaseModal';

const VISIBILITY_OPTIONS = [
  { id: 'private', label: 'Private' },
  { id: 'community', label: 'Community' },
  { id: 'public', label: 'Public' },
];

export default function SectionCommentsModal({
  visible,
  onClose,
  styles,
  workTitle,
  sectionTitle,
  comments,
  isLoading,
  error,
  onRefresh,
  onSubmit,
}) {
  const [draft, setDraft] = useState('');
  const [visibility, setVisibility] = useState('public');

  const canSubmit = useMemo(() => draft.trim().length > 0, [draft]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    const body = draft.trim();
    setDraft('');
    await onSubmit({ body, visibility });
  }, [canSubmit, draft, onSubmit, visibility]);

  const header = useMemo(() => {
    return (
      <View style={styles.annotationModalHeader}>
        <Text style={styles.annotationModalTitle}>Comments</Text>
        {workTitle || sectionTitle ? (
          <Text style={styles.annotationModalMeta} numberOfLines={2} ellipsizeMode="tail">
            {workTitle ? `${workTitle}` : ''}
            {workTitle && sectionTitle ? ' — ' : ''}
            {sectionTitle ? sectionTitle : ''}
          </Text>
        ) : null}

        <View style={styles.annotationModalVisibilityRow}>
          {VISIBILITY_OPTIONS.map(option => {
            const active = option.id === visibility;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => setVisibility(option.id)}
                style={[
                  styles.annotationModalVisibilityChip,
                  active && styles.annotationModalVisibilityChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Set visibility to ${option.label}`}
              >
                <Text
                  style={[
                    styles.annotationModalVisibilityChipLabel,
                    active && styles.annotationModalVisibilityChipLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.annotationModalComposerRow}>
          <TextInput
            style={styles.annotationModalInput}
            placeholder="Add a comment…"
            placeholderTextColor="#8b7a65"
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.annotationModalSubmit,
              !canSubmit && styles.annotationModalSubmitDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Post comment"
          >
            <Text style={styles.annotationModalSubmitLabel}>Post</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={styles.annotationModalErrorText}>{error}</Text>
        ) : null}

        <View style={styles.annotationModalDivider} />
      </View>
    );
  }, [
    canSubmit,
    draft,
    error,
    handleSubmit,
    sectionTitle,
    styles,
    visibility,
    workTitle,
  ]);

  const renderItem = useCallback(
    ({ item }) => {
      const displayVisibility = item?.visibility ? String(item.visibility) : '';
      const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
      const createdLabel = createdAt && Number.isFinite(createdAt.getTime())
        ? createdAt.toLocaleString()
        : '';

      return (
        <View style={styles.annotationCommentCard}>
          <View style={styles.annotationCommentMetaRow}>
            {displayVisibility ? (
              <View style={styles.annotationCommentBadge}>
                <Text style={styles.annotationCommentBadgeLabel}>
                  {displayVisibility.toUpperCase()}
                </Text>
              </View>
            ) : null}
            {createdLabel ? (
              <Text style={styles.annotationCommentDate}>{createdLabel}</Text>
            ) : null}
          </View>
          <Text style={styles.annotationCommentBody}>{item?.body ?? ''}</Text>
        </View>
      );
    },
    [styles],
  );

  const empty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading comments…</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No comments yet.</Text>
      </View>
    );
  }, [isLoading, styles.emptyState, styles.emptyStateText]);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      styles={styles}
      backdropStyle={styles.annotationModalBackdrop}
      contentStyle={styles.annotationModalCard}
      animationType="slide"
    >
      {header}
      <FlatList
        data={comments}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.annotationModalListContent}
        onRefresh={onRefresh}
        refreshing={Boolean(isLoading)}
      />
    </BaseModal>
  );
}
