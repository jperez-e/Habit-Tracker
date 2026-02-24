import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring, withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import HabitCard from '../components/HabitCard';
import { useColors } from '../hooks/useColors';
import { useHabitStore } from '../store/habitStore';
import { getGreeting, getTodayString } from '../utils/dateHelpers';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { habits, toggleHabit, loadHabits } = useHabitStore();
  const today = getTodayString();
  const confettiRef = useRef<any>(null);
  const prevCompletedRef = useRef(0);

  // Valores animados
  const progressWidth = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    loadHabits();
    // Anima el header al entrar
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
  }, []);

  const completedCount = habits.filter(h => h.completedDates.includes(today)).length;
  const progress = habits.length > 0 ? completedCount / habits.length : 0;

  // Dispara confetti cuando se completan TODOS los hábitos
  useEffect(() => {
    if (
      habits.length > 0 &&
      completedCount === habits.length &&
      prevCompletedRef.current !== habits.length
    ) {
      setTimeout(() => confettiRef.current?.start(), 300);
    }
    prevCompletedRef.current = completedCount;
  }, [completedCount]);

  // Anima la barra de progreso
  useEffect(() => {
    progressWidth.value = withSpring(progress, { damping: 14, stiffness: 80 });
  }, [progress]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const progressPercent = Math.round(progress * 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />

      {/* Confetti al completar todos */}
      <ConfettiCannon
        ref={confettiRef}
        count={120}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut
        colors={['#6C63FF', '#FF6584', '#43C6AC', '#F7971E', '#4CAF50']}
      />

      {/* Header animado */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()} 👋</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Revisemos tus hábitos de hoy
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/add-habit' as any)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Tarjeta de progreso */}
      <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.progressTitle, { color: colors.textMuted }]}>Progreso de hoy</Text>
        <Text style={[styles.progressCount, { color: colors.text }]}>
          {completedCount}/{habits.length} hábitos
          {completedCount === habits.length && habits.length > 0 ? ' 🎉' : ''}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: completedCount === habits.length && habits.length > 0
                  ? '#4CAF50' : colors.primary },
              progressBarStyle,
            ]}
          />
        </View>
        <Text style={[styles.progressPercent, { color: colors.primary }]}>
          {progressPercent}% completado
        </Text>
      </View>

      {/* Lista de hábitos */}
      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={[styles.emptyText, { color: colors.text }]}>Aún no tienes hábitos</Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            Toca el botón + para agregar tu primer hábito
          </Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitCard habit={item} onToggle={toggleHabit} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  addButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  addButtonText: { color: '#FFF', fontSize: 28, lineHeight: 32 },
  progressCard: {
    margin: 20, borderRadius: 20, padding: 20, borderWidth: 1,
  },
  progressTitle: { fontSize: 14, marginBottom: 4 },
  progressCount: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPercent: { fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center' },
});