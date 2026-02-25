import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useThemeStore } from '../src/store/themeStore';

export default function RootLayout() {
  const { loadTheme } = useThemeStore();

  useEffect(() => {
    loadTheme();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-habit" />
      <Stack.Screen name="habit-detail" />
      <Stack.Screen name="edit-habit" />
    </Stack>
  );
}