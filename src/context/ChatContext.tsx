
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    createChat as apiCreateChat,
    getChats as apiGetChats,
    postMessage as apiPostMessage,
    deleteChat as apiDeleteChat,
    cancelGeneration as apiCancelGeneration
} from '@/api/chat';
import { getApiKey, getModelName } from '@/utils/apiKeyManager';
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
    const { chatId } = useParams<{ chatId?: string }>();
    const navigate = useNavigate();

    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeChat = useMemo(() => chats.find(c => c.short_id === activeChatId) || null, [chats, activeChatId]);

    useEffect(() => {
        setActiveChatId(chatId || null);
    }, [chatId]);

    const loadChats = useCallback(async (projectId: string) => {
        try {
            const loadedChats = await apiGetChats(projectId);
            // Sort chats by creation date, newest first
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
        const apiKey = getApiKey();
        if (!apiKey) {
            setError("API key not found.");
            return;
        }

        setIsCreatingChat(true);
        setError(null);
        try {
            const newChat = await apiCreateChat(currentProject.id, { title, api_key: apiKey });
            // Add new chat to the top of the list
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

        // If there's no active chat, create a new one first.
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

        const apiKey = getApiKey();
        if (!apiKey || !currentProject) return;

        const tempMessageId = `temp-${Date.now()}`;
        const newMessage: Message = { 
            id: tempMessageId, 
            content: messageContent, 
            role: 'user', 
            timestamp: new Date().toISOString(),
            user_id: user?.uid
        };

        // Immediately update UI with user's message
        setChats(prev => prev.map(chat => 
            chat.short_id === currentChatId ? { ...chat, messages: [...(chat.messages || []), newMessage] } : chat
        ));

        setIsLoading(true);
        setError(null);

        try {
            await apiPostMessage(currentChatId, { content: messageContent, api_key: apiKey, model_name: getModelName() || undefined });
            // Refresh the specific chat to get the assistant's response
             if (currentProject) {
                await loadChats(currentProject.id);
             }
        } catch (err: any) {
            setError(`Failed to send message: ${err.message}`);
            // Revert chat creation if it was temporary
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
