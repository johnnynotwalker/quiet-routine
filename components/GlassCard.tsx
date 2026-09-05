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
  /** Solid white card — required over maps. */
  solid?: boolean;
};

export default function GlassCard({
  children,
  style,
  contentStyle,
  highlighted = false,
  compact = false,
  solid = false,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  // Solid-enough fills so navy text stays readable on the light canvas.
  const borderColor = highlighted ? 'rgba(56, 189, 248, 0.55)' : 'rgba(148, 163, 184, 0.35)';
  const fill = highlighted ? 'rgba(224, 242, 254, 0.95)' : solid ? palette.card : 'rgba(255, 255, 255, 0.92)';

  const inner = (
    <View
      style={[
        styles.inner,
        compact && styles.innerCompact,
        { borderColor, backgroundColor: fill },
        contentStyle,
      ]}>
      {children}
    </View>
  );

  if (!solid && Platform.OS === 'ios') {
    return (
      <View style={[styles.shadow, style]}>
        <BlurView intensity={28} tint="light" style={styles.blur}>
          {inner}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.shadow, styles.fallback, { backgroundColor: palette.card, borderColor }, style]}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  blur: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  fallback: {
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  inner: {
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  innerCompact: {
    padding: spacing.lg,
  },
});
