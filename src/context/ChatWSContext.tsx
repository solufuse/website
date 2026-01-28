
import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import { WebSocketConnection, WebSocketEvent } from '@/api/chat_ws';
import { getChatHistoryPage } from '@/api/chat_http'; 
import { useAuthContext } from './authcontext';
import type { Message } from '@/types/types_chat';

// --- CONTEXT SHAPE ---
interface ChatWSContextType {
    messages: Message[];
    isStreaming: boolean;
    isLoading: boolean;
    isLoadingMore: boolean; 
    connectionStatus: string;
    error: string | null;
    hasMoreHistory: boolean;
    connect: (projectId: string, chatId: string) => void;
    disconnect: () => void;
    sendMessage: (message: string) => void;
    loadMoreHistory: () => void;
}

const ChatWSContext = createContext<ChatWSContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const ChatWSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuthContext();
    const wsConnection = useRef<WebSocketConnection | null>(null);
    const optimisticMessageIdRef = useRef<string | null>(null);
    const assistantMessageIdRef = useRef<string | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [error, setError] = useState<string | null>(null);

    const currentPage = useRef(1);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const currentChatId = useRef<string | null>(null);
    const currentProjectId = useRef<string | null>(null);

    const handleWsEvent = useCallback((event: WebSocketEvent) => {
        console.log('WebSocket Event:', event);

        if (['tool_code', 'chunk', 'tool_output'].includes(event.type) && !assistantMessageIdRef.current) {
            const newAssistantId = `assistant-streaming-${Date.now()}`;
            assistantMessageIdRef.current = newAssistantId;
            setIsStreaming(true);
            setMessages(prev => [...prev, {
                id: newAssistantId,
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString()
            }]);
        }

        switch (event.type) {
            case 'status':
                if (event.data.includes('Agent initialized')) {
                    setConnectionStatus('Connected');
                    setIsLoading(false);
                }
                break;

            case 'message':
                setMessages(prev => {
                    if (event.data.role === 'user' && optimisticMessageIdRef.current) {
                        const newMessages = prev.map(m =>
                            m.id === optimisticMessageIdRef.current ? event.data : m
                        );
                        optimisticMessageIdRef.current = null;
                        return newMessages;
                    } else {
                        const filteredPrev = prev.filter(m => m.id !== event.data.id);
                        return [...filteredPrev, event.data];
                    }
                });
                break;

            case 'tool_code':
                setMessages(prev => prev.map(m =>
                    m.id === assistantMessageIdRef.current
                        ? { ...m, tool_code: (m.tool_code || '') + event.data }
                        : m
                ));
                break;
            
            case 'tool_output':
                setMessages(prev => prev.map(m =>
                    m.id === assistantMessageIdRef.current
                        ? { ...m, tool_output: (m.tool_output || '') + event.data }
                        : m
                ));
                break;

            case 'chunk':
                 setMessages(prev => prev.map(m =>
                    m.id === assistantMessageIdRef.current
                        ? { ...m, content: m.content + event.data }
                        : m
                ));
                break;

            case 'event':
                if (event.data === 'end_of_stream') {
                    setIsStreaming(false);
                    assistantMessageIdRef.current = null;
                }
                break;

            case 'error':
                setError(event.data);
                setConnectionStatus('Error');
                setIsLoading(false);
                setIsLoadingMore(false);
                setIsStreaming(false);
                assistantMessageIdRef.current = null;
                break;

            case 'warning':
                console.warn('WebSocket Warning:', event.data);
                break;

            default:
                console.warn('Unhandled WebSocket event:', event);
        }
    }, []);

    const loadMoreHistory = useCallback(async () => {
        if (!user?.token || !currentProjectId.current || !currentChatId.current || isLoading || isLoadingMore || !hasMoreHistory) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const nextPage = currentPage.current + 1;
            const history = await getChatHistoryPage(currentProjectId.current, currentChatId.current, user.token, nextPage);
            
            if (history.length > 0) {
                setMessages(prev => [...history, ...prev]);
                currentPage.current = nextPage;
            } else {
                setHasMoreHistory(false);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load more history');
        } finally {
            setIsLoadingMore(false);
        }
    }, [user?.token, isLoading, isLoadingMore, hasMoreHistory]);

    const connect = useCallback(async (projectId: string, chatId: string) => {
        if (!user?.token) return;
        if (wsConnection.current?.isConnected() && wsConnection.current.getChatId() === chatId) return;
        
        wsConnection.current?.closeConnection();

        console.log(`Connecting to WebSocket for chat ${chatId}. Resetting state and loading history.`);
        setIsLoading(true);
        setIsStreaming(false);
        setError(null);
        setMessages([]);
        setConnectionStatus('Disconnected');
        optimisticMessageIdRef.current = null;
        assistantMessageIdRef.current = null;
        
        currentPage.current = 1;
        setHasMoreHistory(true);
        currentProjectId.current = projectId;
        currentChatId.current = chatId;

        try {
            const initialHistory = await getChatHistoryPage(projectId, chatId, user.token, 1);
            setMessages(initialHistory);
            if (initialHistory.length < 30) {
                setHasMoreHistory(false);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load initial history');
            setConnectionStatus('Error');
            setIsLoading(false);
            return;
        }

        const newConnection = new WebSocketConnection({
            project_id: projectId,
            chat_id: chatId,
            onEvent: handleWsEvent,
            onOpen: () => setConnectionStatus('Connecting'),
            onClose: (_code, reason) => {
                console.log('WebSocket closed:', reason);
                setConnectionStatus('Disconnected');
                setIsLoading(false);
            },
            onError: (err) => {
                console.error('WebSocket error:', err);
                setError('An error occurred with the connection.');
                setIsLoading(false);
            },
        });

        wsConnection.current = newConnection;
        newConnection.connect();
    }, [user?.token, handleWsEvent]);

    const disconnect = useCallback(() => {
        if (wsConnection.current) {
            console.log('Disconnecting WebSocket.');
            wsConnection.current.closeConnection();
            wsConnection.current = null;
        }
    }, []);

    const sendMessage = useCallback((messageContent: string) => {
        if (wsConnection.current?.isConnected() && user) {
            const optimisticMessage: Message = {
                id: `user-optimistic-${Date.now()}`,
                content: messageContent,
                role: 'user',
                timestamp: new Date().toISOString(),
                user_id: user.uid,
            };
            optimisticMessageIdRef.current = optimisticMessage.id;
            setMessages(prev => [...prev, optimisticMessage]);
            wsConnection.current.sendMessage(messageContent);
        } else {
            setError('Cannot send message. WebSocket is not connected.');
        }
    }, [user]);

    const value = {
        messages,
        isStreaming,
        isLoading,
        isLoadingMore,
        connectionStatus,
        error,
        hasMoreHistory,
        connect,
        disconnect,
        sendMessage,
        loadMoreHistory,
    };

    return <ChatWSContext.Provider value={value}>{children}</ChatWSContext.Provider>;
};

// --- HOOK ---
export const useChatWSContext = () => {
    const context = useContext(ChatWSContext);
    if (context === undefined) {
        throw new Error('useChatWSContext must be used within a ChatWSProvider');
    }
    return context;
};
