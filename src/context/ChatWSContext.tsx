
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
                setConnectionStatus(event.data);
                if (event.data === 'connected') {
                    setIsLoading(false);
                }
                break;

            case 'message':
                // If data is an array, it's the chat history
                if (Array.isArray(event.data)) {
                    setMessages(event.data);
                } else {
                    // Otherwise, it's a single new message.
                    // Replace the streaming message with the final one.
                    setMessages(prev => [...prev.filter(m => m.id !== 'assistant-streaming'), event.data]);
                }
                setIsLoading(false);
                break;

            case 'chunk':
                if (!isStreaming) {
                    setIsStreaming(true);
                    // Add a placeholder for the streaming response
                    setMessages(prev => [...prev, { id: 'assistant-streaming', role: 'assistant', content: '', timestamp: new Date().toISOString() }]);
                }
                // Append chunk to the streaming message
                setMessages(prev => prev.map(m => 
                    m.id === 'assistant-streaming' 
                        ? { ...m, content: m.content + event.data }
                        : m
                ));
                break;

            case 'event':
                if (event.data === 'end_of_stream') {
                    setIsStreaming(false);
                    // The final message is expected to arrive via a 'message' event
                }
                break;

            case 'error':
                setError(event.data);
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
        if (!user || wsConnection.current?.isConnected()) {
            return;
        }
        console.log(`Connecting to WebSocket for chat ${chatId}`);
        
        // Reset state for the new connection
        setIsLoading(true);
        setError(null);
        setMessages([]);
        wsConnection.current?.closeConnection(); // Close any existing connection

        const newConnection = new WebSocketConnection({
            project_id: projectId,
            chat_id: chatId,
            onEvent: handleWsEvent,
            onOpen: () => setConnectionStatus('Connecting'), // The backend sends a 'connected' status event later
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
            // Optimistically add user message
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
