import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { isExpoGo } from '@/lib/platform';
import { lockScreenSettingsHint } from '@/lib/notification-permissions';

type Props = {
  lockScreenReady: boolean;
  notificationsGranted: boolean;
};

export default function LockScreenStatusCard({ lockScreenReady, notificationsGranted }: Props) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];

  if (lockScreenReady) {
    return (
      <View style={[styles.card, { backgroundColor: palette.accent, borderColor: palette.tint }]}>
        <Text style={styles.title}>Lock screen status is on</Text>
        <Text style={[styles.body, { color: palette.muted }]}>
          Look at your lock screen — you should see whether your phone should be silenced. Only
          notification permission is required{isExpoGo() ? ' (via Expo Go)' : ''}, not location.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={styles.title}>Enable lock screen status</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        {!notificationsGranted
          ? 'Allow notifications so QuietRoutine can show silence status on your lock screen. Location is not required for this.'
          : `Notifications are on, but lock screen display is off. ${lockScreenSettingsHint()}`}
      </Text>
      <Pressable onPress={() => Linking.openSettings()}>
        <Text style={[styles.link, { color: palette.tint }]}>
          Open {Platform.OS === 'ios' ? 'notification' : 'app'} settings
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
