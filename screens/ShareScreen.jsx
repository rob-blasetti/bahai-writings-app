import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';

const getThemeChipStyle = (theme, isActive) => ({
  borderColor: theme.accentColor,
  backgroundColor: isActive ? theme.backgroundColor : '#fff',
});

export default function ShareScreen({
  styles,
  scaledTypography,
  shareContext,
  shareBackButtonLabel,
  onClose,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
  activeShareTheme,
  shareThemes,
  shareThemeId,
  onSelectShareTheme,
  onShareNow,
}) {
  return (
    <View style={styles.screenSurface}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonLabel}>{shareBackButtonLabel}</Text>
        </TouchableOpacity>
        <ProgramIconButton
          styles={styles}
          hasProgramPassages={hasProgramPassages}
          programBadgeLabel={programBadgeLabel}
          onPress={onOpenProgram}
        />
      </View>
      <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
        Share this passage
      </Text>
      <Text style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}>
        Pick a layout and send this inspiration to someone you love.
      </Text>
      <View
        style={[
          styles.sharePreviewCard,
          {
            backgroundColor: activeShareTheme.backgroundColor,
            borderColor: activeShareTheme.accentColor,
          },
        ]}
      >
        <View style={styles.sharePreviewContent}>
          <Text
            style={[
              styles.sharePreviewQuote,
              scaledTypography.contentParagraph,
              { color: activeShareTheme.textColor },
            ]}
          >
            {shareContext.block.text}
          </Text>
          <View style={styles.sharePreviewMeta}>
            <Text
              style={[
                styles.sharePreviewMetaLabel,
                { color: activeShareTheme.tagColor },
              ]}
            >
              From
            </Text>
            <Text
              style={[
                styles.sharePreviewTitle,
                { color: activeShareTheme.textColor },
              ]}
            >
              {shareContext.writingTitle}
            </Text>
            {shareContext.sectionTitle ? (
              <Text
                style={[
                  styles.sharePreviewSection,
                  { color: activeShareTheme.tagColor },
                ]}
              >
                {shareContext.sectionTitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.shareThemeRow}>
        {shareThemes.map(theme => {
          const isActive = theme.id === shareThemeId;
          const themeChipStyle = getThemeChipStyle(theme, isActive);
          return (
            <TouchableOpacity
              key={theme.id}
              onPress={() => onSelectShareTheme(theme.id)}
              style={[
                styles.shareThemeChip,
                isActive && styles.shareThemeChipSelected,
                themeChipStyle,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View
                style={[
                  styles.shareThemeSwatch,
                  { backgroundColor: theme.accentColor },
                ]}
              />
              <Text style={styles.shareThemeLabel}>{theme.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity onPress={onShareNow} style={styles.shareNowButton}>
        <Text style={styles.shareNowButtonLabel}>Share passage</Text>
      </TouchableOpacity>
    </View>
  );
}
