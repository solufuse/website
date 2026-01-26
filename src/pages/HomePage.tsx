
import React from 'react';
import { Link } from 'react-router-dom';

const SolufuseLogo = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
    <path d="M62.5 12.5H37.5L25 43.75H43.75L31.25 68.75L75 31.25H50L62.5 12.5Z" className="stroke-red-500" strokeWidth="5" strokeLinejoin="round" />
    <path d="M62.5 12.5H37.5L25 43.75H43.75L31.25 68.75L75 31.25H50L62.5 12.5Z" className="stroke-blue-500" strokeWidth="5" strokeLinejoin="round" style={{ strokeDasharray: '150', strokeDashoffset: '150', animation: 'draw 2s ease-in-out forwards' }} />
  </svg>
);


const HomePage: React.FC = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-sans" style={{
      background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)'
    }}>
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <header className="text-center py-20">
          <SolufuseLogo />
          <h1 className="text-6xl font-extrabold text-white tracking-tighter">
            Solufuse
          </h1>
          <p className="mt-3 text-2xl font-semibold text-red-400">
            ELECTRICAL ENGINEERING, SIMPLIFIED.
          </p>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400">
            From NFC 13-200 calculations to complex ETAP file analysis, Solufuse provides the tools you need to streamline your workflow and ensure project accuracy.
          </p>
          <nav className="flex justify-center items-center gap-6 mt-10">
            <Link to="/chats" className="text-lg text-gray-300 hover:text-red-400 transition-colors">Chat</Link>
            <Link to="/chats-old" className="text-lg text-gray-300 hover:text-blue-400 transition-colors">Legacy Chat</Link>
            <Link to="/ws-test" className="text-lg text-gray-300 hover:text-green-400 transition-colors">WebSocket Test</Link>
          </nav>
        </header>

        <main className="pb-20">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">Core Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: NFC 13-200 */}
            <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 shadow-lg backdrop-blur-sm">
              <h3 className="text-2xl font-semibold text-red-400 mb-4">NFC 13-200 Cable Calculations</h3>
              <p className="text-gray-400">
                Full integration of NFC 13-200 standard for precise high-voltage cable sizing. Automate cross-section calculations, verify voltage drop, and generate detailed reports to ensure regulatory compliance.
              </p>
            </div>

            {/* Feature 2: ETAP Analysis */}
            <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 shadow-lg backdrop-blur-sm">
              <h3 className="text-2xl font-semibold text-blue-400 mb-4">Advanced ETAP File Analysis</h3>
              <p className="text-gray-400">
                Directly import and analyze ETAP project files. Automatically define and validate your network topology, and calculate short-circuit currents (Isc) for robust protection and safety sizing.
              </p>
            </div>
          </div>

          <div className="text-center mt-20">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Dive Deeper?</h2>
            <p className="text-gray-400 mb-8">Explore our documentation to learn more about our features.</p>
            <a 
              href="https://docs.solufuse.com"
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 inline-block"
            >
              View Documentation
            </a>
          </div>
        </main>
        
        <footer className="text-center py-8 mt-16 text-gray-500 border-t border-gray-800">
          <p>Built by Solufuse, a space electrical AI with a soul.</p>
          <p className="mt-2 text-sm">
            <a href="https://solufuse.com" className="hover:text-red-400 transition">solufuse.com</a> | 
            <a href="https://api.solufuse.com" className="hover:text-blue-400 transition"> API</a>
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
