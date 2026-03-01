import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet, Switch, Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useHabitStore } from '../store/habitStore';
import { habitSchema } from '../utils/habitValidation';
import { requestPermissions, scheduleHabitReminder } from '../utils/notifications';

const ICONS = ['⭐', '💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '🎯', '✍️', '🎨', '🎵', '🌿'];
const COLORS = ['#6C63FF', '#FF6584', '#43C6AC', '#F7971E', '#12c2e9', '#f64f59', '#c471ed', '#4CAF50'];

export default function AddHabitScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addHabit } = useHabitStore();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('⭐');
  const [selectedColor, setSelectedColor] = useState('#6C63FF');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const REMINDER_TIMES = ['06:00', '07:00', '08:00', '09:00', '12:00', '18:00', '20:00', '22:00'];
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    try {
      const validatedData = habitSchema.parse({
        name,
        icon: selectedIcon || '⭐',
        color: selectedColor,
        notes,
      });

      const newHabit = {
        id: Date.now().toString(),
        name: validatedData.name,
        icon: validatedData.icon,
        color: validatedData.color,
        notes: validatedData.notes || '',
        completedDates: [],
        streak: 0,
        createdAt: new Date().toISOString(),
        archived: false,
        reminderEnabled,
        reminderTime,
      };
      addHabit(newHabit);

      if (reminderEnabled) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert('Permiso requerido', 'Activa las notificaciones para usar recordatorios.');
          return;
        }
        await scheduleHabitReminder(newHabit.id, newHabit.name, newHabit.icon, reminderTime);
      }
      router.back();
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        Alert.alert('Error', error.errors[0].message);
      } else {
        Alert.alert('Error', 'Ocurrió un problema al guardar el hábito.');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />



      {/* Header */}
      <View style={[
        styles.header,
        {
          borderBottomColor: colors.border,
          paddingTop: 8,
        }
      ]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.textMuted }]}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Nuevo hábito</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.save, { color: colors.primary }]}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '33' }]}>
            <Text style={styles.previewEmoji}>{selectedIcon}</Text>
          </View>
          <Text style={[styles.previewName, { color: colors.text }]}>
            {name || 'Mi nuevo hábito'}
          </Text>
        </View>

        {/* Nombre */}
        <Text style={[styles.label, { color: colors.textMuted }]}>Nombre del hábito</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Ej: Leer 30 minutos"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        {/* Notas */}
        <Text style={[styles.label, { color: colors.textMuted }]}>
          Notas (opcional)
        </Text>
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

        {/* Recordatorio */}
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
          <View style={styles.timesGrid}>
            {REMINDER_TIMES.map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  reminderTime === time && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setReminderTime(time)}
              >
                <Text style={[
                  styles.timeBtnText,
                  { color: reminderTime === time ? '#FFF' : colors.text }
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Íconos */}
        <Text style={[styles.label, { color: colors.textMuted }]}>Ícono</Text>
        <View style={styles.grid}>
          {ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[styles.iconBtn, { backgroundColor: colors.card },
              selectedIcon === icon && { borderColor: colors.primary, backgroundColor: colors.primary + '22' }]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Colores */}
        <Text style={[styles.label, { color: colors.textMuted }]}>Color</Text>
        <View style={styles.colorsRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorBtn, { backgroundColor: color },
              selectedColor === color && styles.colorBtnSelected]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Text style={styles.colorCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 16, paddingBottom: 16,
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
  previewName: { fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    borderRadius: 14, padding: 16, fontSize: 16,
    borderWidth: 1, marginBottom: 24,
  },
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

  notesInput: {
    borderRadius: 14, padding: 16, fontSize: 15,
    borderWidth: 1, marginBottom: 4,
    minHeight: 110,
  },
  charCount: { fontSize: 11, textAlign: 'right', marginBottom: 24 },

  // Estilos
  reminderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderRadius: 14, padding: 16,
    borderWidth: 1, marginBottom: 12,
  },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reminderIcon: { fontSize: 20 },
  reminderLabel: { fontSize: 15, fontWeight: '500' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  timeBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  timeBtnText: { fontSize: 14, fontWeight: '500' },
});
