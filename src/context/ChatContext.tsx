
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createChat as apiCreateChat,
    getChats as apiGetChats,
    deleteChat as apiDeleteChat,
    cancelGeneration as apiCancelGeneration
} from '@/api/chat';
import { WebSocketConnection, WebSocketEvent } from '@/api/chat_ws';
import { useAuthContext } from './authcontext';
import { useProjectContext } from './ProjectContext';
import type { Chat, Message } from '@/types/types_chat';

// --- CONTEXT SHAPE ---
interface ChatContextType {
    chats: Chat[];
    activeChat: Chat | null;
    activeChatId: string | null;
    isLoading: boolean;
    isCreatingChat: boolean;
    isStreaming: boolean;
    connectionStatus: string;
    error: string | null;
    
    setActiveChatId: (chatId: string | null) => void;
    loadChats: (projectId: string) => Promise<void>;
    createChat: (title?: string) => Promise<Chat | undefined>;
    deleteChat: (chatId: string) => Promise<void>;
    sendMessage: (message: string) => Promise<void>;
    cancelGeneration: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuthContext();
    const { currentProject } = useProjectContext();
    const navigate = useNavigate();
    const wsConnection = useRef<WebSocketConnection | null>(null);

    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, _setActiveChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [error, setError] = useState<string | null>(null);

    const activeChat = useMemo(() => chats.find(c => c.short_id === activeChatId) || null, [chats, activeChatId]);

    const setActiveChatId = useCallback((id: string | null) => {
        if (wsConnection.current) {
            wsConnection.current.closeConnection();
            wsConnection.current = null;
        }
        _setActiveChatId(id);
    }, []);

    useEffect(() => {
        if (activeChatId && currentProject) {
            connectToWebSocket(currentProject.id, activeChatId);
        }
        return () => {
            if (wsConnection.current) {
                wsConnection.current.closeConnection();
                wsConnection.current = null;
            }
        };
    }, [activeChatId, currentProject, user]);

    const connectToWebSocket = (projectId: string, chatId: string) => {
        const options = {
            project_id: projectId,
            chat_id: chatId,
            model: user?.preferred_model,
            onOpen: () => setConnectionStatus('Connected'),
            onClose: (_code: number, reason: string) => setConnectionStatus(`Disconnected: ${reason}`),
            onEvent: handleWebSocketEvent,
            onError: (err: any) => setError(`WebSocket Error: ${err.message}`),
        };
        wsConnection.current = new WebSocketConnection(options);
        wsConnection.current.connect();
    };

    const handleWebSocketEvent = (event: WebSocketEvent) => {
        switch (event.type) {
            case 'status':
                if (event.data === "Agent initialized. Ready for messages.") {
                    setIsLoading(false);
                }
                setConnectionStatus(event.data);
                break;
            case 'message':
                setChats(prev => prev.map(chat => 
                    chat.short_id === activeChatId ? { ...chat, messages: [...chat.messages, event.data] } : chat
                ));
                break;
            case 'chunk':
                setIsStreaming(true);
                setChats(prev => prev.map(chat => {
                    if (chat.short_id !== activeChatId) return chat;
                    const lastMsgIndex = chat.messages.length - 1;
                    if (lastMsgIndex >= 0 && chat.messages[lastMsgIndex].role === 'assistant') {
                        let newMessages = [...chat.messages];
                        newMessages[lastMsgIndex].content += event.data;
                        return { ...chat, messages: newMessages };
                    } else {
                        const newAssistantMessage: Message = { id: `ai-${Date.now()}`, content: event.data, role: 'assistant', timestamp: new Date().toISOString() };
                        return { ...chat, messages: [...chat.messages, newAssistantMessage] };
                    }
                }));
                break;
            case 'event':
                if (event.data === 'end_of_stream') {
                    setIsStreaming(false);
                }
                break;
            case 'error':
                setError(event.data);
                setIsLoading(false);
                setIsStreaming(false);
                break;
        }
    };

    const loadChats = useCallback(async (projectId: string) => {
        try {
            const loadedChats = await apiGetChats(projectId);
            const sortedChats = loadedChats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setChats(sortedChats);
        } catch (err: any) {
            setError('Failed to load chats.');
        }
    }, []);

    const createChat = async (title: string = "New Chat") => {
        if (!currentProject || !user) {
            setError("A project and user must be set to create a chat.");
            return;
        }
        if (!user.api_key_set) {
            setError("API key not found. Please set it in your user settings.");
            return;
        }

        setIsCreatingChat(true);
        setError(null);
        try {
            const newChat = await apiCreateChat(currentProject.id, { title, api_key: '' });
            setChats(prev => [newChat, ...prev]);
            navigate(`/chats/${currentProject.id}/${newChat.short_id}`);
            // setActiveChatId will trigger the useEffect to connect the websocket
            setActiveChatId(newChat.short_id);
            return newChat;
        } catch (err: any) {
            setError(`Failed to create chat: ${err.message}`);
        } finally {
            setIsCreatingChat(false);
        }
    };
    
    const deleteChat = async (chatIdToDelete: string) => {
        try {
            await apiDeleteChat(chatIdToDelete);
            setChats(prev => prev.filter(c => c.short_id !== chatIdToDelete));
            if (activeChatId === chatIdToDelete && currentProject) {
                navigate(`/chats/${currentProject.id}`);
            }
        } catch (err: any) {
            setError(`Failed to delete chat: ${err.message}`);
        }
    };

    const sendMessage = async (messageContent: string) => {
        if (!messageContent.trim()) return;
        if (!wsConnection.current || !wsConnection.current.isConnected()) {
            setError("WebSocket is not connected.");
            return;
        }

        // The user message is now sent via WebSocket and will be echoed back
        // by the server, so we don't add it to the state directly.
        wsConnection.current.sendMessage(messageContent);
    };

    const cancelGeneration = async () => {
        if (!activeChatId) return;
        try {
            await apiCancelGeneration(activeChatId);
        } catch (err: any) {
            setError(`Failed to cancel generation: ${err.message}`);
        }
    };

    const value = {
        chats,
        activeChat,
        activeChatId,
        isLoading,
        isCreatingChat,
        isStreaming,
        connectionStatus,
        error,
        setActiveChatId,
        loadChats,
        createChat,
        deleteChat,
        sendMessage,
        cancelGeneration
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// --- HOOK ---
export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};
