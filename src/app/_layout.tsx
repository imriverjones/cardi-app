import {
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  Figtree_900Black,
  useFonts,
} from '@expo-google-fonts/figtree';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppProvider, useApp } from '@/state/app-state';
import { registerBackgroundRefresh } from '@/tasks/background';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { ready, palette } = useApp();
  const [fontsLoaded] = useFonts({ Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold, Figtree_900Black });

  useEffect(() => {
    if (ready && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [ready, fontsLoaded]);
  useEffect(() => {
    registerBackgroundRefresh();
  }, []);

  if (!ready || !fontsLoaded) return null;
  return (
    <>
      <StatusBar style={palette.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg2 } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="story" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="place" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.9], sheetGrabberVisible: true }} />
        <Stack.Screen name="widgets" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true }} />
        <Stack.Screen name="day" />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
