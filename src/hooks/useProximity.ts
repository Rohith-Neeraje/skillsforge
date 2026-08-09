import { useState, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { LevelConfig } from '../types/challenge';

export type ProximityLevel = 'none' | 'looking' | 'waving' | 'interacting';

const LOOK_DISTANCE = 7;
const WAVE_DISTANCE = 5;
const INTERACTION_DISTANCE = 3.5;

export function useProximity(
  cameraPosition: Vector3,
  stations: LevelConfig[],
  playerIsLocked: boolean,
) {
  const [nearbyStation, setNearbyStation] = useState<LevelConfig | null>(null);
  const [distance, setDistance] = useState<number>(Infinity);
  const [proximityLevel, setProximityLevel] = useState<ProximityLevel>('none');
  const lastStationRef = useRef<string | null>(null);

  useEffect(() => {
    let closest: LevelConfig | null = null;
    let closestDist = Infinity;

    for (const station of stations) {
      const pos = new Vector3(...station.stationPosition);
      const dist = cameraPosition.distanceTo(pos);
      if (dist < closestDist) {
        closest = station;
        closestDist = dist;
      }
    }

    setNearbyStation(closestDist < INTERACTION_DISTANCE ? closest : null);
    setDistance(closestDist);

    // Determine proximity level
    let level: ProximityLevel = 'none';
    if (closestDist < INTERACTION_DISTANCE) {
      level = 'interacting';
    } else if (closestDist < WAVE_DISTANCE) {
      level = 'waving';
    } else if (closestDist < LOOK_DISTANCE) {
      level = 'looking';
    }

    setProximityLevel(level);

    if (closest?.id !== lastStationRef.current) {
      lastStationRef.current = closest?.id ?? null;
    }
  }, [cameraPosition, stations]);

  return {
    nearbyStation,
    distance,
    proximityLevel,
    isNearby: nearbyStation !== null && playerIsLocked && proximityLevel === 'interacting',
  };
}

/** Compute per-station proximity level and direction from camera */
export function getStationProximity(
  cameraPos: Vector3,
  stationPos: [number, number, number],
): { level: ProximityLevel; distance: number; direction: Vector3 } {
  const pos = new Vector3(...stationPos);
  const dist = cameraPos.distanceTo(pos);
  const direction = new Vector3().copy(pos).sub(cameraPos);
  direction.y = 0;
  direction.normalize();

  let level: ProximityLevel = 'none';
  if (dist < INTERACTION_DISTANCE) {
    level = 'interacting';
  } else if (dist < WAVE_DISTANCE) {
    level = 'waving';
  } else if (dist < LOOK_DISTANCE) {
    level = 'looking';
  }

  return { level, distance: dist, direction };
}