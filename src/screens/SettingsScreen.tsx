import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert, ScrollView, StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabitStore } from '../store/habitStore';
import {
  cancelDailyReminder,
  requestPermissions,
  scheduleDailyReminder,
  sendTestNotification
} from '../utils/notifications';

type SettingRowProps = {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
};

function SettingRow({ icon, label, subtitle, onPress, right, danger }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <View>
          <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
          {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
      {onPress && !right && <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );
}

const HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '18:00', '20:00', '21:00'];

export default function SettingsScreen() {
  const { habits, clearAllHabits } = useHabitStore();
  const [notifications, setNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);

  // Carga preferencias guardadas
  useEffect(() => {
    const loadPrefs = async () => {
      const notif = await AsyncStorage.getItem('notifications_enabled');
      const time = await AsyncStorage.getItem('reminder_time');
      setNotifications(notif === 'true');
      if (time) setReminderTime(time);
    };
    loadPrefs();
  }, []);

  const handleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permisos necesarios',
          'Ve a Configuración del sistema y activa las notificaciones para esta app.'
        );
        return;
      }
      const [hour, minute] = reminderTime.split(':').map(Number);
      await scheduleDailyReminder(hour, minute);
      await sendTestNotification();
      await AsyncStorage.setItem('notifications_enabled', 'true');
      setNotifications(true);
    } else {
      await cancelDailyReminder();
      await AsyncStorage.setItem('notifications_enabled', 'false');
      setNotifications(false);
    }
  };

  const handleTimeChange = async (time: string) => {
    setReminderTime(time);
    setShowTimePicker(false);
    await AsyncStorage.setItem('reminder_time', time);
    if (notifications) {
      const [hour, minute] = time.split(':').map(Number);
      await scheduleDailyReminder(hour, minute);
      Alert.alert('✅ Actualizado', `Te recordaremos a las ${time} cada día.`);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Borrar todos los datos',
      'Esto eliminará todos tus hábitos y progreso. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar todo', style: 'destructive', onPress: () => clearAllHabits() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Personaliza tu experiencia</Text>
        </View>

        {/* Perfil */}
        <View style={styles.profileCard}>
          <Text style={styles.profileAvatar}>🧠</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Mi progreso</Text>
            <Text style={styles.profileStat}>
              {totalHabits} hábitos · {totalCompletions} completados en total
            </Text>
          </View>
        </View>

        {/* Notificaciones */}
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🔔"
            label="Recordatorio diario"
            subtitle="Recibe un aviso para completar tus hábitos"
            right={
              <Switch
                value={notifications}
                onValueChange={handleNotifications}
                trackColor={{ false: '#2E2E3E', true: '#6C63FF' }}
                thumbColor="#FFF"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="⏰"
            label="Hora del recordatorio"
            subtitle={notifications ? reminderTime : 'Activa las notificaciones primero'}
            onPress={() => notifications && setShowTimePicker(!showTimePicker)}
          />

          {/* Selector de hora */}
          {showTimePicker && (
            <View style={styles.timePicker}>
              {HOURS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeBtn, reminderTime === time && styles.timeBtnActive]}
                  onPress={() => handleTimeChange(time)}
                >
                  <Text style={[styles.timeText, reminderTime === time && styles.timeTextActive]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Acerca de */}
        <Text style={styles.sectionTitle}>Acerca de la app</Text>
        <View style={styles.card}>
          <SettingRow
            icon="📱"
            label="Versión"
            subtitle="Habit Tracker v1.0.0"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="⭐"
            label="Calificar la app"
            onPress={() => Alert.alert('¡Gracias!', 'Pronto estará disponible en la tienda.')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🔒"
            label="Política de privacidad"
            onPress={() => Alert.alert('Privacidad', 'Tus datos se guardan solo en tu dispositivo.')}
          />
        </View>

        {/* Datos */}
        <Text style={styles.sectionTitle}>Datos</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🗑️"
            label="Borrar todos los datos"
            danger
            onPress={handleClearData}
          />
        </View>

        <Text style={styles.footer}>Hecho con 💜 · Habit Tracker 2024</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121E' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E1E2E', borderRadius: 20,
    padding: 20, margin: 20, marginTop: 16,
    borderWidth: 1, borderColor: '#6C63FF44',
  },
  profileAvatar: { fontSize: 44, marginRight: 16 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  profileStat: { fontSize: 13, color: '#888' },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: '#555',
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 20, marginBottom: 8, marginTop: 8,
  },
  card: {
    backgroundColor: '#1E1E2E', borderRadius: 20,
    marginHorizontal: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#2E2E3E', overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { fontSize: 22, marginRight: 14 },
  rowLabel: { fontSize: 15, color: '#FFF', fontWeight: '500' },
  rowLabelDanger: { color: '#FF6584' },
  rowSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  rowRight: { marginLeft: 12 },
  rowArrow: { color: '#555', fontSize: 22 },
  divider: { height: 1, backgroundColor: '#2E2E3E', marginLeft: 52 },
  timePicker: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, padding: 16, paddingTop: 0,
  },
  timeBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#2E2E3E',
    borderWidth: 1, borderColor: 'transparent',
  },
  timeBtnActive: { backgroundColor: '#6C63FF22', borderColor: '#6C63FF' },
  timeText: { color: '#888', fontSize: 14 },
  timeTextActive: { color: '#6C63FF', fontWeight: 'bold' },
  footer: { textAlign: 'center', color: '#444', fontSize: 13, paddingVertical: 30 },
});