import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors, { type ThemeColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { buildWeekStrip, WeekDay } from '@/lib/calendar-ui';
import { radius, spacing } from '@/constants/theme';
import { selectHaptic } from '@/lib/haptics';

type Props = {
  selectedDate: string;
  markedDates: Set<string>;
  onSelectDate: (iso: string) => void;
};

export default function WeekStrip({ selectedDate, markedDates, onSelectDate }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const days = buildWeekStrip(selectedDate);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((day) => (
        <DayPill
          key={day.iso}
          day={day}
          selected={day.iso === selectedDate}
          marked={markedDates.has(day.iso)}
          palette={palette}
          onPress={() => {
            selectHaptic().catch(() => undefined);
            onSelectDate(day.iso);
          }}
        />
      ))}
    </ScrollView>
  );
}

function DayPill({
  day,
  selected,
  marked,
  palette,
  onPress,
}: {
  day: WeekDay;
  selected: boolean;
  marked: boolean;
  palette: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.pillWrap}>
      <View
        style={[
          styles.pill,
          selected
            ? { backgroundColor: palette.iceTint, borderColor: palette.tint }
            : { backgroundColor: palette.card, borderColor: palette.border },
        ]}>
        <Text style={[styles.weekday, { color: selected ? palette.tintDeep : palette.muted }]}>
          {day.weekday}
        </Text>
        <Text style={[styles.dayNum, { color: selected ? palette.text : palette.text }]}>
          {day.day}
        </Text>
      </View>
      {selected || marked ? (
        <View style={[styles.dot, { backgroundColor: selected ? palette.tint : palette.muted }]} />
      ) : (
        <View style={styles.dotSpacer} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pillWrap: {
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    width: 56,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotSpacer: {
    height: 5,
  },
});
