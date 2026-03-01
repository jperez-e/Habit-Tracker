import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogBox } from 'react-native';
import { HabitFrequencyData } from './habitFrequency';

// Ignora la advertencia sobre notificaciones remotas en Expo Go,
// ya que esta app usa únicamente notificaciones locales (que sí funcionan).
LogBox.ignoreLogs([
  'Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
]);
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const HABIT_REMINDER_IDS_KEY = 'habit_reminder_ids';
const GLOBAL_REMINDER_ID_KEY = 'global_reminder_id';
export const HABIT_NOTIFICATION_CATEGORY_ID = 'habit_actions';
export const HABIT_MARK_DONE_ACTION_ID = 'mark_done';

export type GlobalReminderFrequency = 'daily' | 'every_2h' | 'every_4h' | 'every_8h';

const parseTime = (timeStr: string): { hour: number; minute: number } => {
  const [h, m] = timeStr.split(':').map(Number);
  const hour = Number.isFinite(h) ? Math.min(Math.max(h, 0), 23) : 8;
  const minute = Number.isFinite(m) ? Math.min(Math.max(m, 0), 59) : 0;
  return { hour, minute };
};

const getHabitReminderMap = async (): Promise<Record<string, string>> => {
  try {
    const raw = await AsyncStorage.getItem(HABIT_REMINDER_IDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setHabitReminderMap = async (map: Record<string, string>) => {
  await AsyncStorage.setItem(HABIT_REMINDER_IDS_KEY, JSON.stringify(map));
};

export const requestPermissions = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const configureNotificationActions = async () => {
  await Notifications.setNotificationCategoryAsync(HABIT_NOTIFICATION_CATEGORY_ID, [
    {
      identifier: HABIT_MARK_DONE_ACTION_ID,
      buttonTitle: 'Marcar completado',
      options: { opensAppToForeground: false },
    },
  ]);
};

// Recordatorio global (para todos los hábitos)
export const scheduleGlobalReminder = async (
  hour: number,
  minute: number,
  frequency: GlobalReminderFrequency = 'daily'
) => {
  await cancelGlobalReminder();

  const trigger =
    frequency === 'daily'
      ? {
        type: Notifications.SchedulableTriggerInputTypes.DAILY as const,
        hour,
        minute,
      }
      : {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL as const,
        seconds: frequency === 'every_2h' ? 2 * 60 * 60 : frequency === 'every_4h' ? 4 * 60 * 60 : 8 * 60 * 60,
        repeats: true,
      };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌱 Habit Tracker',
      body: '¡Es hora de revisar tus hábitos del día!',
      sound: true,
    },
    trigger,
  });
  await AsyncStorage.setItem(GLOBAL_REMINDER_ID_KEY, id);
};

export const cancelGlobalReminder = async () => {
  const id = await AsyncStorage.getItem(GLOBAL_REMINDER_ID_KEY);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(GLOBAL_REMINDER_ID_KEY);
  }
};

// Recordatorio por hábito individual
export const scheduleHabitReminder = async (
  habitId: string,
  habitName: string,
  habitIcon: string,
  timeStr: string, // "HH:MM"
  frequency?: HabitFrequencyData
) => {
  // Cancela el anterior de este hábito
  await cancelHabitReminder(habitId);

  const { hour, minute } = parseTime(timeStr);

  const map = await getHabitReminderMap();
  const ids: string[] = [];

  const content = {
    title: `${habitIcon} Recordatorio`,
    body: `¡No olvides: ${habitName}!`,
    sound: true,
    categoryIdentifier: HABIT_NOTIFICATION_CATEGORY_ID,
    data: { habitId },
  };

  const frequencyType = frequency?.frequencyType ?? 'daily';

  if (frequencyType === 'specific_days' && (frequency?.specificDays?.length ?? 0) > 0) {
    for (const day of frequency!.specificDays!) {
      const weekday = day === 0 ? 1 : day + 1; // Expo: 1=Sunday
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        },
      });
      ids.push(id);
    }
  } else {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    ids.push(id);
  }

  map[habitId] = ids.join(',');
  await setHabitReminderMap(map);
};

export const cancelHabitReminder = async (habitId: string) => {
  const map = await getHabitReminderMap();
  const id = map[habitId];
  if (!id) return;
  for (const singleId of id.split(',')) {
    await Notifications.cancelScheduledNotificationAsync(singleId);
  }
  delete map[habitId];
  await setHabitReminderMap(map);
};

export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(HABIT_REMINDER_IDS_KEY);
  await AsyncStorage.removeItem(GLOBAL_REMINDER_ID_KEY);
};
