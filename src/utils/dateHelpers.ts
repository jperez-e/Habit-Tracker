export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};