import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
}) {
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
    <ProgramForm
      styles={styles}
      programTitle={programTitle}
      onChangeProgramTitle={onChangeProgramTitle}
      programNotes={programNotes}
      onChangeProgramNotes={onChangeProgramNotes}
    />
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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonLabel}>{programBackButtonLabel}</Text>
        </TouchableOpacity>
        {hasProgramPassages ? (
          <TouchableOpacity
            onPress={onClearProgram}
            style={styles.programClearButton}
          >
            <Text style={styles.programClearLabel}>Clear all</Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
