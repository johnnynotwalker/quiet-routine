import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import Colors from '@/constants/Colors';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';

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

  const backgroundColor =
    variant === 'primary'
      ? palette.tint
      : variant === 'danger'
        ? palette.danger
        : palette.card;

  const textColor = variant === 'secondary' ? palette.text : '#FFFFFF';
  const borderColor = variant === 'secondary' ? palette.border : backgroundColor;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Text style={[styles.label, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
