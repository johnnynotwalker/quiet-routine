import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  active?: boolean;
  color?: string;
  size?: number;
};

export default function PulsingMarker({ active = true, color = '#38BDF8', size = 18 }: Props) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [active, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + pulse.value * 1.4 }],
    opacity: 0.55 * (1 - pulse.value),
  }));

  if (!active) {
    return <View style={[styles.core, { width: size, height: size, backgroundColor: '#94A3B8' }]} />;
  }

  return (
    <View style={[styles.wrap, { width: size * 3, height: size * 3 }]}>
      <Animated.View
        style={[
          styles.ring,
          { width: size * 2.2, height: size * 2.2, borderRadius: size * 1.1, borderColor: color },
          ringStyle,
        ]}
      />
      <View style={[styles.core, { width: size, height: size, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  core: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
