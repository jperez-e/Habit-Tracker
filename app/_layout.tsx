import { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import ToastViewport from '../src/components/ToastViewport';
import { initSentry } from '../src/lib/sentry';
import { supabase } from '../src/lib/supabase';
import AuthScreen from '../src/screens/AuthScreen';
import { useHabitStore } from '../src/store/habitStore';
import { useThemeStore } from '../src/store/themeStore';
import { getTodayString } from '../src/utils/dateHelpers';
import { configureNotificationActions, HABIT_MARK_DONE_ACTION_ID } from '../src/utils/notifications';

export default function RootLayout() {
  initSentry();
  const { loadTheme, setUserName } = useThemeStore();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadTheme();
    configureNotificationActions();

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.username) {
        setUserName(session.user.user_metadata.username);
      }
      setSession(session);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.user_metadata?.username) {
        setUserName(session.user.user_metadata.username);
      }
      setSession(session);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionId = response.actionIdentifier;
      const habitId = response.notification.request.content.data?.habitId as string | undefined;

      if (actionId === HABIT_MARK_DONE_ACTION_ID && habitId) {
        const today = getTodayString();
        const { habits, toggleHabit } = useHabitStore.getState();
        const habit = habits.find((h) => h.id === habitId);

        if (habit && !habit.completedDates.includes(today)) {
          await toggleHabit(habitId, today);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      responseSub.remove();
    };
  }, [loadTheme, setUserName]);

  if (!initialized) return null;

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 220,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="add-habit" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="habit-detail" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="edit-habit" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <ToastViewport />
    </>
  );
}
