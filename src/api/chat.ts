
import { getAuthToken } from '@/api/getAuthToken';
import type {
    Chat,
    Message,
    CreateChatRequest,
    PostMessageRequest,
    DeleteMessageRequest,
} from '@/types/types_chat';
import { handleResponse } from '@/utils/handleResponse';

const API_BASE_URL = 'https://api.solufuse.com';

// --- CHAT API FUNCTIONS ---

export const createChat = async (projectId: string, payload: CreateChatRequest): Promise<Chat> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chats/project/${projectId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const getChats = async (projectId: string): Promise<Chat[]> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chats/project/${projectId}`, { headers });
    return handleResponse(response);
};

export const getChat = async (chatId: string): Promise<Chat> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, { headers });
    return handleResponse(response);
};

export const postMessage = async (chatId: string, payload: PostMessageRequest): Promise<Message> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const cancelGeneration = async (chatId: string): Promise<{ status: string; message: string; }> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/cancel`, {
        method: 'POST',
        headers,
    });
    return handleResponse(response);
};

export const deleteChat = async (chatId: string): Promise<void> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: 'DELETE',
        headers,
    });
    return handleResponse(response);
};

export const deleteMessage = async (chatId: string, payload: DeleteMessageRequest): Promise<{ status: string; message: string; }> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

// --- ADMIN API FUNCTIONS ---

export const syncStorage = async (): Promise<{ status: string; message: string; }> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chats/admin/sync-storage`, {
        method: 'POST',
        headers,
    });
    return handleResponse(response);
};

export const purgeMessages = async (): Promise<{ status: string; message: string; purged_count: number; failed_or_skipped_count: number; details_on_failures: any[] }> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chats/admin/purge-messages`, {
        method: 'POST',
        headers,
    });
    return handleResponse(response);
};
