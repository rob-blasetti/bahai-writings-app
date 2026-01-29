import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import BaseScreen from '../components/BaseScreen';

export default function WebScreen({ styles }) {
  const navigation = useNavigation();
  const route = useRoute();
  const { url, title } = route?.params ?? {};
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleNavigationStateChange = useCallback((state) => {
    setCanGoBack(state.canGoBack);
  }, []);

  const handleBack = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return;
    }
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('explore');
  }, [canGoBack, navigation]);

  if (!url) {
    return (
      <BaseScreen styles={styles} variant="plain" style={styles.homeContainer}>
        <Text style={styles.bottomNavScreenSubtitle}>
          Unable to open this page.
        </Text>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen
      styles={styles}
      variant="full"
      includeBottomInset
      topNav={{ title: title ?? 'Browser', onBack: handleBack }}
    >
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator color="#8c6239" />
            </View>
          )}
        />
      </View>
    </BaseScreen>
  );
}
