
export interface Point {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
}

export interface Track {
  id: string;
  name: string;
  date: number;
  points: Point[];
  distance: number; // in meters
  duration: number; // in seconds
}

/**
 * Calculates the Haversine distance between two points in meters.
 */
export const calculateDistance = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Formats seconds into HH:MM:SS or MM:SS string.
 */
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Formats distance in meters to km with 2 decimal places.
 */
export const formatDistance = (meters: number): string => {
  return (meters / 1000).toFixed(2);
};

/**
 * Calculates speed in km/h from m/s.
 */
export const msToKmh = (ms: number): number => {
  return ms * 3.6;
};
