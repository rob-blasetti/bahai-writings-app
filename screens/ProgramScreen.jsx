import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationTopBar } from '../components/NavigationTopBar';

function ProgramThemeGenerator({ styles, onOpen, feedback }) {
  return (
    <View style={styles.programThemeSection}>
      <Text style={styles.programThemeTitle}>Generate by theme</Text>
      <Text style={styles.programThemeDescription}>
        Search the library for passages that match a theme and add them to your
        devotional in a single step.
      </Text>
      <TouchableOpacity onPress={onOpen} style={styles.programThemeButton}>
        <Text style={styles.programThemeButtonLabel}>Find themed sections</Text>
      </TouchableOpacity>
      {feedback ? (
        <Text style={styles.programThemeFeedback}>{feedback}</Text>
      ) : null}
    </View>
  );
}

function ProgramThemeModal({
  styles,
  visible,
  onClose,
  themeQuery,
  onChangeThemeQuery,
  onSearchTheme,
  isSearching,
  searchMessage,
  searchResults,
  selectedSectionIds,
  onToggleSection,
  onAddSelected,
}) {
  const hasResults = Array.isArray(searchResults) && searchResults.length > 0;
  const selectionIds = Array.isArray(selectedSectionIds)
    ? selectedSectionIds
    : [];
  const hasSelection = selectionIds.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.programModalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.programModalCard}
          onPress={() => {}}
          accessibilityViewIsModal
        >
          <Text style={styles.programModalTitle}>Generate by theme</Text>
          <Text style={styles.programModalDescription}>
            Enter a keyword to find sections related to your theme. Select the
            sections you want to add to your devotional.
          </Text>
          <TextInput
            value={themeQuery}
            onChangeText={onChangeThemeQuery}
            placeholder="e.g. unity, joy, detachment"
            placeholderTextColor="#b8a58b"
            style={[styles.programTextInput, styles.programModalInput]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={onSearchTheme}
          />
          <View style={styles.programModalSearchRow}>
            <TouchableOpacity
              onPress={onSearchTheme}
              style={styles.programModalButton}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#3b2a15" />
              ) : (
                <Text style={styles.programModalButtonLabel}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
          {searchMessage ? (
            <Text style={styles.programModalMessage}>{searchMessage}</Text>
          ) : null}
          <ScrollView
            style={styles.programModalResults}
            contentContainerStyle={styles.programModalResultsContent}
            keyboardShouldPersistTaps="handled"
          >
            {hasResults
              ? searchResults.map(result => {
                  const isSelected = selectionIds.includes(result.id);
                  return (
                    <TouchableOpacity
                      key={result.id}
                      onPress={() => onToggleSection(result.id)}
                      style={[
                        styles.programModalResult,
                        isSelected && styles.programModalResultSelected,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={styles.programModalResultTitle}>
                        {result.sectionTitle}
                      </Text>
                      <Text style={styles.programModalResultWriting}>
                        {result.writingTitle}
                      </Text>
                      {result.preview ? (
                        <Text style={styles.programModalResultPreview}>
                          {result.preview}
                        </Text>
                      ) : null}
                      <Text style={styles.programModalResultToggle}>
                        {isSelected
                          ? 'Included in devotional'
                          : 'Tap to include this section'}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : null}
          </ScrollView>
          <View style={styles.programModalActions}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.programModalButton}
            >
              <Text style={styles.programModalButtonLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onAddSelected}
              style={[
                styles.programModalButton,
                styles.programModalActionSpacing,
                styles.programModalButtonPrimary,
                (!hasSelection || isSearching) && styles.buttonDisabled,
              ]}
              disabled={!hasSelection || isSearching}
            >
              <Text style={styles.programModalButtonPrimaryLabel}>
                Add selected sections
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ProgramPassageCard({ styles, item, index, renderBlockContent, onRemove }) {
  return (
    <View style={styles.passageCard}>
      <View style={styles.programCardHeader}>
        <View style={styles.programCardMeta}>
          <Text style={styles.programCardTitle}>
            {index + 1}. {item.writingTitle ?? 'Selected passage'}
          </Text>
          {item.sectionTitle ? (
            <Text style={styles.programCardSubtitle}>{item.sectionTitle}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => onRemove(item.id)}
          style={styles.programRemoveButton}
        >
          <Text style={styles.programRemoveLabel}>Remove</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.blockWrapper}>
        {renderBlockContent(item.block, 0)}
      </View>
    </View>
  );
}

function ProgramForm({
  styles,
  programTitle,
  onChangeProgramTitle,
  programNotes,
  onChangeProgramNotes,
}) {
  return (
    <View style={styles.programForm}>
      <Text style={styles.programFormTitle}>Devotional details</Text>
      <Text style={styles.programFormHint}>
        Give this devotional a title and optional guidance. These details are
        included when sending to Liquid Spirit.
      </Text>
      <Text style={styles.programInputLabel}>Title</Text>
      <TextInput
        value={programTitle}
        onChangeText={onChangeProgramTitle}
        placeholder="Sunrise Devotional"
        style={styles.programTextInput}
        placeholderTextColor="#b8a58b"
        autoCapitalize="sentences"
        autoCorrect
      />
      <Text style={styles.programInputLabel}>Notes (optional)</Text>
      <TextInput
        value={programNotes}
        onChangeText={onChangeProgramNotes}
        placeholder="Add facilitation notes, music cues, or prayers."
        style={[styles.programTextInput, styles.programTextArea]}
        placeholderTextColor="#b8a58b"
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

function ProgramActions({
  styles,
  hasProgramPassages,
  isSubmittingProgram,
  onShareProgram,
  onSubmitProgram,
  programSubmissionError,
  programSubmissionSuccess,
}) {
  return (
    <View style={styles.programActions}>
      <TouchableOpacity
        onPress={onShareProgram}
        style={[
          styles.shareNowButton,
          styles.programActionButton,
          (!hasProgramPassages || isSubmittingProgram) && styles.buttonDisabled,
        ]}
        disabled={!hasProgramPassages || isSubmittingProgram}
      >
        <Text style={styles.shareNowButtonLabel}>
          Share devotional program
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSubmitProgram}
        style={[
          styles.submitButton,
          styles.programActionButton,
          (!hasProgramPassages || isSubmittingProgram) && styles.buttonDisabled,
        ]}
        disabled={!hasProgramPassages || isSubmittingProgram}
      >
        {isSubmittingProgram ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonLabel}>Submit to Liquid Spirit</Text>
        )}
      </TouchableOpacity>
      {programSubmissionError ? (
        <Text style={styles.programStatusError}>
          {programSubmissionError}
        </Text>
      ) : null}
      {programSubmissionSuccess ? (
        <Text style={styles.programStatusSuccess}>
          {programSubmissionSuccess}
        </Text>
      ) : null}
    </View>
  );
}

function ProgramEmptyState({ styles }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        No passages added yet. Explore the library or daily passages and tap
        "Add to program" to build your devotional.
      </Text>
    </View>
  );
}

export default function ProgramScreen({
  styles,
  scaledTypography,
  programPassages,
  programBackButtonLabel,
  hasProgramPassages,
  onClose,
  onClearProgram,
  renderBlockContent,
  programTitle,
  onChangeProgramTitle,
  programNotes,
  onChangeProgramNotes,
  onShareProgram,
  onSubmitProgram,
  programSubmissionError,
  programSubmissionSuccess,
  isSubmittingProgram,
  onRemoveFromProgram,
  onSearchProgramTheme,
  onAddProgramSections,
}) {
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [themeQuery, setThemeQuery] = useState('');
  const [themeSearchResults, setThemeSearchResults] = useState([]);
  const [selectedThemeSectionIds, setSelectedThemeSectionIds] = useState([]);
  const [isSearchingTheme, setIsSearchingTheme] = useState(false);
  const [themeSearchMessage, setThemeSearchMessage] = useState(null);
  const [themeFeedback, setThemeFeedback] = useState(null);

  const selectedSections = useMemo(
    () =>
      themeSearchResults.filter(result =>
        selectedThemeSectionIds.includes(result.id),
      ),
    [themeSearchResults, selectedThemeSectionIds],
  );

  const handleOpenThemeModal = useCallback(() => {
    setIsThemeModalVisible(true);
    setThemeQuery('');
    setThemeSearchResults([]);
    setSelectedThemeSectionIds([]);
    setThemeSearchMessage(null);
  }, []);

  const handleCloseThemeModal = useCallback(() => {
    setIsThemeModalVisible(false);
  }, []);

  const handleSearchTheme = useCallback(() => {
    if (typeof onSearchProgramTheme !== 'function') {
      return;
    }

    const trimmedQuery = themeQuery.trim();

    if (trimmedQuery.length === 0) {
      setThemeSearchResults([]);
      setSelectedThemeSectionIds([]);
      setThemeSearchMessage('Enter a theme to start searching.');
      return;
    }

    setIsSearchingTheme(true);

    try {
      const results = onSearchProgramTheme(trimmedQuery) ?? [];

      if (!Array.isArray(results) || results.length === 0) {
        setThemeSearchResults([]);
        setSelectedThemeSectionIds([]);
        setThemeSearchMessage(
          `No sections found for “${trimmedQuery}”. Try another theme.`,
        );
        return;
      }

      setThemeSearchResults(results);
      setSelectedThemeSectionIds(results.map(result => result.id));
      setThemeSearchMessage(
        results.length === 1
          ? '1 section matches this theme.'
          : `${results.length} sections match this theme.`,
      );
    } catch (error) {
      console.warn('Program theme search failed', error);
      setThemeSearchResults([]);
      setSelectedThemeSectionIds([]);
      setThemeSearchMessage(
        'Something went wrong while searching. Please try again.',
      );
    } finally {
      setIsSearchingTheme(false);
    }
  }, [onSearchProgramTheme, themeQuery]);

  const handleToggleThemeSection = useCallback(sectionId => {
    setSelectedThemeSectionIds(previous => {
      if (previous.includes(sectionId)) {
        return previous.filter(id => id !== sectionId);
      }
      return [...previous, sectionId];
    });
  }, []);

  const handleAddSelectedSections = useCallback(() => {
    if (!Array.isArray(selectedSections) || selectedSections.length === 0) {
      setThemeSearchMessage('Select at least one section to add.');
      return;
    }

    if (typeof onAddProgramSections !== 'function') {
      return;
    }

    const addedCount = onAddProgramSections(selectedSections);
    const sectionCount = selectedSections.length;
    const trimmedQuery = themeQuery.trim();

    if (addedCount > 0) {
      const passageLabel = addedCount === 1 ? 'passage' : 'passages';
      const sectionLabel = sectionCount === 1 ? 'section' : 'sections';
      const queryLabel = trimmedQuery.length > 0 ? ` “${trimmedQuery}”` : '';
      setThemeFeedback(
        `Added ${addedCount} ${passageLabel} from ${sectionCount} ${sectionLabel}${queryLabel}.`,
      );
    } else {
      setThemeFeedback(
        'Those sections are already part of your devotional. Try another theme.',
      );
    }

    setIsThemeModalVisible(false);
  }, [onAddProgramSections, selectedSections, themeQuery]);

  const renderProgramPassage = useCallback(
    ({ item, index }) => (
      <ProgramPassageCard
        styles={styles}
        item={item}
        index={index}
        renderBlockContent={renderBlockContent}
        onRemove={onRemoveFromProgram}
      />
    ),
    [styles, renderBlockContent, onRemoveFromProgram],
  );

  const listHeaderComponent = (
    <View>
      <ProgramThemeGenerator
        styles={styles}
        onOpen={handleOpenThemeModal}
        feedback={themeFeedback}
      />
      <ProgramForm
        styles={styles}
        programTitle={programTitle}
        onChangeProgramTitle={onChangeProgramTitle}
        programNotes={programNotes}
        onChangeProgramNotes={onChangeProgramNotes}
      />
    </View>
  );

  const listFooterComponent = (
    <ProgramActions
      styles={styles}
      hasProgramPassages={hasProgramPassages}
      isSubmittingProgram={isSubmittingProgram}
      onShareProgram={onShareProgram}
      onSubmitProgram={onSubmitProgram}
      programSubmissionError={programSubmissionError}
      programSubmissionSuccess={programSubmissionSuccess}
    />
  );

  const listEmptyComponent = <ProgramEmptyState styles={styles} />;

  return (
    <View style={styles.screenSurface}>
      <ProgramThemeModal
        styles={styles}
        visible={isThemeModalVisible}
        onClose={handleCloseThemeModal}
        themeQuery={themeQuery}
        onChangeThemeQuery={setThemeQuery}
        onSearchTheme={handleSearchTheme}
        isSearching={isSearchingTheme}
        searchMessage={themeSearchMessage}
        searchResults={themeSearchResults}
        selectedSectionIds={selectedThemeSectionIds}
        onToggleSection={handleToggleThemeSection}
        onAddSelected={handleAddSelectedSections}
      />
      <NavigationTopBar
        styles={styles}
        onBack={onClose}
        backAccessibilityLabel={programBackButtonLabel}
        rightAccessory={
          hasProgramPassages ? (
            <TouchableOpacity
              onPress={onClearProgram}
              style={styles.programClearButton}
            >
              <Text style={styles.programClearLabel}>Clear all</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
        Devotional Program
      </Text>
      <Text style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}>
        Gather passages into a single flow before you share.
      </Text>
      <FlatList
        data={programPassages}
        keyExtractor={item => item.id}
        style={styles.programList}
        contentContainerStyle={styles.programListContent}
        renderItem={renderProgramPassage}
        ListHeaderComponent={listHeaderComponent}
        ListFooterComponent={listFooterComponent}
        ListEmptyComponent={listEmptyComponent}
      />
    </View>
  );
}
