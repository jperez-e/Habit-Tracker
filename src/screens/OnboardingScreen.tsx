import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions, FlatList,
  StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1', emoji: '🌱',
    title: 'Bienvenido a\nHabit Tracker',
    subtitle: 'Construye hábitos poderosos día a día y transforma tu vida poco a poco.',
    color: '#6C63FF', isName: false,
  },
  {
    id: '2', emoji: '✅',
    title: 'Registra tus\nhábitos diarios',
    subtitle: 'Marca tus hábitos cada día y mantén una racha activa para motivarte.',
    color: '#43C6AC', isName: false,
  },
  {
    id: '3', emoji: '📊',
    title: 'Visualiza tu\nprogreso',
    subtitle: 'Mira estadísticas detalladas y descubre tus hábitos más consistentes.',
    color: '#F7971E', isName: false,
  },
  {
    id: '4', emoji: '🚀',
    title: 'Misión de\n7 días',
    subtitle: 'Empieza con un hábito pequeño y complétalo durante 7 días seguidos. Tu objetivo: constancia, no perfección.',
    color: '#FF6584', isName: false,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)/home' as any);
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)/home' as any);
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Botón omitir */}
      {!isLastSlide && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: insets.top + 20 }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.flatList}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Círculo con emoji */}
            <View style={[styles.circle, { backgroundColor: item.color + '22' }]}>
              <View style={[styles.circleInner, { backgroundColor: item.color + '44' }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>

            {item.id === '4' && (
              <View style={styles.missionCard}>
                <Text style={styles.missionTitle}>Plan de arranque</Text>
                <Text style={styles.missionItem}>1. Elige un hábito de 2 minutos.</Text>
                <Text style={styles.missionItem}>2. Hazlo siempre a la misma hora.</Text>
                <Text style={styles.missionItem}>3. No rompas la cadena de 7 días.</Text>
              </View>
            )}
          </View>
        )}
      />

      {/* Dots indicadores */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && [
                styles.dotActive,
                { backgroundColor: SLIDES[currentIndex].color }
              ]
            ]}
          />
        ))}
      </View>

      {/* Botón principal */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}>
        {isLastSlide ? (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: currentSlide.color }]}
            onPress={handleFinish}
          >
            <Text style={styles.btnText}>¡Comenzar ahora! 🚀</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: currentSlide.color }]}
            onPress={handleNext}
          >
            <Text style={styles.btnText}>Siguiente →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121E' },
  flatList: { flex: 1 },
  skipBtn: { position: 'absolute', right: 24, zIndex: 10 },
  skipText: { color: '#888', fontSize: 15 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  circle: {
    width: 180, height: 180, borderRadius: 90,
    justifyContent: 'center', alignItems: 'center', marginBottom: 30,
  },
  circleInner: {
    width: 130, height: 130, borderRadius: 65,
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 64 },
  title: {
    fontSize: 28, fontWeight: 'bold', color: '#FFF',
    textAlign: 'center', marginBottom: 12, lineHeight: 36,
  },
  subtitle: {
    fontSize: 15, color: '#888', textAlign: 'center',
    lineHeight: 22, paddingHorizontal: 10,
  },
  missionCard: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#FF6584',
  },
  missionTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  missionItem: {
    color: '#B8B8C7',
    fontSize: 14,
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8, marginBottom: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E2E3E' },
  dotActive: { width: 24, height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24 },
  btn: {
    paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
});
