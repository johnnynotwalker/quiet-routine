import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import Colors from '@/constants/Colors';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { dateFromTimeString, formatTimeLabel, formatTimeString } from '@/lib/time';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function TimePickerField({ label, value, onChange }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [showPicker, setShowPicker] = useState(false);
  const pickerDate = dateFromTimeString(value);

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selected) {
      onChange(formatTimeString(selected));
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.muted }]}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="11:00"
          placeholderTextColor={palette.muted}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.button,
            {
              color: palette.text,
              backgroundColor: palette.card,
              borderColor: palette.border,
            },
          ]}
        />
      </View>
    );
  }

  if (Platform.OS === 'android') {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.muted }]}>{label}</Text>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={[styles.button, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.buttonText, { color: palette.text }]}>{formatTimeLabel(value)}</Text>
          <Text style={[styles.hint, { color: palette.muted }]}>Tap to pick</Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker value={pickerDate} mode="time" is24Hour display="default" onChange={handleChange} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.muted }]}>{label}</Text>
      <View style={[styles.pickerWrap, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display="spinner"
          onChange={handleChange}
          style={styles.picker}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
  },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 180,
  },
});
