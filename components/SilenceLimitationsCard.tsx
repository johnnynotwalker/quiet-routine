import { Linking, Platform, Pressable, StyleSheet } from 'react-native';

import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { isExpoGo } from '@/lib/platform';
import { lockScreenSettingsHint } from '@/lib/notification-permissions';
import { typography } from '@/constants/theme';

export default function SilenceLimitationsCard() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];

  return (
    <GlassCard contentStyle={styles.card}>
      <Text style={[styles.title, { color: palette.text }]}>Lock screen vs. real silence</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        Lock screen status only needs notification permission — not location. If you do not see it,{' '}
        {lockScreenSettingsHint()}
      </Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        {isExpoGo()
          ? 'Expo Go cannot flip the physical silent switch. QuietRoutine shows when you should be quiet.'
          : Platform.OS === 'ios'
            ? 'Apple does not let apps mute the ringer. Use Silent mode or a Focus yourself.'
            : 'Automatic ringer control needs a production build with extra permissions.'}
      </Text>
      <Pressable onPress={() => Linking.openSettings()}>
        <Text style={[styles.link, { color: palette.tint }]}>
          Open {Platform.OS === 'ios' ? 'Focus / Do Not Disturb' : 'phone'} settings
        </Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  title: {
    ...typography.heading,
  },
  body: {
    ...typography.body,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
