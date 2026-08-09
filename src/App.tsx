import { useState, useCallback, useRef } from 'react';
import { LevelConfig, EvaluationResult } from './types/challenge';
import { challenges } from './data/challenges';
import { evaluateSkill } from './services/skillEvaluation';
import { useGameState } from './hooks/useGameState';
import { isLevelUnlocked } from './utils/xpCalculator';
import type { PlayerControlsHandle } from './components/PlayerControls';
import PlayerControls from './components/PlayerControls';
import GameCanvas from './components/GameCanvas';
import FactoryScene from './components/FactoryScene';
import InteractionSystem from './components/InteractionSystem';
import HUD from './components/HUD';
import ChallengeModal from './components/ChallengeModal';
import VictoryScreen from './components/VictoryScreen';
import TutorialOverlay from './components/TutorialOverlay';

export default function App() {
  const { state, setLoading, setError, completeLevel, resetGame } =
    useGameState();
  const controlsRef = useRef<PlayerControlsHandle>(null);

  const [isLocked, setIsLocked] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeStation, setActiveStation] = useState<LevelConfig | null>(null);
  const [warpFlash, setWarpFlash] = useState(false);

  const completedLevels = state.levels
    .filter((l) => l.completed)
    .map((l) => l.levelId);

  const unlockedLevels = challenges
    .filter((c) => isLevelUnlocked(c.id, completedLevels))
    .map((c) => c.id);

  const handleStart = useCallback(() => {
    setHasStarted(true);
    // Must call lock() synchronously in the user gesture — browsers
    // reject Pointer Lock requests made outside a click/keyboard handler.
    controlsRef.current?.lock();
    setShowTutorial(true);
  }, []);

  const handleDismissTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const handleInteract = useCallback((station: LevelConfig) => {
    controlsRef.current?.unlock();
    setActiveStation(station);
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveStation(null);
    controlsRef.current?.lock();
  }, []);

  const handleSubmitSkill = useCallback(
    async (skill: string): Promise<EvaluationResult | null> => {
      if (!activeStation) return null;
      setLoading(true);
      try {
        const result = await evaluateSkill(skill, activeStation);
        completeLevel(activeStation.id, result, skill);
        return result;
      } catch (err) {
        setError('Failed to evaluate skill. Please try again.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [activeStation, completeLevel, setLoading, setError],
  );

  const handleReplay = useCallback(() => {
    resetGame();
    setHasStarted(false);
    setActiveStation(null);
    setShowTutorial(false);
  }, [resetGame]);

  const handleLockChange = useCallback((locked: boolean) => {
    setIsLocked(locked);
  }, []);

  // Warp flash: triggered when player crosses the world boundary
  const warpTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const handleWarp = useCallback(() => {
    setWarpFlash(true);
    if (warpTimeoutRef.current) clearTimeout(warpTimeoutRef.current);
    warpTimeoutRef.current = setTimeout(() => setWarpFlash(false), 500);
  }, []);

  return (
    <div className="w-full h-full relative">
      <GameCanvas>
        <FactoryScene />
        <PlayerControls
          ref={controlsRef}
          onLockChange={handleLockChange}
          onWarp={handleWarp}
        />
        <InteractionSystem
          stations={challenges}
          completedLevels={completedLevels}
          unlockedLevels={unlockedLevels}
          playerIsLocked={isLocked}
          onInteract={handleInteract}
        />
      </GameCanvas>

      <HUD
        gameState={state}
        isLocked={isLocked}
        hasStarted={hasStarted}
        onStart={handleStart}
        onLockToggle={() => controlsRef.current?.lock()}
      />

      <TutorialOverlay visible={showTutorial} onDismiss={handleDismissTutorial} />

      {activeStation && (
        <ChallengeModal
          level={activeStation}
          isCompleted={completedLevels.includes(activeStation.id)}
          onSubmit={handleSubmitSkill}
          onClose={handleCloseModal}
        />
      )}

      <VictoryScreen gameState={state} onReplay={handleReplay} />

      {/* Warp flash overlay — warm sunset flash when player is teleported back */}
      <div
        className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-300"
        style={{
          opacity: warpFlash ? 1 : 0,
          background:
            'radial-gradient(ellipse at center, rgba(255, 119, 51, 0.35) 0%, rgba(180, 60, 10, 0.5) 60%, rgba(0, 0, 0, 0.7) 100%)',
        }}
        aria-hidden
      />
    </div>
  );
}