
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="bg-gray-900 min-h-screen p-8 text-gray-200 font-sans" style={{
      background: 'linear-gradient(135deg, rgba(10, 20, 40, 0.95), rgba(40, 10, 20, 0.95)), radial-gradient(circle at top left, rgba(255, 0, 0, 0.1), transparent 30%), radial-gradient(circle at bottom right, rgba(0, 0, 255, 0.1), transparent 30%)',
      backgroundBlendMode: 'screen'
    }}>
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">Solufuse</h1>
          <p className="text-xl text-gray-400">Project Release Notes - January 2026</p>
        </header>

        <nav className="flex justify-center space-x-4 mb-12">
          <Link to="/chats" className="text-white hover:text-red-400 transition-colors duration-300">Chat</Link>
          <Link to="/chats-old" className="text-white hover:text-blue-400 transition-colors duration-300">Legacy Chat</Link>
          <Link to="/ws-test" className="text-white hover:text-green-400 transition-colors duration-300">WebSocket Test</Link>
        </nav>

        <main className="space-y-16">
          {/* Page 1: NFC 13-200 Calculations */}
          <section className="bg-gray-800 bg-opacity-50 p-8 rounded-lg shadow-lg" style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2), 0 0 15px rgba(0, 0, 255, 0.2)' }}>
            <div className="A4-page">
              <h2 className="text-3xl font-semibold text-red-400 border-b-2 border-red-400 pb-2 mb-6">NFC 13-200 Standard: Cable Calculations</h2>
              <div className="space-y-4">
                <p>We are proud to announce the full integration of the <strong className="font-bold">NFC 13-200</strong> standard calculations. This major update allows users to accurately size cables for high-voltage electrical installations in France.</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Automated calculation of cable cross-sections.</li>
                  <li>Consideration of installation conditions and correction factors.</li>
                  <li>Verification of voltage drop and short-circuit withstand.</li>
                  <li>Generation of detailed calculation reports.</li>
                </ul>
                <p>This feature aims to simplify the engineering process and ensure regulatory compliance for your projects.</p>
              </div>
            </div>
          </section>

          {/* Page 2: ETAP Topology & Short-Circuit */}
          <section className="bg-gray-800 bg-opacity-50 p-8 rounded-lg shadow-lg" style={{ boxShadow: '0 0 15px rgba(0, 0, 255, 0.2), 0 0 15px rgba(255, 0, 0, 0.2)' }}>
            <div className="A4-page">
              <h2 className="text-3xl font-semibold text-blue-400 border-b-2 border-blue-400 pb-2 mb-6">Advanced ETAP File Analysis</h2>
              <div className="space-y-4">
                <p>Solufuse can now interact directly with your <strong className="font-bold">ETAP</strong> project files to extract crucial information and perform complex analyses.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-blue-300 mb-2">Topology Definition</h3>
                    <p>Import your ETAP files to automatically visualize and validate your electrical network topology. Our tool identifies connections, equipment, and configurations to give you a clear and quick overview.</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-blue-300 mb-2">Short-Circuit Current Calculation</h3>
                    <p>Determine the short-circuit currents (Isc) at different points in your installation. Solufuse analyzes data from your ETAP files to provide accurate results, essential for sizing protection devices and ensuring installation safety.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Page 3: Documentation and Links */}
          <section className="bg-gray-800 bg-opacity-50 p-8 rounded-lg shadow-lg text-center" style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2), 0 0 15px rgba(0, 0, 255, 0.2)' }}>
            <div className="A4-page">
              <h2 className="text-3xl font-semibold text-gray-300 border-b-2 border-gray-400 pb-2 mb-6">Resources and Documentation</h2>
              <p className="mb-6">To learn more about these new features and how to use Solufuse, please refer to our comprehensive documentation.</p>
              <a 
                href="https://docs.solufuse.com" // Placeholder link
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 inline-block"
              >
                View Documentation
              </a>
            </div>
          </section>
        </main>

        <footer className="text-center mt-16 text-gray-500">
          <p>&copy; 2026 Solufuse. All rights reserved.</p>
          <p className="mt-2">
            <a href="https://solufuse.com" className="hover:text-red-400 transition">solufuse.com</a> | 
            <a href="https://api.solufuse.com" className="hover:text-blue-400 transition"> API</a>
          </p>
        </footer>
      </div>

      <style>{`
        .A4-page {
          background: rgba(10, 10, 20, 0.4);
          padding: 2rem;
          margin: 0 auto;
          box-shadow: 0 0 0.5cm rgba(0,0,0,0.5);
          min-height: 29.7cm; /* A4 Height */
          max-width: 21cm; /* A4 Width */
          display: flex;
          flex-direction: column;
        }
        @media print {
          body {
            background: none;
          }
          .A4-page {
            box-shadow: none;
            margin: 0;
            height: auto;
          }
          section {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
