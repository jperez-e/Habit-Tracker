import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions, FlatList, KeyboardAvoidingView,
  Platform, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';

const { width, height } = Dimensions.get('window');

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
    id: '4', emoji: '👋',
    title: '¿Cómo te llamas?',
    subtitle: 'Así podemos personalizar tu experiencia.',
    color: '#FF6584', isName: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setUserName } = useThemeStore();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [name, setName] = useState('');

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFinish = async () => {
    const finalName = name.trim() || 'Campeón';
    await setUserName(finalName);
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)/home' as any);
  };

  const handleSkip = async () => {
    await setUserName('Campeón');
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)/home' as any);
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Botón omitir */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      )}

      {/* ✅ KeyboardAvoidingView FUERA del FlatList */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
            // ✅ Cada slide tiene altura fija
            <View style={[styles.slide, { width, height: height * 0.65 }]}>

              {/* ✅ Círculo con emoji — estructura limpia */}
              <View style={[styles.circle, { backgroundColor: item.color + '22' }]}>
                <View style={[styles.circleInner, { backgroundColor: item.color + '44' }]}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>
              </View>

              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>

              {/* Input solo en la última diapositiva */}
              {item.isName && (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Tu nombre..."
                    placeholderTextColor="#555"
                    value={name}
                    onChangeText={setName}
                    maxLength={20}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleFinish}
                  />
                </View>
              )}
            </View>
          )}
        />
      </KeyboardAvoidingView>

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
            style={[styles.btn, { backgroundColor: currentSlide.color }]}
            onPress={handleFinish}
          >
            <Text style={styles.btnText}>
              {name.trim() ? `¡Empecemos, ${name.trim()}! 🚀` : '¡Comenzar ahora! 🚀'}
            </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121E' },
  keyboardView: { flex: 1 },
  flatList: { flex: 1 },
  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
  skipText: { color: '#888', fontSize: 15 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  circle: {
    width: 200, height: 200, borderRadius: 100,
    justifyContent: 'center', alignItems: 'center', marginBottom: 40,
  },
  circleInner: {
    width: 145, height: 145, borderRadius: 72,
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 72 },
  title: {
    fontSize: 30, fontWeight: 'bold', color: '#FFF',
    textAlign: 'center', marginBottom: 14, lineHeight: 38,
  },
  subtitle: {
    fontSize: 15, color: '#888', textAlign: 'center',
    lineHeight: 24, paddingHorizontal: 10,
  },
  inputWrapper: { marginTop: 28, width: '100%' },
  nameInput: {
    backgroundColor: '#1E1E2E', borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 16,
    fontSize: 18, color: '#FFF', textAlign: 'center',
    borderWidth: 1, borderColor: '#6C63FF',
  },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8, marginBottom: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E2E3E' },
  dotActive: { width: 24, height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  btn: {
    paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
});