import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { isExpoGo } from '@/lib/platform';

export default function SilenceLimitationsCard() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];

  const openFocusSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:root=DO_NOT_DISTURB').catch(() => Linking.openSettings());
      return;
    }

    Linking.openSettings();
  };

  const notificationNote =
    Platform.OS === 'ios'
      ? 'On iPhone, Apple does not allow any app to pin a notification in Notification Center — you can always swipe it away. QuietRoutine re-posts it every few seconds while the app is running. A production build can use a Lock Screen Live Activity instead.'
      : 'On Android, QuietRoutine uses a foreground service notification that cannot be swiped away while the app is monitoring (allow location when prompted).';

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={styles.title}>About status notifications</Text>
      <Text style={[styles.body, { color: palette.muted }]}>{notificationNote}</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        {isExpoGo()
          ? 'In Expo Go, QuietRoutine also cannot switch your iPhone to silent or Do Not Disturb — it tracks when you should be quiet and reminds you.'
          : Platform.OS === 'ios'
            ? 'Apple does not let third-party apps turn off the ringer. Turn on Silent mode or a Focus yourself.'
            : 'Full automatic ringer control needs a production app build with extra Android permissions.'}
      </Text>
      <Pressable onPress={openFocusSettings}>
        <Text style={[styles.link, { color: palette.tint }]}>
          Open {Platform.OS === 'ios' ? 'Focus / Do Not Disturb' : 'phone'} settings
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
