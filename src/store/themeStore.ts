import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type ThemeStore = {
  isDark: boolean;
  userName: string; // ← nuevo
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
  setUserName: (name: string) => Promise<void>; // ← nuevo
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: true,
  userName: '', // ← nuevo

  toggleTheme: async () => {
    const newValue = !get().isDark;
    set({ isDark: newValue });
    await AsyncStorage.setItem('theme', newValue ? 'dark' : 'light');
  },

  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('theme');
    const name = await AsyncStorage.getItem('user_name');
    if (saved) set({ isDark: saved === 'dark' });
    if (name) set({ userName: name });
  },

  setUserName: async (name: string) => {
    set({ userName: name });
    await AsyncStorage.setItem('user_name', name);
  },
}));