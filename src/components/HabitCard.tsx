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
import { Habit } from '../store/habitStore';
import { getTodayString } from '../utils/dateHelpers';

type Props = {
  habit: Habit;
  onToggle: (id: string, date: string) => void;
};

export default function HabitCard({ habit, onToggle }: Props) {
  const router = useRouter();
  const today = getTodayString();
  const isCompleted = habit.completedDates.includes(today);

  // Valores animados
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);
  const cardOpacity = useSharedValue(1);

  // Estilo animado de la card
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: cardOpacity.value,
  }));

  // Estilo animado del check
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleToggle = () => {
    // Animación de rebote en la card
    scale.value = withSequence(
      withSpring(0.96, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    // Animación del check
    if (!isCompleted) {
      checkScale.value = withSequence(
        withSpring(1.4, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    } else {
      checkScale.value = withTiming(0, { duration: 150 });
    }

    runOnJS(onToggle)(habit.id, today);
  };

  return (
    <Animated.View style={[cardStyle]}>
      <TouchableOpacity
        style={[styles.card, isCompleted && styles.cardCompleted]}
        onPress={handleToggle}
        activeOpacity={0.9}
      >
        {/* Ícono */}
        <View style={[styles.iconBox, { backgroundColor: habit.color + '33' }]}>
          <Text style={styles.icon}>{habit.icon}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.name, isCompleted && styles.nameCompleted]}>
            {habit.name}
          </Text>
          <Text style={styles.streak}>🔥 {habit.streak} días seguidos</Text>
        </View>

        {/* Botón detalle */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/habit-detail' as any, params: { habitId: habit.id } })}
          style={styles.detailBtn}
        >
          <Text style={styles.detailBtnText}>›</Text>
        </TouchableOpacity>

        {/* Check animado */}
        <Animated.View
          style={[
            styles.check,
            isCompleted && { backgroundColor: habit.color, borderColor: habit.color },
            checkStyle,
          ]}
        >
          <Text style={styles.checkText}>{isCompleted ? '✓' : ''}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E2E3E',
  },
  cardCompleted: {
    borderColor: '#4CAF50',
    opacity: 0.85,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  nameCompleted: { textDecorationLine: 'line-through', color: '#888' },
  streak: { fontSize: 12, color: '#888' },
  detailBtn: { paddingHorizontal: 8 },
  detailBtnText: { color: '#888', fontSize: 24 },
  check: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#444',
    justifyContent: 'center', alignItems: 'center',
  },
  checkText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});