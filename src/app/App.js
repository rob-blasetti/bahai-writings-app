import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppContent from './AppContent';
import { AuthProvider } from '../auth/authContext';
import { VersesProvider } from '../myVerses/versesContext';
import { ShareProvider } from '../sharing/shareContext';
import { ProgramProvider } from '../programs/programContext';
import { ReflectionProvider } from '../reflection/reflectionContext';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <VersesProvider>
          <ShareProvider>
            <ProgramProvider>
              <ReflectionProvider>
                <AppContent />
              </ReflectionProvider>
            </ProgramProvider>
          </ShareProvider>
        </VersesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
