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
import { useColors } from '../hooks/useColors';
import { useHabitStore } from '../store/habitStore';
import { useThemeStore } from '../store/themeStore';

type SettingRowProps = {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  colors: any;
};

function SettingRow({ icon, label, subtitle, onPress, right, danger, colors }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <View>
          <Text style={[styles.rowLabel, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
          {subtitle && <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
        </View>
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
      {onPress && !right && <Text style={[styles.rowArrow, { color: colors.textMuted }]}>›</Text>}
    </TouchableOpacity>
  );
}

const HOURS = ['06:00','07:00','08:00','09:00','10:00','18:00','20:00','21:00'];

export default function SettingsScreen() {
  const colors = useColors();
  const { habits, clearAllHabits } = useHabitStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [notifications, setNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);

  useEffect(() => {
    const loadPrefs = async () => {
      const notif = await AsyncStorage.getItem('notifications_enabled');
      const time = await AsyncStorage.getItem('reminder_time');
      setNotifications(notif === 'true');
      if (time) setReminderTime(time);
    };
    loadPrefs();
  }, []);

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

  const handleResetOnboarding = async () => {
    await AsyncStorage.removeItem('onboarding_completed');
    Alert.alert('✅ Listo', 'Cierra y vuelve a abrir la app para ver el onboarding.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Configuración</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Personaliza tu experiencia</Text>
        </View>

        {/* Perfil */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.primary + '44' }]}>
          <Text style={styles.profileAvatar}>🧠</Text>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>Mi progreso</Text>
            <Text style={[styles.profileStat, { color: colors.textMuted }]}>
              {totalHabits} hábitos · {totalCompletions} completados en total
            </Text>
          </View>
        </View>

        {/* Preferencias */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Preferencias</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="🌙"
            label="Modo oscuro"
            subtitle="Tema actual de la app"
            colors={colors}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="🔔"
            label="Notificaciones"
            subtitle="Disponible en build APK"
            colors={colors}
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="⏰"
            label="Hora del recordatorio"
            subtitle={reminderTime}
            colors={colors}
            onPress={() => setShowTimePicker(!showTimePicker)}
          />
          {showTimePicker && (
            <View style={styles.timePicker}>
              {HOURS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeBtn, { backgroundColor: colors.border },
                    reminderTime === time && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
                  onPress={() => { setReminderTime(time); setShowTimePicker(false); }}
                >
                  <Text style={[styles.timeText, { color: reminderTime === time ? colors.primary : colors.textMuted }]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Acerca de */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Acerca de la app</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="📱" label="Versión" subtitle="Habit Tracker v1.0.0" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="⭐" label="Calificar la app" colors={colors}
            onPress={() => Alert.alert('¡Gracias!', 'Pronto estará disponible en la tienda.')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="🔒" label="Política de privacidad" colors={colors}
            onPress={() => Alert.alert('Privacidad', 'Tus datos se guardan solo en tu dispositivo.')}
          />
        </View>

        {/* Datos */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Datos</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="🔄" label="Resetear onboarding"
            subtitle="Solo para desarrollo" colors={colors}
            onPress={handleResetOnboarding}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="🗑️" label="Borrar todos los datos"
            danger colors={colors} onPress={handleClearData}
          />
        </View>

        <Text style={[styles.footer, { color: colors.border }]}>Hecho por José Pérez · Habit Tracker 2026</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, padding: 20, margin: 20, marginTop: 16, borderWidth: 1,
  },
  profileAvatar: { fontSize: 44, marginRight: 16 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  profileStat: { fontSize: 13 },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: 20, marginBottom: 8, marginTop: 8,
  },
  card: { borderRadius: 20, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { fontSize: 22, marginRight: 14 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  rowRight: { marginLeft: 12 },
  rowArrow: { fontSize: 22 },
  divider: { height: 1, marginLeft: 52 },
  timePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, paddingTop: 0 },
  timeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  timeText: { fontSize: 14 },
  footer: { textAlign: 'center', fontSize: 13, paddingVertical: 30 },
});