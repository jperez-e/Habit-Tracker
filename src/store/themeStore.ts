import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type ThemeMode = 'light' | 'dark' | 'system';
export type TextScale = 'normal' | 'large' | 'xlarge';

type ThemeStore = {
  themeMode: ThemeMode;
  isDark: boolean; // Computed or literal based on mode
  userName: string;
  userMotivation: string;
  appStartDate: string;
  textScale: TextScale;
  highContrast: boolean;
  largeTouchTargets: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>; // Legacy toggle (keep for backwards compat if needed)
  loadTheme: () => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  setUserMotivation: (phrase: string) => Promise<void>;
  setTextScale: (scale: TextScale) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  setLargeTouchTargets: (enabled: boolean) => Promise<void>;
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themeMode: 'system',
  isDark: true, // initial default
  userName: '',
  userMotivation: '',
  appStartDate: '',
  textScale: 'normal',
  highContrast: false,
  largeTouchTargets: false,

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    if (mode !== 'system') {
      set({ isDark: mode === 'dark' });
    }
    await AsyncStorage.setItem('themeMode', mode);
  },

  toggleTheme: async () => {
    // toggle now cycles through light/dark manually
    const newValue = !get().isDark;
    const mode = newValue ? 'dark' : 'light';
    set({ isDark: newValue, themeMode: mode });
    await AsyncStorage.setItem('themeMode', mode);
  },

  loadTheme: async () => {
    const savedMode = await AsyncStorage.getItem('themeMode') as ThemeMode | null;
    const legacySaved = await AsyncStorage.getItem('theme'); // keep old check

    // migrate from old 'theme' key to 'themeMode'
    let effectiveMode: ThemeMode = 'system';
    if (savedMode) {
      effectiveMode = savedMode;
    } else if (legacySaved) {
      effectiveMode = legacySaved as ThemeMode;
      await AsyncStorage.setItem('themeMode', effectiveMode);
    }

    if (effectiveMode !== 'system') {
      set({ isDark: effectiveMode === 'dark', themeMode: effectiveMode });
    } else {
      set({ themeMode: 'system' });
    }

    const name = await AsyncStorage.getItem('user_name');
    const motivation = await AsyncStorage.getItem('user_motivation');
    let startDate = await AsyncStorage.getItem('app_start_date');
    const textScale = await AsyncStorage.getItem('text_scale');
    const highContrast = await AsyncStorage.getItem('high_contrast');
    const largeTouchTargets = await AsyncStorage.getItem('large_touch_targets');

    if (!startDate) {
      startDate = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem('app_start_date', startDate);
    }

    if (name) set({ userName: name });
    if (motivation) set({ userMotivation: motivation });
    set({ appStartDate: startDate });
    if (textScale === 'large' || textScale === 'xlarge') set({ textScale });
    if (highContrast === 'true') set({ highContrast: true });
    if (largeTouchTargets === 'true') set({ largeTouchTargets: true });
  },

  setUserName: async (name: string) => {
    set({ userName: name });
    await AsyncStorage.setItem('user_name', name);

    // Sync with Supabase metadata if logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({
          data: { username: name }
        });
      }
    } catch (error) {
      console.error('Error syncing username to Supabase:', error);
    }
  },
  setUserMotivation: async (phrase: string) => {
    set({ userMotivation: phrase });
    await AsyncStorage.setItem('user_motivation', phrase);
  },
  setTextScale: async (scale) => {
    set({ textScale: scale });
    await AsyncStorage.setItem('text_scale', scale);
  },
  setHighContrast: async (enabled) => {
    set({ highContrast: enabled });
    await AsyncStorage.setItem('high_contrast', String(enabled));
  },
  setLargeTouchTargets: async (enabled) => {
    set({ largeTouchTargets: enabled });
    await AsyncStorage.setItem('large_touch_targets', String(enabled));
  },
}));
