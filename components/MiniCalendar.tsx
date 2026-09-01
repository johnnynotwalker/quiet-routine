import { Pressable, StyleSheet, View } from 'react-native';

import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  monthLabel,
  shiftMonth,
  todayParts,
  toIsoDate,
} from '@/lib/calendar-ui';
import { spacing, typography } from '@/constants/theme';

type Props = {
  year: number;
  month: number;
  selectedDate: string;
  markedDates: Set<string>;
  onMonthChange: (year: number, month: number) => void;
  onSelectDate: (iso: string) => void;
};

export default function MiniCalendar({
  year,
  month,
  selectedDate,
  markedDates,
  onMonthChange,
  onSelectDate,
}: Props) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const today = toIsoDate(todayParts().year, todayParts().month, todayParts().day);
  const cells = buildMonthGrid(year, month);

  return (
    <GlassCard contentStyle={styles.card}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            const prev = shiftMonth(year, month, -1);
            onMonthChange(prev.year, prev.month);
          }}>
          <Text style={[styles.nav, { color: palette.tint }]}>‹</Text>
        </Pressable>
        <Text style={[styles.month, { color: palette.text }]}>{monthLabel(year, month)}</Text>
        <Pressable
          onPress={() => {
            const next = shiftMonth(year, month, 1);
            onMonthChange(next.year, next.month);
          }}>
          <Text style={[styles.nav, { color: palette.tint }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={[styles.weekday, { color: palette.muted }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, index) => {
          if (!cell.inMonth) {
            return <View key={`empty-${index}`} style={styles.cell} />;
          }

          const isSelected = cell.iso === selectedDate;
          const isToday = cell.iso === today;
          const hasEvent = markedDates.has(cell.iso);

          return (
            <Pressable key={cell.iso} style={styles.cell} onPress={() => onSelectDate(cell.iso)}>
              <View
                style={[
                  styles.dayBubble,
                  isSelected && { backgroundColor: palette.tint },
                  !isSelected && isToday && { borderColor: palette.tint, borderWidth: 1 },
                ]}>
                <Text
                  style={{
                    color: isSelected ? '#FFF' : palette.text,
                    fontWeight: isToday || isSelected ? '700' : '500',
                  }}>
                  {cell.day}
                </Text>
              </View>
              {hasEvent ? <View style={[styles.dot, { backgroundColor: palette.tint }]} /> : null}
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nav: {
    fontSize: 28,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
  },
  month: {
    ...typography.heading,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 42,
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
});
