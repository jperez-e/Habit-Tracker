import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { useHabitStore } from '../store/habitStore';
import { useUiStore } from '../store/uiStore';
import { useThemeStore } from '../store/themeStore';

const DEFAULT_MOTIVATIONS = [
  '¡Cada día cuenta! 💪',
  'El éxito es la suma de pequeños esfuerzos. 🌱',
  'Sé constante, los resultados llegarán. 🔥',
  'Un hábito a la vez, una vida mejor. ⭐',
  'La disciplina es libertad. 🚀',
];

export default function ProfileScreen() {
  const colors = useColors();
  const showToast = useUiStore((s) => s.showToast);
  const { userName, userMotivation, appStartDate, setUserName, setUserMotivation } = useThemeStore();
  const { habits } = useHabitStore();

  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [motivationModalVisible, setMotivationModalVisible] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [tempMotivation, setTempMotivation] = useState(userMotivation);
  const [weeklyGoal, setWeeklyGoal] = useState(14);

  React.useEffect(() => {
    const loadWeeklyGoal = async () => {
      const value = await AsyncStorage.getItem('profile_weekly_goal');
      if (value) setWeeklyGoal(Number(value));
    };
    loadWeeklyGoal();
  }, []);

  // Estadísticas del perfil
  const totalHabits = habits.length;
  const activeHabits = habits.filter(h => !h.archived);

  const bestStreakEver = habits.reduce((max, h) => {
    const sorted = [...h.completedDates].sort();
    let best = 0, current = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { current = 1; continue; }
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      current = diff === 1 ? current + 1 : 1;
      best = Math.max(best, current);
    }
    return Math.max(max, best);
  }, 0);

  const totalCompleted = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const thisWeekCompleted = (() => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return habits.reduce((sum, habit) => {
      const inWeek = habit.completedDates.filter((date) => new Date(date + 'T12:00:00') >= start).length;
      return sum + inWeek;
    }, 0);
  })();
  const weeklyGoalPct = Math.min(100, Math.round((thisWeekCompleted / Math.max(1, weeklyGoal)) * 100));

  const globalSuccessRate = (() => {
    if (activeHabits.length === 0 || !appStartDate) return 0;
    const daysSinceStart = Math.max(1, Math.ceil(
      (new Date().getTime() - new Date(appStartDate).getTime()) / (1000 * 60 * 60 * 24)
    ));
    const possible = activeHabits.length * daysSinceStart;
    return possible > 0 ? Math.min(Math.round((totalCompleted / possible) * 100), 100) : 0;
  })();

  const daysInApp = appStartDate ? Math.ceil(
    (new Date().getTime() - new Date(appStartDate).getTime()) / (1000 * 60 * 60 * 24)
  ) : 0;

  const startDateFormatted = appStartDate
    ? new Date(appStartDate + 'T12:00:00').toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    : '—';

  // Avatar con inicial
  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : '?';
  const avatarColor = colors.primary;

  const handleSaveName = async () => {
    if (tempName.trim()) await setUserName(tempName.trim());
    setNameModalVisible(false);
  };

  const handleSaveMotivation = async () => {
    await setUserMotivation(tempMotivation.trim());
    setMotivationModalVisible(false);
  };

  const handleEditWeeklyGoal = () => {
    Alert.alert(
      'Meta semanal',
      'Selecciona una meta rápida',
      [
        { text: '10', onPress: async () => { setWeeklyGoal(10); await AsyncStorage.setItem('profile_weekly_goal', '10'); showToast('Meta semanal: 10', 'success'); } },
        { text: '14', onPress: async () => { setWeeklyGoal(14); await AsyncStorage.setItem('profile_weekly_goal', '14'); showToast('Meta semanal: 14', 'success'); } },
        { text: '20', onPress: async () => { setWeeklyGoal(20); await AsyncStorage.setItem('profile_weekly_goal', '20'); showToast('Meta semanal: 20', 'success'); } },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const badges = [
    { id: 'starter', icon: '🌱', label: 'Primer hábito', unlocked: totalHabits >= 1 },
    { id: 'streak7', icon: '🔥', label: 'Racha 7+', unlocked: bestStreakEver >= 7 },
    { id: 'streak30', icon: '🚀', label: 'Racha 30+', unlocked: bestStreakEver >= 30 },
    { id: 'wins100', icon: '🏆', label: '100 completados', unlocked: totalCompleted >= 100 },
  ];

  const heatmapData = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const key = d.toISOString().split('T')[0];
    const count = habits.filter((h) => h.completedDates.includes(key)).length;
    return { key, count };
  });
  const heatmapMax = Math.max(1, ...heatmapData.map((x) => x.count));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} />

      {/* Modal nombre */}
      <Modal visible={nameModalVisible} transparent animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>👤 Tu nombre</Text>
            <TextInput
              style={[styles.modalInput, {
                backgroundColor: colors.background,
                borderColor: colors.primary, color: colors.text,
              }]}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Tu nombre..."
              placeholderTextColor={colors.textMuted}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setNameModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveName}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal frase motivacional */}
      <Modal visible={motivationModalVisible} transparent animationType="fade"
        onRequestClose={() => setMotivationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>💬 Tu frase</Text>
            <TextInput
              style={[styles.modalInput, {
                backgroundColor: colors.background,
                borderColor: colors.primary, color: colors.text,
              }]}
              value={tempMotivation}
              onChangeText={setTempMotivation}
              placeholder="Escribe tu frase motivacional..."
              placeholderTextColor={colors.textMuted}
              maxLength={80}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveMotivation}
            />
            {/* Frases sugeridas */}
            <Text style={[styles.suggestTitle, { color: colors.textMuted }]}>Sugerencias:</Text>
            {DEFAULT_MOTIVATIONS.map((phrase, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestionBtn, { borderColor: colors.border }]}
                onPress={() => setTempMotivation(phrase)}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>{phrase}</Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.modalButtons, { marginTop: 12 }]}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setMotivationModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveMotivation}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header del perfil */}
        <Animated.View
          entering={FadeInDown.duration(240)}
          layout={Layout.springify().damping(20).stiffness(200)}
          style={[styles.profileHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {/* Avatar */}
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: avatarColor }]}
            onPress={() => { setTempName(userName); setNameModalVisible(true); }}
          >
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </TouchableOpacity>

          {/* Nombre */}
          <TouchableOpacity onPress={() => { setTempName(userName); setNameModalVisible(true); }}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {userName || 'Sin nombre'} ✏️
            </Text>
          </TouchableOpacity>

          {/* Fecha de inicio */}
          <Text style={[styles.profileSince, { color: colors.textMuted }]}>
            🗓 Usando la app desde {startDateFormatted}
          </Text>
          <Text style={[styles.profileDays, { color: colors.primary }]}>
            {daysInApp} {daysInApp === 1 ? 'día' : 'días'} en la app
          </Text>

          {/* Frase motivacional */}
          <TouchableOpacity
            style={[styles.motivationBox, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}
            onPress={() => { setTempMotivation(userMotivation); setMotivationModalVisible(true); }}
          >
            <Text style={[styles.motivationText, { color: colors.text, fontStyle: 'italic' }]}>
              &quot;{userMotivation || 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.'}&quot;
            </Text>
            <Text style={[styles.motivationEdit, { color: colors.primary }]}>✏️ Editar</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Estadísticas */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mis estadísticas</Text>
        <View style={styles.statsGrid}>
          {[
            { icon: '📋', value: totalHabits, label: 'Hábitos creados' },
            { icon: '🔥', value: `${bestStreakEver}d`, label: 'Mejor racha' },
            { icon: '🏆', value: totalCompleted, label: 'Total completados' },
            { icon: '📊', value: `${globalSuccessRate}%`, label: 'Éxito global' },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(240)}
          layout={Layout.springify().damping(20).stiffness(200)}
          style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.successHeader}>
            <Text style={[styles.successTitle, { color: colors.text }]}>Meta semanal</Text>
            <TouchableOpacity onPress={handleEditWeeklyGoal}>
              <Text style={[styles.goalEdit, { color: colors.primary }]}>Editar</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.goalMeta, { color: colors.textMuted }]}>
            {thisWeekCompleted}/{weeklyGoal} completados esta semana
          </Text>
          <View style={[styles.successBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.successBarFill, { width: `${weeklyGoalPct}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.successSub, { color: colors.textMuted }]}>
            {weeklyGoalPct >= 100 ? 'Meta cumplida. Excelente semana.' : `Te faltan ${Math.max(0, weeklyGoal - thisWeekCompleted)} para llegar a la meta.`}
          </Text>
        </Animated.View>

        {/* Barra de éxito global */}
        <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.successHeader}>
            <Text style={[styles.successTitle, { color: colors.text }]}>Porcentaje de éxito global</Text>
            <Text style={[styles.successPercent, { color: colors.primary }]}>{globalSuccessRate}%</Text>
          </View>
          <View style={[styles.successBarBg, { backgroundColor: colors.border }]}>
            <View style={[
              styles.successBarFill,
              {
                width: `${globalSuccessRate}%`,
                backgroundColor: globalSuccessRate >= 80 ? '#4CAF50'
                  : globalSuccessRate >= 50 ? colors.primary : '#FF6584',
              }
            ]} />
          </View>
          <Text style={[styles.successSub, { color: colors.textMuted }]}>
            {globalSuccessRate >= 80 ? '🏆 ¡Rendimiento excelente!'
              : globalSuccessRate >= 50 ? '💪 Vas por buen camino'
                : '🌱 Sigue adelante, cada día cuenta'}
          </Text>
        </View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(240)}
          layout={Layout.springify().damping(20).stiffness(200)}
          style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.successTitle, { color: colors.text, marginBottom: 10 }]}>Logros</Text>
          <View style={styles.badgesWrap}>
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgePill,
                  {
                    borderColor: badge.unlocked ? colors.primary : colors.border,
                    backgroundColor: badge.unlocked ? colors.primary + '1F' : colors.background,
                  }
                ]}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[styles.badgeText, { color: badge.unlocked ? colors.text : colors.textMuted }]}>
                  {badge.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).duration(240)}
          layout={Layout.springify().damping(20).stiffness(200)}
          style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.successTitle, { color: colors.text, marginBottom: 10 }]}>Actividad reciente (28 días)</Text>
          <View style={styles.heatmapWrap}>
            {heatmapData.map((cell) => {
              const intensity = cell.count / heatmapMax;
              return (
                <View
                  key={cell.key}
                  style={[
                    styles.heatCell,
                    {
                      backgroundColor: cell.count === 0 ? colors.border : `rgba(108,99,255,${0.25 + intensity * 0.75})`,
                    }
                  ]}
                />
              );
            })}
          </View>
          <Text style={[styles.successSub, { color: colors.textMuted, marginTop: 8 }]}>
            Más intenso = más hábitos completados ese día
          </Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: {
    margin: 16, borderRadius: 24, padding: 24,
    alignItems: 'center', borderWidth: 1,
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  avatarLetter: { fontSize: 40, fontWeight: 'bold', color: '#FFF' },
  profileName: { fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  profileSince: { fontSize: 13, marginBottom: 4 },
  profileDays: { fontSize: 15, fontWeight: '600', marginBottom: 16 },
  motivationBox: {
    width: '100%', borderRadius: 14, padding: 14,
    borderWidth: 1, alignItems: 'center', gap: 6,
  },
  motivationText: { fontSize: 14, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  motivationEdit: { fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 16 },
  statCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1 },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
  successCard: {
    marginHorizontal: 16, borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 16,
  },
  successHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  successTitle: { fontSize: 15, fontWeight: '600' },
  goalEdit: { fontSize: 13, fontWeight: '700' },
  goalMeta: { fontSize: 13, marginBottom: 10 },
  successPercent: { fontSize: 22, fontWeight: 'bold' },
  successBarBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  successBarFill: { height: '100%', borderRadius: 5 },
  successSub: { fontSize: 13 },
  badgesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgePill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  badgeIcon: { fontSize: 14, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  heatmapWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heatCell: { width: '11.5%', aspectRatio: 1, borderRadius: 6 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, borderWidth: 2, marginBottom: 16, textAlign: 'center',
  },
  suggestTitle: { fontSize: 13, marginBottom: 8 },
  suggestionBtn: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 6 },
  suggestionText: { fontSize: 13 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
