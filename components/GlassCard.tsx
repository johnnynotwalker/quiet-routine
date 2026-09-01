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
          borderColor: highlighted ? 'rgba(56, 189, 248, 0.55)' : palette.glassBorder,
          backgroundColor: highlighted ? 'rgba(56, 189, 248, 0.1)' : palette.glassInner,
        },
        contentStyle,
      ]}>
      {children}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.shadow, style]}>
        <BlurView intensity={50} tint="light" style={styles.blur}>
          {inner}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.shadow, styles.fallback, { backgroundColor: palette.glass, borderColor: palette.glassBorder }, style]}>
      {inner}
    </View>
  );
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
    borderWidth: 1,
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
