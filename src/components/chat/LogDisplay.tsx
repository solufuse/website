
import React from 'react';

interface LogDisplayProps {
  log: string[];
}

const LogDisplay: React.FC<LogDisplayProps> = ({ log }) => {
  return (
    <div className="bg-black p-4 rounded-lg h-full overflow-y-auto">
      <pre className="text-sm font-mono text-white whitespace-pre-wrap">
        {log.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </pre>
    </div>
  );
};

export default LogDisplay;
