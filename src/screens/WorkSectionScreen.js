import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BaseScreen from '../components/BaseScreen';
import SectionCommentsModal from '../components/SectionCommentsModal';
import {
  createComment,
  createHighlight,
  deleteHighlight,
  listComments,
  listHighlights,
} from '../writings/annotationsService';
import { getWorkUnits } from '../writings/worksService';

function parseUnitNumber(unitId) {
  const match = String(unitId ?? '').match(/^p:(\d{6})$/);
  if (!match) return null;
  return Number(match[1]);
}

export default function WorkSectionScreen({
  styles,
  scaledTypography,
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

  const [highlights, setHighlights] = useState([]);
  const [highlightsLoaded, setHighlightsLoaded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);

  const nextStartIndexRef = useRef(0);
  const endUnitNumber = useMemo(() => parseUnitNumber(section?.end), [section?.end]);

  const reset = useCallback(() => {
    setUnits([]);
    setNotes({});
    setError(null);
    setHasMore(true);
    setIsLoading(false);
    nextStartIndexRef.current = 0;

    setHighlights([]);
    setHighlightsLoaded(false);
    setComments([]);
    setCommentsLoaded(false);
    setCommentsError(null);
    setIsCommentsVisible(false);
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

  const header = useMemo(() => {
    if (!work || !section) return null;
    const rangeLabel = section?.start && section?.end ? `${section.start} → ${section.end}` : null;
    return (
      <View style={styles.passageMeta}>
        <Text style={styles.passageMetaLabel}>Reading</Text>
        <Text style={[styles.passageMetaWriting, scaledTypography.passageMetaWriting]}>
          {work.title}
        </Text>
        <Text style={[styles.passageMetaSection, scaledTypography.passageMetaSection]}>
          {section.title}
        </Text>
        {rangeLabel ? (
          <Text style={styles.passageMetaRange}>{rangeLabel}</Text>
        ) : null}
      </View>
    );
  }, [scaledTypography, section, styles, work]);

  const highlightsByStartUnit = useMemo(() => {
    const map = new Map();
    (Array.isArray(highlights) ? highlights : []).forEach(h => {
      const startUnitId = h?.range?.start?.unitId || h?.unitId;
      if (!startUnitId) return;
      if (!map.has(startUnitId)) map.set(startUnitId, []);
      map.get(startUnitId).push(h);
    });
    return map;
  }, [highlights]);

  const toggleWholeUnitHighlight = useCallback(
    async unit => {
      if (!token || !work?.workId || !unit?.id) {
        return;
      }

      const existing = (highlightsByStartUnit.get(unit.id) || []).find(h => {
        const startUnitId = h?.range?.start?.unitId || h?.unitId;
        const endUnitId = h?.range?.end?.unitId || h?.unitId;
        const startOffset = h?.range?.start?.offset ?? h?.startOffset;
        const endOffset = h?.range?.end?.offset ?? h?.endOffset;
        const unitText = typeof unit?.text === 'string' ? unit.text : '';
        return (
          startUnitId === unit.id &&
          endUnitId === unit.id &&
          Number(startOffset) === 0 &&
          Number(endOffset) === unitText.length
        );
      });

      try {
        if (existing && existing._id) {
          await deleteHighlight(existing._id, { token });
        } else {
          const unitText = typeof unit?.text === 'string' ? unit.text : '';
          await createHighlight(
            {
              workId: work.workId,
              version: work.version,
              range: {
                start: { unitId: unit.id, offset: 0 },
                end: { unitId: unit.id, offset: unitText.length },
              },
              color: 'yellow',
              quote: unitText,
            },
            { token },
          );
        }
      } catch (e) {
        console.warn('[Highlights] toggle failed', e);
      }

      // Refresh highlights after mutation.
      try {
        const startUnitId = units[0]?.id;
        const endUnitId = units[units.length - 1]?.id;
        if (startUnitId && endUnitId) {
          const next = await listHighlights(
            { workId: work.workId, version: work.version, startUnitId, endUnitId },
            { token },
          );
          setHighlights(next);
          setHighlightsLoaded(true);
        }
      } catch (e) {
        console.warn('[Highlights] refresh failed', e);
      }
    },
    [highlightsByStartUnit, token, units, work?.workId, work?.version],
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const unitText = typeof item?.text === 'string' ? item.text : '';
      const isWholeUnitHighlighted = (highlightsByStartUnit.get(item.id) || []).some(h => {
        const startUnitId = h?.range?.start?.unitId || h?.unitId;
        const endUnitId = h?.range?.end?.unitId || h?.unitId;
        const startOffset = h?.range?.start?.offset ?? h?.startOffset;
        const endOffset = h?.range?.end?.offset ?? h?.endOffset;
        return (
          startUnitId === item.id &&
          endUnitId === item.id &&
          Number(startOffset) === 0 &&
          Number(endOffset) === unitText.length
        );
      });

      return (
        <View style={styles.blockWrapper}>
          {renderBlockContent(item, index, {
            writingTitle: work?.title ?? '',
            sectionTitle: section?.title ?? '',
            notes,
            highlightColor: isWholeUnitHighlighted ? 'yellow' : null,
            onLongPress: token ? () => toggleWholeUnitHighlight(item) : null,
          })}
        </View>
      );
    },
    [
      highlightsByStartUnit,
      notes,
      renderBlockContent,
      section?.title,
      styles.blockWrapper,
      token,
      toggleWholeUnitHighlight,
      work?.title,
    ],
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
      <BaseScreen styles={styles} variant="plain" topNav={{ title: 'Reading', backAccessibilityLabel: 'Back', onBack }}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No work selected.</Text>
        </View>
      </BaseScreen>
    );
  }

  const loadSectionComments = useCallback(async () => {
    if (!token || !work?.workId || !section?.id) {
      return;
    }

    try {
      setCommentsError(null);
      setCommentsLoaded(false);
      const next = await listComments(
        {
          workId: work.workId,
          version: work.version,
          targetType: 'section',
          sectionId: section.id,
          limit: 200,
        },
        { token },
      );
      setComments(next);
      setCommentsLoaded(true);
    } catch (e) {
      setCommentsError(e?.message ?? 'Unable to load comments');
      setCommentsLoaded(true);
    }
  }, [section?.id, token, work?.workId, work?.version]);

  useEffect(() => {
    if (!token) return;
    if (!isCommentsVisible) return;
    loadSectionComments();
  }, [isCommentsVisible, loadSectionComments, token]);

  // Keep highlights in sync with current window
  const refreshHighlightsForWindow = useCallback(async () => {
    if (!token || !work?.workId) return;
    if (!Array.isArray(units) || units.length === 0) return;

    try {
      const startUnitId = units[0]?.id;
      const endUnitId = units[units.length - 1]?.id;
      if (!startUnitId || !endUnitId) return;
      const next = await listHighlights(
        { workId: work.workId, version: work.version, startUnitId, endUnitId },
        { token },
      );
      setHighlights(next);
      setHighlightsLoaded(true);
    } catch (e) {
      console.warn('[Highlights] load failed', e);
      setHighlightsLoaded(true);
    }
  }, [token, units, work?.workId, work?.version]);

  useEffect(() => {
    if (!token) return;
    // Debounce-ish: only refresh once we have some units.
    if (!highlightsLoaded && units.length > 0) {
      refreshHighlightsForWindow();
    }
  }, [highlightsLoaded, refreshHighlightsForWindow, token, units.length]);

  const topNavRight = token ? (
    <TouchableOpacity
      onPress={() => setIsCommentsVisible(true)}
      style={styles.iconButtonContainer}
      accessibilityRole="button"
      accessibilityLabel="Open section comments"
    >
      <View style={styles.iconButton}>
        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#3b2a15" />
      </View>
    </TouchableOpacity>
  ) : null;

  return (
    <BaseScreen
      styles={styles}
      variant="plain"
      topNav={{
        title: section.title,
        backAccessibilityLabel: 'Back',
        onBack,
        rightAccessory: topNavRight,
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
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        onEndReached={() => {
          if (!isLoading && hasMore) {
            loadNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.sectionListContent}
      />

      <SectionCommentsModal
        visible={isCommentsVisible}
        onClose={() => setIsCommentsVisible(false)}
        styles={styles}
        workTitle={work?.title ?? ''}
        sectionTitle={section?.title ?? ''}
        comments={comments}
        isLoading={!commentsLoaded}
        error={commentsError}
        onRefresh={loadSectionComments}
        onSubmit={async ({ body, visibility }) => {
          if (!token) return;
          try {
            await createComment(
              {
                workId: work.workId,
                version: work.version,
                target: { type: 'section', sectionId: section.id },
                body,
                visibility,
              },
              { token },
            );
          } catch (e) {
            setCommentsError(e?.message ?? 'Unable to post comment');
            return;
          }
          await loadSectionComments();
        }}
      />
    </BaseScreen>
  );
}
