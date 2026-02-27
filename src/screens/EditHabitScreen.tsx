import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { cancelHabitReminder, scheduleHabitReminder } from '../utils/notifications';

import {
  Alert, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useHabitStore } from '../store/habitStore';

// ✅ ⭐ agregado al inicio
const ICONS = ['⭐','💪','📚','🏃','🧘','💧','🥗','😴','🎯','✍️','🎨','🎵','🌿'];
const COLORS = ['#6C63FF','#FF6584','#43C6AC','#F7971E','#12c2e9','#f64f59','#c471ed','#4CAF50'];

export default function EditHabitScreen() {
  const router = useRouter();
  const colors = useColors();
  const { habitId } = useLocalSearchParams();
  const { habits, updateHabit } = useHabitStore();
  const habit = habits.find(h => h.id === habitId);
  const [reminderEnabled, setReminderEnabled] = useState(habit?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? '08:00');
  const [name, setName] = useState(habit?.name ?? '');
  const [selectedIcon, setSelectedIcon] = useState(habit?.icon ?? '⭐');
  const [selectedColor, setSelectedColor] = useState(habit?.color ?? '#6C63FF');
  const [notes, setNotes] = useState(habit?.notes ?? ''); // ✅ carga notas existentes
  const REMINDER_TIMES = ['06:00','07:00','08:00','09:00','12:00','18:00','20:00','22:00'];


  if (!habit) {
    router.back();
    return null;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor escribe un nombre para el hábito');
      return;
    }
    await updateHabit(habit.id, {
      name: name.trim(),
      icon: selectedIcon || '⭐',
      color: selectedColor,
      notes: notes.trim(),
      reminderEnabled,
      reminderTime,
    });
   
if (reminderEnabled) {
  await scheduleHabitReminder(habit.id, name.trim(), selectedIcon, reminderTime);
} else {
  await cancelHabitReminder(habit.id);
}
router.back();
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
              "{notes.trim()}"
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
});