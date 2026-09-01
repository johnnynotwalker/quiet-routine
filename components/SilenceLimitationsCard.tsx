import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { isExpoGo } from '@/lib/platform';
import { lockScreenSettingsHint } from '@/lib/notification-permissions';

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

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={styles.title}>Lock screen vs. real silence</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        Lock screen status only needs notification permission — not location. If you do not see it on
        your lock screen, {lockScreenSettingsHint()}
      </Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        {isExpoGo()
          ? 'Expo Go cannot flip the physical silent switch. QuietRoutine shows when you should be quiet and reminds you.'
          : Platform.OS === 'ios'
            ? 'Apple does not let apps mute the ringer. Use Silent mode or a Focus yourself.'
            : 'Automatic ringer control needs a production build with extra permissions.'}
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
