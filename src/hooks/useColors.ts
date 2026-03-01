import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { darkColors, lightColors } from '../theme/colors';

export const useColors = () => {
  const { themeMode, isDark: storeIsDark, highContrast } = useThemeStore();
  const colorScheme = useColorScheme();

  const isDark = themeMode === 'system' ? colorScheme === 'dark' : storeIsDark;
  const base = isDark ? darkColors : lightColors;

  if (!highContrast) return base;

  return {
    ...base,
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    textMuted: isDark ? '#D7D7E0' : '#1E1E1E',
    border: isDark ? '#5A5A73' : '#B2B2C5',
    primary: isDark ? '#8A84FF' : '#4A39FF',
    danger: '#FF3B5C',
    success: '#2FBF4A',
  };
};
