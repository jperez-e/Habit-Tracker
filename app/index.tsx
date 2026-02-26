import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'done'>('logo');

  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fase 1 — aparece el logo
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
    ]).start(() => {
      // Fase 2 — aparece el tagline
      Animated.timing(taglineOpacity, {
        toValue: 1, duration: 500, delay: 200, useNativeDriver: true,
      }).start(async () => {
        // Espera un momento y navega
        await new Promise(r => setTimeout(r, 800));

        // Fade out
        Animated.timing(bgOpacity, {
          toValue: 0, duration: 400, useNativeDriver: true,
        }).start(async () => {
          const value = await AsyncStorage.getItem('onboarding_completed');
          router.replace(
            value === 'true' ? '/(tabs)/home' as any : '/onboarding' as any
          );
        });
      });
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>

      {/* Círculos decorativos de fondo */}
      <View style={[styles.circle1]} />
      <View style={[styles.circle2]} />
      <View style={[styles.circle3]} />

      {/* Logo */}
      <Animated.View style={[
        styles.logoContainer,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] }
      ]}>
        <View style={styles.iconWrapper}>
          <Text style={styles.emoji}>🏆</Text>
        </View>
        <Text style={styles.appName}>Habit Tracker</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
        <Text style={styles.tagline}>Construye hábitos.</Text>
        <Text style={styles.taglineAccent}>Transforma tu vida.</Text>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: taglineOpacity }]}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#12121E',
    justifyContent: 'center', alignItems: 'center',
  },
  circle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#6C63FF', opacity: 0.08, top: -80, right: -80,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#FF6584', opacity: 0.06, bottom: 100, left: -60,
  },
  circle3: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#43C6AC', opacity: 0.07, bottom: -40, right: 40,
  },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  iconWrapper: {
    width: 110, height: 110, borderRadius: 32,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  emoji: { fontSize: 56 },
  appName: {
    fontSize: 36, fontWeight: 'bold', color: '#FFFFFF',
    letterSpacing: 1,
  },
  taglineContainer: { alignItems: 'center', gap: 4 },
  tagline: { fontSize: 18, color: '#888', fontWeight: '300' },
  taglineAccent: { fontSize: 18, color: '#6C63FF', fontWeight: '600' },
  footer: {
    position: 'absolute', bottom: 60,
    flexDirection: 'row', gap: 8,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E2E3E',
  },
  dotActive: { backgroundColor: '#6C63FF', width: 24 },
});