import React from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider } from 'react-native-paper';
import { store, persistor } from './src/app/store';
import { paperTheme, COLORS } from './src/constants/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OfflineBanner } from './src/components/OfflineBanner';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

const App = () => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ReduxProvider store={store}>
        <PersistGate loading={<LoadingFallback />} persistor={persistor}>
          <PaperProvider theme={paperTheme}>
            <SafeAreaProvider>
              <StatusBar
                barStyle="light-content"
              />
              <ErrorBoundary>
                <OfflineBanner />
                <RootNavigator />
              </ErrorBoundary>
            </SafeAreaProvider>
          </PaperProvider>
        </PersistGate>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
