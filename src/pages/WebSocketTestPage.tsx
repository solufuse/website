
import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import { useAuthContext } from '@/context/authcontext';
import { useProjectContext } from '@/context/ProjectContext';
import { getApiKey } from '@/utils/apiKeyManager';
import ChatWebSocket from '@/api/chat_ws'; // Import the new WebSocket manager

const SettingsDialog = lazy(() => import('@/components/chat/SettingsDialog'));
const ProfileDialog = lazy(() => import('@/components/user/ProfileDialog'));

const WebSocketTestPage = () => {
  const [chatId, setChatId] = useState('');
  const [projectId, setProjectId] = useState(''); // Added for the new URL structure
  const [message, setMessage] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState('Disconnected');
  const wsClient = useRef<ChatWebSocket | null>(null);

  const { user, loginWithGoogle, logout, updateUsername } = useAuthContext();
  const { currentProject } = useProjectContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // If there is a current project, set the projectId for the test page
    if (currentProject) {
      setProjectId(currentProject.id);
    }
  }, [currentProject]);

  const addLog = (text: string) => {
    console.log(text);
    setLog(prev => [...prev, text]);
  };

  const connect = async () => {
    if (!chatId || !projectId) {
      addLog('--- Project ID and Chat ID are required ---');
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      addLog('--- API Key not found. Please add it via the settings dialog. ---');
      return;
    }

    // Disconnect previous connection if any
    if (wsClient.current) {
      wsClient.current.close();
    }

    addLog(`--- Attempting to connect (Project: ${projectId}, Chat: ${chatId}) ---`);
    wsClient.current = new ChatWebSocket(projectId, chatId, apiKey);

    wsClient.current.on('status', (newStatus: string) => {
        setStatus(newStatus);
        addLog(`Status: ${newStatus}`);
    });

    wsClient.current.on('open', () => {
        addLog('--- Connection Opened and Authenticated ---');
    });

    wsClient.current.on('message', (data: string) => {
        addLog(`[SERVER]: ${data}`);
    });

    wsClient.current.on('error', (error: Error) => {
        addLog(`--- ERROR: ${error.message} ---`);
    });

    wsClient.current.on('close', (event: CloseEvent) => {
        addLog(`--- Connection Closed (Code: ${event.code}) ---`);
    });
    
    wsClient.current.on('end', () => {
        addLog('--- <<END_OF_STREAM>> ---');
    });

    try {
      await wsClient.current.connect();
    } catch (error: any) {
      addLog(`--- Connection failed: ${error.message} ---`);
    }
  };

  const disconnect = () => {
    if (wsClient.current) {
      wsClient.current.close();
    }
  };

  const sendMessage = () => {
    if (wsClient.current) {
      addLog(`[CLIENT]: ${message}`);
      wsClient.current.sendMessage(message);
      setMessage('');
    } else {
      addLog('--- Not connected --- ');
    }
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (wsClient.current) {
        wsClient.current.close();
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
            <p className="font-mono">Status: <span className={status === 'connected' ? 'text-green-500' : 'text-red-500'}>{status}</span></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <input
              type="text"
              placeholder="Project ID (auto-filled from current project)"
              value={projectId}
              readOnly // It's better to use the project from the context
              className="p-2 rounded bg-gray-600 text-white cursor-not-allowed"
            />
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
