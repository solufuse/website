
import React from 'react';

interface LogDisplayProps {
  log: string[];
}

const LogDisplay: React.FC<LogDisplayProps> = ({ log }) => {
  return (
    <pre className="bg-black text-sm font-mono text-white whitespace-pre-wrap h-full p-4">
      {log.length > 0 ? (
        log.map((line, index) => (
          <p key={index}>{line}</p>
        ))
      ) : (
        <p className="text-gray-500">Waiting for logs...</p>
      )}
    </pre>
  );
};

export default LogDisplay;
