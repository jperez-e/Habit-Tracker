import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, ScrollView,
  Modal,
  Share,
  StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { Habit, useHabitStore } from '../store/habitStore';
import { useUiStore } from '../store/uiStore';
import { getTodayString } from '../utils/dateHelpers';
import { getFrequencyLabel } from '../utils/habitFrequency';

const getLast30Days = (): string[] => {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

const getDayLabel = (dateStr: string): string => {
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return days[new Date(dateStr + 'T12:00:00').getDay()];
};

export default function HabitDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { habitId } = useLocalSearchParams();
  const { habits, toggleHabit, deleteHabit, archiveHabit, updateHabit } = useHabitStore();
  const showToast = useUiStore((s) => s.showToast);
  const [retroModalVisible, setRetroModalVisible] = useState(false);
  const [retroDate, setRetroDate] = useState(getTodayString());
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const habit: Habit | undefined = habits.find((h) => h.id === habitId);

  useEffect(() => {
    if (!habit) router.replace('/(tabs)/home' as any);
  }, [habit, router]);

  const today = getTodayString();
  const last30 = getLast30Days();
  const isCompletedToday = habit ? habit.completedDates.includes(today) : false;
  const isRestToday = habit ? (habit.restDates ?? []).includes(today) : false;
  const completedThisMonth = habit ? last30.filter(d => habit.completedDates.includes(d)).length : 0;
  const completionRate = Math.round((completedThisMonth / 30) * 100);
  const targetMinutes = habit?.targetMinutes ?? 25;

  useEffect(() => {
    if (!habit?.timerEnabled) {
      setTimerRunning(false);
      setSecondsLeft(0);
      return;
    }

    if (secondsLeft <= 0 && !timerRunning) {
      setSecondsLeft(targetMinutes * 60);
    }
  }, [habit?.timerEnabled, targetMinutes, secondsLeft, timerRunning]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (!habit?.timerEnabled) return;
    if (secondsLeft > 0) return;
    if (!timerRunning) return;
    if (!habit) return;

    setTimerRunning(false);
    if (!isCompletedToday) {
      toggleHabit(habit.id, today);
      showToast(`Temporizador completado: ${habit.name} marcado como hecho.`, 'success');
    }
  }, [secondsLeft, timerRunning, habit, isCompletedToday, today, toggleHabit, showToast]);

  const timerMinutes = Math.floor(secondsLeft / 60);
  const timerSeconds = secondsLeft % 60;
  const timerDisplay = `${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`;

  if (!habit) return null;

  const handleRetroSave = () => {
    // Validamos formato ISO corto para evitar fechas ambiguas según región/dispositivo.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(retroDate)) {
      Alert.alert('Error', 'Formato de fecha inválido. Usa YYYY-MM-DD.');
      return;
    }

    toggleHabit(habit.id, retroDate);
    setRetroModalVisible(false);
  };

  const handleShare = async () => {
    const message =
      `🌱 Mi progreso en Habit Tracker\n\n` +
      `📋 Hábito: ${habit.name} ${habit.icon}\n` +
      `🔥 Racha actual: ${habit.streak} días\n` +
      `✅ Completado este mes: ${completedThisMonth} días\n` +
      `📊 Tasa de éxito: ${completionRate}%\n\n` +
      `¡Construyendo hábitos un día a la vez!`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar hábito',
      `¿Seguro que quieres eliminar "${habit.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: () => { deleteHabit(habit.id); router.back(); }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />

      <Modal
        visible={retroModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRetroModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Registro retroactivo
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Escribe la fecha en formato YYYY-MM-DD
            </Text>
            <TextInput
              value={retroDate}
              onChangeText={setRetroDate}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
              placeholder="2026-02-25"
              placeholderTextColor={colors.textMuted}
              style={[styles.modalInput, { color: colors.text, borderColor: colors.primary, backgroundColor: colors.background }]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setRetroModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleRetroSave}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Registrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Header correctamente cerrado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/edit-habit' as any, params: { habitId: habit.id } })}
            style={styles.editBtn}
          >
            <Text style={[styles.editBtnText, { color: colors.primary }]}>✏️ Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                habit.archived ? 'Desarchivar hábito' : 'Archivar hábito',
                habit.archived
                  ? '¿Quieres volver a activar este hábito?'
                  : '¿Quieres archivar este hábito? No aparecerá en tu lista diaria.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: habit.archived ? 'Desarchivar' : 'Archivar',
                    onPress: () => { archiveHabit(habit.id); router.back(); }
                  }
                ]
              );
            }}
            style={styles.editBtn}
          >
            <Text style={[styles.editBtnText, { color: colors.textMuted }]}>
              {habit.archived ? '📤 Activar' : '📦 Archivar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete}>
            <Text style={[styles.delete, { color: colors.danger }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* ✅ Cierre del header */}

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={[styles.iconBox, { backgroundColor: habit.color + '33' }]}>
            <Text style={styles.icon}>{habit.icon}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{habit.name}</Text>
          <Text style={[styles.since, { color: colors.textMuted }]}>
            Desde {new Date(habit.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </Text>
          <Text style={[styles.since, { color: colors.textMuted, marginBottom: 8 }]}>
            Frecuencia: {getFrequencyLabel(habit)}
          </Text>

          <TouchableOpacity
            style={[styles.toggleBtn, isCompletedToday && styles.toggleBtnDone,
            { borderColor: habit.color }]}
            onPress={() => toggleHabit(habit.id, today)}
          >
            <Text style={[styles.toggleBtnText, { color: isCompletedToday ? '#FFF' : habit.color }]}>
              {isCompletedToday ? '✓ Completado hoy' : 'Marcar como hecho hoy'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: colors.border }]}
            onPress={handleShare}
          >
            <Text style={[styles.shareBtnText, { color: colors.textMuted }]}>
              📤 Compartir progreso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.retroBtn, { borderColor: colors.border }]}
            onPress={() => {
              setRetroDate(today);
              setRetroModalVisible(true);
            }}
          >
            <Text style={[styles.retroBtnText, { color: colors.primary }]}>
              📅 Registrar logro antiguo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.retroBtn, { borderColor: colors.border }]}
            onPress={() => {
              const nextRestDates = isRestToday
                ? (habit.restDates ?? []).filter((d) => d !== today)
                : Array.from(new Set([...(habit.restDates ?? []), today]));
              updateHabit(habit.id, { restDates: nextRestDates });
            }}
          >
            <Text style={[styles.retroBtnText, { color: colors.textMuted }]}>
              {isRestToday ? '🟢 Quitar descanso de hoy' : '🛌 Marcar descanso hoy'}
            </Text>
          </TouchableOpacity>
        </View>

        {habit.timerEnabled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⏳ Temporizador</Text>
            <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.timerValue, { color: colors.primary }]}>{timerDisplay}</Text>
              <Text style={[styles.timerSub, { color: colors.textMuted }]}>
                Objetivo: {targetMinutes} min
              </Text>
              <View style={styles.timerActions}>
                <TouchableOpacity
                  style={[styles.timerBtn, { borderColor: colors.primary }]}
                  onPress={() => setTimerRunning((prev) => !prev)}
                >
                  <Text style={[styles.timerBtnText, { color: colors.primary }]}>
                    {timerRunning ? 'Pausar' : 'Iniciar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timerBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setTimerRunning(false);
                    setSecondsLeft(targetMinutes * 60);
                  }}
                >
                  <Text style={[styles.timerBtnText, { color: colors.textMuted }]}>Reiniciar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          {[
            { value: `🔥 ${habit.streak}`, label: 'Racha actual' },
            { value: `${completedThisMonth}`, label: 'Días este mes' },
            { value: `${completionRate}%`, label: 'Tasa de éxito' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: habit.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Últimos 30 días</Text>
          <View style={styles.calendar}>
            {last30.map((date) => {
              const done = habit.completedDates.includes(date);
              const isToday = date === today;
              return (
                <View key={date} style={styles.dayCol}>
                  <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{getDayLabel(date)}</Text>
                  <View style={[
                    styles.dayDot,
                    { backgroundColor: done ? habit.color : colors.border },
                    isToday && { borderWidth: 2, borderColor: colors.text }
                  ]} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Notas del hábito */}
        {habit.notes ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📝 Notas
            </Text>
            <View style={[styles.notesCard, {
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}>
              <Text style={[styles.notesText, { color: colors.text }]}>
                {habit.notes}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addNotesBtn, { borderColor: colors.border }]}
            onPress={() => router.push({
              pathname: '/edit-habit' as any,
              params: { habitId: habit.id }
            })}
          >
            <Text style={[styles.addNotesBtnText, { color: colors.textMuted }]}>
              📝 Agregar notas a este hábito
            </Text>
          </TouchableOpacity>
        )}

        <View style={[styles.motivationCard, { backgroundColor: colors.card, borderColor: habit.color }]}>
          <Text style={[styles.motivationText, { color: colors.textMuted }]}>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
  },
  back: { fontSize: 16 },
  delete: { fontSize: 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editBtn: { paddingHorizontal: 4 },
  editBtnText: { fontSize: 14, fontWeight: '600' },
  hero: { alignItems: 'center', padding: 24, paddingTop: 8 },
  iconBox: { width: 88, height: 88, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 44 },
  name: { fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  since: { fontSize: 13, marginBottom: 24 },
  toggleBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30, borderWidth: 2, marginTop: 4 },
  toggleBtnDone: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  toggleBtnText: { fontSize: 16, fontWeight: '600' },
  shareBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  shareBtnText: { fontSize: 14 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 11, textAlign: 'center' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 9 },
  dayDot: { width: 20, height: 20, borderRadius: 6 },
  motivationCard: { margin: 20, borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 40 },
  motivationText: { fontSize: 15, lineHeight: 22, textAlign: 'center' },

  notesCard: {
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  notesText: { fontSize: 15, lineHeight: 24 },
  addNotesBtn: {
    marginHorizontal: 20, marginBottom: 24,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderStyle: 'dashed',
    alignItems: 'center',
  },
  addNotesBtnText: { fontSize: 14 },
  timerValue: { fontSize: 42, fontWeight: '700', textAlign: 'center' },
  timerSub: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  timerActions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16 },
  timerBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  timerBtnText: { fontSize: 14, fontWeight: '600' },
  retroBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderStyle: 'dotted' },
  retroBtnText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, marginBottom: 14, textAlign: 'center' },
  modalInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalBtnText: { fontSize: 14, fontWeight: '600' },
});
