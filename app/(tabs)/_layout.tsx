import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlowTabIcon } from '@/components/GlowTabIcon';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { radius, shadow } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0, top: 0, left: 0, right: 0 }}
      screenOptions={{
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
          height: 58,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 48,
          right: 48,
          bottom: Math.max(insets.bottom, 8),
          height: 58,
          paddingTop: 0,
          paddingBottom: 0,
          borderRadius: radius.pill,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: palette.glassBorder,
          backgroundColor: palette.card,
          ...shadow.card,
          overflow: 'hidden',
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={36} tint="light" style={StyleSheet.absoluteFill} />
          ) : null,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <GlowTabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <GlowTabIcon name="calendar" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="zones"
        options={{
          title: 'Zones',
          tabBarIcon: ({ color, focused }) => (
            <GlowTabIcon name="zones" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="routines" options={{ href: null }} />
    </Tabs>
  );
}
