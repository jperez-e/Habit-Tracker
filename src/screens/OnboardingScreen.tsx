import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '🌱',
    title: 'Bienvenido a\nHabit Tracker',
    subtitle: 'Construye hábitos poderosos día a día y transforma tu vida poco a poco.',
    color: '#6C63FF',
  },
  {
    id: '2',
    emoji: '✅',
    title: 'Registra tus\nhábitos diarios',
    subtitle: 'Marca tus hábitos cada día y mantén una racha activa para mantenerte motivado.',
    color: '#43C6AC',
  },
  {
    id: '3',
    emoji: '📊',
    title: 'Visualiza tu\nprogreso',
    subtitle: 'Mira estadísticas detalladas y descubre cuáles son tus hábitos más consistentes.',
    color: '#F7971E',
  },
  {
    id: '4',
    emoji: '🏆',
    title: '¡Empieza hoy\nmismo!',
    subtitle: 'Solo toma un minuto agregar tu primer hábito. El cambio comienza ahora.',
    color: '#FF6584',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Botón Skip */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            
            {/* Círculo decorativo */}
            <View style={[styles.circle, { backgroundColor: item.color + '22' }]}>
              <View style={[styles.circleInner, { backgroundColor: item.color + '44' }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
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
      <View style={styles.footer}>
        {isLastSlide ? (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: SLIDES[currentIndex].color }]}
            onPress={handleFinish}
          >
            <Text style={styles.btnText}>¡Comenzar ahora! 🚀</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: SLIDES[currentIndex].color }]}
            onPress={handleNext}
          >
            <Text style={styles.btnText}>Siguiente →</Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121E' },
  skipBtn: {
    position: 'absolute', top: 56, right: 24, zIndex: 10,
  },
  skipText: { color: '#888', fontSize: 15 },
  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 40,
  },
  circle: {
    width: 220, height: 220, borderRadius: 110,
    justifyContent: 'center', alignItems: 'center', marginBottom: 48,
  },
  circleInner: {
    width: 160, height: 160, borderRadius: 80,
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 80 },
  title: {
    fontSize: 32, fontWeight: 'bold', color: '#FFF',
    textAlign: 'center', marginBottom: 16, lineHeight: 40,
  },
  subtitle: {
    fontSize: 16, color: '#888', textAlign: 'center',
    lineHeight: 24, paddingHorizontal: 10,
  },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8, marginBottom: 24,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E2E3E',
  },
  dotActive: { width: 24, height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  btn: {
    paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
});