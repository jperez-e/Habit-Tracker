import { useThemeStore } from '../store/themeStore';

export const useA11y = () => {
  const { textScale, largeTouchTargets } = useThemeStore();

  const fontScale = textScale === 'xlarge' ? 1.18 : textScale === 'large' ? 1.1 : 1;
  const minTouchSize = largeTouchTargets ? 48 : 40;

  return {
    fontScale,
    minTouchSize,
    scaleFont: (value: number) => Math.round(value * fontScale),
  };
};
