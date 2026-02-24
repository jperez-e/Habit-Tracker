import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  completedDates: string[]; // fechas en formato 'YYYY-MM-DD'
  streak: number;
  createdAt: string;
};

type HabitStore = {
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  toggleHabit: (id: string, date: string) => void;
  loadHabits: () => Promise<void>;
};

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],

  addHabit: async (habit) => {
    const updated = [...get().habits, habit];
    set({ habits: updated });
    await AsyncStorage.setItem('habits', JSON.stringify(updated));
  },

  toggleHabit: async (id, date) => {
    const updated = get().habits.map((h) => {
      if (h.id !== id) return h;
      const done = h.completedDates.includes(date);
      const completedDates = done
        ? h.completedDates.filter((d) => d !== date)
        : [...h.completedDates, date];
      return { ...h, completedDates, streak: completedDates.length };
    });
    set({ habits: updated });
    await AsyncStorage.setItem('habits', JSON.stringify(updated));
  },

  loadHabits: async () => {
    const data = await AsyncStorage.getItem('habits');
    if (data) set({ habits: JSON.parse(data) });
  },
}));