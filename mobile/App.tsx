import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useGlucoseStore } from './src/store/glucoseStore';

const HEALTH_CONNECT_TASK = 'HEALTH_CONNECT_BACKGROUND_SYNC';

TaskManager.defineTask(HEALTH_CONNECT_TASK, async () => {
  try {
    const { healthConnectEnabled, triggerHealthConnectSync } = useGlucoseStore.getState();
    if (!healthConnectEnabled) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    await triggerHealthConnectSync(1);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  useEffect(() => {
    BackgroundFetch.registerTaskAsync(HEALTH_CONNECT_TASK, {
      minimumInterval: 60 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    }).catch(() => {
      // Background fetch registration may fail on simulators / web — ignore silently
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
