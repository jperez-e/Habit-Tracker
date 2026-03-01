import * as Sentry from '@sentry/react-native';

let initialized = false;

export const initSentry = () => {
  if (initialized) return;

  const dsn = (process.env.EXPO_PUBLIC_SENTRY_DSN || '').trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    enableNativeFramesTracking: true,
    enableCaptureFailedRequests: true,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
    environment: process.env.EXPO_PUBLIC_APP_ENV || (__DEV__ ? 'development' : 'production'),
  });

  initialized = true;
};

export { Sentry };
