import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1E1E2E', borderTopColor: '#2E2E3E' },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: 'Hoy',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarLabel: 'Estadísticas',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}