import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  notes: string;
  reminderEnabled: boolean;
  reminderTime: string;
  completedDates: string[];
  streak: number;
  archived: boolean;
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
  resetStore: () => Promise<void>;
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
    try {
      const newHabit = { ...habit, archived: false };
      const updated = [...get().habits, newHabit];
      set({ habits: updated });
      await AsyncStorage.setItem('habits', JSON.stringify(updated));

      // Sync with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Syncing new habit to cloud:', newHabit.name);
        const { error: syncError } = await supabase.from('habits').insert([
          {
            id: newHabit.id,
            user_id: user.id,
            name: newHabit.name,
            icon: newHabit.icon,
            color: newHabit.color,
            notes: newHabit.notes,
            archived: newHabit.archived,
            reminder_enabled: newHabit.reminderEnabled,
            reminder_time: newHabit.reminderTime,
            completed_dates: newHabit.completedDates,
            created_at: newHabit.createdAt,
          },
        ]);
        if (syncError) {
          console.error('Error syncing habit to Supabase:', syncError.message, syncError.details);
          Alert.alert('Error de Sincronización', 'No pudimos guardar tu hábito en la nube: ' + syncError.message);
        } else {
          console.log('Habit synced successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving habit to storage:', error);
    }
  },

  updateHabit: async (id, updates) => {
    try {
      const updated = get().habits.map(h =>
        h.id === id ? { ...h, ...updates } : h
      );
      set({ habits: updated });
      await AsyncStorage.setItem('habits', JSON.stringify(updated));

      // Sync with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
        if (updates.reminderEnabled !== undefined) dbUpdates.reminder_enabled = updates.reminderEnabled;
        if (updates.reminderTime !== undefined) dbUpdates.reminder_time = updates.reminderTime;
        if (updates.completedDates !== undefined) dbUpdates.completed_dates = updates.completedDates;

        // Doble filtro por seguridad: evita afectar hábitos de otro usuario si cambia RLS.
        await supabase.from('habits').update(dbUpdates).eq('id', id).eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error updating habit in storage:', error);
    }
  },

  toggleHabit: async (id, date) => {
    try {
      let finalDates: string[] = [];
      const updated = get().habits.map(h => {
        if (h.id !== id) return h;
        const alreadyDone = h.completedDates.includes(date);
        const newDates = alreadyDone
          ? h.completedDates.filter(d => d !== date)
          : [...h.completedDates, date];
        finalDates = newDates;
        return {
          ...h,
          completedDates: newDates,
          streak: calculateStreak(newDates),
        };
      });
      set({ habits: updated });
      await AsyncStorage.setItem('habits', JSON.stringify(updated));

      // Sync with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Doble filtro por seguridad: id + usuario autenticado.
        await supabase.from('habits').update({ completed_dates: finalDates }).eq('id', id).eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error toggling habit in storage:', error);
    }
  },

  deleteHabit: async (id) => {
    try {
      const updated = get().habits.filter(h => h.id !== id);
      set({ habits: updated });
      await AsyncStorage.setItem('habits', JSON.stringify(updated));

      // Sync with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Doble filtro por seguridad: id + usuario autenticado.
        await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error deleting habit from storage:', error);
    }
  },

  archiveHabit: async (id) => {
    try {
      let isArchived = false;
      const updated = get().habits.map(h => {
        if (h.id === id) {
          isArchived = !h.archived;
          return { ...h, archived: isArchived };
        }
        return h;
      });
      set({ habits: updated });
      await AsyncStorage.setItem('habits', JSON.stringify(updated));

      // Sync with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Doble filtro por seguridad: id + usuario autenticado.
        await supabase.from('habits').update({ archived: isArchived }).eq('id', id).eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error archiving habit in storage:', error);
    }
  },

  clearAllHabits: async () => {
    try {
      set({ habits: [] });
      await AsyncStorage.removeItem('habits');

      // Sync with Supabase (delete all user habits)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('habits').delete().eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error clearing habits in storage:', error);
    }
  },

  resetStore: async () => {
    try {
      set({ habits: [] });
      await AsyncStorage.removeItem('habits');
    } catch (error) {
      console.error('Error resetting store:', error);
    }
  },

  loadHabits: async () => {
    try {
      // 1. Load local
      const localData = await AsyncStorage.getItem('habits');
      let localHabits: Habit[] = localData ? JSON.parse(localData) : [];

      // 2. Load from Supabase if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Loading habits from Supabase for user:', user.email);
        const { data: cloudHabits, error: cloudError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id);

        if (cloudError) {
          console.error('Error fetching habits from cloud:', cloudError.message);
          Alert.alert('Error de Carga', 'No pudimos recuperar tus hábitos de la nube.');
        }

        if (!cloudError && cloudHabits) {
          console.log(`Found ${cloudHabits.length} habits in cloud.`);
          // Merge logic: prefer cloud data, but push local if not in cloud
          const merged: Habit[] = [...localHabits];

          // Map cloud habits back to local type
          const mappedCloud: Habit[] = cloudHabits.map(ch => ({
            id: ch.id,
            name: ch.name,
            icon: ch.icon,
            color: ch.color,
            notes: ch.notes,
            reminderEnabled: ch.reminder_enabled,
            reminderTime: ch.reminder_time,
            completedDates: ch.completed_dates,
            streak: calculateStreak(ch.completed_dates),
            archived: ch.archived,
            createdAt: ch.created_at,
          }));

          // Add cloud habits to local if missing (based on ID)
          mappedCloud.forEach(ch => {
            const index = merged.findIndex(lh => lh.id === ch.id);
            if (index === -1) {
              merged.push(ch);
            } else {
              // If exists in both, cloud wins for consistency
              merged[index] = ch;
            }
          });

          // Upload local habits that are NOT in cloud
          const toUpload = localHabits.filter(lh => !mappedCloud.find(ch => ch.id === lh.id));
          if (toUpload.length > 0) {
            await supabase.from('habits').insert(toUpload.map(lh => ({
              id: lh.id,
              user_id: user.id,
              name: lh.name,
              icon: lh.icon,
              color: lh.color,
              notes: lh.notes,
              archived: lh.archived,
              reminder_enabled: lh.reminderEnabled,
              reminder_time: lh.reminderTime,
              completed_dates: lh.completedDates,
              created_at: lh.createdAt,
            })));
          }

          localHabits = merged;
        }
      }

      const migrated = localHabits.map((h: Habit) => ({
        ...h,
        archived: h.archived ?? false,
        notes: h.notes ?? '',
        reminderEnabled: h.reminderEnabled ?? false,
        reminderTime: h.reminderTime ?? '08:00',
        streak: calculateStreak(h.completedDates),
      }));

      set({ habits: migrated });
      await AsyncStorage.setItem('habits', JSON.stringify(migrated));
    } catch (error) {
      console.error('Error loading habits from storage:', error);
    }
  },
}));
