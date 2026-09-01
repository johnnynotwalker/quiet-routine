import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { radius, spacing } from '@/constants/theme';
import { tapHaptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  active?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export default function Chip({ label, active = false, onPress, style }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        tapHaptic().catch(() => undefined);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 280 });
      }}
      style={[
        styles.chip,
        animatedStyle,
        {
          backgroundColor: active ? palette.tint : palette.glass,
          borderColor: active ? palette.tint : palette.border,
        },
        style,
      ]}>
      <Text style={{ color: active ? '#FFFFFF' : palette.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
});
