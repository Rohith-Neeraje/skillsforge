import { useState, useEffect } from 'react';

interface TutorialOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

const steps = [
  {
    title: 'Welcome, Skill Architect',
    content: 'You\'ve entered the SkillsForge factory. Four worker stations await — each with a unique AI agent challenge.',
    icon: '🏭',
  },
  {
    title: 'Navigate the Factory',
    content: 'Use WASD to move around the factory. Move your mouse to look around. Walk up to any glowing station.',
    icon: '⌨️',
  },
  {
    title: 'Interact & Solve',
    content: 'When you\'re close to a station, press E to interact. Read the worker\'s story, then write your AI skill in Markdown.',
    icon: '✍️',
  },
  {
    title: 'Get Evaluated',
    content: 'Submit your skill for AI-powered evaluation. Earn XP, unlock badges, and become a Master AI Architect!',
    icon: '🏆',
  },
];

export default function TutorialOverlay({ visible, onDismiss }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
  }, [visible]);

  if (!visible) return null;

  const current = steps[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="max-w-md w-full p-6 rounded-2xl"
        style={{
          background: '#16213e',
          border: '1px solid rgba(0,212,255,0.3)',
          boxShadow: '0 0 40px rgba(0,212,255,0.1)',
        }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{current.icon}</div>
          <h2
            className="text-xl font-bold mb-2"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              color: '#00d4ff',
            }}
          >
            {current.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#aabbcc' }}>
            {current.content}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i === step ? '#00d4ff' : 'rgba(255,255,255,0.15)',
                width: i === step ? '20px' : '8px',
              }}
            />
          ))}
        </div>

        <div className="flex justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5 cursor-pointer"
              style={{ color: '#8888aa' }}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.97] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #0088cc)',
                color: '#000',
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.97] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                color: '#000',
              }}
            >
              Start Playing!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}