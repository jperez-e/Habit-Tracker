import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HabitCard from '../components/HabitCard';
import { useHabitStore } from '../store/habitStore';
import { getGreeting, getTodayString } from '../utils/dateHelpers';

export default function HomeScreen() {
  const router = useRouter(); 
  const { habits, toggleHabit, loadHabits } = useHabitStore();
  const today = getTodayString();

  useEffect(() => {
    loadHabits();
  }, []);

  const completedCount = habits.filter(h =>
    h.completedDates.includes(today)
  ).length;

  const progress = habits.length > 0
    ? Math.round((completedCount / habits.length) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.subtitle}>Revisemos tus hábitos de hoy</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-habit' as any)} 
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Progreso del día */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Progreso de hoy</Text>
        <Text style={styles.progressCount}>
          {completedCount}/{habits.length} hábitos
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{progress}% completado</Text>
      </View>

      {/* Lista de hábitos */}
      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyText}>Aún no tienes hábitos</Text>
          <Text style={styles.emptySubtext}>
            Toca el botón + para agregar tu primer hábito
          </Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              onToggle={toggleHabit} 
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121E' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  addButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
  },
  addButtonText: { color: '#FFF', fontSize: 28, lineHeight: 32 },
  progressCard: {
    margin: 20, backgroundColor: '#1E1E2E',
    borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2E2E3E',
  },
  progressTitle: { fontSize: 14, color: '#888', marginBottom: 4 },
  progressCount: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  progressBar: {
    height: 8, backgroundColor: '#2E2E3E',
    borderRadius: 4, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#6C63FF', borderRadius: 4 },
  progressPercent: { fontSize: 12, color: '#6C63FF', fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center' },
});