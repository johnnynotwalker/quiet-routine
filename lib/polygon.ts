import { LatLng } from './types';

export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const earthRadius = 6371000;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const deltaLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const deltaLng = ((b.longitude - a.longitude) * Math.PI) / 180;

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function polygonCentroid(polygon: LatLng[]): LatLng {
  if (polygon.length === 0) return { latitude: 0, longitude: 0 };

  const total = polygon.reduce(
    (acc, point) => ({
      latitude: acc.latitude + point.latitude,
      longitude: acc.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: total.latitude / polygon.length,
    longitude: total.longitude / polygon.length,
  };
}
