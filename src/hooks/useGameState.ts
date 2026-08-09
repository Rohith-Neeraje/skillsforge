import { useState, useCallback } from 'react';
import { GameState, LevelState } from '../types/game';
import { EvaluationResult } from '../types/challenge';
import { challenges } from '../data/challenges';

const initialLevels: LevelState[] = challenges.map((c) => ({
  levelId: c.id,
  completed: false,
  score: 0,
  xpEarned: 0,
  bestSkill: null,
  attempts: 0,
}));

export function useGameState() {
  const [state, setState] = useState<GameState>({
    playerId: null,
    totalXP: 0,
    currentLevel: 1,
    levels: initialLevels,
    badges: [],
    isLoading: false,
    error: null,
    isLocked: false,
    showVictory: false,
  });

  const setPlayerId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, playerId: id }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const completeLevel = useCallback(
    (levelId: string, result: EvaluationResult, skill: string) => {
      setState((prev) => {
        const newLevels = prev.levels.map((l) => {
          if (l.levelId === levelId) {
            const isBetter = result.score > l.score;
            return {
              ...l,
              completed: result.passed || l.completed,
              score: Math.max(l.score, result.score),
              xpEarned: Math.max(l.xpEarned, result.xpEarned),
              bestSkill: isBetter ? skill : l.bestSkill,
              attempts: l.attempts + 1,
            };
          }
          return l;
        });

        const newTotalXP = newLevels.reduce((sum, l) => sum + l.xpEarned, 0);
        const completedIds = newLevels.filter((l) => l.completed).map((l) => l.levelId);

        const nextUncompleted = challenges.find((c) => !completedIds.includes(c.id));
        const newCurrentLevel = nextUncompleted
          ? challenges.indexOf(nextUncompleted) + 1
          : challenges.length;

        const newBadges = result.passed
          ? [...new Set([...prev.badges, levelId])]
          : prev.badges;

        const allCompleted = newLevels.every((l) => l.completed);

        return {
          ...prev,
          levels: newLevels,
          totalXP: newTotalXP,
          currentLevel: newCurrentLevel,
          badges: newBadges,
          showVictory: allCompleted,
        };
      });
    },
    [],
  );

  const loadProgress = useCallback(
    (data: { levels: LevelState[]; totalXP: number; badges: string[] }) => {
      setState((prev) => ({
        ...prev,
        levels: data.levels,
        totalXP: data.totalXP,
        badges: data.badges,
        currentLevel: calculateCurrentLevel(data.levels),
      }));
    },
    [],
  );

  const resetGame = useCallback(() => {
    setState({
      playerId: null,
      totalXP: 0,
      currentLevel: 1,
      levels: initialLevels,
      badges: [],
      isLoading: false,
      error: null,
      isLocked: false,
      showVictory: false,
    });
  }, []);

  return {
    state,
    setPlayerId,
    setLoading,
    setError,
    completeLevel,
    loadProgress,
    resetGame,
  };
}

function calculateCurrentLevel(levels: LevelState[]): number {
  const completed = levels.filter((l) => l.completed).length;
  return Math.min(completed + 1, levels.length);
}