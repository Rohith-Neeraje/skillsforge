import { supabase } from './supabase';
import type { LevelState } from '../types/game';

export interface ProgressData {
  levels: LevelState[];
  totalXP: number;
  badges: string[];
}

/**
 * Signs in the user anonymously (or returns existing session).
 */
export async function signInAnonymously(): Promise<string | null> {
  const { data: existingSession } = await supabase.auth.getSession();
  if (existingSession.session?.user) {
    return existingSession.session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('Anonymous sign-in failed:', error.message);
    return null;
  }
  return data.user?.id ?? null;
}

/**
 * Loads player progress from Supabase.
 */
export async function loadProgress(userId: string): Promise<ProgressData | null> {
  try {
    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('user_id', userId)
      .single();

    // Fetch progress per level
    const { data: progressRows } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId);

    // Fetch badges
    const { data: badgeRows } = await supabase
      .from('badges')
      .select('badge_id')
      .eq('user_id', userId);

    const totalXP = profile?.total_xp ?? 0;
    const badges = (badgeRows ?? []).map((b) => b.badge_id);

    // Map progress rows to LevelState
    const levels: LevelState[] = (progressRows ?? []).map((row) => ({
      levelId: row.level_id,
      completed: row.completed,
      score: row.score,
      xpEarned: row.xp_earned,
      bestSkill: row.best_skill,
      attempts: row.attempts,
    }));

    return { levels, totalXP, badges };
  } catch (err) {
    console.error('Failed to load progress:', err);
    return null;
  }
}

/**
 * Saves a level completion result to Supabase.
 */
export async function saveProgress(
  userId: string,
  levelId: string,
  completed: boolean,
  score: number,
  xpEarned: number,
  bestSkill: string | null,
  attempts: number,
): Promise<boolean> {
  try {
    const { error } = await supabase.from('progress').upsert(
      {
        user_id: userId,
        level_id: levelId,
        completed,
        score,
        xp_earned: xpEarned,
        best_skill: bestSkill,
        attempts,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, level_id' },
    );
    return !error;
  } catch (err) {
    console.error('Failed to save progress:', err);
    return false;
  }
}

/**
 * Updates the player's total XP in the profile.
 */
export async function updateTotalXP(userId: string, totalXP: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: userId,
          total_xp: totalXP,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    return !error;
  } catch (err) {
    console.error('Failed to update XP:', err);
    return false;
  }
}

/**
 * Saves an earned badge.
 */
export async function saveBadge(
  userId: string,
  badgeId: string,
  badgeName: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from('badges').upsert(
      {
        user_id: userId,
        badge_id: badgeId,
        badge_name: badgeName,
      },
      { onConflict: 'user_id, badge_id' },
    );
    return !error;
  } catch (err) {
    console.error('Failed to save badge:', err);
    return false;
  }
}