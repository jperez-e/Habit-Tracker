import React from 'react';
import {
  ScrollView, StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabitStore } from '../store/habitStore';
import { getTodayString } from '../utils/dateHelpers';

const getLast7Days = (): string[] => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

const getDayName = (dateStr: string): string => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[new Date(dateStr + 'T12:00:00').getDay()];
};

export default function StatsScreen() {
  const { habits } = useHabitStore();
  const today = getTodayString();
  const last7 = getLast7Days();

  // Stats globales
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);

  // Completados por día (últimos 7 días)
  const weekData = last7.map((date) => ({
    date,
    day: getDayName(date),
    count: habits.filter(h => h.completedDates.includes(date)).length,
    isToday: date === today,
  }));

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  // Hábito más consistente
  const bestHabit = habits.reduce((best, h) =>
    h.completedDates.length > (best?.completedDates.length ?? -1) ? h : best
  , null as any);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Título */}
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>Tu progreso general</Text>
        </View>

        {/* Cards de resumen */}
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📋</Text>
            <Text style={styles.statValue}>{totalHabits}</Text>
            <Text style={styles.statLabel}>Hábitos totales</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{completedToday}</Text>
            <Text style={styles.statLabel}>Completados hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Mejor racha</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{totalCompletions}</Text>
            <Text style={styles.statLabel}>Total completados</Text>
          </View>
        </View>

        {/* Gráfica semanal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad — últimos 7 días</Text>
          <View style={styles.chart}>
            {weekData.map((day) => (
              <View key={day.date} style={styles.barCol}>
                <Text style={styles.barCount}>
                  {day.count > 0 ? day.count : ''}
                </Text>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max((day.count / maxCount) * 120, day.count > 0 ? 8 : 4),
                        backgroundColor: day.isToday ? '#6C63FF' : day.count > 0 ? '#6C63FF88' : '#2E2E3E',
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.barDay, day.isToday && styles.barDayToday]}>
                  {day.day}
                </Text>
                {day.isToday && <View style={styles.todayDot} />}
              </View>
            ))}
          </View>
        </View>

        {/* Hábito más consistente */}
        {bestHabit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hábito más consistente</Text>
            <View style={[styles.bestCard, { borderColor: bestHabit.color }]}>
              <View style={[styles.bestIcon, { backgroundColor: bestHabit.color + '33' }]}>
                <Text style={styles.bestEmoji}>{bestHabit.icon}</Text>
              </View>
              <View style={styles.bestInfo}>
                <Text style={styles.bestName}>{bestHabit.name}</Text>
                <Text style={styles.bestStat}>
                  {bestHabit.completedDates.length} días completados · 🔥 {bestHabit.streak} de racha
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Lista de todos los hábitos con su tasa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendimiento por hábito</Text>
          {habits.length === 0 ? (
            <Text style={styles.empty}>Aún no tienes hábitos registrados</Text>
          ) : (
            habits.map((habit) => {
              const rate = habit.completedDates.length > 0
                ? Math.min(Math.round((habit.completedDates.length / 30) * 100), 100)
                : 0;
              return (
                <View key={habit.id} style={styles.habitRow}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <View style={styles.habitInfo}>
                    <View style={styles.habitRowTop}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      <Text style={[styles.habitRate, { color: habit.color }]}>{rate}%</Text>
                    </View>
                    <View style={styles.habitBar}>
                      <View style={[styles.habitBarFill, { width: `${rate}%`, backgroundColor: habit.color }]} />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121E' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 12, marginTop: 20, marginBottom: 8,
  },
  statCard: {
    width: '47%', backgroundColor: '#1E1E2E',
    borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#2E2E3E',
  },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#888', textAlign: 'center' },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  chart: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', backgroundColor: '#1E1E2E',
    borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2E2E3E',
  },
  barCol: { alignItems: 'center', flex: 1 },
  barCount: { fontSize: 11, color: '#888', marginBottom: 4, height: 16 },
  barWrapper: { height: 120, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: 20, borderRadius: 6 },
  barDay: { fontSize: 11, color: '#555', marginTop: 8 },
  barDayToday: { color: '#6C63FF', fontWeight: 'bold' },
  todayDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#6C63FF', marginTop: 4,
  },
  bestCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E1E2E', borderRadius: 16,
    padding: 16, borderWidth: 1,
  },
  bestIcon: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  bestEmoji: { fontSize: 26 },
  bestInfo: { flex: 1 },
  bestName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  bestStat: { fontSize: 12, color: '#888' },
  habitRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E1E2E', borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#2E2E3E',
  },
  habitIcon: { fontSize: 24, marginRight: 12 },
  habitInfo: { flex: 1 },
  habitRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  habitName: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  habitRate: { fontSize: 14, fontWeight: 'bold' },
  habitBar: {
    height: 6, backgroundColor: '#2E2E3E',
    borderRadius: 3, overflow: 'hidden',
  },
  habitBarFill: { height: '100%', borderRadius: 3 },
  empty: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 20 },
});