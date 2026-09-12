import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlowTabIcon } from '@/components/GlowTabIcon';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { radius, shadow } from '@/constants/theme';

const TAB_HEIGHT = 40;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom - 2, 8);

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0, top: 0, left: 0, right: 0 }}
      screenOptions={{
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 0,
          paddingBottom: 0,
          height: TAB_HEIGHT,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 40,
          right: 40,
          bottom: 0,
          height: TAB_HEIGHT + bottomPad,
          paddingTop: 0,
          paddingBottom: bottomPad,
          borderRadius: 0,
          borderTopLeftRadius: radius.pill,
          borderTopRightRadius: radius.pill,
          borderTopWidth: 0,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: palette.border,
          backgroundColor: '#FFFFFF',
          ...shadow.card,
          elevation: 8,
        },
        tabBarBackground: () => null,
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
