import * as Notifications from 'expo-notifications';

// Configura cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
  shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Pide permisos al usuario
export const requestPermissions = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();

  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Programa un recordatorio diario
export const scheduleDailyReminder = async (hour: number, minute: number): Promise<string | null> => {
  const granted = await requestPermissions();
  if (!granted) return null;

  // Cancela notificaciones anteriores para no duplicar
  await cancelDailyReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌱 ¡Es hora de tus hábitos!',
      body: 'Revisa tu progreso de hoy y mantén tu racha activa.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
};

// Cancela el recordatorio diario
export const cancelDailyReminder = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Obtiene las notificaciones programadas (para verificar)
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

// Envía una notificación inmediata de prueba
export const sendTestNotification = async (): Promise<void> => {
  const granted = await requestPermissions();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Notificaciones activadas',
      body: '¡Perfecto! Te recordaremos completar tus hábitos cada día.',
      sound: true,
    },
    trigger: null, // inmediata
  });
};