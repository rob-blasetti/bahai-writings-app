import React, { useCallback, useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

function formatTarget(comment) {
  const targetType = comment?.target?.type;
  if (targetType === 'section') {
    return comment?.sectionTitle ? `Section: ${comment.sectionTitle}` : 'Section comment';
  }
  if (targetType === 'passage') {
    const start = comment?.target?.passage?.startUnitId;
    const end = comment?.target?.passage?.endUnitId;
    if (start && end) return `Passage: ${start} → ${end}`;
    return 'Passage comment';
  }
  if (targetType === 'highlight') {
    return 'Highlight comment';
  }
  return 'Comment';
}

export default function RecentCommentsSection({
  styles,
  comments,
  isLoading,
  error,
  onPressComment,
}) {
  const hasComments = Array.isArray(comments) && comments.length > 0;

  const header = useMemo(
    () => (
      <View style={styles.recentCommentsHeader}>
        <Text style={styles.recentCommentsTitle}>Recent comments</Text>
        <Text style={styles.recentCommentsSubtitle}>Latest public/community activity.</Text>
      </View>
    ),
    [styles],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const workTitle = item?.work?.title || item?.workId;
      const workAuthor = item?.work?.author;
      const targetLabel = formatTarget(item);

      return (
        <TouchableOpacity
          style={styles.recentCommentCard}
          onPress={() => onPressComment?.(item)}
          accessibilityRole="button"
          accessibilityLabel="Open comment"
        >
          <Text style={styles.recentCommentWorkTitle} numberOfLines={1} ellipsizeMode="tail">
            {workTitle}
          </Text>
          {workAuthor ? (
            <Text style={styles.recentCommentWorkAuthor} numberOfLines={1} ellipsizeMode="tail">
              {workAuthor}
            </Text>
          ) : null}
          <Text style={styles.recentCommentTarget}>{targetLabel}</Text>
          <Text style={styles.recentCommentBody} numberOfLines={3} ellipsizeMode="tail">
            {item?.body ?? ''}
          </Text>
        </TouchableOpacity>
      );
    },
    [onPressComment, styles],
  );

  if (isLoading) {
    return (
      <View style={styles.recentCommentsWrapper}>
        {header}
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading recent comments…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.recentCommentsWrapper}>
        {header}
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!hasComments) {
    return null;
  }

  return (
    <View style={styles.recentCommentsWrapper}>
      {header}
      <FlatList
        data={comments}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentCommentsListContent}
      />
    </View>
  );
}
