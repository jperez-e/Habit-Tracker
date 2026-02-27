import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type ThemeStore = {
  isDark: boolean;
  userName: string;
  userMotivation: string;
  appStartDate: string;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  setUserMotivation: (phrase: string) => Promise<void>;
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: true,
  userName: '', 
  userMotivation: '',
  appStartDate: '',

  toggleTheme: async () => {
    const newValue = !get().isDark;
    set({ isDark: newValue });
    await AsyncStorage.setItem('theme', newValue ? 'dark' : 'light');
  },

  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('theme');
    const name = await AsyncStorage.getItem('user_name');
    const motivation = await AsyncStorage.getItem('user_motivation');
    let startDate = await AsyncStorage.getItem('app_start_date');
     
     if (!startDate) {
      startDate = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem('app_start_date', startDate);
    }

    if (saved) set({ isDark: saved === 'dark' });
    if (name) set({ userName: name });
    if (motivation) set({ userMotivation: motivation });
    set({ appStartDate: startDate });
  },

  setUserName: async (name: string) => {
    set({ userName: name });
    await AsyncStorage.setItem('user_name', name);
  },
  setUserMotivation: async (phrase: string) => {
    set({ userMotivation: phrase });
    await AsyncStorage.setItem('user_motivation', phrase);
  },
}));