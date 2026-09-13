import 'react-native-gesture-handler';
import '@/lib/geofencing';

import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AppProvider } from '@/context/AppContext';
import { handleShortcutDeepLink } from '@/lib/shortcuts-setup';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // When Shortcuts reports a missing QuietRoutine On/Off shortcut, create both automatically.
  useEffect(() => {
    const onUrl = ({ url }: { url: string }) => {
      handleShortcutDeepLink(url);
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) handleShortcutDeepLink(url);
      })
      .catch(() => undefined);

    const subscription = Linking.addEventListener('url', onUrl);
    return () => subscription.remove();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}

function RootLayoutNav() {
  // Force light navigation chrome to match the glass design system.
  useColorScheme();

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
