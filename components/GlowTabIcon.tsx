import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { shadow } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IconName;
  color: string;
  focused: boolean;
};

export function GlowTabIcon({ name, color, focused }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <View style={styles.wrap}>
      {focused ? <View style={[styles.glow, { backgroundColor: palette.accent }, shadow.glow]} /> : null}
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export function HeaderIconButton({ name, onPress }: { name: IconName; onPress?: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.55)', borderColor: palette.border }]}>
      <Ionicons name={name} size={20} color={palette.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
