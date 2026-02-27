import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
import { useThemeStore } from '../store/themeStore';
import { getGreeting, getTodayString } from '../utils/dateHelpers';
import { t } from '../utils/i18n';


export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { habits, toggleHabit, loadHabits } = useHabitStore();
  const today = getTodayString();
  const confettiRef = useRef<any>(null);
  const prevCompletedRef = useRef(0);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const { userName } = useThemeStore();
  

  const progressWidth = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    loadHabits();
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
  }, []);

  const activeHabits = habits
  .filter(h => !h.archived)
  .filter(h => h.name.toLowerCase().includes(search.toLowerCase()));

const archivedHabits = habits
  .filter(h => h.archived)
  .filter(h => h.name.toLowerCase().includes(search.toLowerCase()));
  
  const completedCount = activeHabits.filter(h =>
    h.completedDates.includes(today)
  ).length;

  const progress = activeHabits.length > 0
    ? completedCount / activeHabits.length
    : 0;

  const progressPercent = Math.round(progress * 100);

  // Dispara confetti al completar todos
  useEffect(() => {
    if (
      activeHabits.length > 0 &&
      completedCount === activeHabits.length &&
      prevCompletedRef.current !== activeHabits.length
    ) {
      setTimeout(() => confettiRef.current?.start(), 300);
    }
    prevCompletedRef.current = completedCount;
  }, [completedCount]);

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

  const allDone = completedCount === activeHabits.length && activeHabits.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />

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
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()} {userName ? `, ${userName}` : ''} 👋
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('check_progress')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/add-habit' as any)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Buscador */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
  <Text style={[styles.searchIcon, { color: colors.textMuted }]}>🔍</Text>
  <TextInput
    style={[styles.searchInput, { color: colors.text }]}
    placeholder="Buscar hábitos..."
    placeholderTextColor={colors.textMuted}
    value={search}
    onChangeText={setSearch}
    clearButtonMode="while-editing"
  />
  {search.length > 0 && (
    <TouchableOpacity onPress={() => setSearch('')}>
      <Text style={[styles.searchClear, { color: colors.textMuted }]}>✕</Text>
    </TouchableOpacity>
  )}
</View> 

      {/* Tarjeta de progreso */}
      <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.progressTitle, { color: colors.textMuted }]}>
          {t('today_progress')}
        </Text>
        <Text style={[styles.progressCount, { color: colors.text }]}>
          {t('habits_completed', { completed: completedCount, total: activeHabits.length })}
          {allDone ? ' 🎉' : ''}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: allDone ? '#4CAF50' : colors.primary },
              progressBarStyle,
            ]}
          />
        </View>
        <Text style={[styles.progressPercent, { color: colors.primary }]}>
          {t('percent_completed', { percent: progressPercent })}
        </Text>
      </View>

      {/* Lista de hábitos activos */}
      {activeHabits.length === 0 && archivedHabits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t('no_habits')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            {t('no_habits_sub')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeHabits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitCard habit={item} onToggle={toggleHabit} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            archivedHabits.length > 0 ? (
              <View style={styles.archivedSection}>
                
                {/* Header colapsable de archivados */}
                <TouchableOpacity
                  style={[styles.archivedHeader, { borderColor: colors.border }]}
                  onPress={() => setShowArchived(!showArchived)}
                >
                  <Text style={[styles.archivedTitle, { color: colors.textMuted }]}>
                    📦 {t('archived')} ({archivedHabits.length})
                  </Text>
                  <Text style={[styles.archivedArrow, { color: colors.textMuted }]}>
                    {showArchived ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {/* Lista de archivados */}
                {showArchived && archivedHabits.map(item => (
                  <View key={item.id} style={styles.archivedItem}>
                    <HabitCard habit={item} onToggle={toggleHabit} />
                  </View>
                ))}
              </View>
            ) : null
          }
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
  archivedSection: { marginTop: 8, marginBottom: 20 },
  archivedHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
    borderTopWidth: 1, marginBottom: 8,
  },
  archivedTitle: { fontSize: 14, fontWeight: '600' },
  archivedArrow: { fontSize: 12 },
  archivedItem: { opacity: 0.6 },
  searchContainer: {
  flexDirection: 'row', alignItems: 'center',
  marginHorizontal: 20, marginBottom: 8,
  borderRadius: 14, paddingHorizontal: 14,
  paddingVertical: 10, borderWidth: 1,
},
searchIcon: { fontSize: 16, marginRight: 8 },
searchInput: { flex: 1, fontSize: 15 },
searchClear: { fontSize: 14, paddingLeft: 8 },
});