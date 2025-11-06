import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera } from 'react-native-image-picker';
import ViewShot from 'react-native-view-shot';
import Video from 'react-native-video';
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
  const viewShotRef = useRef(null);
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
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [isCapturingMedia, setIsCapturingMedia] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);

  const capturedMediaIsVideo = useMemo(
    () =>
      typeof capturedMedia?.type === 'string'
        ? capturedMedia.type.startsWith('video')
        : false,
    [capturedMedia?.type],
  );

  const shareDestinations = useMemo(
    () => [
      { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
      { id: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
      { id: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
      { id: 'liquidSpirit', label: 'Liquid Spirit', icon: 'water-outline' },
    ],
    [],
  );

  const viewShotOptions = useMemo(
    () => ({
      format: 'png',
      quality: 0.92,
      result: 'tmpfile',
      fileName: 'bahai-writings-share',
    }),
    [],
  );

  useEffect(() => {
    setFontId(fontOptions[0].id);
    setTextColorId('theme');
    setBackgroundId('theme');
    setLayoutId(layoutOptions[1]?.id ?? layoutOptions[0].id);
    setActiveTool('theme');
    setCapturedMedia(null);
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

  const handleCaptureMedia = useCallback(async () => {
    try {
      setIsCapturingMedia(true);
      const result = await launchCamera({
        mediaType: 'mixed',
        includeBase64: false,
        videoQuality: 'high',
        saveToPhotos: false,
      });

      if (result?.didCancel) {
        return;
      }

      if (result?.errorCode) {
        throw new Error(result.errorMessage || result.errorCode);
      }

      const asset = Array.isArray(result?.assets) ? result.assets[0] : null;

      if (!asset?.uri) {
        throw new Error('No media was captured.');
      }

      setCapturedMedia({
        uri: asset.uri,
        type: asset.type ?? (asset.duration ? 'video/mp4' : 'image/jpeg'),
        duration: asset.duration ?? null,
        fileName: asset.fileName ?? null,
      });
    } catch (error) {
      console.warn('Unable to capture media for sharing', error);
      Alert.alert(
        'Camera unavailable',
        error?.message ??
          'We could not open the camera. Please check your permissions and try again.',
      );
    } finally {
      setIsCapturingMedia(false);
    }
  }, []);

  const handleResetMedia = useCallback(() => {
    setCapturedMedia(null);
  }, []);

  const handleOpenShareSheet = useCallback(() => {
    if (!hasSelection) {
      Alert.alert(
        'Select sentences first',
        'Choose at least one sentence to include before sharing.',
      );
      return;
    }

    setShareSheetVisible(true);
  }, [hasSelection]);

  const handleCloseShareSheet = useCallback(() => {
    setShareSheetVisible(false);
  }, []);

  const handleShareToDestination = useCallback(
    async destinationId => {
      if (!destinationId) {
        return;
      }

      let composedImageUri = null;

      if (viewShotRef.current?.capture) {
        try {
          composedImageUri = await viewShotRef.current.capture(viewShotOptions);
        } catch (error) {
          console.warn('Unable to capture share preview', error);
          composedImageUri = null;
        }
      }

      onShareNow?.({
        destination: destinationId,
        writingTitle: shareContext?.writingTitle,
        sectionTitle: shareContext?.sectionTitle,
        text: shareText,
        composedImageUri,
        media:
          capturedMedia && capturedMedia.uri
            ? {
                uri: capturedMedia.uri,
                type: capturedMedia.type ?? null,
                duration: capturedMedia.duration ?? null,
              }
            : null,
        theme: {
          id: shareThemeId,
          textColor: activeTextColor,
          backgroundColor: activeBackground.backgroundColor,
          borderColor: activeBackground.borderColor,
          fontId,
          layoutId,
        },
      });

      setShareSheetVisible(false);
    },
    [
      activeBackground.backgroundColor,
      activeBackground.borderColor,
      activeTextColor,
      capturedMedia,
      fontId,
      layoutId,
      onShareNow,
      shareContext,
      shareText,
      shareThemeId,
      viewShotOptions,
    ],
  );

  const paletteTabs = useMemo(
    () => [
      { id: 'media', label: 'Camera', icon: 'camera-outline' },
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
      case 'media':
        return (
          <View style={styles.shareMediaPanel}>
            <TouchableOpacity
              onPress={handleCaptureMedia}
              style={[
                styles.shareCaptureButton,
                isCapturingMedia && styles.shareCaptureButtonDisabled,
              ]}
              disabled={isCapturingMedia}
              accessibilityRole="button"
            >
              <Ionicons
                name={capturedMediaIsVideo ? 'videocam-outline' : 'camera-outline'}
                size={20}
                color="#ffffff"
                style={styles.shareCaptureButtonIcon}
              />
              <Text style={styles.shareCaptureButtonLabel}>
                {isCapturingMedia
                  ? 'Opening camera…'
                  : capturedMedia
                  ? 'Retake photo or video'
                  : 'Take photo or video'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.shareCaptureNotice}>
              Use your device camera to capture a background image or clip. Your
              selected passage will be layered on top.
            </Text>
            {capturedMedia ? (
              <View style={styles.shareCapturePreview}>
                <Ionicons
                  name={capturedMediaIsVideo ? 'film-outline' : 'image-outline'}
                  size={20}
                  color="#3b2a15"
                  style={styles.shareCapturePreviewIcon}
                />
                <View style={styles.shareCapturePreviewInfo}>
                  <Text style={styles.shareCaptureFileLabel}>
                    {capturedMedia.fileName ||
                      (capturedMediaIsVideo
                        ? 'Video clip'
                        : 'Photo background')}
                  </Text>
                  {capturedMedia.duration ? (
                    <Text style={styles.shareCaptureFileMeta}>
                      {Math.round(capturedMedia.duration)}s clip
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={handleResetMedia}
                  style={styles.shareCaptureResetButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.shareCaptureResetLabel}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        );
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

  const previewQuoteStyle = [
    styles.sharePreviewQuote,
    baseParagraphStyle,
    activeLayout.quoteStyle,
    activeFont.style,
    {
      color: activeTextColor,
      fontSize: calculatedQuoteSize,
      lineHeight: calculatedQuoteLineHeight,
    },
  ];

  const previewAttribution = (
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
  );

  const previewFooter = (
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
  );

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
      {typeof onChangeSelection === 'function' ? (
        <TouchableOpacity
          onPress={onChangeSelection}
          style={styles.shareChangeSelectionButton}
          accessibilityRole="button"
        >
          <Text style={styles.shareChangeSelectionLabel}>Adjust selection</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.shareEditorBody}>
        <View style={styles.sharePreviewWrapper}>
          <View
            style={[
              styles.sharePreviewOuter,
              capturedMedia
                ? styles.sharePreviewOuterMedia
                : { borderColor: activeBackground.borderColor },
            ]}
          >
            <ViewShot
              ref={viewShotRef}
              style={styles.sharePreviewShot}
              options={viewShotOptions}
            >
              {capturedMedia ? (
                <View
                  style={[styles.sharePreviewCard, styles.sharePreviewCardMedia]}
                >
                  {capturedMediaIsVideo ? (
                    <View style={styles.sharePreviewMediaWrapper}>
                      <Video
                        source={{ uri: capturedMedia.uri }}
                        style={styles.sharePreviewVideo}
                        resizeMode="cover"
                        repeat
                        muted
                      />
                      <View style={styles.sharePreviewOverlayLayer} />
                    </View>
                  ) : (
                    <ImageBackground
                      source={{ uri: capturedMedia.uri }}
                      style={styles.sharePreviewMediaWrapper}
                      imageStyle={styles.sharePreviewImage}
                    >
                      <View style={styles.sharePreviewOverlayLayer} />
                    </ImageBackground>
                  )}
                  <View
                    style={[
                      styles.sharePreviewOverlayContent,
                      activeLayout.contentStyle,
                    ]}
                  >
                    <Text style={previewQuoteStyle}>
                      {shareText || 'Select sentences to preview.'}
                    </Text>
                    {previewAttribution}
                    {previewFooter}
                  </View>
                </View>
              ) : (
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
                  <View
                    style={[
                      styles.sharePreviewContent,
                      activeLayout.contentStyle,
                    ]}
                  >
                    <Text style={previewQuoteStyle}>
                      {shareText || 'Select sentences to preview.'}
                    </Text>
                    {previewAttribution}
                  </View>
                  {previewFooter}
                </View>
              )}
            </ViewShot>
          </View>
        </View>
      </View>
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
        onPress={handleOpenShareSheet}
        style={[
          styles.shareFloatingButton,
          (!hasSelection || isCapturingMedia) && styles.shareFloatingButtonDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Choose where to share"
        disabled={!hasSelection || isCapturingMedia}
      >
        <Ionicons name="share-outline" size={24} color="#ffffff" />
      </TouchableOpacity>
      <Modal
        visible={shareSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseShareSheet}
      >
        <View style={styles.shareDestinationBackdrop}>
          <TouchableOpacity
            style={styles.shareDestinationDismiss}
            accessibilityRole="button"
            onPress={handleCloseShareSheet}
          />
          <View style={styles.shareDestinationSheet}>
            <Text style={styles.shareDestinationTitle}>Share to…</Text>
            <View style={styles.shareDestinationOptions}>
              {shareDestinations.map(destination => (
                <TouchableOpacity
                  key={destination.id}
                  onPress={() => handleShareToDestination(destination.id)}
                  style={styles.shareDestinationOption}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={destination.icon}
                    size={22}
                    color="#3b2a15"
                    style={styles.shareDestinationOptionIcon}
                  />
                  <Text style={styles.shareDestinationOptionLabel}>
                    {destination.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={handleCloseShareSheet}
              style={styles.shareDestinationCancel}
              accessibilityRole="button"
            >
              <Text style={styles.shareDestinationCancelLabel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
