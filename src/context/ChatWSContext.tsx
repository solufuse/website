
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
    sendMessage: (message: string) => Promise<void>;
}

const ChatWSContext = createContext<ChatWSContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const ChatWSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuthContext();
    const wsConnection = useRef<WebSocketConnection | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [error, setError] = useState<string | null>(null);

    const handleWebSocketEvent = useCallback((event: WebSocketEvent) => {
        switch (event.type) {
            case 'status':
                if (event.data === "Agent initialized. Ready for messages.") {
                    setIsLoading(false);
                }
                setConnectionStatus(event.data);
                break;
            case 'message': // Handles full messages, e.g., history
                // Assuming history comes as a batch
                if (Array.isArray(event.data)) {
                    setMessages(prev => [...prev, ...event.data]);
                } else {
                    setMessages(prev => [...prev, event.data]);
                }
                break;
            case 'chunk':
                setIsStreaming(true);
                setMessages(prev => {
                    const lastMsgIndex = prev.length - 1;
                    if (lastMsgIndex >= 0 && prev[lastMsgIndex].role === 'assistant') {
                        // Append to the last assistant message
                        let newMessages = [...prev];
                        newMessages[lastMsgIndex].content += event.data;
                        return newMessages;
                    } else {
                        // Start a new assistant message
                        const newAssistantMessage: Message = { id: `ai-${Date.now()}`, content: event.data, role: 'assistant', timestamp: new Date().toISOString() };
                        return [...prev, newAssistantMessage];
                    }
                });
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
    }, []);

    const connect = useCallback((projectId: string, chatId: string) => {
        if (wsConnection.current) {
            wsConnection.current.closeConnection();
        }
        
        setMessages([]); // Clear previous messages
        setIsLoading(true);
        setError(null);
        
        const options = {
            project_id: projectId,
            chat_id: chatId,
            model: user?.preferred_model,
            onOpen: () => setConnectionStatus('Connected'),
            onClose: (_code: number, reason: string) => setConnectionStatus(`Disconnected: ${reason}`),
            onEvent: handleWebSocketEvent,
            onError: (err: any) => {
                setError(`WebSocket Error: ${err.message}`);
                setIsLoading(false);
            },
        };
        wsConnection.current = new WebSocketConnection(options);
        wsConnection.current.connect();
    }, [user, handleWebSocketEvent]);

    const disconnect = useCallback(() => {
        if (wsConnection.current) {
            wsConnection.current.closeConnection();
            wsConnection.current = null;
            setConnectionStatus('Disconnected');
        }
    }, []);

    const sendMessage = async (messageContent: string) => {
        if (!messageContent.trim()) return;
        if (!wsConnection.current || !wsConnection.current.isConnected()) {
            setError("WebSocket is not connected.");
            return;
        }

        // The user message is sent to the server, which will echo it back.
        // We can add it optimistically if the server doesn't echo user messages.
        wsConnection.current.sendMessage(messageContent);
    };

    const value = {
        messages,
        isStreaming,
        isLoading,
        connectionStatus,
        error,
        connect,
        disconnect,
        sendMessage,
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
