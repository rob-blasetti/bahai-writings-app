import React from 'react';
import ExploreScreen from '../screens/ExploreScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyVersesScreen from '../screens/MyVersesScreen';
import WritingsCollectionScreen from '../screens/WritingsCollectionScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WebScreen from '../screens/WebScreen';
import ShareSelectionScreen from '../screens/ShareSelectionScreen';
import ShareEditorScreen from '../screens/ShareEditorScreen';
import ProgramScreen from '../screens/ProgramScreen';
import WritingScreen from '../screens/WritingScreen';
import SectionScreen from '../screens/SectionScreen';
import PassageScreen from '../screens/PassageScreen';
import WorkSectionScreen from '../screens/WorkSectionScreen';
import UnavailableScreen from '../screens/UnavailableScreen';
import { Stack } from './StackNavigator';
import { getStackScreenOptions } from './stackOptions';

export default function TabStackNavigator({
  tabKey,
  renderScreenSurface,
  screenState,
}) {
  const rootScreenName = `${tabKey}Root`;
  const {
    styles,
    scaledTypography,
    displayName,
    authenticatedUser,
    content,
    program,
    share,
    profile,
    verses,
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
    sectionPagerRef,
    sectionPageWidth,
    sectionViewabilityConfig,
    sectionViewableItemsChanged,
    renderBlockContent,
    searchableSections,
  } = content;

  const writingsCollectionOptions = collectionOptions.filter(
    collection => collection.key !== 'prayers',
  );

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

  const { email: profileEmail, memberRef, isAuthenticated } = profile;
  const { items: myVerses } = verses;

  const {
    readWritings,
    openPrayers,
    chooseRandom,
    createDevotional,
    selectCollection,
    selectWriting,
    openSettings,
    openProgram,
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
    openSearchResult,
    removeVerse,
    openVerse,
    logout,
  } = handlers;

  const renderTabRoot = () => {
    if (tabKey === 'search') {
      return (
        <SearchScreen
          styles={styles}
          scaledTypography={scaledTypography}
          searchableSections={searchableSections}
          onSelectSection={openSearchResult}
        />
      );
    }

    if (tabKey === 'profile') {
      return (
        <ProfileScreen
          styles={styles}
          displayName={displayName}
          email={profileEmail}
          memberRef={memberRef}
          isAuthenticated={isAuthenticated}
        />
      );
    }

    if (tabKey === 'myVerses') {
      return (
        <MyVersesScreen
          styles={styles}
          scaledTypography={scaledTypography}
          verses={myVerses}
          onRemoveVerse={removeVerse}
          onOpenVerse={openVerse}
        />
      );
    }

    if (tabKey === 'settings') {
      return (
        <SettingsScreen
          styles={styles}
          onLogout={logout}
        />
      );
    }

    return (
      <ExploreScreen
        styles={styles}
        onReadWritings={readWritings}
        onOpenPrayers={openPrayers}
        onChooseRandom={chooseRandom}
        onCreateDevotional={createDevotional}
        recentComments={content.recentComments}
        recentCommentsLoading={content.recentCommentsLoading}
        recentCommentsError={content.recentCommentsError}
        onOpenRecentComment={handlers.openRecentComment}
      />
    );
  };

  return (
    <Stack.Navigator
      initialRouteName={rootScreenName}
      screenOptions={getStackScreenOptions}
    >
      <Stack.Screen name={rootScreenName}>
        {() => renderScreenSurface(renderTabRoot())}
      </Stack.Screen>
      <Stack.Screen name="collections">
        {() =>
          renderScreenSurface(
            <WritingsCollectionScreen
              styles={styles}
              collections={writingsCollectionOptions}
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
              onSelectWriting={selectWriting}
              onOpenSettings={openSettings}
            />,
          )
        }
      </Stack.Screen>
      {tabKey !== 'settings' ? (
        <Stack.Screen name="settings">
          {() =>
            renderScreenSurface(
              <SettingsScreen
                styles={styles}
                onLogout={logout}
              />,
            )
          }
        </Stack.Screen>
      ) : null}
      <Stack.Screen name="web">
        {() => renderScreenSurface(<WebScreen styles={styles} />)}
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
                onNext={proceedToShareEdit}
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
                onSelectSection={selectSection}
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

      <Stack.Screen name="workSection">
        {() =>
          renderScreenSurface(
            selectedWriting && selectedSection ? (
              <WorkSectionScreen
                styles={styles}
                scaledTypography={scaledTypography}
                work={selectedWriting}
                section={selectedSection}
                token={authenticatedUser?.token ?? null}
                renderBlockContent={renderBlockContent}
                onBack={backToSections}
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
                programPassages={programPassages}
                myVerses={myVerses}
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
                programPassages={programPassages}
                myVerses={myVerses}
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
