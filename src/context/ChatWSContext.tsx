
import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import { WebSocketConnection, WebSocketEvent } from '@/api/chat_ws';
import { useAuthContext } from './authcontext';
import type { Message } from '@/types/types_chat';

// --- CONTEXT SHAPE ---
interface ChatWSContextType {
    messages: Message[];
    isStreaming: boolean;
    isLoading: boolean;
    connectionStatus: string;
    error: string | null;
    connect: (projectId: string, chatId: string) => void;
    disconnect: () => void;
    sendMessage: (message: string) => void;
}

const ChatWSContext = createContext<ChatWSContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const ChatWSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuthContext();
    const wsConnection = useRef<WebSocketConnection | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [error, setError] = useState<string | null>(null);

    const handleWsEvent = (event: WebSocketEvent) => {
        console.log('WebSocket Event:', event);
        switch (event.type) {
            case 'status':
                const statusMessage = event.data;
                // Interpret the backend status message to set a machine-readable state.
                if (statusMessage.includes('Agent initialized')) {
                    setConnectionStatus('Connected');
                    setIsLoading(false);
                } else if (statusMessage.includes('authenticated')) {
                    // Still connecting, but making progress. No state change needed yet.
                }
                break;
            
            case 'full_history': 
                setMessages(event.data);
                setIsLoading(false);
                break;

            case 'message':
                setMessages(prev => {
                    const filteredPrev = prev.filter(m => m.id !== 'assistant-streaming' && m.id !== event.data.id);
                    return [...filteredPrev, event.data];
                });
                break;

            case 'chunk':
                if (!isStreaming) {
                    setIsStreaming(true);
                    setMessages(prev => 
                        prev.some(m => m.id === 'assistant-streaming') 
                        ? prev 
                        : [...prev, { id: 'assistant-streaming', role: 'assistant', content: '', timestamp: new Date().toISOString() }]
                    );
                }
                setMessages(prev => prev.map(m => 
                    m.id === 'assistant-streaming' 
                        ? { ...m, content: m.content + event.data }
                        : m
                ));
                break;

            case 'event':
                if (event.data === 'end_of_stream') {
                    setIsStreaming(false);
                }
                break;

            case 'error':
                setError(event.data);
                setConnectionStatus('Error');
                setIsLoading(false);
                setIsStreaming(false);
                break;

            case 'warning':
                console.warn('WebSocket Warning:', event.data);
                break;

            default:
                console.warn('Unhandled WebSocket event:', event);
        }
    };

    const connect = useCallback((projectId: string, chatId: string) => {
        if (!user) return;
        if (wsConnection.current?.isConnected()) {
             // If we're already connected to the same chat, do nothing.
            if (wsConnection.current.getChatId() === chatId) return;
        }
        
        console.log(`Connecting to WebSocket for chat ${chatId}`);
        
        wsConnection.current?.closeConnection(); // Close any existing connection

        // Reset state for the new connection
        setIsLoading(true);
        setError(null);
        setMessages([]);
        setConnectionStatus('Disconnected');

        const newConnection = new WebSocketConnection({
            project_id: projectId,
            chat_id: chatId,
            onEvent: handleWsEvent,
            onOpen: () => setConnectionStatus('Connecting'),
            onClose: (_code, reason) => {
                console.log('WebSocket closed:', reason);
                setConnectionStatus('Disconnected');
            },
            onError: (err) => {
                console.error('WebSocket error:', err);
                setError('An error occurred with the connection.');
            },
        });

        wsConnection.current = newConnection;
        newConnection.connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

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
                id: `user-${Date.now()}`,
                content: messageContent,
                role: 'user',
                timestamp: new Date().toISOString(),
                user_id: user.uid,
            };
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
        connectionStatus,
        error,
        connect,
        disconnect,
        sendMessage
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
