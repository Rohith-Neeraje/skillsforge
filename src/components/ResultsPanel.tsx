import { LevelConfig, EvaluationResult } from '../types/challenge';

interface ResultsPanelProps {
  result: EvaluationResult;
  level: LevelConfig;
  skill: string;
  onRetry: () => void;
  onClose: () => void;
}

export default function ResultsPanel({
  result,
  level,
  onRetry,
  onClose,
}: ResultsPanelProps) {
  const { passed, score, xpEarned, feedback, requiredElements } = result;

  return (
    <div className="space-y-4">
      {/* Score section */}
      <div
        className="p-6 rounded-xl text-center"
        style={{
          background: passed
            ? 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.02))'
            : 'linear-gradient(135deg, rgba(255,0,51,0.1), rgba(255,0,51,0.02))',
          border: `1px solid ${passed ? '#00ff88' : '#ff0033'}30`,
        }}
      >
        <div
          className="text-5xl font-bold mb-1"
          style={{
            fontFamily: 'Orbitron, sans-serif',
            color: passed ? '#00ff88' : '#ff0033',
          }}
        >
          {score}%
        </div>
        <p
          className="text-sm mb-2 font-semibold"
          style={{ color: passed ? '#00ff88' : '#ff0033' }}
        >
          {passed ? 'SKILL PASSED' : 'SKILL NEEDS IMPROVEMENT'}
        </p>
        <div
          className="text-2xl font-bold"
          style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#ff6b35',
          }}
        >
          +{xpEarned} XP
        </div>
        {passed && level.reward && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)' }}>
            <span style={{ fontSize: '20px' }}>{level.reward.icon}</span>
            <span className="text-sm font-semibold" style={{ color: '#00ff88' }}>
              {level.reward.name} Unlocked!
            </span>
          </div>
        )}
      </div>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#00ff88' }}>
            ✅ Strengths
          </h3>
          <ul className="space-y-1">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#aabbcc' }}>
                <span style={{ color: '#00ff88' }}>•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {feedback.improvements.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#ff6b35' }}>
            🔧 Areas to Improve
          </h3>
          <ul className="space-y-1">
            {feedback.improvements.map((imp, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#aabbcc' }}>
                <span style={{ color: '#ff6b35' }}>•</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Required elements */}
      <div className="grid grid-cols-2 gap-3">
        {requiredElements.found.length > 0 && (
          <div className="p-3 rounded-lg" style={{ background: 'rgba(0,255,136,0.05)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#00ff88' }}>Found</p>
            <ul className="space-y-0.5">
              {requiredElements.found.map((el, i) => (
                <li key={i} className="text-xs flex items-center gap-1" style={{ color: '#88ccaa' }}>
                  <span>✓</span> {el}
                </li>
              ))}
            </ul>
          </div>
        )}
        {requiredElements.missing.length > 0 && (
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255,0,51,0.05)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#ff0033' }}>Missing</p>
            <ul className="space-y-0.5">
              {requiredElements.missing.map((el, i) => (
                <li key={i} className="text-xs flex items-center gap-1" style={{ color: '#cc8888' }}>
                  <span>✗</span> {el}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Hints */}
      {feedback.hints && (
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.2)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#ff6b35' }}>
            💡 Hint
          </p>
          <p className="text-sm" style={{ color: '#ccb088' }}>
            {feedback.hints}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5 cursor-pointer"
          style={{ color: '#8888aa' }}
        >
          {passed ? 'Back to Factory' : 'Skip for Now'}
        </button>
        {!passed && (
          <button
            onClick={onRetry}
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.97] cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${level.stationColor}, ${level.stationColor}88)`,
              color: '#000',
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}