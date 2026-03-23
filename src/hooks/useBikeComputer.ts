
import { useState, useEffect, useCallback, useRef } from 'react';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { type Point, calculateDistance, msToKmh } from '../utils/geo';

export const useBikeComputer = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Point | null>(null);
  const [path, setPath] = useState<Point[]>([]);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<string | null>(null);

  const startTracking = useCallback(async () => {
    const permissions = await Geolocation.requestPermissions();
    if (permissions.location !== 'granted') {
      alert('Location permission required');
      return;
    }

    setIsTracking(true);
    setPath([]);
    setDistance(0);
    setElapsedTime(0);
    setSpeed(0);

    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      (position: Position | null) => {
        if (position) {
          const newPoint: Point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
          };

          setCurrentPosition(newPoint);
          
          if (newPoint.speed !== null && newPoint.speed !== undefined) {
             setSpeed(msToKmh(newPoint.speed));
          }

          setPath((prevPath) => {
            if (prevPath.length > 0) {
              const lastPoint = prevPath[prevPath.length - 1];
              const d = calculateDistance(lastPoint, newPoint);
              // Filter out small jitters if not moving
              if (d > 2) {
                setDistance((prevDist) => prevDist + d);
                return [...prevPath, newPoint];
              }
              return prevPath;
            }
            return [newPoint];
          });
        }
      }
    );

    watchIdRef.current = id;

    timerRef.current = window.setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (watchIdRef.current) {
      Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return {
    isTracking,
    currentPosition,
    path,
    distance,
    speed,
    elapsedTime,
    startTracking,
    stopTracking,
  };
};
