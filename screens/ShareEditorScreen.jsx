import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { extractPassageSentences, getShareableBlockText } from './shareUtils';
import { ProgramIconButton } from '../components/IconButtons';
import { NavigationTopBar } from '../components/NavigationTopBar';

const getThemeChipStyle = (theme, isActive) => ({
  borderColor: theme.accentColor,
  backgroundColor: isActive ? theme.backgroundColor : '#fff',
});

export default function ShareEditorScreen({
  styles,
  scaledTypography,
  shareContext,
  shareBackButtonLabel,
  selectedSentenceIndexes,
  onClose,
  onOpenProgram,
  onChangeSelection,
  hasProgramPassages,
  programBadgeLabel,
  activeShareTheme,
  shareThemes,
  shareThemeId,
  onSelectShareTheme,
  onShareNow,
}) {
  const passageText = useMemo(() => {
    if (typeof shareContext?.passageText === 'string') {
      return shareContext.passageText;
    }
    return getShareableBlockText(shareContext?.block);
  }, [shareContext?.passageText, shareContext?.block]);

  const sentences = useMemo(() => {
    if (Array.isArray(shareContext?.sentences)) {
      return shareContext.sentences;
    }
    return extractPassageSentences(passageText);
  }, [shareContext?.sentences, passageText]);
  const sanitizedSelection = useMemo(() => {
    if (!Array.isArray(selectedSentenceIndexes) || sentences.length === 0) {
      return [];
    }

    const normalized = selectedSentenceIndexes
      .map(item =>
        typeof item === 'string' ? Number.parseInt(item, 10) : item,
      )
      .filter(Number.isFinite);

    const unique = [];
    normalized.forEach(index => {
      if (
        index >= 0 &&
        index < sentences.length &&
        !unique.includes(index)
      ) {
        unique.push(index);
      }
    });

    return unique;
  }, [selectedSentenceIndexes, sentences]);
  const hasSelection = sanitizedSelection.length > 0;

  useEffect(() => {
    console.log('[ShareEditor] selection state received', {
      rawIndexes: selectedSentenceIndexes,
      sanitizedSelection,
      totalSentences: sentences.length,
    });
  }, [selectedSentenceIndexes, sanitizedSelection, sentences]);

  const fontOptions = useMemo(
    () => [
      {
        id: 'serif',
        label: 'Serif',
        style: {
          fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
          fontWeight: '600',
        },
      },
      {
        id: 'sans',
        label: 'Modern',
        style: {
          fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif', default: undefined }),
          fontWeight: '600',
        },
      },
      {
        id: 'mono',
        label: 'Mono',
        style: {
          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
          fontWeight: '500',
          letterSpacing: 0.4,
        },
      },
      {
        id: 'rounded',
        label: 'Rounded',
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
        description: 'Left-aligned text with subtle rhythm.',
        quoteStyle: { textAlign: 'left' },
        authorStyle: { textAlign: 'left' },
        contentStyle: { alignItems: 'flex-start' },
        quoteScale: 1,
        lineHeightScale: 1,
      },
      {
        id: 'centered',
        label: 'Centered',
        description: 'Centered typography for balance.',
        quoteStyle: { textAlign: 'center' },
        authorStyle: { textAlign: 'center' },
        contentStyle: { alignItems: 'center' },
        quoteScale: 1.05,
        lineHeightScale: 1.05,
      },
      {
        id: 'poster',
        label: 'Poster',
        description: 'Bold uppercase lettering for emphasis.',
        quoteStyle: { textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2 },
        authorStyle: { textAlign: 'center', letterSpacing: 1 },
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
      },
      {
        id: 'sunset',
        label: 'Sunset',
        backgroundColor: '#fbe4d8',
        borderColor: '#f7a992',
      },
      {
        id: 'lagoon',
        label: 'Lagoon',
        backgroundColor: '#e0f0ef',
        borderColor: '#6fb1a0',
      },
      {
        id: 'twilight',
        label: 'Twilight',
        backgroundColor: '#262837',
        borderColor: '#505b8f',
      },
    ],
    [activeShareTheme.backgroundColor, activeShareTheme.accentColor],
  );

  const [fontId, setFontId] = useState(fontOptions[0].id);
  const [textColorId, setTextColorId] = useState('theme');
  const [backgroundId, setBackgroundId] = useState('theme');
  const [layoutId, setLayoutId] = useState(
    layoutOptions[1]?.id ?? layoutOptions[0].id,
  );
  const [activeTool, setActiveTool] = useState('theme');

  useEffect(() => {
    setFontId(fontOptions[0].id);
    setTextColorId('theme');
    setBackgroundId('theme');
    setLayoutId(layoutOptions[1]?.id ?? layoutOptions[0].id);
    setActiveTool('theme');
  }, [shareContext?.block?.id, fontOptions, layoutOptions]);

  useEffect(() => {
    setTextColorId('theme');
    setBackgroundId('theme');
  }, [activeShareTheme]);

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
    if (!sentences.length || sanitizedSelection.length === 0) {
      return '';
    }
    const sortedIndexes = [...sanitizedSelection].sort((a, b) => a - b);
    const compiled = sortedIndexes
      .map(index => {
        const sentence = sentences[index];
        if (!sentence) {
          return '';
        }
        if (typeof sentence === 'string') {
          return sentence;
        }
        return sentence.text ?? '';
      })
      .filter(Boolean)
      .join('\n\n');

    if (compiled) {
      return compiled;
    }

    return typeof passageText === 'string' ? passageText.trim() : '';
  }, [sanitizedSelection, sentences, passageText]);

  const baseParagraphStyle = scaledTypography?.contentParagraph ?? {};
  const calculatedQuoteSize = baseParagraphStyle.fontSize
    ? baseParagraphStyle.fontSize * (activeLayout.quoteScale ?? 1)
    : undefined;
  const calculatedQuoteLineHeight = baseParagraphStyle.lineHeight
    ? baseParagraphStyle.lineHeight * (activeLayout.lineHeightScale ?? activeLayout.quoteScale ?? 1)
    : undefined;

  const paletteTabs = useMemo(
    () => [
      { id: 'theme', label: 'Theme', icon: 'color-palette-outline' },
      { id: 'font', label: 'Font', icon: 'text-outline' },
      { id: 'textColor', label: 'Text color', icon: 'color-fill-outline' },
      { id: 'background', label: 'Background', icon: 'image-outline' },
      { id: 'layout', label: 'Layout', icon: 'apps-outline' },
    ],
    [],
  );

  const renderPaletteContent = () => {
    switch (activeTool) {
      case 'theme':
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sharePaletteChipRow}
          >
            {shareThemes.map(theme => {
              const isActive = theme.id === shareThemeId;
              const themeChipStyle = getThemeChipStyle(theme, isActive);
              return (
                <TouchableOpacity
                  key={theme.id}
                  onPress={() => onSelectShareTheme(theme.id)}
                  style={[
                    styles.shareThemeChip,
                    styles.sharePaletteChip,
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
          </ScrollView>
        );
      case 'font':
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sharePaletteOptionRow}
          >
            {fontOptions.map(option => {
              const isSelected = option.id === fontId;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setFontId(option.id)}
                  style={[
                    styles.shareEditorOption,
                    styles.sharePaletteOptionCard,
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
          </ScrollView>
        );
      case 'textColor':
        return (
          <View style={styles.sharePaletteSwatchRow}>
            {colorPalette.map(option => {
              const isSelected = option.id === textColorId;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setTextColorId(option.id)}
                  style={[
                    styles.shareEditorColorSwatch,
                    isSelected && styles.shareEditorColorSwatchSelected,
                    styles.sharePaletteColorSwatch,
                    { backgroundColor: option.value },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                />
              );
            })}
          </View>
        );
      case 'background':
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sharePaletteOptionRow}
          >
            {backgroundOptions.map(option => {
              const isSelected = option.id === backgroundId;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setBackgroundId(option.id)}
                  style={[
                    styles.shareEditorOption,
                    styles.sharePaletteOptionCard,
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
          </ScrollView>
        );
      case 'layout':
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sharePaletteLayoutRow}
          >
            {layoutOptions.map(option => {
              const isSelected = option.id === layoutId;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setLayoutId(option.id)}
                  style={[
                    styles.shareEditorLayoutCard,
                    styles.sharePaletteLayoutCard,
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
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.screenSurface}>
      <NavigationTopBar
        styles={styles}
        onBack={onClose}
        backAccessibilityLabel={shareBackButtonLabel}
        rightAccessory={
          <ProgramIconButton
            styles={styles}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
            onPress={onOpenProgram}
          />
        }
      />
      <View style={styles.shareEditorHeader}>
        <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
          Share this passage
        </Text>
        <Text style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}>
          Craft a beautiful moment before you send this inspiration to someone you love.
        </Text>
      </View>
      <View style={styles.shareEditorBody}>
        <View style={styles.sharePreviewWrapper}>
          <View
            style={[
              styles.sharePreviewOuter,
              { borderColor: activeBackground.borderColor },
            ]}
          >
            <View
              style={[
                styles.sharePreviewCard,
                { backgroundColor: activeBackground.backgroundColor },
              ]}
            >
              <View
                style={[
                  styles.sharePreviewAccent,
                  { backgroundColor: activeBackground.borderColor },
                ]}
              />
              <View
                style={[
                  styles.sharePreviewAccentSecondary,
                  { backgroundColor: activeBackground.borderColor },
                ]}
              />
              <View style={[styles.sharePreviewContent, activeLayout.contentStyle]}>
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
                  {shareText || 'Select sentences to preview.'}
                </Text>
                <View style={styles.sharePreviewAttribution}>
                  <View
                    style={[
                      styles.sharePreviewDivider,
                      { backgroundColor: activeTextColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.sharePreviewAuthor,
                      activeLayout.authorStyle,
                      { color: activeTextColor },
                    ]}
                  >
                    — {shareContext?.writingTitle}
                  </Text>
                  {shareContext?.sectionTitle ? (
                    <Text
                      style={[
                        styles.sharePreviewSection,
                        activeLayout.authorStyle,
                        { color: activeTextColor },
                      ]}
                    >
                      {shareContext.sectionTitle}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.sharePreviewFooter}>
                <View
                  style={[
                    styles.sharePreviewFooterLine,
                    { backgroundColor: activeTextColor },
                  ]}
                />
                <Text
                  style={[
                    styles.sharePreviewFooterLabel,
                    { color: activeTextColor },
                  ]}
                >
                  Bahai Writings
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.shareToolbar}>
        <View style={styles.shareToolbarTabs}>
          {paletteTabs.map(tab => {
            const isActive = tab.id === activeTool;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTool(tab.id)}
                style={[
                  styles.sharePaletteTab,
                  isActive && styles.sharePaletteTabActive,
                ]}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isActive }}
              >
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={isActive ? '#ffffff' : '#5a4524'}
                  style={styles.sharePaletteTabIcon}
                />
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.shareToolbarContent}>{renderPaletteContent()}</View>
      </View>
      <TouchableOpacity
        onPress={onShareNow}
        style={[
          styles.shareFloatingButton,
          !hasSelection && styles.shareFloatingButtonDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Share passage"
        disabled={!hasSelection}
      >
        <Ionicons name="share-outline" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
