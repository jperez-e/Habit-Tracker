import React from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ScrollView, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router'; // ← agrega
import { useHabitStore, Habit } from '../store/habitStore';
import { getTodayString } from '../utils/dateHelpers';

// Genera los últimos 30 días
const getLast30Days = (): string[] => {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

// Nombre corto del día
const getDayLabel = (dateStr: string): string => {
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return days[new Date(dateStr + 'T12:00:00').getDay()];
};

export default function HabitDetailScreen() { // ← sin props
  const router = useRouter(); // ← agrega
  const { habitId } = useLocalSearchParams(); // ← reemplaza route.params

  const { habits, toggleHabit, deleteHabit } = useHabitStore();
  const habit: Habit | undefined = habits.find((h) => h.id === habitId);

  if (!habit) {
    router.back(); // ← reemplaza navigation.goBack()
    return null;
  }

  const today = getTodayString();
  const last30 = getLast30Days();
  const isCompletedToday = habit.completedDates.includes(today);

  const completedThisMonth = last30.filter(d =>
    habit.completedDates.includes(d)
  ).length;

  const completionRate = Math.round((completedThisMonth / 30) * 100);

  const handleDelete = () => {
    Alert.alert(
      'Eliminar hábito',
      `¿Seguro que quieres eliminar "${habit.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: () => {
            deleteHabit(habit.id);
            router.back(); // ← reemplaza navigation.goBack()
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}> // ← reemplaza navigation.goBack()
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.delete}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconBox, { backgroundColor: habit.color + '33' }]}>
            <Text style={styles.icon}>{habit.icon}</Text>
          </View>
          <Text style={styles.name}>{habit.name}</Text>
          <Text style={styles.since}>
            Desde {new Date(habit.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </Text>

          {/* Botón completar hoy */}
          <TouchableOpacity
            style={[styles.toggleBtn, isCompletedToday && styles.toggleBtnDone,
              { borderColor: habit.color }]}
            onPress={() => toggleHabit(habit.id, today)}
          >
            <Text style={[styles.toggleBtnText, { color: isCompletedToday ? '#FFF' : habit.color }]}>
              {isCompletedToday ? '✓ Completado hoy' : 'Marcar como hecho hoy'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: habit.color }]}>🔥 {habit.streak}</Text>
            <Text style={styles.statLabel}>Racha actual</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: habit.color }]}>{completedThisMonth}</Text>
            <Text style={styles.statLabel}>Días este mes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: habit.color }]}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Tasa de éxito</Text>
          </View>
        </View>

        {/* Calendario últimos 30 días */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos 30 días</Text>
          <View style={styles.calendar}>
            {last30.map((date) => {
              const done = habit.completedDates.includes(date);
              const isToday = date === today;
              return (
                <View key={date} style={styles.dayCol}>
                  <Text style={styles.dayLabel}>{getDayLabel(date)}</Text>
                  <View style={[
                    styles.dayDot,
                    done && { backgroundColor: habit.color },
                    isToday && styles.dayDotToday,
                    !done && { backgroundColor: '#2E2E3E' }
                  ]} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Motivación */}
        <View style={[styles.motivationCard, { borderColor: habit.color }]}>
          <Text style={styles.motivationText}>
            {completionRate >= 80
              ? '🏆 ¡Excelente! Estás construyendo un hábito sólido.'
              : completionRate >= 50
              ? '💪 Vas bien, sigue adelante. La constancia es la clave.'
              : '🌱 Cada día cuenta. No te rindas, estás empezando algo grande.'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121E' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
  },
  back: { color: '#6C63FF', fontSize: 16 },
  delete: { color: '#FF6584', fontSize: 16 },
  hero: { alignItems: 'center', padding: 24, paddingTop: 8 },
  iconBox: {
    width: 88, height: 88, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  icon: { fontSize: 44 },
  name: { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 6 },
  since: { fontSize: 13, color: '#888', marginBottom: 24 },
  toggleBtn: {
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 30, borderWidth: 2, marginTop: 4,
  },
  toggleBtnDone: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  toggleBtnText: { fontSize: 16, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 20,
    gap: 12, marginBottom: 24,
  },
  statCard: {
    flex: 1, backgroundColor: '#1E1E2E', borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2E2E3E',
  },
  statValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 9, color: '#555' },
  dayDot: { width: 20, height: 20, borderRadius: 6 },
  dayDotToday: { borderWidth: 2, borderColor: '#FFF' },
  motivationCard: {
    margin: 20, backgroundColor: '#1E1E2E',
    borderRadius: 16, padding: 20,
    borderWidth: 1, marginBottom: 40,
  },
  motivationText: { color: '#CCC', fontSize: 15, lineHeight: 22, textAlign: 'center' },
});