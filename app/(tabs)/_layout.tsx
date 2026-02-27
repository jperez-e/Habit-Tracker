import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../src/hooks/useColors';

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets(); // ← detecta la barra de navegación automáticamente

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom, // ← suma el espacio de la barra de navegación
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} activeColor={colors.primary} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} activeColor={colors.primary} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} activeColor={colors.primary} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} activeColor={colors.primary} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color, activeColor }: { emoji: string; color: string; activeColor: string }) {
  const isActive = color === activeColor;
  return (
    <Text style={{ fontSize: 20, opacity: isActive ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}