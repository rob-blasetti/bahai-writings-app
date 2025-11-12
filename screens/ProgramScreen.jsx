import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { NavigationTopBar } from '../components/NavigationTopBar';

const PROGRAM_STEPS = [
  { id: 'program', label: 'Program' },
  { id: 'devotional', label: 'Devotional' },
  { id: 'session', label: 'Session' },
];

function ProgramStepper({ styles, steps, activeStep, onSelectStep }) {
  const activeIndex = steps.findIndex(step => step.id === activeStep);
  return (
    <View style={styles.programStepper}>
      {steps.map((step, index) => {
        const isActive = step.id === activeStep;
        const isCompleted = index < activeIndex;
        const isLast = index === steps.length - 1;
        return (
          <React.Fragment key={step.id}>
            <TouchableOpacity
              onPress={() => onSelectStep(step.id)}
              style={styles.programStepItem}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View
                style={[
                  styles.programStepNode,
                  isCompleted && styles.programStepNodeCompleted,
                  isActive && styles.programStepNodeActive,
                ]}
              >
                <Text
                  style={[
                    styles.programStepNodeLabel,
                    (isActive || isCompleted) &&
                      styles.programStepNodeLabelActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.programStepLabel,
                  isActive && styles.programStepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </TouchableOpacity>
            {!isLast ? (
              <View
                style={[
                  styles.programStepConnector,
                  isCompleted && styles.programStepConnectorCompleted,
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

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
        {renderBlockContent(item.block, 0, {
          writingTitle: item.writingTitle,
          sectionTitle: item.sectionTitle,
        })}
      </View>
    </View>
  );
}

function ProgramDetailsForm({
  styles,
  programTitle,
  onChangeProgramTitle,
  programNotes,
  onChangeProgramNotes,
  fieldErrors = {},
}) {
  return (
    <View style={styles.programForm}>
      <Text style={styles.programFormTitle}>Program basics</Text>
      <Text style={styles.programFormHint}>
        Give your devotional a clear name so friends recognize it, and add any
        planning notes you want to remember.
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
      {fieldErrors?.title ? (
        <Text style={styles.programInputError}>{fieldErrors.title}</Text>
      ) : null}
      <Text style={styles.programInputLabel}>Description</Text>
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

function SessionDetailsForm({
  styles,
  sessionDate,
  onChangeSessionDate,
  sessionTime,
  onChangeSessionTime,
  timeZone,
  onChangeTimeZone,
  defaultTimeZone,
  frequencyOptions,
  selectedFrequency,
  onSelectFrequency,
  participantInput,
  onChangeParticipantInput,
  facilitatorInput,
  onChangeFacilitatorInput,
  fieldErrors = {},
  currentUserName,
  currentUserId,
  includeCurrentUserFacilitator = true,
  onRemoveCurrentUserFacilitator,
  onRestoreCurrentUserFacilitator,
}) {
  const [iosPickerMode, setIosPickerMode] = useState(null);
  const [iosPickerDate, setIosPickerDate] = useState(new Date());

  const getFieldError = field => fieldErrors?.[field];
  const renderFieldError = field => {
    const message = getFieldError(field);
    if (!message) {
      return null;
    }
    return <Text style={styles.programInputError}>{message}</Text>;
  };

  const parseDateValue = value => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  };

  const parseTimeValue = value => {
    const baseline = new Date();
    baseline.setSeconds(0);
    baseline.setMilliseconds(0);
    if (/^\d{2}:\d{2}$/.test(value)) {
      const [hour, minute] = value.split(':').map(Number);
      baseline.setHours(hour ?? 7, minute ?? 0, 0, 0);
      return baseline;
    }
    baseline.setHours(7, 0, 0, 0);
    return baseline;
  };

  const formatDateValue = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeValue = date => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const openPicker = mode => {
    if (Platform.OS === 'android') {
      const pickerValue =
        mode === 'date' ? parseDateValue(sessionDate) : parseTimeValue(sessionTime);
      DateTimePickerAndroid.open({
        value: pickerValue,
        mode,
        is24Hour: true,
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) {
            return;
          }
          if (mode === 'date') {
            onChangeSessionDate(formatDateValue(selectedDate));
          } else {
            onChangeSessionTime(formatTimeValue(selectedDate));
          }
        },
      });
      return;
    }

    setIosPickerDate(
      mode === 'date' ? parseDateValue(sessionDate) : parseTimeValue(sessionTime),
    );
    setIosPickerMode(mode);
  };

  const handleIosPickerChange = (_, selectedDate) => {
    if (selectedDate) {
      setIosPickerDate(selectedDate);
    }
  };

  const handleIosPickerCancel = () => {
    setIosPickerMode(null);
  };

  const handleIosPickerConfirm = () => {
    if (iosPickerMode === 'date') {
      onChangeSessionDate(formatDateValue(iosPickerDate));
    } else if (iosPickerMode === 'time') {
      onChangeSessionTime(formatTimeValue(iosPickerDate));
    }
    setIosPickerMode(null);
  };

  return (
    <>
      <View style={styles.programForm}>
        <Text style={styles.programFormTitle}>Session schedule</Text>
        <Text style={styles.programFormHint}>
          Let Liquid Spirit know when and how this devotional takes place so it can
          notify the right people.
        </Text>
      <Text style={styles.programInputLabel}>Session date & time</Text>
      <View style={styles.programFieldRow}>
        <View style={styles.programFieldColumn}>
          <TouchableOpacity
            onPress={() => openPicker('date')}
            style={styles.programPickerInput}
            accessibilityRole="button"
            accessibilityLabel="Choose devotional date"
          >
            <Text
              style={
                sessionDate
                  ? styles.programPickerValue
                  : styles.programPickerPlaceholder
              }
            >
              {sessionDate || 'YYYY-MM-DD'}
            </Text>
          </TouchableOpacity>
          {renderFieldError('sessionDate')}
        </View>
        <View style={styles.programFieldColumn}>
          <TouchableOpacity
            onPress={() => openPicker('time')}
            style={styles.programPickerInput}
            accessibilityRole="button"
            accessibilityLabel="Choose devotional start time"
          >
            <Text
              style={
                sessionTime
                  ? styles.programPickerValue
                  : styles.programPickerPlaceholder
              }
            >
              {sessionTime || 'HH:MM'}
            </Text>
          </TouchableOpacity>
          {renderFieldError('sessionTime')}
        </View>
      </View>
      <Text style={styles.programHelperText}>
        Use 24-hour time (e.g. 19:30) so the Liquid Spirit calendar is accurate.
      </Text>
      <Text style={styles.programInputLabel}>Time zone</Text>
      <TextInput
        value={timeZone}
        onChangeText={onChangeTimeZone}
        placeholder={defaultTimeZone}
        placeholderTextColor="#b8a58b"
        style={styles.programTextInput}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {renderFieldError('timeZone')}
      <Text style={styles.programInputLabel}>Meeting frequency</Text>
      <View style={styles.programFrequencyRow}>
        {frequencyOptions.map(option => {
          const isSelected = option.id === selectedFrequency;
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => onSelectFrequency(option.id)}
              style={[
                styles.programFrequencyChip,
                isSelected && styles.programFrequencyChipActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.programFrequencyChipLabel,
                  isSelected && styles.programFrequencyChipLabelActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.programHelperText}>
        Location and logistics are confirmed later—just share the schedule for now.
      </Text>
      <Text style={styles.programInputLabel}>Participants (optional)</Text>
      <TextInput
        value={participantInput}
        onChangeText={onChangeParticipantInput}
        placeholder="Separate names or emails with commas or new lines"
        placeholderTextColor="#b8a58b"
        style={[styles.programTextInput, styles.programTextArea]}
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.programHelperText}>
        These help Liquid Spirit invite friends already in your contacts.
      </Text>
      <Text style={styles.programInputLabel}>Facilitators (optional)</Text>
      {currentUserName ? (
        includeCurrentUserFacilitator ? (
          <View style={styles.programFacilitatorChips}>
            <View style={styles.programFacilitatorChip}>
              <Text style={styles.programFacilitatorChipLabel}>
                {currentUserName} (You)
              </Text>
              {typeof onRemoveCurrentUserFacilitator === 'function' ? (
                <TouchableOpacity
                  onPress={onRemoveCurrentUserFacilitator}
                  style={styles.programFacilitatorChipRemove}
                  accessibilityRole="button"
                  accessibilityLabel="Remove yourself as a facilitator"
                >
                  <Text style={styles.programFacilitatorChipRemoveLabel}>X</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : (
          typeof onRestoreCurrentUserFacilitator === 'function' ? (
            <TouchableOpacity
              onPress={onRestoreCurrentUserFacilitator}
              style={styles.programFacilitatorChipRestore}
              accessibilityRole="button"
            >
              <Text style={styles.programFacilitatorChipRestoreLabel}>
                Add yourself as facilitator
              </Text>
            </TouchableOpacity>
          ) : null
        )
      ) : null}
      <TextInput
        value={facilitatorInput}
        onChangeText={onChangeFacilitatorInput}
        placeholder="Who is leading prayers, music, or reflections?"
        placeholderTextColor="#b8a58b"
        style={[styles.programTextInput, styles.programTextArea]}
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
      />
      </View>
      {Platform.OS === 'ios' && iosPickerMode ? (
        <Modal transparent animationType="fade" visible onRequestClose={handleIosPickerCancel}>
          <Pressable
            style={styles.programPickerModalBackdrop}
            onPress={handleIosPickerCancel}
          >
            <Pressable style={styles.programPickerModalCard} onPress={() => {}}>
              <DateTimePicker
                mode={iosPickerMode}
                value={iosPickerDate}
                display="spinner"
                onChange={handleIosPickerChange}
                style={styles.programPickerModalWheel}
              />
              <View style={styles.programPickerModalActions}>
                <TouchableOpacity
                  onPress={handleIosPickerCancel}
                  style={styles.programPickerModalButton}
                >
                  <Text style={styles.programPickerModalButtonLabel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleIosPickerConfirm}
                  style={[
                    styles.programPickerModalButton,
                    styles.programPickerModalButtonPrimary,
                  ]}
                >
                  <Text style={styles.programPickerModalButtonPrimaryLabel}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
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
  authenticatedUser,
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
  programSessionDate,
  onChangeProgramSessionDate,
  programSessionTime,
  onChangeProgramSessionTime,
  programTimeZone,
  onChangeProgramTimeZone,
  defaultProgramTimeZone,
  programFrequencyOptions,
  programFrequency,
  onSelectProgramFrequency,
  programParticipants,
  onChangeProgramParticipants,
  programFacilitators,
  onChangeProgramFacilitators,
  includeCurrentUserFacilitator,
  onRemoveCurrentUserFacilitator,
  onRestoreCurrentUserFacilitator,
  programFieldErrors,
  onShareProgram,
  onSubmitProgram,
  programSubmissionError,
  programSubmissionSuccess,
  isSubmittingProgram,
  onRemoveFromProgram,
  onSearchProgramTheme,
  onAddProgramSections,
}) {
  const [activeStep, setActiveStep] = useState(PROGRAM_STEPS[0].id);
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

  const activeStepIndex = useMemo(
    () => PROGRAM_STEPS.findIndex(step => step.id === activeStep),
    [activeStep],
  );

  const handleSelectStep = useCallback(stepId => {
    setActiveStep(stepId);
  }, []);

  const handleNextStep = useCallback(() => {
    const nextStep = PROGRAM_STEPS[activeStepIndex + 1];
    if (nextStep) {
      setActiveStep(nextStep.id);
    }
  }, [activeStepIndex]);

  const handlePrevStep = useCallback(() => {
    const prevStep = PROGRAM_STEPS[activeStepIndex - 1];
    if (prevStep) {
      setActiveStep(prevStep.id);
    }
  }, [activeStepIndex]);

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

  const renderPassageList = useCallback(() => {
    if (programPassages.length === 0) {
      return <ProgramEmptyState styles={styles} />;
    }
    return programPassages.map((item, index) => (
      <ProgramPassageCard
        key={item.id}
        styles={styles}
        item={item}
        index={index}
        renderBlockContent={renderBlockContent}
        onRemove={onRemoveFromProgram}
      />
    ));
  }, [programPassages, renderBlockContent, onRemoveFromProgram, styles]);
  const currentUserName =
    authenticatedUser?.name ??
    authenticatedUser?.email ??
    authenticatedUser?.memberRef ??
    authenticatedUser?.userId ??
    null;
  const currentUserId =
    authenticatedUser?.memberRef ?? authenticatedUser?.userId ?? null;

  const stepContent = useMemo(() => {
    switch (activeStep) {
      case 'program':
        return (
          <ProgramDetailsForm
            styles={styles}
            programTitle={programTitle}
            onChangeProgramTitle={onChangeProgramTitle}
            programNotes={programNotes}
            onChangeProgramNotes={onChangeProgramNotes}
            fieldErrors={programFieldErrors}
          />
        );
      case 'devotional':
        return (
          <View style={styles.programStepSection}>
            <ProgramThemeGenerator
              styles={styles}
              onOpen={handleOpenThemeModal}
              feedback={themeFeedback}
            />
            <View style={styles.programPassageList}>{renderPassageList()}</View>
          </View>
        );
      case 'session':
        return (
          <SessionDetailsForm
            styles={styles}
            sessionDate={programSessionDate}
            onChangeSessionDate={onChangeProgramSessionDate}
            sessionTime={programSessionTime}
            onChangeSessionTime={onChangeProgramSessionTime}
            timeZone={programTimeZone}
            onChangeTimeZone={onChangeProgramTimeZone}
            defaultTimeZone={defaultProgramTimeZone}
            frequencyOptions={programFrequencyOptions}
            selectedFrequency={programFrequency}
            onSelectFrequency={onSelectProgramFrequency}
            participantInput={programParticipants}
            onChangeParticipantInput={onChangeProgramParticipants}
            facilitatorInput={programFacilitators}
            onChangeFacilitatorInput={onChangeProgramFacilitators}
            fieldErrors={programFieldErrors}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            includeCurrentUserFacilitator={includeCurrentUserFacilitator}
            onRemoveCurrentUserFacilitator={onRemoveCurrentUserFacilitator}
            onRestoreCurrentUserFacilitator={onRestoreCurrentUserFacilitator}
          />
        );
      default:
        return null;
    }
  }, [
    activeStep,
    defaultProgramTimeZone,
    handleOpenThemeModal,
    onChangeProgramNotes,
    onChangeProgramParticipants,
    onChangeProgramSessionDate,
    onChangeProgramSessionTime,
    onChangeProgramTimeZone,
    onChangeProgramTitle,
    onChangeProgramFacilitators,
    onSelectProgramFrequency,
    programFieldErrors,
    programFrequency,
    programFrequencyOptions,
    programNotes,
    programParticipants,
    programSessionDate,
    programSessionTime,
    programTimeZone,
    programTitle,
    renderPassageList,
    themeFeedback,
    programFacilitators,
    styles,
    currentUserId,
    currentUserName,
    includeCurrentUserFacilitator,
    onRemoveCurrentUserFacilitator,
    onRestoreCurrentUserFacilitator,
  ]);

  const canGoBack = activeStepIndex > 0;
  const canGoNext = activeStepIndex < PROGRAM_STEPS.length - 1;
  const nextStepLabel = canGoNext
    ? PROGRAM_STEPS[activeStepIndex + 1].label
    : null;

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
      <ProgramStepper
        styles={styles}
        steps={PROGRAM_STEPS}
        activeStep={activeStep}
        onSelectStep={handleSelectStep}
      />
      <ScrollView
        style={styles.programList}
        contentContainerStyle={styles.programListContent}
      >
        {stepContent}
        <View style={styles.programStepControls}>
          <TouchableOpacity
            onPress={handlePrevStep}
            style={[
              styles.programStepControlButton,
              !canGoBack && styles.buttonDisabled,
            ]}
            disabled={!canGoBack}
          >
            <Text style={styles.programStepControlLabel}>Back</Text>
          </TouchableOpacity>
          {canGoNext ? (
            <TouchableOpacity
              onPress={handleNextStep}
              style={styles.programStepControlButtonPrimary}
            >
              <Text style={styles.programStepControlPrimaryLabel}>
                Next{nextStepLabel ? `: ${nextStepLabel}` : ''}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <ProgramActions
          styles={styles}
          hasProgramPassages={hasProgramPassages}
          isSubmittingProgram={isSubmittingProgram}
          onShareProgram={onShareProgram}
          onSubmitProgram={onSubmitProgram}
          programSubmissionError={programSubmissionError}
          programSubmissionSuccess={programSubmissionSuccess}
        />
      </ScrollView>
    </View>
  );
}
