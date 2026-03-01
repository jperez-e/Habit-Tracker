import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../store/uiStore';

const tone = {
  success: { bg: '#1F5F3B', border: '#2E9C5C' },
  error: { bg: '#5C1F1F', border: '#C44A4A' },
  info: { bg: '#1F2A5F', border: '#5C77FF' },
};

export default function ToastViewport() {
  const insets = useSafeAreaInsets();
  const { toasts, removeToast } = useUiStore();

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), toast.duration)
    );

    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  return (
    <View pointerEvents="box-none" style={[styles.container, { top: insets.top + 8 }]}>
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(180)}
          exiting={FadeOutUp.duration(180)}
          layout={Layout.springify().damping(18).stiffness(220)}
          style={[
            styles.toast,
            { backgroundColor: tone[toast.type].bg, borderColor: tone[toast.type].border },
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    gap: 8,
  },
  toast: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
