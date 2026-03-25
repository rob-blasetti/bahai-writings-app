import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import BaseScreen from '../components/BaseScreen';
import { getWorkUnits } from '../writings/worksService';

function parseUnitNumber(unitId) {
  const match = String(unitId ?? '').match(/^p:(\d{6})$/);
  if (!match) return null;
  return Number(match[1]);
}

export default function WorkSectionScreen({
  styles,
  work,
  section,
  token,
  renderBlockContent,
  onBack,
}) {
  const [units, setUnits] = useState([]);
  const [notes, setNotes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const nextStartIndexRef = useRef(0);
  const endUnitNumber = useMemo(() => parseUnitNumber(section?.end), [section?.end]);

  const reset = useCallback(() => {
    setUnits([]);
    setNotes({});
    setError(null);
    setHasMore(true);
    setIsLoading(false);
    nextStartIndexRef.current = 0;
  }, []);

  useEffect(() => {
    reset();
  }, [reset, work?.workId, section?.id]);

  const mergeNotes = useCallback(nextNotes => {
    if (!nextNotes) return;
    setNotes(prev => ({ ...prev, ...nextNotes }));
  }, []);

  const loadNextPage = useCallback(async () => {
    if (!work?.workId || !section?.start || !section?.end) {
      return;
    }

    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startId = units.length === 0 ? section.start : null;
      const response = await getWorkUnits(work.workId, {
        token,
        start: units.length === 0 ? undefined : nextStartIndexRef.current,
        startId,
        limit: 80,
      });

      const incoming = Array.isArray(response?.units) ? response.units : [];
      const incomingNotes = response?.notes || {};
      mergeNotes(incomingNotes);

      // If this section has an end boundary, trim to it and stop.
      let trimmed = incoming;
      if (endUnitNumber != null) {
        trimmed = incoming.filter(u => {
          const n = parseUnitNumber(u?.id);
          return n != null && n <= endUnitNumber;
        });
      }

      setUnits(prev => [...prev, ...trimmed]);

      const nextStart = Number(response?.start ?? 0) + Number(response?.limit ?? 0);
      nextStartIndexRef.current = nextStart;

      const reachedEnd =
        endUnitNumber != null &&
        trimmed.length > 0 &&
        parseUnitNumber(trimmed[trimmed.length - 1]?.id) >= endUnitNumber;

      const more = Boolean(response?.hasMore) && !reachedEnd;
      setHasMore(more);
    } catch (err) {
      setError(err?.message ?? 'Unable to load this section.');
    } finally {
      setIsLoading(false);
    }
  }, [endUnitNumber, hasMore, isLoading, mergeNotes, section, token, units.length, work?.workId]);

  useEffect(() => {
    // initial load
    loadNextPage();
  }, [loadNextPage]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={styles.blockWrapper}>
        {renderBlockContent(item, index, {
          writingTitle: work?.title ?? '',
          sectionTitle: section?.title ?? '',
          // Provide notes map so renderer can resolve footnotes if it supports it
          notes,
        })}
      </View>
    ),
    [notes, renderBlockContent, section?.title, styles.blockWrapper, work?.title],
  );

  const footer = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#8c6239" />
        </View>
      );
    }

    if (!hasMore) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>End of section.</Text>
        </View>
      );
    }

    return null;
  }, [hasMore, isLoading, styles.emptyState, styles.emptyStateText]);

  if (!work || !section) {
    return (
      <BaseScreen
        styles={styles}
        variant="plain"
        style={styles.homeContainer}
        topNav={{ title: 'Reading', backAccessibilityLabel: 'Back', onBack }}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No work selected.</Text>
        </View>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen
      styles={styles}
      variant="plain"
      style={styles.homeContainer}
      topNav={{
        title: (
          <View style={styles.topBarTitleStack}>
            <Text
              style={styles.topBarTitlePrimary}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {section.title}
            </Text>
            <Text
              style={styles.topBarTitleSecondary}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {work.title}
            </Text>
          </View>
        ),
        backAccessibilityLabel: 'Back',
        onBack,
      }}
    >
      {error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={units}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListFooterComponent={footer}
        onEndReached={() => {
          if (!isLoading && hasMore) {
            loadNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[
          styles.sectionListContent,
          styles.workSectionListContent,
        ]}
      />
    </BaseScreen>
  );
}
