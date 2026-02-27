import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Recordatorio global (para todos los hábitos)
export const scheduleGlobalReminder = async (hour: number, minute: number) => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌱 Habit Tracker',
      body: '¡Es hora de revisar tus hábitos del día!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
};

// Recordatorio por hábito individual
export const scheduleHabitReminder = async (
  habitId: string,
  habitName: string,
  habitIcon: string,
  timeStr: string // "HH:MM"
) => {
  // Cancela el anterior de este hábito
  await cancelHabitReminder(habitId);

  const [hour, minute] = timeStr.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: `habit_${habitId}`,
    content: {
      title: `${habitIcon} Recordatorio`,
      body: `¡No olvides: ${habitName}!`,
      sound: true,
      data: { habitId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
};

export const cancelHabitReminder = async (habitId: string) => {
  await Notifications.cancelScheduledNotificationAsync(`habit_${habitId}`);
};

export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};