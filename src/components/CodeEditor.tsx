interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  stationColor: string;
}

export default function CodeEditor({
  value,
  onChange,
  placeholder,
  stationColor,
}: CodeEditorProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="code-editor w-full min-h-[250px] p-4 rounded-xl text-sm leading-relaxed resize-y focus:outline-none transition-all"
        style={{
          background: '#0a0a14',
          color: '#ccddee',
          fontFamily: 'JetBrains Mono, monospace',
          border: `1px solid ${stationColor}30`,
          caretColor: stationColor,
          lineHeight: '1.6',
        }}
        spellCheck={false}
      />
      <div
        className="absolute bottom-3 right-3 text-[10px] px-2 py-0.5 rounded"
        style={{
          background: 'rgba(0,0,0,0.5)',
          color: '#555577',
          fontFamily: 'JetBrains Mono, monospace',
          pointerEvents: 'none',
        }}
      >
        {value.split('\n').length} lines
      </div>
    </div>
  );
}