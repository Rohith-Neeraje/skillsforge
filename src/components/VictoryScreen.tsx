import { GameState } from '../types/game';
import { challenges } from '../data/challenges';
import { calculateMaxXP } from '../utils/xpCalculator';

interface VictoryScreenProps {
  gameState: GameState;
  onReplay: () => void;
}

export default function VictoryScreen({ gameState, onReplay }: VictoryScreenProps) {
  const { totalXP, levels, badges } = gameState;
  const maxXP = calculateMaxXP();
  const completedCount = levels.filter((l) => l.completed).length;
  const allCompleted = completedCount === levels.length;

  if (!allCompleted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.98) 100%)',
      }}
    >
      <div className="text-center max-w-lg">
        {/* Decorative top */}
        <div className="mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="inline-block text-2xl animate-bounce"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1s',
              }}
            >
              🏆
            </span>
          ))}
        </div>

        <h1
          className="text-4xl font-bold mb-2"
          style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#00ff88',
            textShadow: '0 0 30px rgba(0,255,136,0.3)',
          }}
        >
          MASTER ARCHITECT
        </h1>

        <p
          className="text-lg mb-6"
          style={{
            color: '#f0f0f0',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          You've completed all 4 challenges!
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            <div className="text-2xl font-bold" style={{ color: '#00d4ff', fontFamily: 'Orbitron, sans-serif' }}>
              {totalXP}
            </div>
            <div className="text-xs" style={{ color: '#8888aa' }}>Total XP</div>
            <div className="text-xs" style={{ color: '#555577' }}>of {maxXP} max</div>
          </div>

          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}
          >
            <div className="text-2xl font-bold" style={{ color: '#00ff88', fontFamily: 'Orbitron, sans-serif' }}>
              {levels.length}
            </div>
            <div className="text-xs" style={{ color: '#8888aa' }}>Levels</div>
            <div className="text-xs" style={{ color: '#555577' }}>Completed</div>
          </div>

          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.2)' }}
          >
            <div className="text-2xl font-bold" style={{ color: '#ff6b35', fontFamily: 'Orbitron, sans-serif' }}>
              {badges.length}
            </div>
            <div className="text-xs" style={{ color: '#8888aa' }}>Badges</div>
            <div className="text-xs" style={{ color: '#555577' }}>Earned</div>
          </div>
        </div>

        {/* Badges earned */}
        <div className="mb-8">
          <p className="text-sm font-semibold mb-3" style={{ color: '#8888aa' }}>
            Badges & Rewards
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {badges.map((badgeId) => {
              const challenge = challenges.find((c) => c.id === badgeId);
              if (!challenge) return null;
              return (
                <div
                  key={badgeId}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}
                >
                  <span style={{ fontSize: '18px' }}>{challenge.reward.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: '#00ff88' }}>
                    {challenge.reward.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate */}
        <div
          className="p-6 rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(0,255,136,0.05))',
            border: '2px solid rgba(0,212,255,0.3)',
          }}
        >
          <h2
            className="text-lg font-bold mb-2"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              color: '#00d4ff',
            }}
          >
            🏆 Certificate of Mastery
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#aabbcc' }}>
            This certifies that you have demonstrated proficiency in all four pillars of AI agent skill architecture:
            guardrails enforcement, dynamic variable handling, brand voice control, and chained workflow management.
          </p>
          <p className="text-xs mt-3" style={{ color: '#00ff88' }}>
            You are officially a Master AI Architect.
          </p>
        </div>

        {/* Replay */}
        <button
          onClick={onReplay}
          className="px-8 py-3 rounded-xl text-base font-semibold transition-all active:scale-[0.97] cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #00d4ff, #0088cc)',
            color: '#000',
            fontFamily: 'Orbitron, sans-serif',
            boxShadow: '0 0 30px rgba(0,212,255,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 50px rgba(0,212,255,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0,212,255,0.3)';
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}