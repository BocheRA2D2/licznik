
import { useState, useEffect } from 'react';
import { type Point, type Track, calculateDistance } from '../utils/geo';

export const useGhostRace = (ghostTrack: Track | null, isRacing: boolean, elapsedTime: number, currentPosition: Point | null) => {
  const [ghostPosition, setGhostPosition] = useState<Point | null>(null);
  const [timeGap, setTimeGap] = useState(0); // seconds
  const [distanceGap, setDistanceGap] = useState(0); // meters

  // Interpolate ghost position based on elapsedTime
  useEffect(() => {
    if (!ghostTrack || !isRacing) {
      setGhostPosition(null);
      return;
    }

    const points = ghostTrack.points;
    if (points.length < 2) return;

    // Find the segment the ghost is currently in based on time from start
    // ghostTrack points have timestamps relative to its own start
    const startTime = points[0].timestamp;
    const targetTimeOffset = elapsedTime * 1000; // ms

    let found = false;
    for (let i = 0; i < points.length - 1; i++) {
       const p1 = points[i];
       const p2 = points[i+1];
       const t1 = p1.timestamp - startTime;
       const t2 = p2.timestamp - startTime;

       if (targetTimeOffset >= t1 && targetTimeOffset <= t2) {
          const ratio = (targetTimeOffset - t1) / (t2 - t1);
          setGhostPosition({
             lat: p1.lat + (p2.lat - p1.lat) * ratio,
             lng: p1.lng + (p2.lng - p1.lng) * ratio,
             timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * ratio
          });
          found = true;
          break;
       }
    }
    
    // If we passed the end of the track
    if (!found && targetTimeOffset > (points[points.length - 1].timestamp - startTime)) {
       setGhostPosition(points[points.length - 1]);
    }
  }, [ghostTrack, isRacing, elapsedTime]);

  // Calculate gaps
  useEffect(() => {
     if (!isRacing || !currentPosition || !ghostPosition || !ghostTrack) return;

     // 1. Distance gap (linear distance between us and ghost)
     const dGap = calculateDistance(currentPosition, ghostPosition);
     
     
     // Determine if we are ahead or behind. 
     // This is a simplification: we'll check who has covered more distance on the track.
     // We assume the user is roughly on the track
     // We'll use a heuristic for now: compare cumulative distance
     // But better: find "projected" distance of user on the ghost path.
     
     // Simplified Lead/Lag: 
     // Find the point on ghostTrack closest to user.
     let minDict = Infinity;
     let closestIndex = 0;
     for(let i=0; i<ghostTrack.points.length; i++) {
        const d = calculateDistance(currentPosition, ghostTrack.points[i]);
        if(d < minDict) {
            minDict = d;
            closestIndex = i;
        }
     }
     
     const userTimeAtThatPoint = (ghostTrack.points[closestIndex].timestamp - ghostTrack.points[0].timestamp) / 1000;
     setTimeGap(elapsedTime - userTimeAtThatPoint); // positive = we are slower (behind in time), negative = ahead
     setDistanceGap(dGap);

  }, [isRacing, currentPosition, ghostPosition, ghostTrack, elapsedTime]);

  return {
    ghostPosition,
    timeGap,
    distanceGap
  };
};
