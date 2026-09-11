import { useEffect, useState } from 'react';
import { Circle } from 'react-native-maps';

import { LatLng } from '@/lib/types';

type Props = {
  center: LatLng;
  radius: number;
  strokeColor: string;
  baseFillAlpha?: number;
  strokeWidth?: number;
};

/** Soft breathing fill inside a radius zone (map Circle opacity pulse). */
export default function BreathingZoneCircle({
  center,
  radius,
  strokeColor,
  baseFillAlpha = 0.18,
  strokeWidth = 2,
}: Props) {
  const [alpha, setAlpha] = useState(baseFillAlpha);

  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      const t = (Math.sin(frame / 12) + 1) / 2;
      setAlpha(baseFillAlpha * 0.55 + t * baseFillAlpha * 0.9);
    }, 80);
    return () => clearInterval(id);
  }, [baseFillAlpha]);

  return (
    <Circle
      center={center}
      radius={Math.max(radius, 1)}
      strokeColor={strokeColor}
      fillColor={`rgba(56, 189, 248, ${alpha.toFixed(3)})`}
      strokeWidth={strokeWidth}
    />
  );
}
