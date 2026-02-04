
import React from 'react';

interface LogDisplayProps {
  log: string[];
}

const LogDisplay: React.FC<LogDisplayProps> = ({ log }) => {
  return (
    <pre className="text-sm font-mono text-white whitespace-pre-wrap">
      {log.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </pre>
  );
};

export default LogDisplay;
