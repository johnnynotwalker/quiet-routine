import { Linking, Platform, Pressable, StyleSheet } from 'react-native';

import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { isExpoGo } from '@/lib/platform';
import { lockScreenSettingsHint } from '@/lib/notification-permissions';
import { typography } from '@/constants/theme';

type Props = {
  lockScreenReady: boolean;
  notificationsGranted: boolean;
};

export default function LockScreenStatusCard({ lockScreenReady, notificationsGranted }: Props) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];

  return (
    <GlassCard highlighted={lockScreenReady} contentStyle={styles.card}>
      <Text style={[styles.title, { color: palette.text }]}>
        {lockScreenReady ? 'Lock screen status is on' : 'Enable lock screen status'}
      </Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        {lockScreenReady
          ? `Your silence status appears on the lock screen. Only notification permission is needed${isExpoGo() ? ' (via Expo Go)' : ''}.`
          : !notificationsGranted
            ? 'Allow notifications so QuietRoutine can show silence status on your lock screen. Location is not required.'
            : `Notifications are on, but lock screen display is off. ${lockScreenSettingsHint()}`}
      </Text>
      {!lockScreenReady ? (
        <Pressable onPress={() => Linking.openSettings()}>
          <Text style={[styles.link, { color: palette.tint }]}>
            Open {Platform.OS === 'ios' ? 'notification' : 'app'} settings
          </Text>
        </Pressable>
      ) : null}
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
