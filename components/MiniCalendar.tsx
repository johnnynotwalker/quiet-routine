import { Pressable, StyleSheet, View } from 'react-native';

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
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            const prev = shiftMonth(year, month, -1);
            onMonthChange(prev.year, prev.month);
          }}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{monthLabel(year, month)}</Text>
        <Pressable
          onPress={() => {
            const next = shiftMonth(year, month, 1);
            onMonthChange(next.year, next.month);
          }}>
          <Text style={styles.nav}>›</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nav: {
    fontSize: 28,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  month: {
    fontSize: 17,
    fontWeight: '700',
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
