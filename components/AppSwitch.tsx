import { Switch, SwitchProps } from 'react-native';

import { switchColors } from '@/constants/theme';
import { selectHaptic } from '@/lib/haptics';

type Props = Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'>;

export default function AppSwitch({ onValueChange, ...props }: Props) {
  return (
    <Switch
      {...props}
      trackColor={{ false: switchColors.off, true: switchColors.on }}
      thumbColor={switchColors.thumb}
      ios_backgroundColor={switchColors.off}
      onValueChange={(value) => {
        selectHaptic().catch(() => undefined);
        onValueChange?.(value);
      }}
    />
  );
}
