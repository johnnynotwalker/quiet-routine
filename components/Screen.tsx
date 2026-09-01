import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';

type HeaderVariant = 'greeting' | 'title';

type Props = {
  title: string;
  subtitle?: string;
  greeting?: string;
  variant?: HeaderVariant;
  action?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export default function Screen({
  title,
  subtitle,
  greeting,
  variant = 'title',
  action,
  children,
  contentStyle,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FFFFFF', '#F0F9FF', '#E0F2FE', '#F8FCFF']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.container, contentStyle]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              {variant === 'greeting' ? (
                <>
                  <Text style={[styles.greeting, { color: palette.text }]}>{greeting ?? 'Hello'}</Text>
                  {subtitle ? (
                    <Text style={[styles.greetingSub, { color: palette.muted }]}>{subtitle}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
                  {subtitle ? (
                    <Text style={[styles.greetingSub, { color: palette.muted }]}>{subtitle}</Text>
                  ) : null}
                </>
              )}
            </View>
            {action}
          </View>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  greeting: {
    ...typography.hero,
  },
  title: {
    ...typography.title,
  },
  greetingSub: {
    ...typography.body,
    fontSize: 14,
  },
});
