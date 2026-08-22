import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import Button from '@/components/Button';
import FormField from '@/components/FormField';
import Screen from '@/components/Screen';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '@/context/AppContext';
import { createId, formatMinutes } from '@/lib/time';
import { RoutineItem } from '@/lib/types';

export default function RoutinesScreen() {
  const { data, setRoutines } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('30');
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>();

  const sortedRoutines = [...data.routines].sort((a, b) => a.order - b.order);
  const totalMinutes = sortedRoutines.reduce((sum, item) => sum + item.durationMinutes, 0);

  const addRoutine = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Give this routine step a name.');
      return;
    }

    const routine: RoutineItem = {
      id: createId('routine'),
      name: name.trim(),
      durationMinutes: Math.max(5, Number(duration) || 30),
      zoneId: selectedZoneId,
      order: data.routines.length,
    };

    await setRoutines([...data.routines, routine]);
    setName('');
    setDuration('30');
    setSelectedZoneId(undefined);
  };

  const removeRoutine = async (routineId: string) => {
    const remaining = data.routines
      .filter((routine) => routine.id !== routineId)
      .map((routine, index) => ({ ...routine, order: index }));
    await setRoutines(remaining);
  };

  const moveRoutine = async (routineId: string, direction: 'up' | 'down') => {
    const index = sortedRoutines.findIndex((routine) => routine.id === routineId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= sortedRoutines.length) return;

    const reordered = [...sortedRoutines];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);
    await setRoutines(reordered.map((routine, order) => ({ ...routine, order })));
  };

  return (
    <Screen title="Daily routine" subtitle="Build your day and track how long each block takes.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summary, { backgroundColor: palette.accent, borderColor: palette.tint }]}>
          <Text style={styles.summaryTitle}>{formatMinutes(totalMinutes)} planned today</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            {sortedRoutines.length} routine {sortedRoutines.length === 1 ? 'step' : 'steps'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.cardTitle}>Add routine step</Text>
          <FormField label="Activity" value={name} onChangeText={setName} placeholder="Deep work, commute, lunch..." />
          <FormField
            label="Duration (minutes)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="30"
          />

          <Text style={[styles.label, { color: palette.muted }]}>Optional silent zone</Text>
          <View style={styles.zoneChoices}>
            <Pressable
              onPress={() => setSelectedZoneId(undefined)}
              style={[
                styles.chip,
                {
                  backgroundColor: !selectedZoneId ? palette.tint : palette.card,
                  borderColor: palette.border,
                },
              ]}>
              <Text style={{ color: !selectedZoneId ? '#FFF' : palette.text }}>None</Text>
            </Pressable>
            {data.zones.map((zone) => (
              <Pressable
                key={zone.id}
                onPress={() => setSelectedZoneId(zone.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedZoneId === zone.id ? palette.tint : palette.card,
                    borderColor: palette.border,
                  },
                ]}>
                <Text style={{ color: selectedZoneId === zone.id ? '#FFF' : palette.text }}>{zone.name}</Text>
              </Pressable>
            ))}
          </View>

          <Button title="Add to routine" onPress={addRoutine} />
        </View>

        {sortedRoutines.length === 0 ? (
          <Text style={[styles.empty, { color: palette.muted }]}>
            Example: Morning focus (90m), Team standup (30m), Gym (60m).
          </Text>
        ) : (
          sortedRoutines.map((routine, index) => {
            const linkedZone = data.zones.find((zone) => zone.id === routine.zoneId);
            return (
              <View
                key={routine.id}
                style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={styles.itemTitle}>{routine.name}</Text>
                <Text style={[styles.meta, { color: palette.muted }]}>
                  {formatMinutes(routine.durationMinutes)}
                  {linkedZone ? ` · auto-silence in ${linkedZone.name}` : ''}
                </Text>
                <View style={styles.actions}>
                  <Button title="Up" variant="secondary" onPress={() => moveRoutine(routine.id, 'up')} />
                  <Button title="Down" variant="secondary" onPress={() => moveRoutine(routine.id, 'down')} />
                  <Button title="Remove" variant="danger" onPress={() => removeRoutine(routine.id)} />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  summary: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  zoneChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
});
