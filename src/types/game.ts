export interface LevelState {
  levelId: string;
  completed: boolean;
  score: number;
  xpEarned: number;
  bestSkill: string | null;
  attempts: number;
}

export interface GameState {
  playerId: string | null;
  totalXP: number;
  currentLevel: number;
  levels: LevelState[];
  badges: string[];
  isLoading: boolean;
  error: string | null;
  isLocked: boolean;
  showVictory: boolean;
}