import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
  const fontOptions = useMemo(
    () => [
      {
        id: 'serif',
        label: 'Serif',
        previewLabel: 'Serif',
        style: {
          fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
          fontWeight: '600',
        },
      },
      {
        id: 'sans',
        label: 'Modern',
        previewLabel: 'Modern',
        style: {
          fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif', default: undefined }),
          fontWeight: '600',
        },
      },
      {
        id: 'mono',
        label: 'Mono',
        previewLabel: 'Mono',
        style: {
          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
          fontWeight: '500',
          letterSpacing: 0.4,
        },
      },
      {
        id: 'rounded',
        label: 'Rounded',
        previewLabel: 'Rounded',
        style: {
          fontFamily: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: undefined }),
          fontWeight: '700',
          letterSpacing: 0.6,
        },
      },
    ],
    [],
  );

  const layoutOptions = useMemo(
    () => [
      {
        id: 'classic',
        label: 'Classic',
        description: 'Balanced margins with left-aligned text.',
        quoteStyle: { textAlign: 'left' },
        metaContainerStyle: { alignItems: 'flex-start' },
        metaTextStyle: { textAlign: 'left' },
        contentStyle: { alignItems: 'flex-start' },
        quoteScale: 1,
        lineHeightScale: 1,
      },
      {
        id: 'centered',
        label: 'Centered',
        description: 'Centered type and symmetrical spacing.',
        quoteStyle: { textAlign: 'center' },
        metaContainerStyle: { alignItems: 'center' },
        metaTextStyle: { textAlign: 'center' },
        contentStyle: { alignItems: 'center' },
        quoteScale: 1.05,
        lineHeightScale: 1.05,
      },
      {
        id: 'poster',
        label: 'Poster',
        description: 'Bold uppercase lettering for dramatic quotes.',
        quoteStyle: { textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2 },
        metaContainerStyle: { alignItems: 'center' },
        metaTextStyle: { textAlign: 'center', letterSpacing: 1 },
        contentStyle: { alignItems: 'center' },
        quoteScale: 1.12,
        lineHeightScale: 1.1,
      },
    ],
    [],
  );

  const colorPalette = useMemo(
    () => [
      { id: 'theme', label: 'Theme', value: activeShareTheme.textColor },
      { id: 'espresso', label: 'Espresso', value: '#3b2a15' },
      { id: 'deepBlue', label: 'Midnight', value: '#1f2a44' },
      { id: 'forest', label: 'Forest', value: '#2f4f4f' },
      { id: 'rose', label: 'Rose', value: '#7a1f3d' },
      { id: 'ivory', label: 'Ivory', value: '#fdf8f2' },
    ],
    [activeShareTheme.textColor],
  );

  const backgroundOptions = useMemo(
    () => [
      {
        id: 'theme',
        label: 'Theme',
        backgroundColor: activeShareTheme.backgroundColor,
        borderColor: activeShareTheme.accentColor,
        tagColor: activeShareTheme.tagColor,
      },
      {
        id: 'sunset',
        label: 'Sunset',
        backgroundColor: '#fbe4d8',
        borderColor: '#f7a992',
        tagColor: '#de8162',
      },
      {
        id: 'lagoon',
        label: 'Lagoon',
        backgroundColor: '#e0f0ef',
        borderColor: '#6fb1a0',
        tagColor: '#3e7d6e',
      },
      {
        id: 'twilight',
        label: 'Twilight',
        backgroundColor: '#262837',
        borderColor: '#505b8f',
        tagColor: '#9ca8d9',
      },
    ],
    [activeShareTheme.backgroundColor, activeShareTheme.accentColor, activeShareTheme.tagColor],
  );

  const passageSegments = useMemo(() => {
    const rawText = shareContext?.block?.text ?? '';
    const splitSegments = rawText
      .split(/\n+/)
      .map(segment => segment.trim())
      .filter(Boolean);
    if (splitSegments.length > 0) {
      return splitSegments;
    }
    return rawText ? [rawText.trim()] : [];
  }, [shareContext]);

  const [fontId, setFontId] = useState(fontOptions[0].id);
  const [textColorId, setTextColorId] = useState('theme');
  const [backgroundId, setBackgroundId] = useState('theme');
  const [layoutId, setLayoutId] = useState(layoutOptions[0].id);
  const [selectedSegments, setSelectedSegments] = useState(() => {
    if (passageSegments.length === 0) {
      return [];
    }
    if (passageSegments.length === 1) {
      return [0];
    }
    return [0, 1].filter(index => index < passageSegments.length);
  });

  useEffect(() => {
    setTextColorId('theme');
    setBackgroundId('theme');
  }, [activeShareTheme]);

  useEffect(() => {
    setSelectedSegments(prev => {
      if (passageSegments.length === 0) {
        return [];
      }
      const sanitized = prev.filter(index => index < passageSegments.length);
      if (sanitized.length > 0) {
        return sanitized;
      }
      if (passageSegments.length === 1) {
        return [0];
      }
      return [0, 1].filter(index => index < passageSegments.length);
    });
  }, [passageSegments]);

  const activeFont = useMemo(
    () => fontOptions.find(option => option.id === fontId) ?? fontOptions[0],
    [fontId, fontOptions],
  );

  const activeTextColor = useMemo(() => {
    const option = colorPalette.find(color => color.id === textColorId);
    return option ? option.value : colorPalette[0].value;
  }, [colorPalette, textColorId]);

  const activeBackground = useMemo(() => {
    const option = backgroundOptions.find(background => background.id === backgroundId);
    return option ?? backgroundOptions[0];
  }, [backgroundId, backgroundOptions]);

  const activeLayout = useMemo(
    () => layoutOptions.find(option => option.id === layoutId) ?? layoutOptions[0],
    [layoutId, layoutOptions],
  );

  const shareText = useMemo(() => {
    if (!passageSegments.length) {
      return '';
    }
    if (selectedSegments.length === 0) {
      return passageSegments.join('\n\n');
    }
    const sortedIndexes = [...selectedSegments].sort((a, b) => a - b);
    return sortedIndexes.map(index => passageSegments[index]).join('\n\n');
  }, [passageSegments, selectedSegments]);

  const baseParagraphStyle = scaledTypography?.contentParagraph ?? {};
  const calculatedQuoteSize = baseParagraphStyle.fontSize
    ? baseParagraphStyle.fontSize * (activeLayout.quoteScale ?? 1)
    : undefined;
  const calculatedQuoteLineHeight = baseParagraphStyle.lineHeight
    ? baseParagraphStyle.lineHeight * (activeLayout.lineHeightScale ?? activeLayout.quoteScale ?? 1)
    : undefined;

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
      <ScrollView
        contentContainerStyle={styles.shareEditorScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
          Share this passage
        </Text>
        <Text style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}>
          Craft a beautiful moment before you send this inspiration to someone you
          love.
        </Text>
        <View
          style={[
            styles.sharePreviewCard,
            {
              backgroundColor: activeBackground.backgroundColor,
              borderColor: activeBackground.borderColor,
            },
          ]}
        >
          <View
            style={[styles.sharePreviewContent, activeLayout.contentStyle]}
          >
            <Text
              style={[
                styles.sharePreviewQuote,
                baseParagraphStyle,
                activeLayout.quoteStyle,
                activeFont.style,
                {
                  color: activeTextColor,
                  fontSize: calculatedQuoteSize,
                  lineHeight: calculatedQuoteLineHeight,
                },
              ]}
            >
              {shareText}
            </Text>
            <View
              style={[
                styles.sharePreviewMeta,
                activeLayout.metaContainerStyle,
              ]}
            >
              <Text
                style={[
                  styles.sharePreviewMetaLabel,
                  activeLayout.metaTextStyle,
                  { color: activeBackground.tagColor },
                ]}
              >
                From
              </Text>
              <Text
                style={[
                  styles.sharePreviewTitle,
                  activeLayout.metaTextStyle,
                  { color: activeTextColor },
                ]}
              >
                {shareContext.writingTitle}
              </Text>
              {shareContext.sectionTitle ? (
                <Text
                  style={[
                    styles.sharePreviewSection,
                    activeLayout.metaTextStyle,
                    { color: activeBackground.tagColor },
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
        <View style={styles.shareEditorSection}>
          <Text style={styles.shareEditorLabel}>Font</Text>
          <View style={styles.shareEditorOptionsRow}>
            {fontOptions.map(option => {
              const isSelected = option.id === fontId;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setFontId(option.id)}
                  style={[
                    styles.shareEditorOption,
                    isSelected && styles.shareEditorOptionSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.shareEditorOptionLabel, option.style]}>Aa</Text>
                  <Text style={styles.shareEditorOptionName}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.shareEditorSection}>
          <Text style={styles.shareEditorLabel}>Text colour</Text>
          <View style={styles.shareEditorColorRow}>
            {colorPalette.map(option => {
              const isSelected = option.id === textColorId;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setTextColorId(option.id)}
                  style={[
                    styles.shareEditorColorSwatch,
                    { backgroundColor: option.value },
                    isSelected && styles.shareEditorColorSwatchSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                />
              );
            })}
          </View>
        </View>
        <View style={styles.shareEditorSection}>
          <Text style={styles.shareEditorLabel}>Background</Text>
          <View style={styles.shareEditorOptionsRow}>
            {backgroundOptions.map(option => {
              const isSelected = option.id === backgroundId;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setBackgroundId(option.id)}
                  style={[
                    styles.shareEditorOption,
                    isSelected && styles.shareEditorOptionSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View
                    style={[
                      styles.shareEditorBackgroundPreview,
                      { backgroundColor: option.backgroundColor, borderColor: option.borderColor },
                    ]}
                  />
                  <Text style={styles.shareEditorOptionName}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.shareEditorSection}>
          <Text style={styles.shareEditorLabel}>Layout</Text>
          <View style={styles.shareEditorOptionsColumn}>
            {layoutOptions.map(option => {
              const isSelected = option.id === layoutId;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setLayoutId(option.id)}
                  style={[
                    styles.shareEditorLayoutCard,
                    isSelected && styles.shareEditorLayoutCardSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={styles.shareEditorLayoutTitle}>{option.label}</Text>
                  <Text style={styles.shareEditorLayoutDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        {passageSegments.length > 1 ? (
          <View style={styles.shareEditorSection}>
            <Text style={styles.shareEditorLabel}>Pick the lines to feature</Text>
            <Text style={styles.shareEditorHelperText}>
              Choose up to two parts of the passage to highlight in your post.
            </Text>
            <View style={styles.shareSegmentList}>
              {passageSegments.map((segment, index) => {
                const isSelected = selectedSegments.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedSegments(prev => {
                        const alreadySelected = prev.includes(index);
                        if (alreadySelected) {
                          return prev.filter(item => item !== index);
                        }
                        if (prev.length >= 2) {
                          return [prev[1] ?? prev[0], index].filter(
                            item => item !== undefined,
                          );
                        }
                        return [...prev, index];
                      });
                    }}
                    style={[
                      styles.shareSegmentCard,
                      isSelected && styles.shareSegmentCardSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.shareSegmentBadge}>
                      <Text style={styles.shareSegmentBadgeLabel}>{index + 1}</Text>
                    </View>
                    <Text style={styles.shareSegmentPreview} numberOfLines={3}>
                      {segment}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
        <TouchableOpacity onPress={onShareNow} style={styles.shareNowButton}>
          <Text style={styles.shareNowButtonLabel}>Share passage</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
