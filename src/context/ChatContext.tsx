
import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createChat as apiCreateChat,
    getChats as apiGetChats,
    deleteChat as apiDeleteChat,
    postMessage as apiPostMessage, // Using REST API post
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
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeChat = useMemo(() => chats.find(c => c.short_id === activeChatId) || null, [chats, activeChatId]);

    const setActiveChatId = useCallback((id: string | null) => {
        _setActiveChatId(id);
    }, []);

    const loadChats = useCallback(async (projectId: string) => {
        setIsLoading(true);
        try {
            const loadedChats = await apiGetChats(projectId);
            const sortedChats = loadedChats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setChats(sortedChats);
        } catch (err: any) {
            setError('Failed to load chats.');
        } finally {
            setIsLoading(false);
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
            // The api_key is required by the type, but might not be used if auth is token-based
            const newChat = await apiCreateChat(currentProject.id, { title, api_key: '' });
            setChats(prev => [newChat, ...prev]);
            navigate(`/chats/${currentProject.id}/${newChat.short_id}`);
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
        if (!messageContent.trim() || !activeChatId || !currentProject) return;

        setIsLoading(true);
        setError(null);

        // Optimistically add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            content: messageContent,
            role: 'user',
            timestamp: new Date().toISOString(),
            user_id: user?.uid,
        };
        setChats(prev => prev.map(c => c.short_id === activeChatId ? { ...c, messages: [...c.messages, userMessage] } : c));

        try {
            await apiPostMessage(activeChatId, { content: messageContent, api_key: '' });
            // Reload the whole chat to get the assistant's response
            await loadChats(currentProject.id);
        } catch (err: any) {
            setError(`Failed to send message: ${err.message}`);
            // Optional: remove optimistic message on failure
            setChats(prev => prev.map(c => c.short_id === activeChatId ? { ...c, messages: c.messages.filter(m => m.id !== userMessage.id) } : c));
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
