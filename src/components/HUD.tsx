import { GameState } from '../types/game';
import { calculateLevelProgress } from '../utils/xpCalculator';

interface HUDProps {
  gameState: GameState;
  isLocked: boolean;
  hasStarted: boolean;
  onStart: () => void;
  onLockToggle: () => void;
}

export default function HUD({
  gameState,
  isLocked,
  hasStarted,
  onStart,
  onLockToggle,
}: HUDProps) {
  const { totalXP, levels, badges } = gameState;
  const progress = calculateLevelProgress(totalXP);
  const completedCount = levels.filter((l) => l.completed).length;
  const totalLevels = levels.length;

  // Start overlay before first lock
  if (!hasStarted) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(40,20,10,0.95) 0%, rgba(10,5,3,0.98) 100%)',
        }}
      >
        <div className="text-center max-w-lg px-8">
          <h1
            className="text-5xl font-bold mb-3 tracking-wider"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              color: '#ff7733',
              textShadow: '0 0 20px rgba(255,119,51,0.3)',
            }}
          >
            SkillsForge
          </h1>
          <p className="text-lg mb-2" style={{ color: '#e8d5b0', fontFamily: 'JetBrains Mono, monospace' }}>
            The Skill Architect Academy
          </p>
          <p className="text-sm mb-8" style={{ color: '#998877' }}>
            Master the art of AI agent skill writing in an immersive 3D world
          </p>

          {/* Warm-themed decorative divider */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #ff7733)' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#ffaa44', boxShadow: '0 0 8px #ffaa44' }} />
            <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #ff7733, transparent)' }} />
          </div>

          <div className="space-y-3 mb-10 text-left inline-block" style={{ color: '#bba88a', fontSize: '14px' }}>
            <p>✦ <strong style={{ color: '#ff8833' }}>Explore</strong> the ancient world — 4 stations await</p>
            <p>✦ <strong style={{ color: '#ff6633' }}>Solve</strong> real-world AI agent challenges</p>
            <p>✦ <strong style={{ color: '#ffcc44' }}>Earn</strong> XP, badges, and become a Master AI Architect</p>
          </div>
          <button
            onClick={onStart}
            className="px-10 py-4 rounded-xl text-lg font-semibold tracking-wider transition-all active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #ff7733, #cc4400)',
              color: '#1a0a00',
              fontFamily: 'Orbitron, sans-serif',
              boxShadow: '0 0 30px rgba(255,119,51,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 50px rgba(255,119,51,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255,119,51,0.3)';
            }}
          >
            ENTER THE WILDERNESS
          </button>
          <p className="mt-4 text-xs" style={{ color: '#554433' }}>
            WASD to move · Mouse to look · E to interact
          </p>
        </div>
      </div>
    );
  }

  // Mini HUD when playing
  if (isLocked) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="flex justify-between items-start p-4">
          {/* Left: XP */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold tracking-wider"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  color: '#ff8833',
                }}
              >
                LV.{progress.level}
              </span>
              <span className="text-xs" style={{ color: '#998877' }}>
                {totalXP} XP
              </span>
            </div>
            <div
              className="h-2 w-32 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress.progress}%`,
                  background: 'linear-gradient(90deg, #ff7733, #ffcc44)',
                }}
              />
            </div>
          </div>

          {/* Right: progress */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalLevels }).map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    background: i < completedCount ? '#ffcc44' : i === completedCount ? '#ff7733' : 'rgba(255,255,255,0.1)',
                    boxShadow: i < completedCount ? '0 0 6px rgba(255,204,68,0.5)' : 'none',
                  }}
                />
              ))}
              <span
                className="text-xs ml-2"
                style={{ color: '#998877', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {completedCount}/{totalLevels}
              </span>
            </div>
            {badges.length > 0 && (
              <p className="text-xs mt-1" style={{ color: '#ffcc44' }}>
                ★ {badges.length} badge{badges.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Center crosshair */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative w-6 h-6">
            <div
              className="absolute top-1/2 left-0 w-full h-px"
              style={{ background: 'rgba(255,200,150,0.12)' }}
            />
            <div
              className="absolute left-1/2 top-0 h-full w-px"
              style={{ background: 'rgba(255,200,150,0.12)' }}
            />
            <div
              className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: 'rgba(255,200,150,0.25)' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Minimized HUD when paused (not locked)
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={onLockToggle}
        className="px-6 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] cursor-pointer"
        style={{
          background: 'rgba(255,119,51,0.15)',
          border: '1px solid #ff7733',
          color: '#ff7733',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        CLICK TO CONTINUE
      </button>
    </div>
  );
}