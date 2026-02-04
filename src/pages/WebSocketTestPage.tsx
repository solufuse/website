
import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthContext } from '@/context/authcontext';
import { useProjectContext } from '@/context/ProjectContext';
import { useChatContext } from '@/context/ChatContext';
import { WebSocketConnection, WebSocketEvent } from '@/api/chat_ws';
import { createChat as apiCreateChat } from '@/api/chat';
import LogDisplay from '@/components/chat/LogDisplay';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

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
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const wsConnection = useRef<WebSocketConnection | null>(null);

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

  useEffect(() => {
    if (chatId && projectId) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, projectId]);

  const addLog = (text: string) => {
    console.log(text);
    setLog(prev => [...prev, text]);
  };

  const handleNewConversation = async () => {
    if (!currentProject) {
        addLog("Cannot create chat without a project.");
        return;
    }

    setIsCreating(true);
    try {
        const newChat = await apiCreateChat(currentProject.id, { title: "New Test Chat", api_key: '' });
        await loadChats(currentProject.id);
        setActiveChatId(newChat.short_id);
    } catch (error: any) {
        addLog(`Error creating new chat: ${error.message}`);
    } finally {
        setIsCreating(false);
    }
  };

  const connect = () => {
    if (!chatId || !projectId) return;

    wsConnection.current?.closeConnection();
    addLog(`--- Attempting to connect (Project: ${projectId}, Chat: ${chatId}) ---`);
    
    const options = {
        project_id: projectId,
        chat_id: chatId,
        model: user?.preferred_model,
        onOpen: () => {
            setConnectionStatus('Connected');
            addLog(`--- Connection Opened and Authenticated to ${projectId}/${chatId} ---`);
        },
        onClose: (code: number, reason: string) => {
            setConnectionStatus(`Disconnected: ${reason} (Code: ${code})`);
            addLog(`--- Connection Closed (Code: ${code}, Reason: ${reason}) ---`);
        },
        onEvent: (event: WebSocketEvent) => {
            const dataString = typeof event.data === 'object' ? JSON.stringify(event.data, null, 2) : event.data;
            addLog(`[${event.type.toUpperCase()}]: ${dataString}`);
        },
        onError: (error: any) => {
            addLog(`--- ERROR: ${error.message || 'An unknown error occurred.'} ---`);
        },
    };

    wsConnection.current = new WebSocketConnection(options);
    wsConnection.current.connect();
  };

  const disconnect = () => {
    wsConnection.current?.closeConnection();
  };

  const sendMessage = () => {
    if (wsConnection.current?.isConnected() && message.trim()) {
      addLog(`[CLIENT]: ${message}`);
      wsConnection.current.sendMessage(message);
      setMessage('');
    } else {
      addLog('--- Not connected or message is empty --- ');
    }
  };

  const copyLogsToClipboard = () => {
    if (log.length === 0) {
        toast("No logs to copy.");
        return;
    }
    const logString = log.join('\n');
    navigator.clipboard.writeText(logString).then(() => {
        toast("Logs copied to clipboard!");
    }, (err: any) => {
        toast.error("Failed to copy logs", { description: err.message });
    });
  };

  useEffect(() => {
    return () => wsConnection.current?.closeConnection();
  }, []);

  const loadingComponent = <div className="loading-overlay">Loading...</div>;
  
  const conversationsForSidebar: Conversation[] = chats.map(chat => ({ id: chat.short_id, name: chat.title, owner: chat.user_id }));

  return (
    <div className="flex h-screen bg-background text-foreground">
        <Sidebar 
            conversations={conversationsForSidebar}
            activeConversationId={activeChatId}
            isCreatingChat={isCreating}
            onNewConversation={handleNewConversation}
            onConversationSelect={setActiveChatId}
            onDeleteConversation={deleteChat}
            isSidebarOpen={true}
            onToggleSidebar={() => {}}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
            <Toaster />
            <Header
                user={user}
                onToggleSettings={() => setIsSettingsOpen(true)}
                onOpenProfile={() => setIsProfileOpen(true)} 
                onLogin={loginWithGoogle}
                onLogout={logout}
                currentProject={currentProject}
            />
            <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                <h1 className="text-2xl font-bold shrink-0">WebSocket Test Page</h1>
                
                <Card className="shrink-0">
                    <CardHeader>
                        <CardTitle>Connection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-mono text-sm">Status: <span className={connectionStatus === 'Connected' ? 'text-green-500' : 'text-red-500'}>{connectionStatus}</span>
                        {connectionStatus === 'Connected' && <span>{` to ${projectId}/${chatId}`}</span>}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                            <Input type="text" placeholder="Project ID" value={projectId} readOnly className="cursor-not-allowed" />
                            <Input type="text" placeholder="Chat ID" value={chatId} readOnly className="cursor-not-allowed" />
                        </div>
                        <Button onClick={disconnect} variant="destructive" disabled={connectionStatus !== 'Connected'}>Disconnect</Button>
                    </CardContent>
                </Card>
                
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Logs</CardTitle>
                        <Button onClick={copyLogsToClipboard} variant="outline">Copy Logs</Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto bg-black rounded-b-lg p-4">
                        <LogDisplay log={log} />
                    </CardContent>
                </Card>

                <div className="flex gap-4 shrink-0">
                    <Input
                        type="text"
                        placeholder="Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-grow"
                    />
                    <Button onClick={sendMessage} variant="secondary" disabled={connectionStatus !== 'Connected'}>Send</Button>
                </div>
            </main>
            <Suspense fallback={loadingComponent}>
                {isSettingsOpen && <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
                {user && isProfileOpen && <ProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onSave={updateUsername} currentUsername={user.username} />}
            </Suspense>
        </div>
    </div>
  );
};

export default WebSocketTestPage;
