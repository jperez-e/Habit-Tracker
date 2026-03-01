import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../hooks/useColors';
import { Habit } from '../store/habitStore';
import { getTodayString } from '../utils/dateHelpers';
import { getFrequencyLabel, isHabitDueOnDate } from '../utils/habitFrequency';
import { playCompleteSound, playUncompleteSound } from '../utils/sounds';

type Props = {
  habit: Habit;
  onToggle: (id: string, date: string) => void;
};

export default function HabitCard({ habit, onToggle }: Props) {
  const router = useRouter();
  const colors = useColors();
  const today = getTodayString();
  const isCompleted = habit.completedDates.includes(today);
  const isDueToday = isHabitDueOnDate(habit, today);

  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);
  const cardOpacity = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: cardOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleToggle = () => {
    if (!isDueToday && !isCompleted) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    scale.value = withSequence(
      withSpring(0.96, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    if (!isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      checkScale.value = withSequence(
        withSpring(1.4, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      runOnJS(playCompleteSound)();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      checkScale.value = withTiming(0, { duration: 150 });
      runOnJS(playUncompleteSound)();
    }

    runOnJS(onToggle)(habit.id, today);
  };

  return (
    <Animated.View style={[cardStyle]}>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          isCompleted && { borderColor: '#4CAF50' },
          habit.archived && { opacity: 0.65 },
        ]}
        onPress={handleToggle}
        activeOpacity={0.9}
      >
        {/* Ícono */}
        <View style={[styles.iconBox, { backgroundColor: habit.color + '33' }]}>
          <Text style={styles.icon}>{habit.icon || '⭐'}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[
            styles.name,
            { color: colors.text },
            isCompleted && { textDecorationLine: 'line-through', color: colors.textMuted },
          ]}>
            {habit.name}
          </Text>
          <Text style={[styles.streak, { color: colors.textMuted }]}>
            {habit.archived ? '📦 Archivado · ' : ''}🔥 Racha: {habit.streak} · {getFrequencyLabel(habit)}
          </Text>
          {!isDueToday && !isCompleted && (
            <Text style={[styles.notDue, { color: colors.textMuted }]}>
              No toca hoy
            </Text>
          )}
        </View>

        {/* Botón detalle */}
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/habit-detail' as any,
            params: { habitId: habit.id }
          })}
          style={styles.detailBtn}
        >
          <Text style={[styles.detailBtnText, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* Check animado */}
        <Animated.View
          style={[
            styles.check,
            { borderColor: isCompleted ? habit.color : isDueToday ? colors.border : colors.textMuted },
            isCompleted && { backgroundColor: habit.color },
            checkStyle,
          ]}
        >
          <Text style={[
            styles.checkText,
            {
              // ✅ Siempre blanco dentro del check coloreado
              // transparente cuando no está completado (evita el espacio vacío)
              color: isCompleted ? '#FFFFFF' : 'transparent',
            }
          ]}>
            ✓
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  streak: { fontSize: 12 },
  notDue: { fontSize: 11, marginTop: 2 },
  detailBtn: { paddingHorizontal: 8 },
  detailBtnText: { fontSize: 24 },
  check: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  checkText: { fontWeight: 'bold', fontSize: 14 },
});
