import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import Colors from '@/constants/Colors';
import { radius, shadow, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  highlighted?: boolean;
  compact?: boolean;
};

export default function GlassCard({
  children,
  style,
  contentStyle,
  highlighted = false,
  compact = false,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const inner = (
    <View
      style={[
        styles.inner,
        compact && styles.innerCompact,
        {
          borderColor: highlighted ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.5)',
          backgroundColor: Platform.OS === 'android' ? palette.glass : 'rgba(255,255,255,0.35)',
        },
        highlighted && { backgroundColor: 'rgba(56, 189, 248, 0.08)' },
        contentStyle,
      ]}>
      {children}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.shadow, style]}>
        <BlurView intensity={85} tint="light" style={styles.blur}>
          {inner}
        </BlurView>
      </View>
    );
  }

  return <View style={[styles.shadow, styles.fallback, { backgroundColor: palette.glass }, style]}>{inner}</View>;
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  blur: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  fallback: {
    borderRadius: radius.xl,
  },
  inner: {
    padding: spacing.xxl,
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  innerCompact: {
    padding: spacing.lg,
  },
});
