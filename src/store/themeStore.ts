import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type ThemeStore = {
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: true,

  toggleTheme: async () => {
    const newValue = !get().isDark;
    set({ isDark: newValue });
    await AsyncStorage.setItem('theme', newValue ? 'dark' : 'light');
  },

  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('theme');
    if (saved) set({ isDark: saved === 'dark' });
  },
}));