import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { cancelHabitReminder, requestPermissions, scheduleHabitReminder } from '../utils/notifications';
import { HabitFrequencyType } from '../utils/habitFrequency';
import { getTodayString } from '../utils/dateHelpers';

import {
  Alert, Platform, ScrollView, StatusBar, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useHabitStore } from '../store/habitStore';

import { habitSchema } from '../utils/habitValidation';

// ✅ ⭐ agregado al inicio
const ICONS = ['⭐', '💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '🎯', '✍️', '🎨', '🎵', '🌿'];
const COLORS = ['#6C63FF', '#FF6584', '#43C6AC', '#F7971E', '#12c2e9', '#f64f59', '#c471ed', '#4CAF50'];
const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function EditHabitScreen() {
  const router = useRouter();
  const colors = useColors();
  const { habitId } = useLocalSearchParams();
  const { habits, updateHabit } = useHabitStore();
  const habit = habits.find(h => h.id === habitId);
  const [reminderEnabled, setReminderEnabled] = useState(habit?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? '08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>(habit?.frequencyType ?? 'daily');
  const [specificDays, setSpecificDays] = useState<number[]>(habit?.specificDays ?? []);
  const [timesPerWeek, setTimesPerWeek] = useState(habit?.timesPerWeek ?? 3);
  const [restToday, setRestToday] = useState((habit?.restDates ?? []).includes(getTodayString()));
  const [name, setName] = useState(habit?.name ?? '');
  const [selectedIcon, setSelectedIcon] = useState(habit?.icon ?? '⭐');
  const [selectedColor, setSelectedColor] = useState(habit?.color ?? '#6C63FF');
  const [notes, setNotes] = useState(habit?.notes ?? ''); // ✅ carga notas existentes

  const reminderDate = React.useMemo(() => {
    const [hour, minute] = reminderTime.split(':').map(Number);
    const d = new Date();
    d.setHours(Number.isFinite(hour) ? hour : 8, Number.isFinite(minute) ? minute : 0, 0, 0);
    return d;
  }, [reminderTime]);

  if (!habit) {
    router.back();
    return null;
  }

  const handleReminderTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'dismissed' || !selectedDate) return;

    const hh = String(selectedDate.getHours()).padStart(2, '0');
    const mm = String(selectedDate.getMinutes()).padStart(2, '0');
    setReminderTime(`${hh}:${mm}`);
  };

  const handleSave = async () => {
    try {
      if (frequencyType === 'specific_days' && specificDays.length === 0) {
        Alert.alert('Frecuencia incompleta', 'Selecciona al menos un día de la semana.');
        return;
      }

      const validatedData = habitSchema.parse({
        name,
        icon: selectedIcon || '⭐',
        color: selectedColor,
        notes,
      });

      await updateHabit(habit.id, {
        name: validatedData.name,
        icon: validatedData.icon,
        color: validatedData.color,
        notes: validatedData.notes || '',
        reminderEnabled,
        reminderTime,
        frequencyType,
        specificDays,
        timesPerWeek,
        restDates: restToday
          ? Array.from(new Set([...(habit.restDates ?? []), getTodayString()]))
          : (habit.restDates ?? []).filter((d) => d !== getTodayString()),
      });

      if (reminderEnabled) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert('Permiso requerido', 'Activa las notificaciones para usar recordatorios.');
          return;
        }
        await scheduleHabitReminder(
          habit.id,
          validatedData.name,
          validatedData.icon,
          reminderTime,
          {
            frequencyType,
            specificDays,
            timesPerWeek,
            restDates: restToday
              ? Array.from(new Set([...(habit.restDates ?? []), getTodayString()]))
              : (habit.restDates ?? []).filter((d) => d !== getTodayString()),
            completedDates: habit.completedDates,
          }
        );
      } else {
        await cancelHabitReminder(habit.id);
      }
      router.back();
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        Alert.alert('Error', error.errors[0].message);
      } else {
        Alert.alert('Error', 'Ocurrió un error guardando tu hábito');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.textMuted }]}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Editar hábito</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.save, { color: colors.primary }]}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '33' }]}>
            <Text style={styles.previewEmoji}>{selectedIcon || '⭐'}</Text>
          </View>
          <Text style={[styles.previewName, { color: colors.text }]}>
            {name || 'Mi hábito'}
          </Text>
          {notes.trim() ? (
            <Text style={[styles.previewNotes, { color: colors.textMuted }]} numberOfLines={2}>
              &quot;{notes.trim()}&quot;
            </Text>
          ) : null}
        </View>

        {/* Nombre */}
        <Text style={[styles.label, { color: colors.textMuted }]}>Nombre del hábito</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          }]}
          placeholder="Ej: Leer 30 minutos"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        {/* ✅ Notas */}
        <Text style={[styles.label, { color: colors.textMuted }]}>Notas (opcional)</Text>
        <TextInput
          style={[styles.notesInput, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          }]}
          placeholder="¿Por qué quieres este hábito? ¿Cómo lo harás?..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          maxLength={300}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.textMuted }]}>
          {notes.length}/300
        </Text>

        <Text style={[styles.label, { color: colors.textMuted }]}>Frecuencia</Text>
        <View style={styles.timesGrid}>
          {[
            { key: 'daily', label: 'Diario' },
            { key: 'specific_days', label: 'Días fijos' },
            { key: 'times_per_week', label: 'X / semana' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.timeBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
                frequencyType === opt.key && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setFrequencyType(opt.key as HabitFrequencyType)}
            >
              <Text style={[styles.timeBtnText, { color: frequencyType === opt.key ? '#FFF' : colors.text }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {frequencyType === 'specific_days' && (
          <View style={styles.timesGrid}>
            {WEEK_DAYS.map((day, idx) => {
              const selected = specificDays.includes(idx);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.timeBtn,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() =>
                    setSpecificDays((prev) =>
                      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
                    )
                  }
                >
                  <Text style={[styles.timeBtnText, { color: selected ? '#FFF' : colors.text }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {frequencyType === 'times_per_week' && (
          <View style={styles.timesGrid}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.timeBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  timesPerWeek === n && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setTimesPerWeek(n)}
              >
                <Text style={[styles.timeBtnText, { color: timesPerWeek === n ? '#FFF' : colors.text }]}>{n}x</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.reminderRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reminderLeft}>
            <Text style={styles.reminderIcon}>🛌</Text>
            <Text style={[styles.reminderLabel, { color: colors.text }]}>Descanso hoy</Text>
          </View>
          <Switch
            value={restToday}
            onValueChange={setRestToday}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFF"
          />
        </View>

        <Text style={[styles.label, { color: colors.textMuted }]}>Recordatorio</Text>
        <View style={[styles.reminderRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reminderLeft}>
            <Text style={styles.reminderIcon}>🔔</Text>
            <Text style={[styles.reminderLabel, { color: colors.text }]}>
              Recordatorio diario
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFF"
          />
        </View>

        {reminderEnabled && (
          <View style={styles.reminderPickerWrap}>
            <TouchableOpacity
              style={[styles.reminderPickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.reminderPickerLabel, { color: colors.textMuted }]}>Hora del recordatorio</Text>
              <Text style={[styles.reminderPickerValue, { color: colors.primary }]}>{reminderTime}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={reminderDate}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleReminderTimeChange}
              />
            )}
          </View>
        )}

        {/* Ícono */}
        <Text style={[styles.label, { color: colors.textMuted }]}>Ícono</Text>
        <View style={styles.grid}>
          {ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.card },
                selectedIcon === icon && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '22',
                },
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Color */}
        <Text style={[styles.label, { color: colors.textMuted }]}>Color</Text>
        <View style={styles.colorsRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorBtn,
                { backgroundColor: color },
                selectedColor === color && styles.colorBtnSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Text style={styles.colorCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
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
    borderBottomWidth: 1,
  },
  cancel: { fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  save: { fontSize: 16, fontWeight: 'bold' },
  content: { padding: 20 },
  preview: {
    alignItems: 'center', borderRadius: 20, padding: 24,
    marginBottom: 28, borderWidth: 1,
  },
  previewIcon: {
    width: 72, height: 72, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  previewEmoji: { fontSize: 36 },
  previewName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  previewNotes: { fontSize: 13, textAlign: 'center', marginTop: 6, fontStyle: 'italic' },
  label: {
    fontSize: 13, fontWeight: '600', marginBottom: 12, marginTop: 8,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  input: { borderRadius: 14, padding: 16, fontSize: 16, borderWidth: 1, marginBottom: 24 },
  notesInput: {
    borderRadius: 14, padding: 16, fontSize: 15,
    borderWidth: 1, marginBottom: 4, minHeight: 110,
  },
  charCount: { fontSize: 11, textAlign: 'right', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  iconBtn: {
    width: 56, height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  iconText: { fontSize: 26 },
  colorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  colorBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'transparent',
  },
  colorBtnSelected: { borderColor: '#FFF' },
  colorCheck: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  reminderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderRadius: 14, padding: 16,
    borderWidth: 1, marginBottom: 12,
  },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reminderIcon: { fontSize: 20 },
  reminderLabel: { fontSize: 15, fontWeight: '500' },
  reminderPickerWrap: { marginBottom: 24 },
  reminderPickerBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  reminderPickerLabel: { fontSize: 12, marginBottom: 4 },
  reminderPickerValue: { fontSize: 18, fontWeight: '700' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  timeBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  timeBtnText: { fontSize: 14, fontWeight: '500' },
});
