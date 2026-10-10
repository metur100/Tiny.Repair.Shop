import { Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold, useFonts } from '@expo-google-fonts/fredoka';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initAudio, pauseMusic, syncMusic } from '@/services/audio';
import { loadSave } from '@/store/saveManager';
import { useGameStore } from '@/store/useGameStore';
import { palette } from '@/theme/colors';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold });
  const hydrated = useGameStore((s) => s.hydrated);
  const music = useGameStore((s) => s.settings.music);

  useEffect(() => {
    let alive = true;
    void loadSave().then((data) => {
      if (alive) useGameStore.getState().hydrate(data);
    });
    void initAudio();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) void SplashScreen.hideAsync();
  }, [fontsLoaded, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    syncMusic();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncMusic();
      else pauseMusic();
    });
    return () => sub.remove();
  }, [hydrated, music]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.cream }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.cream }, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="customer/[jobId]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="repair/[jobId]" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="results" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
