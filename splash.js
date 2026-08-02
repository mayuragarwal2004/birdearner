import * as SplashScreen from 'expo-splash-screen';

// Must run before the main App module is evaluated so the native splash
// stays up while Metro downloads / evaluates the JS bundle.
SplashScreen.preventAutoHideAsync().catch(() => {});
