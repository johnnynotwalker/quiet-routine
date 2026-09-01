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
};

export default function GlassCard({ children, style, contentStyle, highlighted = false }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const inner = (
    <View
      style={[
        styles.inner,
        {
          borderColor: highlighted ? palette.tint : palette.glassBorder,
          backgroundColor: Platform.OS === 'android' ? palette.glass : 'transparent',
        },
        highlighted && { backgroundColor: palette.accent },
        contentStyle,
      ]}>
      {children}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.shadow, style]}>
        <BlurView intensity={64} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.blur}>
          {inner}
        </BlurView>
      </View>
    );
  }

  return <View style={[styles.shadow, styles.fallback, { backgroundColor: palette.glass }, style]}>{inner}</View>;
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
  },
  inner: {
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
});
