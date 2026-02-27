import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { darkColors, lightColors } from '../theme/colors';

export const useColors = () => {
  const { themeMode, isDark: storeIsDark } = useThemeStore();
  const colorScheme = useColorScheme();

  const isDark = themeMode === 'system' ? colorScheme === 'dark' : storeIsDark;

  return isDark ? darkColors : lightColors;
};