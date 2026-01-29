import React from 'react';
import { Text, View } from 'react-native';
import BaseScreen from '../components/BaseScreen';
import Card from '../components/Card';
import ScreenTitle from '../components/ScreenTitle';

const CARD_IMAGES = {
  writings: require('../../assets/images/explore-writings.png'),
  prayers: require('../../assets/images/explore-prayers.png'),
  random: require('../../assets/images/explore-random.png'),
  devotional: require('../../assets/images/explore-devotional.png'),
};

export default function ExploreScreen({
  styles,
  onReadWritings,
  onOpenPrayers,
  onChooseRandom,
  onCreateDevotional,
}) {
  return (
    <BaseScreen
      styles={styles}
      variant="plain"
      style={styles.homeContainer}
      scrollable
    >
      <ScreenTitle styles={styles} title="Explore" />
      <View style={styles.homeHeader}>
        <Text style={styles.sectionTitle}>Where would you like to start?</Text>
        <Text style={styles.homeHeaderSubtitle}>
          Choose an option to begin exploring the writings.
        </Text>
      </View>
      <View style={[styles.homeList, styles.cardGrid]}>
        <Card
          styles={styles}
          title="Read The Writings"
          imageSource={CARD_IMAGES.writings}
          onPress={onReadWritings}
          accessibilityLabel="Read the writings"
          accessibilityHint="Browse all collections"
        />
        <Card
          styles={styles}
          title="Prayers"
          imageSource={CARD_IMAGES.prayers}
          onPress={onOpenPrayers}
          accessibilityLabel="Prayers"
          accessibilityHint="Open the prayers collection"
        />
        <Card
          styles={styles}
          title="Choose At Random"
          imageSource={CARD_IMAGES.random}
          onPress={onChooseRandom}
          accessibilityLabel="Choose at random"
          accessibilityHint="Open a random passage"
        />
        <Card
          styles={styles}
          title="Create Devotional"
          imageSource={CARD_IMAGES.devotional}
          onPress={onCreateDevotional}
          accessibilityLabel="Create devotional"
          accessibilityHint="Start a devotional program"
        />
      </View>
    </BaseScreen>
  );
}
