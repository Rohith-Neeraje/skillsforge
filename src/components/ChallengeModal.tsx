import { useState } from 'react';
import { LevelConfig, EvaluationResult } from '../types/challenge';
import CodeEditor from './CodeEditor';
import ResultsPanel from './ResultsPanel';

interface ChallengeModalProps {
  level: LevelConfig;
  isCompleted: boolean;
  onSubmit: (skill: string) => Promise<EvaluationResult | null>;
  onClose: () => void;
}

export default function ChallengeModal({
  level,
  isCompleted,
  onSubmit,
  onClose,
}: ChallengeModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [skill, setSkill] = useState(level.templateHint || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (skill.trim().length < 10) return;
    setIsSubmitting(true);
    try {
      const res = await onSubmit(skill);
      if (res) {
        setResult(res);
        setSubmitted(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{
          background: 'linear-gradient(145deg, #16213e, #0f0f1a)',
          border: `1px solid ${isCompleted ? '#00ff88' : level.stationColor}40`,
          boxShadow: `0 0 40px ${isCompleted ? '#00ff88' : level.stationColor}15`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: isCompleted ? '#00ff88' : level.stationColor,
                boxShadow: `0 0 10px ${isCompleted ? '#00ff88' : level.stationColor}`,
              }}
            />
            <div>
              <h2
                className="text-lg font-bold"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  color: isCompleted ? '#00ff88' : level.stationColor,
                }}
              >
                {level.title}
              </h2>
              <p className="text-xs" style={{ color: '#8888aa' }}>
                {level.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-white/5 cursor-pointer"
            style={{ color: '#8888aa' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!submitted ? (
          <>
            {/* Story & Requirements */}
            <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                  style={{
                    background: `${level.stationColor}20`,
                    border: `2px solid ${level.stationColor}50`,
                    color: level.stationColor,
                  }}
                >
                  {level.workerName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: level.stationColor }}>
                    {level.workerName}
                  </p>
                  <p className="text-xs mb-2" style={{ color: '#8888aa' }}>
                    {level.workerTitle}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#ccddee' }}>
                    {level.story}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-sm mb-2 font-semibold" style={{ color: '#00d4ff' }}>
                  Requirements:
                </p>
                <ul className="space-y-1">
                  {level.requirements.map((req, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#aabbcc' }}>
                      <span style={{ color: '#00d4ff' }}>▸</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Code Editor */}
            <div className="mb-4">
              <div
                className="flex items-center justify-between mb-2"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#8888aa' }}
              >
                <span>Write your skill in Markdown:</span>
                <span>{skill.length} chars</span>
              </div>
              <CodeEditor
                value={skill}
                onChange={setSkill}
                placeholder="Write your AI agent skill here in Markdown..."
                stationColor={level.stationColor}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5 cursor-pointer"
                style={{ color: '#8888aa' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || skill.trim().length < 10}
                className="px-6 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-30 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${level.stationColor}, ${level.stationColor}88)`,
                  color: '#000',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Evaluating...
                  </span>
                ) : (
                  'Submit Skill'
                )}
              </button>
            </div>
          </>
        ) : (
          /* Results */
          <ResultsPanel
            result={result!}
            level={level}
            skill={skill}
            onRetry={handleRetry}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}