import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, StatusBar, TouchableOpacity, Switch, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabitStore } from '../store/habitStore';

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

export default function SettingsScreen() {
  const { habits, clearAllHabits } = useHabitStore();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');

  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Borrar todos los datos',
      'Esto eliminará todos tus hábitos y tu progreso. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: () => clearAllHabits(),
        }
      ]
    );
  };

  const handleNotifications = (value: boolean) => {
    setNotifications(value);
    if (value) {
      Alert.alert('✅ Notificaciones activadas', 'Te recordaremos completar tus hábitos cada día.');
    }
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

        {/* Perfil / Resumen */}
        <View style={styles.profileCard}>
          <Text style={styles.profileAvatar}>🧠</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Mi progreso</Text>
            <Text style={styles.profileStat}>
              {totalHabits} hábitos · {totalCompletions} completados en total
            </Text>
          </View>
        </View>

        {/* Sección: Preferencias */}
        <Text style={styles.sectionTitle}>Preferencias</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🌙"
            label="Modo oscuro"
            subtitle="Tema actual de la app"
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#2E2E3E', true: '#6C63FF' }}
                thumbColor="#FFF"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🔔"
            label="Notificaciones"
            subtitle="Recordatorio diario de hábitos"
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
            subtitle={notifications ? reminderTime : 'Notificaciones desactivadas'}
            onPress={() => notifications && Alert.alert(
              'Hora del recordatorio',
              'Próximamente podrás elegir la hora exacta.',
            )}
          />
        </View>

        {/* Sección: App */}
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
            subtitle="¿Te está ayudando? Déjanos una reseña"
            onPress={() => Alert.alert('¡Gracias!', 'Pronto estará disponible en la tienda.')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📤"
            label="Compartir la app"
            onPress={() => Alert.alert('Compartir', 'Próximamente.')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🔒"
            label="Política de privacidad"
            onPress={() => Alert.alert('Privacidad', 'Tus datos se guardan solo en tu dispositivo. No compartimos nada.')}
          />
        </View>

        {/* Sección: Datos */}
        <Text style={styles.sectionTitle}>Datos</Text>
        <View style={styles.card}>
          <SettingRow
            icon="💾"
            label="Exportar datos"
            subtitle="Próximamente"
            onPress={() => Alert.alert('Exportar', 'Esta función estará disponible pronto.')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🗑️"
            label="Borrar todos los datos"
            danger
            onPress={handleClearData}
          />
        </View>

        <Text style={styles.footer}>
          Hecho con 💜 · Habit Tracker 2024
        </Text>

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
  footer: {
    textAlign: 'center', color: '#444',
    fontSize: 13, paddingVertical: 30,
  },
});