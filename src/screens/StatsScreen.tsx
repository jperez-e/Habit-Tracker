import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../hooks/useColors';
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
  const colors = useColors();
  const today = getTodayString();
  const last7 = getLast7Days();

  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);

  const weekData = last7.map((date) => ({
    date, day: getDayName(date),
    count: habits.filter(h => h.completedDates.includes(date)).length,
    isToday: date === today,
  }));

  const maxCount = Math.max(...weekData.map(d => d.count), 1);
  const bestHabit = habits.reduce((best, h) =>
    h.completedDates.length > (best?.completedDates.length ?? -1) ? h : best, null as any);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Estadísticas</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Tu progreso general</Text>
        </View>

        {/* Cards resumen */}
        <View style={styles.grid}>
          {[
            { emoji: '📋', value: totalHabits, label: 'Hábitos totales' },
            { emoji: '✅', value: completedToday, label: 'Completados hoy' },
            { emoji: '🔥', value: bestStreak, label: 'Mejor racha' },
            { emoji: '🏆', value: totalCompletions, label: 'Total completados' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Gráfica semanal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad — últimos 7 días</Text>
          <View style={[styles.chart, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {weekData.map((day) => (
              <View key={day.date} style={styles.barCol}>
                <Text style={[styles.barCount, { color: colors.textMuted }]}>
                  {day.count > 0 ? day.count : ''}
                </Text>
                <View style={styles.barWrapper}>
                  <View style={[
                    styles.bar,
                    {
                      height: Math.max((day.count / maxCount) * 120, day.count > 0 ? 8 : 4),
                      backgroundColor: day.isToday ? colors.primary : day.count > 0 ? colors.primary + '88' : colors.border,
                    }
                  ]} />
                </View>
                <Text style={[styles.barDay, { color: day.isToday ? colors.primary : colors.textMuted },
                  day.isToday && { fontWeight: 'bold' }]}>
                  {day.day}
                </Text>
                {day.isToday && <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* Mejor hábito */}
        {bestHabit && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hábito más consistente</Text>
            <View style={[styles.bestCard, { backgroundColor: colors.card, borderColor: bestHabit.color }]}>
              <View style={[styles.bestIcon, { backgroundColor: bestHabit.color + '33' }]}>
                <Text style={styles.bestEmoji}>{bestHabit.icon}</Text>
              </View>
              <View style={styles.bestInfo}>
                <Text style={[styles.bestName, { color: colors.text }]}>{bestHabit.name}</Text>
                <Text style={[styles.bestStat, { color: colors.textMuted }]}>
                  {bestHabit.completedDates.length} días · 🔥 {bestHabit.streak} de racha
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Rendimiento por hábito */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rendimiento por hábito</Text>
          {habits.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>Aún no tienes hábitos</Text>
          ) : (
            habits.map((habit) => {
              const rate = Math.min(Math.round((habit.completedDates.length / 30) * 100), 100);
              return (
                <View key={habit.id} style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <View style={styles.habitInfo}>
                    <View style={styles.habitRowTop}>
                      <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                      <Text style={[styles.habitRate, { color: habit.color }]}>{rate}%</Text>
                    </View>
                    <View style={[styles.habitBar, { backgroundColor: colors.border }]}>
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
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginTop: 20, marginBottom: 8 },
  statCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1 },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderRadius: 20, padding: 20, borderWidth: 1 },
  barCol: { alignItems: 'center', flex: 1 },
  barCount: { fontSize: 11, marginBottom: 4, height: 16 },
  barWrapper: { height: 120, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: 20, borderRadius: 6 },
  barDay: { fontSize: 11, marginTop: 8 },
  todayDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  bestCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 1 },
  bestIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  bestEmoji: { fontSize: 26 },
  bestInfo: { flex: 1 },
  bestName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  bestStat: { fontSize: 12 },
  habitRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  habitIcon: { fontSize: 24, marginRight: 12 },
  habitInfo: { flex: 1 },
  habitRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  habitName: { fontSize: 14, fontWeight: '600' },
  habitRate: { fontSize: 14, fontWeight: 'bold' },
  habitBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  habitBarFill: { height: '100%', borderRadius: 3 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 20 },
});