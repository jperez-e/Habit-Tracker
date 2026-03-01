import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView, StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useHabitStore } from '../store/habitStore';
import { getTodayString } from '../utils/dateHelpers';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const RANGE_OPTIONS = [
  { key: 7, label: '7d' },
  { key: 30, label: '30d' },
  { key: 90, label: '90d' },
  { key: 365, label: '1a' },
];

export default function StatsScreen() {
  const colors = useColors();
  const { habits } = useHabitStore();
  const [selectedRange, setSelectedRange] = useState(30);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{
    index: number;
    value: number;
    date: string;
    percent: number;
  } | null>(null);
  const today = getTodayString();
  const activeHabits = habits.filter(h => !h.archived);

  const stats = useMemo(() => {
    const totalCompleted = habits.reduce((acc, h) => acc + h.completedDates.length, 0);

    // Racha más larga de todos los tiempos
    const bestStreakEver = habits.reduce((max, h) => {
      const sorted = [...h.completedDates].sort();
      let best = 0, current = 0;
      for (let i = 0; i < sorted.length; i++) {
        if (i === 0) { current = 1; continue; }
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        current = diff === 1 ? current + 1 : 1;
        best = Math.max(best, current);
      }
      return Math.max(max, best);
    }, 0);

    // Hábito más consistente
    const mostConsistent = [...activeHabits].sort((a, b) =>
      b.completedDates.length - a.completedDates.length
    )[0];

    // Completados hoy
    const completedToday = activeHabits.filter(h =>
      h.completedDates.includes(today)
    ).length;

    // Gráfica de rango dinámico
    const rangeData = Array.from({ length: selectedRange }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (selectedRange - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      const count = activeHabits.filter(h => h.completedDates.includes(dateStr)).length;
      return { date: dateStr, count, day: d.getDate() };
    });

    // Gráfica semanal — últimas 2 semanas para comparar
    const getWeekData = (weeksAgo: number) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        const dayOfWeek = d.getDay();
        d.setDate(d.getDate() - dayOfWeek - (weeksAgo * 7) + i);
        const dateStr = d.toISOString().split('T')[0];
        return activeHabits.filter(h => h.completedDates.includes(dateStr)).length;
      });

    const thisWeek = getWeekData(0);
    const lastWeek = getWeekData(1);
    const thisWeekTotal = thisWeek.reduce((a, b) => a + b, 0);
    const lastWeekTotal = lastWeek.reduce((a, b) => a + b, 0);

    // Mejor día de la semana
    const dayTotals = Array(7).fill(0);
    habits.forEach(h => {
      h.completedDates.forEach(date => {
        const day = new Date(date + 'T12:00:00').getDay();
        dayTotals[day]++;
      });
    });
    const bestDayIndex = dayTotals.indexOf(Math.max(...dayTotals));

    const maxMonthly = Math.max(...rangeData.map(d => d.count), 1);
    const maxWeekly = Math.max(...thisWeek, ...lastWeek, 1);

    const weekSuggestion = thisWeekTotal >= 14
      ? 'Muy bien. Mantén el ritmo esta semana.'
      : thisWeekTotal >= 7
        ? 'Buen avance. Puedes subir 1-2 completados diarios.'
        : 'Objetivo recomendado: +2 completados por día.';

    const habitAtRisk = activeHabits
      .map((h) => {
        const last7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        });
        const done = last7.filter((d) => h.completedDates.includes(d)).length;
        return { habit: h, done };
      })
      .sort((a, b) => a.done - b.done)[0];

    return {
      totalCompleted, bestStreakEver, mostConsistent,
      completedToday, rangeData, thisWeek, lastWeek,
      thisWeekTotal, lastWeekTotal, bestDayIndex, dayTotals,
      maxMonthly, maxWeekly, weekSuggestion, habitAtRisk,
    };
  }, [habits, today, activeHabits, selectedRange]);

  const weekImprovement = stats.lastWeekTotal > 0
    ? Math.round(((stats.thisWeekTotal - stats.lastWeekTotal) / stats.lastWeekTotal) * 100)
    : 0;

  const selectedHabit = useMemo(
    () => activeHabits.find((h) => h.id === selectedHabitId) ?? null,
    [activeHabits, selectedHabitId]
  );

  const selectedHabitRate = useMemo(() => {
    if (!selectedHabit) return 0;
    const totalDays = Math.max(
      1,
      Math.ceil((Date.now() - new Date(selectedHabit.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    );
    return Math.min(100, Math.round((selectedHabit.completedDates.length / totalDays) * 100));
  }, [selectedHabit]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      <Modal
        visible={!!selectedHabit}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedHabitId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {selectedHabit && (
              <>
                <Text style={styles.modalHabitIcon}>{selectedHabit.icon}</Text>
                <Text style={[styles.modalHabitName, { color: colors.text }]}>{selectedHabit.name}</Text>
                <Text style={[styles.modalHabitMeta, { color: colors.textMuted }]}>
                  Completados: {selectedHabit.completedDates.length} · Racha: {selectedHabit.streak}
                </Text>
                <Text style={[styles.modalHabitMeta, { color: colors.primary }]}>
                  Rendimiento: {selectedHabitRate}%
                </Text>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedHabitId(null)}
                >
                  <Text style={styles.modalCloseText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.Text
          entering={FadeInUp.duration(260)}
          style={[styles.screenTitle, { color: colors.text }]}
        >
          Estadísticas
        </Animated.Text>

        {/* Tarjetas principales */}
        <Animated.View
          entering={FadeInDown.duration(260)}
          layout={Layout.springify().damping(18).stiffness(200)}
          style={styles.cardsGrid}
        >
          {[
            { label: 'Hábitos activos', value: activeHabits.length, icon: '📋' },
            { label: 'Completados hoy', value: stats.completedToday, icon: '✅' },
            { label: 'Mejor racha', value: `${stats.bestStreakEver} días`, icon: '🔥' },
            { label: 'Total completados', value: stats.totalCompleted, icon: '🏆' },
          ].map((card, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(i * 50).duration(220)}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <Text style={[styles.cardValue, { color: colors.primary }]}>{card.value}</Text>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{card.label}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Comparativa semanas */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(260)}
          layout={Layout.springify().damping(18).stiffness(200)}
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Esta semana vs semana anterior</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <Text style={[styles.compareValue, { color: colors.primary }]}>{stats.thisWeekTotal}</Text>
              <Text style={[styles.compareLabel, { color: colors.textMuted }]}>Esta semana</Text>
            </View>
            <View style={styles.compareDivider}>
              <Text style={[styles.compareArrow, {
                color: weekImprovement >= 0 ? '#4CAF50' : '#FF6584'
              }]}>
                {weekImprovement >= 0 ? '↑' : '↓'} {Math.abs(weekImprovement)}%
              </Text>
            </View>
            <View style={styles.compareItem}>
              <Text style={[styles.compareValue, { color: colors.textMuted }]}>{stats.lastWeekTotal}</Text>
              <Text style={[styles.compareLabel, { color: colors.textMuted }]}>Semana anterior</Text>
            </View>
          </View>

          {/* Barras comparativas por día */}
          <View style={styles.weekBars}>
            {DAY_NAMES.map((day, i) => (
              <View key={i} style={styles.weekBarCol}>
                <View style={styles.weekBarPair}>
                  {/* Semana anterior — gris */}
                  <View style={[styles.weekBarItem, { backgroundColor: colors.border }]}>
                    <View style={[
                      styles.weekBarFill,
                      {
                        height: `${(stats.lastWeek[i] / stats.maxWeekly) * 100}%`,
                        backgroundColor: colors.textMuted,
                      }
                    ]} />
                  </View>
                  {/* Esta semana — color primario */}
                  <View style={[styles.weekBarItem, { backgroundColor: colors.border }]}>
                    <View style={[
                      styles.weekBarFill,
                      {
                        height: `${(stats.thisWeek[i] / stats.maxWeekly) * 100}%`,
                        backgroundColor: colors.primary,
                      }
                    ]} />
                  </View>
                </View>
                <Text style={[styles.weekBarLabel, { color: colors.textMuted }]}>{day}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Gráfica mensual usando react-native-chart-kit */}
        <Animated.View
          entering={FadeInDown.delay(170).duration(260)}
          layout={Layout.springify().damping(18).stiffness(200)}
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.rangeHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Tendencia
            </Text>
            <View style={styles.rangeChips}>
              {RANGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.rangeChip,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    selectedRange === opt.key && { backgroundColor: colors.primary + '22', borderColor: colors.primary }
                  ]}
                  onPress={() => setSelectedRange(opt.key)}
                >
                  <Text
                    style={[
                      styles.rangeChipText,
                      { color: selectedRange === opt.key ? colors.primary : colors.textMuted }
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <LineChart
              data={{
                labels: stats.rangeData
                  .filter((_, i) => i % Math.max(1, Math.floor(selectedRange / 6)) === 0 || i === selectedRange - 1)
                  .map(d => d.day.toString()),
                datasets: [
                  {
                    data: stats.rangeData.map(d => d.count),
                  }
                ]
              }}
              width={Dimensions.get('window').width - 70} // width of the screen - padding
              height={220}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`, // colors.primary
                labelColor: (opacity = 1) => colors.textMuted,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "2",
                  strokeWidth: "2",
                  stroke: colors.primary
                }
              }}
              bezier
              onDataPointClick={(data) => {
                const point = stats.rangeData[data.index];
                if (!point) return;
                setSelectedPoint({
                  index: data.index,
                  value: data.value,
                  date: point.date,
                  percent: activeHabits.length > 0 ? Math.round((data.value / activeHabits.length) * 100) : 0,
                });
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>
          {selectedPoint && (
            <Animated.View
              entering={FadeInUp.duration(180)}
              layout={Layout.springify().damping(20).stiffness(210)}
              style={[styles.tooltipCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <Text style={[styles.tooltipTitle, { color: colors.text }]}>
                {new Date(selectedPoint.date + 'T12:00:00').toLocaleDateString('es-DO', {
                  day: '2-digit',
                  month: 'short',
                })}
              </Text>
              <Text style={[styles.tooltipValue, { color: colors.primary }]}>
                {selectedPoint.value} completados
              </Text>
              <Text style={[styles.tooltipSub, { color: colors.textMuted }]}>
                {selectedPoint.percent}% de tus hábitos activos
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(190).duration(260)}
          layout={Layout.springify().damping(18).stiffness(200)}
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights automáticos</Text>
          <Text style={[styles.insightText, { color: colors.textMuted }]}>
            Recomendación semanal: {stats.weekSuggestion}
          </Text>
          <Text style={[styles.insightText, { color: colors.textMuted }]}>
            Mejor día histórico: {DAY_NAMES_FULL[stats.bestDayIndex]}
          </Text>
          {stats.habitAtRisk && (
            <Text style={[styles.insightText, { color: '#FFB84D' }]}>
              Hábito en riesgo: {stats.habitAtRisk.habit.icon} {stats.habitAtRisk.habit.name}
            </Text>
          )}
        </Animated.View>

        {/* Mejor día de la semana */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(260)}
          layout={Layout.springify().damping(18).stiffness(200)}
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mejor día de la semana</Text>
          <View style={styles.bestDayRow}>
            <Text style={styles.bestDayEmoji}>📅</Text>
            <View>
              <Text style={[styles.bestDayName, { color: colors.primary }]}>
                {DAY_NAMES_FULL[stats.bestDayIndex]}
              </Text>
              <Text style={[styles.bestDaySub, { color: colors.textMuted }]}>
                {stats.dayTotals[stats.bestDayIndex]} completados en total
              </Text>
            </View>
          </View>
          {/* Barras por día */}
          <View style={styles.dayBars}>
            {DAY_NAMES.map((day, i) => {
              const max = Math.max(...stats.dayTotals, 1);
              return (
                <View key={i} style={styles.dayBarRow}>
                  <Text style={[styles.dayBarLabel, { color: colors.textMuted }]}>{day}</Text>
                  <View style={[styles.dayBarBg, { backgroundColor: colors.border }]}>
                    <View style={[
                      styles.dayBarFill,
                      {
                        width: `${(stats.dayTotals[i] / max) * 100}%`,
                        backgroundColor: i === stats.bestDayIndex ? '#4CAF50' : colors.primary,
                        opacity: i === stats.bestDayIndex ? 1 : 0.6,
                      }
                    ]} />
                  </View>
                  <Text style={[styles.dayBarValue, { color: colors.textMuted }]}>
                    {stats.dayTotals[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Hábito más consistente */}
        {stats.mostConsistent && (
          <Animated.View
            entering={FadeInDown.delay(260).duration(260)}
            layout={Layout.springify().damping(18).stiffness(200)}
            style={[styles.section, {
              backgroundColor: colors.card,
              borderColor: stats.mostConsistent.color,
              borderWidth: 2,
            }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🏆 Hábito más consistente</Text>
            <View style={styles.consistentRow}>
              <View style={[styles.consistentIcon, { backgroundColor: stats.mostConsistent.color + '33' }]}>
                <Text style={styles.consistentEmoji}>{stats.mostConsistent.icon}</Text>
              </View>
              <View style={styles.consistentInfo}>
                <Text style={[styles.consistentName, { color: colors.text }]}>
                  {stats.mostConsistent.name}
                </Text>
                <Text style={[styles.consistentSub, { color: colors.textMuted }]}>
                  {stats.mostConsistent.completedDates.length} días completado · 🔥 {stats.mostConsistent.streak} racha
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Rendimiento por hábito */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(260)}
          layout={Layout.springify().damping(18).stiffness(200)}
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rendimiento por hábito</Text>
          {activeHabits.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aún no tienes hábitos activos
            </Text>
          ) : (
            activeHabits.map(habit => {
              const rate = habit.completedDates.length > 0
                ? Math.min(Math.round((habit.completedDates.length /
                  Math.max(1, Math.ceil(
                    (new Date().getTime() - new Date(habit.createdAt).getTime())
                    / (1000 * 60 * 60 * 24)
                  ))) * 100), 100)
                : 0;
              return (
                <Animated.View
                  key={habit.id}
                  entering={FadeInDown.duration(220)}
                  layout={Layout.springify().damping(18).stiffness(200)}
                  style={styles.habitRow}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.habitPressable}
                    onPress={() => setSelectedHabitId(habit.id)}
                  >
                    <Text style={styles.habitRowIcon}>{habit.icon}</Text>
                    <View style={styles.habitRowInfo}>
                      <Text style={[styles.habitRowName, { color: colors.text }]} numberOfLines={1}>
                        {habit.name}
                      </Text>
                      <View style={[styles.habitBarBg, { backgroundColor: colors.border }]}>
                        <View style={[
                          styles.habitBarFill,
                          { width: `${rate}%`, backgroundColor: habit.color }
                        ]} />
                      </View>
                    </View>
                    <Text style={[styles.habitRowRate, { color: habit.color }]}>{rate}%</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  card: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1 },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  cardLabel: { fontSize: 12, textAlign: 'center' },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 20, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 20 },
  compareItem: { alignItems: 'center' },
  compareValue: { fontSize: 36, fontWeight: 'bold' },
  compareLabel: { fontSize: 13, marginTop: 4 },
  compareDivider: { alignItems: 'center' },
  compareArrow: { fontSize: 22, fontWeight: 'bold' },
  tooltipCard: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
  tooltipTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  tooltipValue: { fontSize: 14, fontWeight: '700' },
  tooltipSub: { fontSize: 12, marginTop: 3 },
  rangeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rangeChips: { flexDirection: 'row', gap: 6 },
  rangeChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  rangeChipText: { fontSize: 12, fontWeight: '700' },
  insightText: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  weekBars: { flexDirection: 'row', justifyContent: 'space-between', height: 80 },
  weekBarCol: { alignItems: 'center', flex: 1 },
  weekBarPair: { flexDirection: 'row', gap: 2, flex: 1, alignItems: 'flex-end' },
  weekBarItem: { width: 10, height: 60, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  weekBarFill: { width: '100%', borderRadius: 4 },
  weekBarLabel: { fontSize: 10, marginTop: 4 },
  monthChart: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 2 },
  monthBarCol: { flex: 1, alignItems: 'center' },
  monthBarBg: { width: '100%', height: 60, borderRadius: 2, justifyContent: 'flex-end', overflow: 'hidden' },
  monthBarFill: { width: '100%', borderRadius: 2 },
  monthBarLabel: { fontSize: 8, marginTop: 2 },
  bestDayRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  bestDayEmoji: { fontSize: 40 },
  bestDayName: { fontSize: 22, fontWeight: 'bold' },
  bestDaySub: { fontSize: 13, marginTop: 4 },
  dayBars: { gap: 8 },
  dayBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayBarLabel: { width: 32, fontSize: 12 },
  dayBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  dayBarFill: { height: '100%', borderRadius: 4 },
  dayBarValue: { width: 24, fontSize: 11, textAlign: 'right' },
  consistentRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  consistentIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  consistentEmoji: { fontSize: 28 },
  consistentInfo: { flex: 1 },
  consistentName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  consistentSub: { fontSize: 13 },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  habitPressable: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  habitRowIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  habitRowInfo: { flex: 1 },
  habitRowName: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  habitBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  habitBarFill: { height: '100%', borderRadius: 3 },
  habitRowRate: { fontSize: 13, fontWeight: 'bold', width: 38, textAlign: 'right' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: { width: '100%', borderRadius: 22, borderWidth: 1, padding: 24, alignItems: 'center' },
  modalHabitIcon: { fontSize: 48, marginBottom: 10 },
  modalHabitName: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  modalHabitMeta: { fontSize: 14, marginBottom: 6, textAlign: 'center' },
  modalCloseBtn: { marginTop: 14, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  modalCloseText: { color: '#FFF', fontWeight: '700' },
});
