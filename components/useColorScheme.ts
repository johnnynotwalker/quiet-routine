/**
 * QuietRoutine is designed as a light glass UI.
 * Always return light so system Dark Mode cannot turn text white
 * on the light canvas (the white-on-white bug).
 */
export type AppColorScheme = 'light' | 'dark';

export function useColorScheme(): AppColorScheme {
  return 'light';
}
