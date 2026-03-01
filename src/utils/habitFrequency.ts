export type HabitFrequencyType = 'daily' | 'specific_days' | 'times_per_week';

export type HabitFrequencyData = {
  frequencyType?: HabitFrequencyType;
  specificDays?: number[];
  timesPerWeek?: number;
  restDates?: string[];
  completedDates: string[];
};

const normalizeDate = (date: string): string => {
  const d = new Date(date + 'T12:00:00');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getWeekRange = (date: string): { weekStart: string; weekEnd: string } => {
  const d = new Date(date + 'T12:00:00');
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { weekStart: normalizeDate(start.toISOString().split('T')[0]), weekEnd: normalizeDate(end.toISOString().split('T')[0]) };
};

export const countCompletionsInWeek = (completedDates: string[], date: string): number => {
  const { weekStart, weekEnd } = getWeekRange(date);
  return completedDates.filter((d) => d >= weekStart && d <= weekEnd).length;
};

export const isHabitDueOnDate = (habit: HabitFrequencyData, date: string): boolean => {
  if (habit.restDates?.includes(date)) return false;

  const frequencyType = habit.frequencyType ?? 'daily';
  if (frequencyType === 'daily') return true;

  if (frequencyType === 'specific_days') {
    const day = new Date(date + 'T12:00:00').getDay();
    const specificDays = habit.specificDays ?? [];
    return specificDays.includes(day);
  }

  const timesPerWeek = Math.max(1, habit.timesPerWeek ?? 3);
  const doneThisWeek = countCompletionsInWeek(habit.completedDates ?? [], date);
  return doneThisWeek < timesPerWeek;
};

export const getFrequencyLabel = (habit: HabitFrequencyData): string => {
  const type = habit.frequencyType ?? 'daily';
  if (type === 'daily') return 'Diario';
  if (type === 'times_per_week') return `${Math.max(1, habit.timesPerWeek ?? 3)}x por semana`;

  const days = habit.specificDays ?? [];
  if (days.length === 0) return 'Días específicos';
  const map = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => map[d] ?? '?')
    .join(' · ');
};

export const calculateHabitStreak = (habit: HabitFrequencyData, todayDate: string): number => {
  if (!habit.completedDates?.length) return 0;

  const type = habit.frequencyType ?? 'daily';
  if (type === 'times_per_week') {
    let streak = 0;
    let cursor = new Date(todayDate + 'T12:00:00');
    for (let i = 0; i < 52; i++) {
      const cursorDate = normalizeDate(cursor.toISOString().split('T')[0]);
      const { weekStart } = getWeekRange(cursorDate);
      const completed = countCompletionsInWeek(habit.completedDates, cursorDate);
      const target = Math.max(1, habit.timesPerWeek ?? 3);
      if (completed >= target) {
        streak++;
        cursor.setDate(cursor.getDate() - 7);
      } else {
        break;
      }
      if (weekStart <= '1970-01-01') break;
    }
    return streak;
  }

  let streak = 0;
  let cursor = new Date(todayDate + 'T12:00:00');
  for (let i = 0; i < 365; i++) {
    const dateStr = normalizeDate(cursor.toISOString().split('T')[0]);
    const due = isHabitDueOnDate({ ...habit, completedDates: habit.completedDates }, dateStr);

    if (!due) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (habit.completedDates.includes(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  return streak;
};
