
import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import { useAuthContext } from '@/context/authcontext';
import { useProjectContext } from '@/context/ProjectContext';
import { getApiKey } from '@/utils/apiKeyManager';

const SettingsDialog = lazy(() => import('@/components/chat/SettingsDialog'));
const ProfileDialog = lazy(() => import('@/components/user/ProfileDialog'));

const WebSocketTestPage = () => {
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState('Disconnected');
  const ws = useRef<WebSocket | null>(null);

  const { user, loginWithGoogle, logout, updateUsername } = useAuthContext();
  const { currentProject } = useProjectContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const addLog = (text: string) => {
    console.log(text);
    setLog(prev => [...prev, text]);
  };

  const connect = () => {
    if (!chatId) {
      addLog('--- Chat ID is required ---');
      return;
    }

    addLog('--- Attempting to connect... ---');
    const wsUrl = `wss://api.solufuse.com/v2/chats/ws/${chatId}`;
    
    const apiKey = getApiKey();
    if (!apiKey) {
        addLog('--- API Key not found in localStorage. Please add it in settings. ---');
    }

    const finalUrl = apiKey ? `${wsUrl}?apiKey=${apiKey}` : wsUrl;
    addLog(`Connecting to: ${finalUrl}`)

    ws.current = new WebSocket(finalUrl);

    ws.current.onopen = () => {
      setStatus('Connected');
      addLog('--- Connection Opened ---');
    };

    ws.current.onclose = (event) => {
      setStatus('Disconnected');
      addLog(`--- Connection Closed (Code: ${event.code}) ---`);
    };

    ws.current.onerror = (event) => {
      addLog(`--- ERROR: ${JSON.stringify(event)} ---`);
    };

    ws.current.onmessage = (event) => {
      addLog(`[SERVER]: ${event.data}`);
    };
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      addLog(`[CLIENT]: ${message}`);
      ws.current.send(message);
      setMessage('');
    } else {
      addLog('--- Not connected --- ');
    }
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const loadingComponent = <div className="loading-overlay">Loading...</div>;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
            user={user}
            onToggleSettings={() => setIsSettingsOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)} 
            onLogin={loginWithGoogle}
            onLogout={logout}
            currentProject={currentProject}
        />
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">WebSocket Test Page</h1>
          <div className="bg-gray-800 p-4 rounded-lg mb-4">
            <p className="font-mono">Status: <span className={status === 'Connected' ? 'text-green-500' : 'text-red-500'}>{status}</span></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            <input
              type="text"
              placeholder="Chat ID"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div className="flex gap-4 mb-4">
            <button onClick={connect} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Connect
            </button>
            <button onClick={disconnect} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Disconnect
            </button>
          </div>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-grow p-2 rounded bg-gray-700 text-white"
            />
            <button onClick={sendMessage} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Send
            </button>
          </div>
          <div className="bg-black p-4 rounded-lg h-96 overflow-y-auto">
            <pre className="text-sm font-mono text-white">{
              log.map((line, index) => <p key={index}>{line}</p>)
            }</pre>
          </div>
        </div>
        <Suspense fallback={loadingComponent}>
            {isSettingsOpen && <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
             {user && isProfileOpen && (
                <ProfileDialog
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    onSave={updateUsername}
                    currentUsername={user.username}
                />
            )}
        </Suspense>
      </div>
    </div>
  );
};

export default WebSocketTestPage;
