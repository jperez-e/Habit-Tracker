import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
};

type UiStore = {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  toasts: [],
  showToast: (message, type = 'info', duration = 2200) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
