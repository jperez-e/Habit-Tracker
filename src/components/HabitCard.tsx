import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router'; // ← agrega
import { Habit } from '../store/habitStore';
import { getTodayString } from '../utils/dateHelpers';

type Props = {
  habit: Habit;
  onToggle: (id: string, date: string) => void;
  // ← navigation: any eliminado
};

export default function HabitCard({ habit, onToggle }: Props) {
  const router = useRouter(); // ← agrega
  const today = getTodayString();
  const isCompleted = habit.completedDates.includes(today);

  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.cardCompleted]}
      onPress={() => onToggle(habit.id, today)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: habit.color + '33' }]}>
        <Text style={styles.icon}>{habit.icon}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, isCompleted && styles.nameCompleted]}>
          {habit.name}
        </Text>
        <Text style={styles.streak}>🔥 {habit.streak} días seguidos</Text>
      </View>

      {/* ← Botón para ir al detalle */}
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/habit-detail' as any, params: { habitId: habit.id } })}
        style={styles.detailBtn}
      >
        <Text style={styles.detailBtnText}>›</Text>
      </TouchableOpacity>

      <View style={[styles.check, isCompleted && { backgroundColor: habit.color }]}>
        <Text style={styles.checkText}>{isCompleted ? '✓' : ''}</Text>
      </View>
    </TouchableOpacity>
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
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  nameCompleted: { textDecorationLine: 'line-through', color: '#888' },
  streak: { fontSize: 12, color: '#888' },
  check: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#444',
    justifyContent: 'center', alignItems: 'center',
  },
  checkText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  detailBtn: { paddingHorizontal: 8 },
  detailBtnText: { color: '#888', fontSize: 24 },
});