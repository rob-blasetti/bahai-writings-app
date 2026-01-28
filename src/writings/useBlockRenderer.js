import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const escapeRegExp = value =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function useBlockRenderer({
  styles,
  scaledTypography,
  activeSearchHighlight,
  selectedSectionId,
  selectedWritingId,
  onShowReflection,
}) {
  return useCallback(
    (block, index, options = {}) => {
      if (!block) {
        return null;
      }
      const { writingTitle = null, sectionTitle = null } = options;
      const normalizedBlockText =
        typeof block.text === 'string' ? block.text.trim() : '';
      const canOpenReflection = normalizedBlockText.length > 0;
      const isHighlightedBlock =
        activeSearchHighlight &&
        activeSearchHighlight.blockId === block.id &&
        activeSearchHighlight.sectionId === selectedSectionId &&
        activeSearchHighlight.writingId === selectedWritingId;
      const highlightTerm =
        isHighlightedBlock && activeSearchHighlight.normalizedTerm
          ? activeSearchHighlight.normalizedTerm
          : null;

      const renderHighlightedContent = text => {
        if (!highlightTerm || typeof text !== 'string' || text.length === 0) {
          return text;
        }
        try {
          const regex = new RegExp(`(${escapeRegExp(highlightTerm)})`, 'ig');
          return text.split(regex).map((part, idx) => {
            if (part.length === 0) {
              return null;
            }
            if (part.toLowerCase() === highlightTerm) {
              return (
                <Text
                  key={`${block.id}-highlight-${idx}`}
                  style={styles.searchHighlightText}
                >
                  {part}
                </Text>
              );
            }
            return part;
          });
        } catch (error) {
          return text;
        }
      };

      const wrapBlock = (
        children,
        wrapperStyle = [styles.blockContainer, index === 0 && styles.firstBlock],
      ) => {
        const baseStyles = Array.isArray(wrapperStyle)
          ? wrapperStyle
          : [wrapperStyle];
        const styleArray = baseStyles.filter(Boolean);
        if (canOpenReflection) {
          return (
            <TouchableOpacity
              style={styleArray}
              activeOpacity={0.85}
              onPress={() =>
                onShowReflection({
                  block,
                  writingTitle,
                  sectionTitle,
                })
              }
            >
              {children}
            </TouchableOpacity>
          );
        }
        return <View style={styleArray}>{children}</View>;
      };

      const renderTextWithNumber = ({ text, style, key, numberStyle }) => {
        if (typeof text !== 'string' || text.length === 0) {
          return null;
        }

        const numberMatch =
          text.match(/^(\d{1,3})([.)]\s+)([\s\S]+)$/) ||
          text.match(/^(\d{1,3})(\s{2,})([\s\S]+)$/);

        if (!numberMatch) {
          return (
            <Text key={key} style={style}>
              {renderHighlightedContent(text)}
            </Text>
          );
        }

        const number = numberMatch[1];
        const delimiter = numberMatch[2];
        const remainder = numberMatch[3] ?? '';
        const normalizedDelimiter = /\s{2,}/.test(delimiter) ? ' ' : delimiter;
        const numberStyleArray = Array.isArray(numberStyle)
          ? numberStyle
          : numberStyle
          ? [numberStyle]
          : [];

        return (
          <Text key={key} style={style}>
            <Text
              style={[
                styles.passageNumber,
                scaledTypography.passageNumber,
                ...numberStyleArray,
              ]}
            >
              {number}
            </Text>
            {normalizedDelimiter}
            {renderHighlightedContent(remainder)}
          </Text>
        );
      };

      const hasFootnotes =
        Array.isArray(block.footnotes) && block.footnotes.length > 0;
      const hasAttribution =
        typeof block.attribution === 'string' && block.attribution.length > 0;
      const renderMeta = () => {
        if (!hasFootnotes && !hasAttribution) {
          return null;
        }
        return (
          <>
            {hasAttribution ? (
              <Text
                style={[styles.attributionText, scaledTypography.attributionText]}
              >
                {block.attribution}
              </Text>
            ) : null}
            {hasFootnotes ? (
              <View style={styles.footnoteContainer}>
                {block.footnotes.map((footnote, footnoteIndex) =>
                  renderTextWithNumber({
                    key: `${block.id}-footnote-${footnoteIndex}`,
                    text: footnote,
                    style: [styles.footnoteText, scaledTypography.footnoteText],
                  }),
                )}
              </View>
            ) : null}
          </>
        );
      };

      if (block.type === 'heading') {
        return (
          <Text
            style={[
              styles.contentHeading,
              index === 0 && styles.contentHeadingFirst,
              scaledTypography.contentHeading,
            ]}
          >
            {renderHighlightedContent(block.text)}
          </Text>
        );
      }

      if (block.type === 'quote') {
        const meta = renderMeta();
        return wrapBlock(
          <>
            <View style={[styles.quoteBlock, index === 0 && styles.firstBlock]}>
              <Text style={[styles.quoteText, scaledTypography.quoteText]}>
                {renderHighlightedContent(block.text)}
              </Text>
            </View>
            {meta}
          </>,
          [styles.blockContainer],
        );
      }

      if (block.type === 'poetry') {
        const meta = renderMeta();
        return wrapBlock(
          <>
            <View style={[styles.poetryBlock, index === 0 && styles.firstBlock]}>
              {block.text.split('\n').map((line, lineIndex) =>
                renderTextWithNumber({
                  key: `${block.id}-line-${lineIndex}`,
                  text: line,
                  style: [styles.poetryLine, scaledTypography.poetryLine],
                }),
              )}
            </View>
            {meta}
          </>,
        );
      }

      if (block.type === 'list') {
        const meta = renderMeta();
        return wrapBlock(
          <>
            <View style={[styles.listBlock, index === 0 && styles.firstBlock]}>
              {block.text.split('\n').map((line, lineIndex) =>
                renderTextWithNumber({
                  key: `${block.id}-item-${lineIndex}`,
                  text: line,
                  style: [styles.listItemText, scaledTypography.listItemText],
                }),
              )}
            </View>
            {meta}
          </>,
        );
      }

      const meta = renderMeta();
      return wrapBlock(
        <>
          {block.text
            ? renderTextWithNumber({
                text: block.text,
                style: [
                  styles.contentParagraph,
                  index === 0 && styles.contentParagraphFirst,
                  scaledTypography.contentParagraph,
                ],
              })
            : null}
          {meta}
        </>,
      );
    },
    [
      activeSearchHighlight,
      onShowReflection,
      scaledTypography,
      selectedSectionId,
      selectedWritingId,
      styles,
    ],
  );
}
