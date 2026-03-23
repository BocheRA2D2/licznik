
import { type Point, calculateDistance } from './geo';

export interface ClimbSegment {
  id: string;
  startIndex: number;
  endIndex: number;
  distance: number; // meters
  elevationGain: number; // meters
  averageGradient: number; // percentage
  points: Point[];
}

/**
 * Analyzes a track to find segments with a gradient > threshold.
 */
export const findClimbs = (points: Point[], minGradient = 3, minDistance = 200): ClimbSegment[] => {
  if (points.length < 10) return [];

  const climbs: ClimbSegment[] = [];
  let currentClimb: Partial<ClimbSegment> | null = null;
  
  // Helper to calculate gradient between two points
  const getGradient = (p1: Point, p2: Point) => {
    const dist = calculateDistance(p1, p2);
    if (dist < 1) return 0;
    const gain = (p2.altitude || 0) - (p1.altitude || 0);
    return (gain / dist) * 100;
  };

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // We look at chunks of points to avoid jitter
    const lookAheadIndex = Math.min(i + 10, points.length - 1);
    const pAhead = points[lookAheadIndex];
    const segmentGradient = getGradient(p1, pAhead);

    if (segmentGradient >= minGradient) {
      if (!currentClimb) {
        currentClimb = {
          startIndex: i,
          points: [p1]
        };
      }
      currentClimb.points?.push(p2);
    } else {
      if (currentClimb && currentClimb.points) {
        const startP = points[currentClimb.startIndex!];
        const endP = points[i];
        const dist = calculateDistance(startP, endP);
        const gain = (endP.altitude || 0) - (startP.altitude || 0);
        
        if (dist >= minDistance && (gain / dist) * 100 >= minGradient) {
           climbs.push({
             id: Math.random().toString(36).substr(2, 9),
             startIndex: currentClimb.startIndex!,
             endIndex: i,
             distance: dist,
             elevationGain: gain,
             averageGradient: (gain / dist) * 100,
             points: currentClimb.points
           });
        }
        currentClimb = null;
      }
    }
  }

  return climbs;
};

/**
 * Checks if a given coordinate is within a climb segment.
 */
export const isInsideClimb = (currentPos: Point, climbs: ClimbSegment[], toleranceMeters = 50): ClimbSegment | null => {
    for (const climb of climbs) {
        // Simple check: is the user close to any point in the climb?
        // Better: check if user is between start and end distance-wise on the track.
        for (const p of climb.points) {
            if (calculateDistance(currentPos, p) < toleranceMeters) {
                return climb;
            }
        }
    }
    return null;
};
