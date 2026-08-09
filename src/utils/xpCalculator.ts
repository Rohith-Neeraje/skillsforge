import { LevelConfig } from '../types/challenge';
import { challenges } from '../data/challenges';

export function calculateLevel(score: number): number {
  if (score >= 1600) return 4;
  if (score >= 1000) return 3;
  if (score >= 500) return 2;
  return 1;
}

export function calculateLevelProgress(score: number): { level: number; progress: number; nextAt: number } {
  if (score >= 1600) return { level: 4, progress: 100, nextAt: 1600 };
  if (score >= 1000) {
    const progress = ((score - 1000) / 600) * 100;
    return { level: 3, progress: Math.min(progress, 100), nextAt: 1600 };
  }
  if (score >= 500) {
    const progress = ((score - 500) / 500) * 100;
    return { level: 2, progress: Math.min(progress, 100), nextAt: 1000 };
  }
  const progress = (score / 500) * 100;
  return { level: 1, progress: Math.min(progress, 100), nextAt: 500 };
}

export function getNextLevel(completedLevels: string[]): LevelConfig | null {
  for (const challenge of challenges) {
    if (!completedLevels.includes(challenge.id)) {
      return challenge;
    }
  }
  return null;
}

export function isLevelUnlocked(levelId: string, completedLevels: string[]): boolean {
  const challenge = challenges.find((c) => c.id === levelId);
  if (!challenge) return false;
  if (levelId === 'guardrails') return true;
  if (challenge.unlockCondition) {
    const requiredLevel = challenge.unlockCondition.replace('Complete: ', '');
    return completedLevels.includes(requiredLevel);
  }
  return true;
}

export function calculateMaxXP(): number {
  return challenges.reduce((sum, c) => {
    const total = c.xpBreakdown.reduce((s, b) => s + b.points, 0);
    return sum + total;
  }, 0);
}