import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { cancelHabitReminder, scheduleHabitReminder } from '../utils/notifications';
import { calculateHabitStreak, HabitFrequencyType } from '../utils/habitFrequency';
import { getTodayString } from '../utils/dateHelpers';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  notes: string;
  reminderEnabled: boolean;
  reminderTime: string;
  frequencyType: HabitFrequencyType;
  specificDays: number[];
  timesPerWeek: number;
  restDates: string[];
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
  importHabitsFromBackup: (habits: Habit[]) => Promise<void>;
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
        const basePayload = {
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
        };

        const fullPayload = {
          ...basePayload,
          frequency_type: newHabit.frequencyType,
          specific_days: newHabit.specificDays,
          times_per_week: newHabit.timesPerWeek,
          rest_dates: newHabit.restDates,
        };

        let { error: syncError } = await supabase.from('habits').insert([fullPayload]);

        // Compatibilidad con esquemas antiguos que aún no tienen columnas de frecuencia.
        if (syncError) {
          const fallback = await supabase.from('habits').insert([basePayload]);
          syncError = fallback.error ?? null;
        }
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
      const updated = get().habits.map(h => (h.id === id ? { ...h, ...updates } : h));
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
        if (updates.frequencyType !== undefined) dbUpdates.frequency_type = updates.frequencyType;
        if (updates.specificDays !== undefined) dbUpdates.specific_days = updates.specificDays;
        if (updates.timesPerWeek !== undefined) dbUpdates.times_per_week = updates.timesPerWeek;
        if (updates.restDates !== undefined) dbUpdates.rest_dates = updates.restDates;
        if (updates.completedDates !== undefined) dbUpdates.completed_dates = updates.completedDates;

        // Doble filtro por seguridad: evita afectar hábitos de otro usuario si cambia RLS.
        let { error: updateError } = await supabase.from('habits').update(dbUpdates).eq('id', id).eq('user_id', user.id);

        if (updateError) {
          const {
            frequency_type: _frequencyType,
            specific_days: _specificDays,
            times_per_week: _timesPerWeek,
            rest_dates: _restDates,
            ...baseUpdates
          } = dbUpdates;

          const fallback = await supabase.from('habits').update(baseUpdates).eq('id', id).eq('user_id', user.id);
          updateError = fallback.error ?? null;
        }

        if (updateError) {
          console.error('Error syncing habit update:', updateError.message);
        }
      }

      // Mantiene sincronizados los recordatorios al editar datos clave del hábito.
      const mergedHabit = updated.find((h) => h.id === id);
      if (mergedHabit) {
        if (!mergedHabit.reminderEnabled || mergedHabit.archived) {
          await cancelHabitReminder(mergedHabit.id);
        } else {
          await scheduleHabitReminder(
            mergedHabit.id,
            mergedHabit.name,
            mergedHabit.icon,
            mergedHabit.reminderTime,
            mergedHabit
          );
        }
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
          streak: calculateHabitStreak({ ...h, completedDates: newDates }, getTodayString()),
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

      await cancelHabitReminder(id);
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

      // Si se archiva, quitamos recordatorio. Si se reactiva y tenía recordatorio, lo restauramos.
      if (isArchived) {
        await cancelHabitReminder(id);
      } else {
        const habitForReminder = updated.find((h) => h.id === id);
        if (habitForReminder?.reminderEnabled) {
        await scheduleHabitReminder(
          habitForReminder.id,
          habitForReminder.name,
          habitForReminder.icon,
          habitForReminder.reminderTime,
          habitForReminder
        );
        }
      }
    } catch (error) {
      console.error('Error archiving habit in storage:', error);
    }
  },

  clearAllHabits: async () => {
    try {
      const currentHabits = get().habits;
      set({ habits: [] });
      await AsyncStorage.removeItem('habits');

      // Sync with Supabase (delete all user habits)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('habits').delete().eq('user_id', user.id);
      }

      // Limpiamos recordatorios locales de hábitos eliminados.
      await Promise.all(currentHabits.map((h) => cancelHabitReminder(h.id)));
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
            frequencyType: ch.frequency_type ?? 'daily',
            specificDays: ch.specific_days ?? [],
            timesPerWeek: ch.times_per_week ?? 3,
            restDates: ch.rest_dates ?? [],
            completedDates: ch.completed_dates,
            streak: calculateHabitStreak(
              {
                frequencyType: ch.frequency_type ?? 'daily',
                specificDays: ch.specific_days ?? [],
                timesPerWeek: ch.times_per_week ?? 3,
                restDates: ch.rest_dates ?? [],
                completedDates: ch.completed_dates ?? [],
              },
              getTodayString()
            ),
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
            const fullRows = toUpload.map(lh => ({
              id: lh.id,
              user_id: user.id,
              name: lh.name,
              icon: lh.icon,
              color: lh.color,
              notes: lh.notes,
              archived: lh.archived,
              reminder_enabled: lh.reminderEnabled,
              reminder_time: lh.reminderTime,
              frequency_type: lh.frequencyType,
              specific_days: lh.specificDays,
              times_per_week: lh.timesPerWeek,
              rest_dates: lh.restDates,
              completed_dates: lh.completedDates,
              created_at: lh.createdAt,
            }));

            let { error: bulkError } = await supabase.from('habits').insert(fullRows);
            if (bulkError) {
              const baseRows = toUpload.map(lh => ({
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
              }));
              const fallback = await supabase.from('habits').insert(baseRows);
              bulkError = fallback.error ?? null;
            }

            if (bulkError) {
              console.error('Error syncing local habits to cloud:', bulkError.message);
            }
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
        frequencyType: h.frequencyType ?? 'daily',
        specificDays: h.specificDays ?? [],
        timesPerWeek: h.timesPerWeek ?? 3,
        restDates: h.restDates ?? [],
        streak: calculateHabitStreak(
          {
            frequencyType: h.frequencyType ?? 'daily',
            specificDays: h.specificDays ?? [],
            timesPerWeek: h.timesPerWeek ?? 3,
            restDates: h.restDates ?? [],
            completedDates: h.completedDates ?? [],
          },
          getTodayString()
        ),
      }));

      set({ habits: migrated });
      await AsyncStorage.setItem('habits', JSON.stringify(migrated));

      // Reprogramamos recordatorios activos al cargar la data.
      const reminderJobs = migrated
        .filter((h) => h.reminderEnabled && !h.archived)
        .map((h) =>
          scheduleHabitReminder(h.id, h.name, h.icon, h.reminderTime, h).catch((e) => {
            console.warn('No se pudo reprogramar recordatorio de hábito:', h.id, e);
          })
        );

      await Promise.all(reminderJobs);
    } catch (error) {
      console.error('Error loading habits from storage:', error);
    }
  },

  importHabitsFromBackup: async (backupHabits) => {
    try {
      const migrated = backupHabits.map((h: Habit) => ({
        ...h,
        archived: h.archived ?? false,
        notes: h.notes ?? '',
        reminderEnabled: h.reminderEnabled ?? false,
        reminderTime: h.reminderTime ?? '08:00',
        frequencyType: h.frequencyType ?? 'daily',
        specificDays: h.specificDays ?? [],
        timesPerWeek: h.timesPerWeek ?? 3,
        restDates: h.restDates ?? [],
        streak: calculateHabitStreak(
          {
            frequencyType: h.frequencyType ?? 'daily',
            specificDays: h.specificDays ?? [],
            timesPerWeek: h.timesPerWeek ?? 3,
            restDates: h.restDates ?? [],
            completedDates: h.completedDates ?? [],
          },
          getTodayString()
        ),
      }));

      set({ habits: migrated });
      await AsyncStorage.setItem('habits', JSON.stringify(migrated));

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const rows = migrated.map((h) => ({
          id: h.id,
          user_id: user.id,
          name: h.name,
          icon: h.icon,
          color: h.color,
          notes: h.notes,
          archived: h.archived,
          reminder_enabled: h.reminderEnabled,
          reminder_time: h.reminderTime,
          completed_dates: h.completedDates,
          created_at: h.createdAt,
        }));
        await supabase.from('habits').upsert(rows);
      }

      const reminderJobs = migrated
        .filter((h) => h.reminderEnabled && !h.archived)
        .map((h) =>
          scheduleHabitReminder(h.id, h.name, h.icon, h.reminderTime, h).catch(() => undefined)
        );
      await Promise.all(reminderJobs);
    } catch (error) {
      console.error('Error importing backup habits:', error);
      throw error;
    }
  },
}));
