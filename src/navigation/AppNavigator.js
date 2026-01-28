import React, { useCallback } from 'react';
import WritingsCollectionScreen from '../screens/WritingsCollectionScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ShareSelectionScreen from '../screens/ShareSelectionScreen';
import ShareEditorScreen from '../screens/ShareEditorScreen';
import ProgramScreen from '../screens/ProgramScreen';
import WritingScreen from '../screens/WritingScreen';
import SectionScreen from '../screens/SectionScreen';
import PassageScreen from '../screens/PassageScreen';
import UnavailableScreen from '../screens/UnavailableScreen';
import { Stack } from './StackNavigator';
import { isBottomTabRoute } from './BottomTabs';
import BottomTabNavigator from './BottomTabNavigator';

export default function AppNavigator({ renderScreenSurface, screenState }) {
  const stackScreenOptions = useCallback(({ route }) => {
    if (route.name === 'tabs') {
      return {
        headerShown: false,
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        animation: 'none',
      };
    }
    const isBottomTabScreen = isBottomTabRoute(route.name);
    if (isBottomTabScreen) {
      return {
        headerShown: false,
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        animation: 'none',
      };
    }
    return {
      headerShown: false,
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
      animation: 'slide_from_right',
    };
  }, []);

  const {
    styles,
    scaledTypography,
    authenticatedUser,
    content,
    program,
    share,
    settings,
    handlers,
  } = screenState;

  const {
    collectionOptions,
    activeCollection,
    scopedWritings,
    selectedWriting,
    writingSections,
    selectedSection,
    randomPassage,
    activeSearchHighlight,
    sectionBlockIndex,
    sectionPagerRef,
    sectionPageWidth,
    sectionViewabilityConfig,
    sectionViewableItemsChanged,
    renderBlockContent,
    hasPassages,
  } = content;

  const {
    passages: programPassages,
    backButtonLabel: programBackButtonLabel,
    hasPassages: hasProgramPassages,
    badgeLabel: programBadgeLabel,
    title: programTitle,
    notes: programNotes,
    sessionDate: programSessionDate,
    sessionTime: programSessionTime,
    timeZone: programTimeZone,
    defaultTimeZone: defaultProgramTimeZone,
    frequencyOptions: programFrequencyOptions,
    frequency: programFrequency,
    participants: programParticipants,
    facilitators: programFacilitators,
    includeCurrentUserFacilitator,
    fieldErrors: programFieldErrors,
    submissionError: programSubmissionError,
    submissionSuccess: programSubmissionSuccess,
    isSubmitting: isSubmittingProgram,
  } = program;

  const {
    session: shareSession,
    backButtonLabel: shareBackButtonLabel,
    selectedSentenceIndexes,
    activeTheme: activeShareTheme,
    themes: shareThemes,
    themeId: shareThemeId,
    selectionLimit: shareSelectionLimit = 2,
  } = share;

  const { fontOptions, fontScale } = settings;

  const {
    selectCollection,
    goBack,
    selectWriting,
    openSettings,
    openProgram,
    showRandomPassage,
    closeSettings,
    selectFontScale,
    logout,
    toggleShareSentence,
    closeShare,
    proceedToShareEdit,
    selectShareTheme,
    shareNow,
    closeProgram,
    clearProgram,
    submitProgram,
    shareProgram,
    removeFromProgram,
    searchProgramTheme,
    addProgramSections,
    changeProgramTitle,
    changeProgramNotes,
    changeProgramSessionDate,
    changeProgramSessionTime,
    changeProgramTimeZone,
    selectProgramFrequency,
    changeProgramParticipants,
    changeProgramFacilitators,
    removeCurrentUserFacilitator,
    restoreCurrentUserFacilitator,
    backToHome,
    backToSections,
    selectSection,
    addToProgram,
    addToMyVerses,
    sharePassage,
    showAnotherPassage,
    continueSection,
  } = handlers;

  return (
    <Stack.Navigator initialRouteName="tabs" screenOptions={stackScreenOptions}>
      <Stack.Screen name="tabs">
        {() => (
          <BottomTabNavigator
            renderScreenSurface={renderScreenSurface}
            screenState={screenState}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="collections">
        {() =>
          renderScreenSurface(
            <WritingsCollectionScreen
              styles={styles}
              collections={collectionOptions}
              onSelectCollection={selectCollection}
            />,
          )
        }
      </Stack.Screen>
      <Stack.Screen name="home">
        {() =>
          renderScreenSurface(
            <LibraryScreen
              styles={styles}
              writings={scopedWritings}
              collectionLabel={activeCollection?.label ?? null}
              onBack={goBack}
              onSelectWriting={selectWriting}
              onOpenSettings={openSettings}
              onOpenProgram={openProgram}
              hasProgramPassages={hasProgramPassages}
              programBadgeLabel={programBadgeLabel}
              hasPassages={hasPassages}
              onShowRandomPassage={showRandomPassage}
            />,
          )
        }
      </Stack.Screen>
      <Stack.Screen name="settings">
        {() =>
          renderScreenSurface(
            <SettingsScreen
              styles={styles}
              scaledTypography={scaledTypography}
              onClose={closeSettings}
              onOpenProgram={openProgram}
              hasProgramPassages={hasProgramPassages}
              programBadgeLabel={programBadgeLabel}
              fontOptions={fontOptions}
              fontScale={fontScale}
              onSelectFontScale={selectFontScale}
              onLogout={logout}
            />,
          )
        }
      </Stack.Screen>
      <Stack.Screen name="shareSelect">
        {() =>
          renderScreenSurface(
            shareSession ? (
              <ShareSelectionScreen
                styles={styles}
                scaledTypography={scaledTypography}
                shareSession={shareSession}
                shareBackButtonLabel={shareBackButtonLabel}
                selectedSentenceIndexes={selectedSentenceIndexes}
                onToggleSentence={toggleShareSentence}
                onClose={closeShare}
                onOpenProgram={openProgram}
                onNext={proceedToShareEdit}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
                maxSelections={shareSelectionLimit}
              />
            ) : (
              <UnavailableScreen
                styles={styles}
                onBack={backToHome}
                onOpenProgram={openProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
              />
            ),
          )
        }
      </Stack.Screen>
      <Stack.Screen name="shareEdit">
        {() =>
          renderScreenSurface(
            shareSession ? (
              <ShareEditorScreen
                styles={styles}
                scaledTypography={scaledTypography}
                shareSession={shareSession}
                shareBackButtonLabel={shareBackButtonLabel}
                selectedSentenceIndexes={selectedSentenceIndexes}
                onClose={closeShare}
                onOpenProgram={openProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
                activeShareTheme={activeShareTheme}
                shareThemes={shareThemes}
                shareThemeId={shareThemeId}
                onSelectShareTheme={selectShareTheme}
                onShareNow={shareNow}
              />
            ) : (
              <UnavailableScreen
                styles={styles}
                onBack={backToHome}
                onOpenProgram={openProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
              />
            ),
          )
        }
      </Stack.Screen>
      <Stack.Screen name="program">
        {() =>
          renderScreenSurface(
            <ProgramScreen
              styles={styles}
              scaledTypography={scaledTypography}
              authenticatedUser={authenticatedUser}
              programPassages={programPassages}
              programBackButtonLabel={programBackButtonLabel}
              hasProgramPassages={hasProgramPassages}
              onClose={closeProgram}
              onClearProgram={clearProgram}
              renderBlockContent={renderBlockContent}
              programTitle={programTitle}
              onChangeProgramTitle={changeProgramTitle}
              programNotes={programNotes}
              onChangeProgramNotes={changeProgramNotes}
              programSessionDate={programSessionDate}
              onChangeProgramSessionDate={changeProgramSessionDate}
              programSessionTime={programSessionTime}
              onChangeProgramSessionTime={changeProgramSessionTime}
              programTimeZone={programTimeZone}
              onChangeProgramTimeZone={changeProgramTimeZone}
              defaultProgramTimeZone={defaultProgramTimeZone}
              programFrequencyOptions={programFrequencyOptions}
              programFrequency={programFrequency}
              onSelectProgramFrequency={selectProgramFrequency}
              programParticipants={programParticipants}
              onChangeProgramParticipants={changeProgramParticipants}
              programFacilitators={programFacilitators}
              onChangeProgramFacilitators={changeProgramFacilitators}
              includeCurrentUserFacilitator={includeCurrentUserFacilitator}
              onRemoveCurrentUserFacilitator={removeCurrentUserFacilitator}
              onRestoreCurrentUserFacilitator={restoreCurrentUserFacilitator}
              programFieldErrors={programFieldErrors}
              onShareProgram={shareProgram}
              onSubmitProgram={submitProgram}
              programSubmissionError={programSubmissionError}
              programSubmissionSuccess={programSubmissionSuccess}
              isSubmittingProgram={isSubmittingProgram}
              onRemoveFromProgram={removeFromProgram}
              onSearchProgramTheme={searchProgramTheme}
              onAddProgramSections={addProgramSections}
            />,
          )
        }
      </Stack.Screen>
      <Stack.Screen name="writing">
        {() =>
          renderScreenSurface(
            selectedWriting ? (
              <WritingScreen
                styles={styles}
                scaledTypography={scaledTypography}
                selectedWriting={selectedWriting}
                writingSections={writingSections}
                collectionLabel={activeCollection?.label ?? null}
                onBack={backToHome}
                onSelectSection={selectSection}
                onOpenProgram={openProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
              />
            ) : (
              <UnavailableScreen
                styles={styles}
                onBack={backToHome}
                onOpenProgram={openProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
              />
            ),
          )
        }
      </Stack.Screen>
      <Stack.Screen name="section">
        {() =>
          renderScreenSurface(
            selectedWriting && selectedSection ? (
              <SectionScreen
                styles={styles}
                scaledTypography={scaledTypography}
                selectedWriting={selectedWriting}
                selectedSection={selectedSection}
                activeSearchHighlight={activeSearchHighlight}
                sectionBlockIndex={sectionBlockIndex}
                onBack={backToSections}
                sectionPagerRef={sectionPagerRef}
                sectionPageWidth={sectionPageWidth}
                sectionViewabilityConfig={sectionViewabilityConfig}
                sectionViewableItemsChanged={sectionViewableItemsChanged}
                renderBlockContent={renderBlockContent}
                onAddToProgram={addToProgram}
                onAddToMyVerses={addToMyVerses}
                onShare={sharePassage}
                onOpenProgram={openProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
              />
            ) : (
              <UnavailableScreen
                styles={styles}
                onBack={backToHome}
                onOpenProgram={openProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
              />
            ),
          )
        }
      </Stack.Screen>
      <Stack.Screen name="passage">
        {() =>
          renderScreenSurface(
            randomPassage ? (
              <PassageScreen
                styles={styles}
                scaledTypography={scaledTypography}
                randomPassage={randomPassage}
                onBack={backToHome}
                renderBlockContent={renderBlockContent}
                onAddToProgram={addToProgram}
                onAddToMyVerses={addToMyVerses}
                onShare={sharePassage}
                onShowAnother={showAnotherPassage}
                onOpenProgram={openProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
                onContinueSection={continueSection}
              />
            ) : (
              <UnavailableScreen
                styles={styles}
                onBack={backToHome}
                onOpenProgram={openProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
              />
            ),
          )
        }
      </Stack.Screen>
    </Stack.Navigator>
  );
}
