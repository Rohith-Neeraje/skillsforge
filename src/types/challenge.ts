export interface EvaluationCriteria {
  requiredHeaders: string[];
  requiredPatterns: string[];
  prohibitedPatterns: string[];
  minLength: number;
  maxLength: number;
  customValidation: string;
}

export interface XpBreakdown {
  label: string;
  points: number;
  check: 'header' | 'pattern' | 'prohibited' | 'custom';
  value?: string;
}

export interface FailCondition {
  reason: string;
  check: 'prohibited' | 'missing' | 'custom';
  value?: string;
}

export interface Reward {
  type: 'badge' | 'title' | 'template' | 'certificate' | 'library';
  id: string;
  name: string;
  icon: string;
  description: string;
}

export type CharacterType = 'professional-f' | 'analyst-m' | 'creative-f' | 'executive-m';

export interface LevelConfig {
  id: string;
  title: string;
  subtitle: string;
  workerName: string;
  workerTitle: string;
  characterType: CharacterType;
  stationColor: string;
  stationPosition: [number, number, number];
  story: string;
  challengeDescription: string;
  requirements: string[];
  templateHint: string;
  evaluationCriteria: EvaluationCriteria;
  xpBreakdown: XpBreakdown[];
  failConditions: FailCondition[];
  reward: Reward;
  unlockCondition?: string;
}

export interface EvaluationFeedback {
  strengths: string[];
  improvements: string[];
  hints: string;
}

export interface EvaluationResult {
  score: number;
  xpEarned: number;
  passed: boolean;
  feedback: EvaluationFeedback;
  requiredElements: {
    found: string[];
    missing: string[];
  };
}

export type ViewState = 'playing' | 'challenge' | 'results' | 'victory';