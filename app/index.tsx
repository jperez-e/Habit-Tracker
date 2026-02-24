import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    const check = async () => {
      const value = await AsyncStorage.getItem('onboarding_completed');
      setOnboardingDone(value === 'true');
      setLoading(false);
    };
    check();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#12121E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return <Redirect href={onboardingDone ? '/(tabs)/home' as any : '/onboarding' as any} />;
}