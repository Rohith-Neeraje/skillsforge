import { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { LevelConfig } from '../types/challenge';
import WorkerStation from './WorkerStation';
import { useProximity, getStationProximity } from '../hooks/useProximity';

interface InteractionSystemProps {
  stations: LevelConfig[];
  completedLevels: string[];
  unlockedLevels: string[];
  playerIsLocked: boolean;
  onInteract: (station: LevelConfig) => void;
}

export default function InteractionSystem({
  stations,
  completedLevels,
  unlockedLevels,
  playerIsLocked,
  onInteract,
}: InteractionSystemProps) {
  const { camera } = useThree();
  const cameraPosRef = useRef(camera.position.clone());
  const [cameraPos, setCameraPos] = useState(cameraPosRef.current);
  const throttleRef = useRef(0);

  useFrame((_, delta) => {
    cameraPosRef.current.copy(camera.position);
    throttleRef.current += delta;
    if (throttleRef.current > 0.1) {
      throttleRef.current = 0;
      setCameraPos(cameraPosRef.current.clone());
    }
  });

  const { nearbyStation, isNearby } = useProximity(
    cameraPos,
    stations,
    playerIsLocked,
  );

  // Interaction key handler
  const handleKeyRef = useRef<(e: KeyboardEvent) => void>();
  handleKeyRef.current = (e: KeyboardEvent) => {
    if (e.code === 'KeyE' && nearbyStation) {
      const isUnlocked = unlockedLevels.includes(nearbyStation.id);
      if (isUnlocked) {
        onInteract(nearbyStation);
      }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyRef.current?.(e);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <group>
      {stations.map((station) => {
        const { level: proxLevel, direction: proxDir } = getStationProximity(
          cameraPos,
          station.stationPosition,
        );
        return (
          <WorkerStation
            key={station.id}
            config={station}
            isCompleted={completedLevels.includes(station.id)}
            isUnlocked={unlockedLevels.includes(station.id)}
            isNearby={nearbyStation?.id === station.id && isNearby}
            proximityLevel={proxLevel}
            playerDirection={proxDir}
          />
        );
      })}
    </group>
  );
}
