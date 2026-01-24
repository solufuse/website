
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createChat as apiCreateChat,
    getChats as apiGetChats,
    postMessage as apiPostMessage,
    deleteChat as apiDeleteChat,
    cancelGeneration as apiCancelGeneration
} from '@/api/chat';
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

    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, _setActiveChatId] = useState<string | null>(null);
    const [queuedChatId, setQueuedChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeChat = useMemo(() => chats.find(c => c.short_id === activeChatId) || null, [chats, activeChatId]);

    const setActiveChatId = useCallback((id: string | null) => {
        if (id && chats.length === 0) {
            setQueuedChatId(id);
            _setActiveChatId(null);
        } else {
            _setActiveChatId(id);
            setQueuedChatId(null);
        }
    }, [chats]);

    useEffect(() => {
        if (queuedChatId && chats.length > 0) {
            const chatExists = chats.some(c => c.short_id === queuedChatId);
            if (chatExists) {
                _setActiveChatId(queuedChatId);
                setQueuedChatId(null);
            } else {
                setQueuedChatId(null);
            }
        }
    }, [chats, queuedChatId]);

    const loadChats = useCallback(async (projectId: string) => {
        try {
            const loadedChats = await apiGetChats(projectId);
            const sortedChats = loadedChats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setChats(sortedChats);
        } catch (err: any) {
            setError('Failed to load chats.');
            console.error(err);
        }
    }, []);

    const createChat = async (title: string = "New Chat") => {
        if (!currentProject || !user) {
            setError("A project and user must be set to create a chat.");
            return;
        }

        // The API key is now handled by the backend, but we need to ensure the user has one set.
        if (!user.api_key_set) {
            setError("API key not found. Please set it in your user settings.");
            return;
        }

        setIsCreatingChat(true);
        setError(null);
        try {
            // The create chat endpoint might not need the api_key anymore if the backend handles it.
            // We pass an empty key for now, but this should be confirmed with backend requirements.
            const newChat = await apiCreateChat(currentProject.id, { title, api_key: '' });
            setChats(prev => [newChat, ...prev]);
            navigate(`/chats/${currentProject.id}/${newChat.short_id}`);
            return newChat;
        } catch (err: any) {
            setError(`Failed to create chat: ${err.message}`);
            console.error(err);
        } finally {
            setIsCreatingChat(false);
        }
    };
    
    const deleteChat = async (chatIdToDelete: string) => {
        setError(null);
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

        let currentChatId = activeChatId;
        let tempChatCreated = false;

        if (!currentChatId) {
            const newChat = await createChat(messageContent.substring(0,20));
            if (newChat) {
                currentChatId = newChat.short_id;
                tempChatCreated = true;
            } else {
                setError("Could not create a new chat to send message.");
                return;
            }
        }

        if (!user || !user.api_key_set || !currentProject) {
            setError('Cannot send message. Ensure you are logged in and have an API key set.');
            return;
        }

        const tempMessageId = `temp-${Date.now()}`;
        const newMessage: Message = { 
            id: tempMessageId, 
            content: messageContent, 
            role: 'user', 
            timestamp: new Date().toISOString(),
            user_id: user?.uid
        };

        setChats(prev => prev.map(chat => 
            chat.short_id === currentChatId ? { ...chat, messages: [...(chat.messages || []), newMessage] } : chat
        ));

        setIsLoading(true);
        setError(null);

        try {
            // Pass the user's preferred model from the auth context to the post message call
            await apiPostMessage(currentChatId, { content: messageContent, api_key: '', model_name: user.preferred_model });
            if (currentProject) {
                await loadChats(currentProject.id);
            }
        } catch (err: any) {
            setError(`Failed to send message: ${err.message}`);
            if (tempChatCreated && currentChatId) {
                await deleteChat(currentChatId);
            }
            const errorId = `error-${Date.now()}`;
            const errorMessage: Message = { id: errorId, content: `Error: ${err.message}`, role: 'assistant', timestamp: new Date().toISOString() };
            setChats(prev => prev.map(chat => 
                chat.short_id === currentChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
            ));
        } finally {
            setIsLoading(false);
        }
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
