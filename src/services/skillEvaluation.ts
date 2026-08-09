import { LevelConfig, EvaluationResult } from '../types/challenge';
import { supabase } from './supabase';

/**
 * Evaluates a skill by calling the Supabase Edge Function.
 * Falls back to local regex evaluation if the Edge Function is unavailable.
 */

// Simple regex-based fallback evaluation
function localFallbackEvaluation(skill: string, level: LevelConfig): EvaluationResult {
  const criteria = level.evaluationCriteria;
  const foundElements: string[] = [];
  const missingElements: string[] = [];
  const strengths: string[] = [];
  const improvements: string[] = [];

  let score = 0;
  let totalPossible = 0;

  for (const xp of level.xpBreakdown) {
    totalPossible += xp.points;

    switch (xp.check) {
      case 'header': {
        const headers = xp.value?.split('||') || [];
        const headerFound = headers.some((h) => skill.includes(h));
        if (headerFound) {
          score += xp.points;
          foundElements.push(xp.label);
          strengths.push(`✓ ${xp.label}`);
        }
        break;
      }
      case 'pattern': {
        const patterns = xp.value?.split('||') || [];
        const patternFound = patterns.some((p) => new RegExp(p, 'i').test(skill));
        if (patternFound) {
          score += xp.points;
          foundElements.push(xp.label);
          strengths.push(`✓ ${xp.label}`);
        }
        break;
      }
      case 'prohibited': {
        const patterns = xp.value?.split('||') || [];
        const hasProhibited = patterns.some((p) => new RegExp(p, 'i').test(skill));
        if (!hasProhibited) {
          score += xp.points;
          foundElements.push(xp.label);
          strengths.push('✓ No prohibited language detected');
        }
        break;
      }
      case 'custom': {
        const keywords = ['step', 'rule', 'if', 'then', 'else', 'escalation', 'approval', 'limit', 'cap', 'max', 'minimum', 'require'];
        const keywordCount = keywords.filter((k) => skill.toLowerCase().includes(k)).length;
        if (keywordCount >= 3) {
          score += xp.points * 0.5;
        }
        break;
      }
    }
  }

  // Check fail conditions
  for (const fail of level.failConditions) {
    if (fail.check === 'prohibited' && fail.value) {
      const patterns = fail.value.split('|');
      const hasProhibited = patterns.some((p) => new RegExp(p, 'i').test(skill));
      if (hasProhibited) {
        score = Math.min(score, 30);
        missingElements.push(`❌ ${fail.reason}`);
      }
    }
    if (fail.check === 'missing' && fail.value) {
      const patterns = fail.value.split('|');
      const hasRequired = patterns.some((p) => new RegExp(p, 'i').test(skill));
      if (!hasRequired) {
        score = Math.min(score, 20);
        missingElements.push(`❌ ${fail.reason}`);
      }
    }
  }

  // Check length
  if (skill.length < criteria.minLength) {
    improvements.push(`Your skill is too short (${skill.length} chars). Minimum is ${criteria.minLength} characters.`);
  }
  if (skill.length > criteria.maxLength) {
    improvements.push(`Your skill is too long (${skill.length} chars). Maximum is ${criteria.maxLength} characters.`);
  }

  const percentage = Math.round((score / Math.max(totalPossible, 1)) * 100);
  const cappedScore = Math.min(100, Math.max(0, percentage));
  const maxLevelXP = level.xpBreakdown.reduce((sum, x) => sum + x.points, 0);
  const xpEarned = Math.round((cappedScore / 100) * maxLevelXP);
  const passed = cappedScore >= 50;

  if (!passed && improvements.length === 0) {
    improvements.push('Try adding more structure with clear Markdown headers and explicit rules.');
  }

  return {
    score: cappedScore,
    xpEarned,
    passed,
    feedback: {
      strengths,
      improvements,
      hints: passed
        ? 'Great work! You can always refine your skill for a higher score.'
        : 'Review the requirements and try adding the missing elements listed above.',
    },
    requiredElements: {
      found: foundElements,
      missing: missingElements,
    },
  };
}

export async function evaluateSkill(
  skill: string,
  level: LevelConfig,
  userId?: string,
): Promise<EvaluationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('evaluate-skill', {
      body: {
        level: level.id,
        skillContent: skill,
        userId: userId || 'anonymous',
      },
    });

    if (error) {
      console.warn('Edge Function error, falling back to local eval:', error.message);
      return localFallbackEvaluation(skill, level);
    }

    if (!data || typeof data.score !== 'number') {
      console.warn('Invalid Edge Function response, falling back to local eval');
      return localFallbackEvaluation(skill, level);
    }

    return data as EvaluationResult;
  } catch (err) {
    console.warn('Failed to call Edge Function, falling back to local eval:', err);
    return localFallbackEvaluation(skill, level);
  }
}