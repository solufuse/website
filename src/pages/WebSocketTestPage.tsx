
import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthContext } from '@/context/authcontext';
import { useProjectContext } from '@/context/ProjectContext';
import { useChatContext } from '@/context/ChatContext';
import { getApiKey } from '@/utils/apiKeyManager';
import ChatWebSocket from '@/api/chat_ws';
import { createChat as apiCreateChat } from '@/api/chat';

const SettingsDialog = lazy(() => import('@/components/chat/SettingsDialog'));
const ProfileDialog = lazy(() => import('@/components/user/ProfileDialog'));

interface Conversation {
    id: string;
    name: string;
    owner?: string;
}

const WebSocketTestPage = () => {
  const [chatId, setChatId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [message, setMessage] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState('Disconnected');
  const wsClient = useRef<ChatWebSocket | null>(null);

  const { user, loginWithGoogle, logout, updateUsername } = useAuthContext();
  const { currentProject } = useProjectContext();
  const { 
    chats,
    activeChat,
    activeChatId,
    deleteChat,
    loadChats,
    setActiveChatId
  } = useChatContext();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setProjectId(currentProject.id);
      loadChats(currentProject.id);
    } else {
        setProjectId('');
    }
  }, [currentProject, loadChats]);

  useEffect(() => {
    if (activeChat) {
      setChatId(activeChat.short_id);
    } else {
      setChatId('');
    }
  }, [activeChat]);

  const addLog = (text: string) => {
    console.log(text);
    setLog(prev => [...prev, text]);
  };

  const handleNewConversation = async () => {
    if (!currentProject) {
        addLog("Cannot create chat without a project.");
        return;
    }
    const apiKey = getApiKey(); // This is for the old REST API, not the WebSocket
    if (!apiKey) {
        addLog("API Key not found for REST operation.");
        return;
    }

    setIsCreating(true);
    try {
        const newChat = await apiCreateChat(currentProject.id, { title: "New Test Chat", api_key: apiKey });
        await loadChats(currentProject.id);
        setActiveChatId(newChat.short_id);
    } catch (error: any) {
        addLog(`Error creating new chat: ${error.message}`);
    } finally {
        setIsCreating(false);
    }
  };

  const connect = async () => {
    if (!chatId || !projectId) {
      addLog('--- Project ID and Chat ID are required ---');
      return;
    }
    
    if (wsClient.current) {
      wsClient.current.close();
    }

    addLog(`--- Attempting to connect (Project: ${projectId}, Chat: ${chatId}) ---`);
    wsClient.current = new ChatWebSocket(projectId, chatId);

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
    if (wsClient.current && status === 'connected') {
      addLog(`[CLIENT]: ${message}`);
      wsClient.current.sendMessage(message);
      setMessage('');
    } else {
      addLog('--- Not connected --- ');
    }
  };

  useEffect(() => {
    return () => {
      if (wsClient.current) {
        wsClient.current.close();
      }
    };
  }, []);

  const loadingComponent = <div className="loading-overlay">Loading...</div>;
  
  const conversationsForSidebar: Conversation[] = chats.map(chat => ({
      id: chat.short_id,
      name: chat.title,
      owner: chat.user_id,
  }));

  return (
    <div className="flex h-screen bg-background text-foreground">
        <Sidebar 
            conversations={conversationsForSidebar}
            activeConversationId={activeChatId}
            isCreatingChat={isCreating}
            onNewConversation={handleNewConversation}
            onConversationSelect={(id: string) => setActiveChatId(id)}
            onDeleteConversation={deleteChat}
            isSidebarOpen={true}
            onToggleSidebar={() => {}}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
            <Header
                user={user}
                onToggleSettings={() => setIsSettingsOpen(true)}
                onOpenProfile={() => setIsProfileOpen(true)} 
                onLogin={loginWithGoogle}
                onLogout={logout}
                currentProject={currentProject}
            />
            <main className="flex-1 overflow-y-auto p-4">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold mb-4">WebSocket Test Page</h1>
                    <div className="bg-gray-800 p-4 rounded-lg mb-4">
                        <p className="font-mono">Status: <span className={status === 'connected' ? 'text-green-500' : 'text-red-500'}>{status}</span></p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                        type="text"
                        placeholder="Project ID (auto-filled from current project)"
                        value={projectId}
                        readOnly
                        className="p-2 rounded bg-gray-600 text-white cursor-not-allowed"
                        />
                        <input
                        type="text"
                        placeholder="Chat ID (auto-filled from current chat)"
                        value={chatId}
                        readOnly
                        className="p-2 rounded bg-gray-600 text-white cursor-not-allowed"
                        />
                    </div>
                    <div className="flex gap-4 mb-4">
                        <button onClick={connect} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={!chatId || !projectId}>
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
                        <button onClick={sendMessage} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" disabled={status !== 'connected'}>
                        Send
                        </button>
                    </div>
                    <div className="bg-black p-4 rounded-lg h-96 overflow-y-auto">
                        <pre className="text-sm font-mono text-white">{
                        log.map((line, index) => <p key={index}>{line}</p>)
                        }</pre>
                    </div>
                </div>
            </main>
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
