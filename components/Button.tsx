import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { radius, shadow } from '@/constants/theme';
import { tapHaptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  disabled?: boolean;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundColor =
    variant === 'primary'
      ? palette.tint
      : variant === 'danger'
        ? 'rgba(251, 113, 133, 0.15)'
        : palette.card;

  const textColor =
    variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? palette.danger : palette.text;
  const borderColor =
    variant === 'primary' ? palette.tint : variant === 'danger' ? 'rgba(251, 113, 133, 0.35)' : palette.border;

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={() => {
        tapHaptic().catch(() => undefined);
        onPress();
      }}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.97, { damping: 14, stiffness: 340 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 280 });
      }}
      style={[
        styles.button,
        animatedStyle,
        variant === 'primary' ? shadow.button : shadow.soft,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      <Text style={[styles.label, { color: textColor }]}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radius.button,
    paddingHorizontal: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
