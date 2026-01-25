
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
    const optimisticMessageIdRef = useRef<string | null>(null); // For user messages
    const assistantMessageIdRef = useRef<string | null>(null); // For assistant messages

    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [error, setError] = useState<string | null>(null);

    const handleWsEvent = (event: WebSocketEvent) => {
        console.log('WebSocket Event:', event);

        // --- Start a new assistant message if one isn't active ---
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
            
            case 'full_history': 
                setMessages(event.data);
                setIsLoading(false);
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

            // --- MODIFIED: Handle new structured events ---
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
                    assistantMessageIdRef.current = null; // Reset for the next message
                }
                break;
            // --- END OF MODIFICATION ---

            case 'error':
                setError(event.data);
                setConnectionStatus('Error');
                setIsLoading(false);
                setIsStreaming(false);
                assistantMessageIdRef.current = null;
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
        if (wsConnection.current?.isConnected() && wsConnection.current.getChatId() === chatId) return;
        
        wsConnection.current?.closeConnection(); 

        console.log(`Connecting to WebSocket for chat ${chatId}. Resetting state.`);
        setIsLoading(true);
        setIsStreaming(false); 
        setError(null);
        setMessages([]);
        setConnectionStatus('Disconnected');
        optimisticMessageIdRef.current = null;
        assistantMessageIdRef.current = null;

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
