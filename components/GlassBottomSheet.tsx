import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export default function GlassBottomSheet({ children, style }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) + 72 }, style]}>
      <View style={styles.handleRow}>
        <View style={styles.handle} />
      </View>
      <GlassCard contentStyle={styles.sheet}>{children}</GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    bottom: 0,
  },
  handleRow: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    gap: spacing.lg,
  },
});
