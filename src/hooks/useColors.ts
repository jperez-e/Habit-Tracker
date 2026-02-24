import { useThemeStore } from '../store/themeStore';
import { darkColors, lightColors } from '../theme/colors';

export const useColors = () => {
  const { isDark } = useThemeStore();
  return isDark ? darkColors : lightColors;
};