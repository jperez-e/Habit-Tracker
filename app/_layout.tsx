import { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import AuthScreen from '../src/screens/AuthScreen';
import { useThemeStore } from '../src/store/themeStore';

export default function RootLayout() {
  const { loadTheme } = useThemeStore();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadTheme();

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [loadTheme]);

  if (!initialized) return null;

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-habit" />
      <Stack.Screen name="habit-detail" />
      <Stack.Screen name="edit-habit" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}