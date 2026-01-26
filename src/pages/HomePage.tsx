
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// A simple component to render a line in the terminal
const TerminalLine: React.FC<{ children: React.ReactNode; isUser?: boolean }> = ({ children, isUser }) => (
  <div className={`flex items-start ${isUser ? 'text-green-400' : 'text-gray-300'}`}>
    {isUser && <span className="flex-shrink-0 mr-2">{'>'}</span>}
    <div className="flex-grow">{children}</div>
  </div>
);

const report = `
+-------------------------------------------+
| CABLE CALCULATION REPORT (NFC 13-200)     |
+-------------------------------------------+
|                                           |
| POWER (P)      : 85 MVA                   |
| VOLTAGE (U)    : 33 kV                    |
| CURRENT (I)    : 1487 A                   |
| LENGTH         : 100 m                    |
| CORE           : COPPER                   |
| INSTALL. METHOD: 7 (Table C.52.1)         |
|                                           |
| ...calculations in progress...            |
|                                           |
| CALCULATED SECTION: 2x(3x240mm²) per phase|
| VOLTAGE DROP   : 0.42% (OK)               |
|                                           |
+-------------------------------------------+
`;

const conversation = [
  { text: 'calculate a cable for 85MVA, 33kV', isUser: true, delay: 1000 },
  { text: 'Of course. For an accurate calculation according to the NFC 13-200 standard, I need the following information:', isUser: false, delay: 1500 },
  { text: (
      <ul className="list-disc list-inside pl-4 text-blue-400">
        <li>Current (A) or Power (kVA/MVA)</li>
        <li>Voltage (V/kV)</li>
        <li>Cable length (m)</li>
        <li>Core type (Copper/Alu)</li>
        <li>Installation method (e.g., buried, on cable tray...)</li>
      </ul>
    ), isUser: false, delay: 2000 },
  { text: 'P=85MVA, U=33kV, L=100m, Cu, Installation method 7 (on perforated cable tray)', isUser: true, delay: 3500 },
  { text: 'Perfect. Starting cable cross-section calculation...', isUser: false, delay: 1500 },
  { text: <pre className="text-yellow-300 whitespace-pre-wrap">{report}</pre>, isUser: false, delay: 2000 },
];

const HomePage: React.FC = () => {
  const [lines, setLines] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const addLine = (index: number) => {
      if (index < conversation.length) {
        const { text, isUser, delay } = conversation[index];
        timeout = setTimeout(() => {
          setLines(prev => [...prev, <TerminalLine key={index} isUser={isUser}>{text}</TerminalLine>]);
          addLine(index + 1);
        }, delay);
      }
    };

    addLine(0);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="bg-black min-h-screen p-4 sm:p-8 font-mono text-lg flex flex-col justify-center">
      <div className="w-full max-w-4xl mx-auto bg-[#1a1b26] rounded-lg shadow-2xl overflow-hidden border border-gray-700">
        {/* Terminal Header */}
        <div className="flex items-center justify-between p-3 bg-[#333] border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-500"></span>
            <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
            <span className="w-4 h-4 rounded-full bg-green-500"></span>
          </div>
          <p className="text-gray-400 text-sm">Solufuse AI - Terminal</p>
          <div></div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 h-auto min-h-[60vh] overflow-y-auto space-y-2">
          {lines}
          <div className="flex items-center">
            <span className="text-green-400 mr-2">{'>'}</span>
            <span className="bg-green-400 w-2 h-5 animate-pulse"></span>
          </div>
        </div>
      </div>
      <footer className="text-center py-4 mt-4 text-gray-500 text-sm">
        <p>This is a simulation. Navigate to the application pages:</p>
        <nav className="flex justify-center items-center gap-4 mt-2">
            <Link to="/chats" className="text-blue-400 hover:underline">Chat</Link>
            <span className="text-gray-600">|</span>
            <Link to="/chats-old" className="text-blue-400 hover:underline">Legacy Chat</Link>
            <span className="text-gray-600">|</span>
            <Link to="/ws-test" className="text-blue-400 hover:underline">WebSocket Test</Link>
        </nav>
        <p className="mt-4">Built by Solufuse, a space electrical AI with a soul.</p>
      </footer>
    </div>
  );
};

export default HomePage;
