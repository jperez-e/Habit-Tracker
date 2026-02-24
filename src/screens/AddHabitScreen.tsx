import { useRouter } from 'expo-router'; // ← agrega
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabitStore } from '../store/habitStore';
const ICONS = ['💪','📚','🏃','🧘','💧','🥗','😴','🎯','✍️','🎨','🎵','🌿'];
const COLORS = ['#6C63FF','#FF6584','#43C6AC','#F7971E','#12c2e9','#f64f59','#c471ed','#4CAF50'];

export default function AddHabitScreen() { // ← sin props
  const router = useRouter(); // ← agrega
  const { addHabit } = useHabitStore();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('💪');
  const [selectedColor, setSelectedColor] = useState('#6C63FF');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor escribe un nombre para el hábito');
      return;
    }

    addHabit({
      id: Date.now().toString(),
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      completedDates: [],
      streak: 0,
      createdAt: new Date().toISOString(),
    });

    router.back(); // ← reemplaza navigation.goBack()
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo hábito</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.save}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Preview */}
        <View style={styles.preview}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '33' }]}>
            <Text style={styles.previewEmoji}>{selectedIcon}</Text>
          </View>
          <Text style={styles.previewName}>{name || 'Mi nuevo hábito'}</Text>
        </View>

        {/* Nombre */}
        <Text style={styles.label}>Nombre del hábito</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Leer 30 minutos"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        {/* Íconos */}
        <Text style={styles.label}>Ícono</Text>
        <View style={styles.grid}>
          {ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[styles.iconBtn, selectedIcon === icon && styles.iconBtnSelected]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Colores */}
        <Text style={styles.label}>Color</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121E' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#2E2E3E',
  },
  cancel: { color: '#888', fontSize: 16 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  save: { color: '#6C63FF', fontSize: 16, fontWeight: 'bold' },
  content: { padding: 20 },
  preview: {
    alignItems: 'center', backgroundColor: '#1E1E2E',
    borderRadius: 20, padding: 24, marginBottom: 28,
    borderWidth: 1, borderColor: '#2E2E3E',
  },
  previewIcon: {
    width: 72, height: 72, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  previewEmoji: { fontSize: 36 },
  previewName: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  label: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#1E1E2E', borderRadius: 14, padding: 16,
    color: '#FFF', fontSize: 16, borderWidth: 1, borderColor: '#2E2E3E', marginBottom: 24,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  iconBtn: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#1E1E2E', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  iconBtnSelected: { borderColor: '#6C63FF', backgroundColor: '#6C63FF22' },
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