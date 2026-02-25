import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  completedDates: string[];
  streak: number;
  archived: boolean; // ← nuevo
  createdAt: string;
};

type HabitStore = {
  habits: Habit[];
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>; // ← nuevo
  toggleHabit: (id: string, date: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>; // ← nuevo
  clearAllHabits: () => Promise<void>;
  loadHabits: () => Promise<void>;
};

// Calcula racha consecutiva real
const calculateStreak = (completedDates: string[]): number => {
  if (completedDates.length === 0) return 0;

  const sorted = [...completedDates].sort((a, b) => b.localeCompare(a));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let current = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = current.toISOString().split('T')[0];
    if (sorted.includes(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      // Permite un día de gracia (hoy puede no estar completado aún)
      if (i === 0) {
        current.setDate(current.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
};

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],

  addHabit: async (habit) => {
    const newHabit = { ...habit, archived: false };
    const updated = [...get().habits, newHabit];
    set({ habits: updated });
    await AsyncStorage.setItem('habits', JSON.stringify(updated));
  },

  updateHabit: async (id, updates) => {
    const updated = get().habits.map(h =>
      h.id === id ? { ...h, ...updates } : h
    );
    set({ habits: updated });
    await AsyncStorage.setItem('habits', JSON.stringify(updated));
  },

  toggleHabit: async (id, date) => {
    const updated = get().habits.map(h => {
      if (h.id !== id) return h;
      const alreadyDone = h.completedDates.includes(date);
      const newDates = alreadyDone
        ? h.completedDates.filter(d => d !== date)
        : [...h.completedDates, date];
      return {
        ...h,
        completedDates: newDates,
        streak: calculateStreak(newDates), // ← racha real
      };
    });
    set({ habits: updated });
    await AsyncStorage.setItem('habits', JSON.stringify(updated));
  },

  deleteHabit: async (id) => {
    const updated = get().habits.filter(h => h.id !== id);
    set({ habits: updated });
    await AsyncStorage.setItem('habits', JSON.stringify(updated));
  },

  archiveHabit: async (id) => {
    const updated = get().habits.map(h =>
      h.id === id ? { ...h, archived: !h.archived } : h
    );
    set({ habits: updated });
    await AsyncStorage.setItem('habits', JSON.stringify(updated));
  },

  clearAllHabits: async () => {
    set({ habits: [] });
    await AsyncStorage.removeItem('habits');
  },

  loadHabits: async () => {
    const data = await AsyncStorage.getItem('habits');
    if (data) {
      const habits = JSON.parse(data);
      // Migra hábitos viejos que no tienen archived
      const migrated = habits.map((h: Habit) => ({
        ...h,
        archived: h.archived ?? false,
      }));
      set({ habits: migrated });
    }
  },
}));