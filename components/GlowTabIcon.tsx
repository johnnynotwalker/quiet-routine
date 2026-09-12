import { Bell, CalendarDays, Home, MapPin, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { shadow } from '@/constants/theme';

export type TabName = 'home' | 'calendar' | 'zones';

const ICONS: Record<TabName, LucideIcon> = {
  home: Home,
  calendar: CalendarDays,
  zones: MapPin,
};

type Props = {
  name: TabName;
  color: ColorValue;
  focused: boolean;
};

export function GlowTabIcon({ name, color, focused }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const Icon = ICONS[name];

  return (
    <View style={styles.wrap}>
      {focused ? (
        <View style={[styles.glow, { backgroundColor: palette.iceTint }, shadow.glow]} />
      ) : null}
      <Icon size={22} color={typeof color === 'string' ? color : palette.tint} strokeWidth={1.75} />
    </View>
  );
}

export function HeaderIconButton({
  icon: Icon = Bell,
  onPress,
}: {
  icon?: LucideIcon;
  onPress?: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.iconBtn,
        shadow.soft,
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}>
      <Icon size={20} color={palette.text} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
