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
const WS_BASE_URL = 'wss://api.solufuse.com';

// --- CHAT API FUNCTIONS (REST) ---

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


// --- WebSocket Chat Class ---

type ChatSocketEvent = 'open' | 'message' | 'close' | 'error';
type ChatSocketListener = (event: any) => void;

export class ChatSocket {
    private ws: WebSocket | null = null;
    private listeners: Map<ChatSocketEvent, ChatSocketListener[]> = new Map();

    constructor(
        private chatId: string,
        private modelName: string,
        private apiKey?: string,
    ) {}

    async connect() {
        if (this.ws) {
            console.warn('WebSocket is already connected or connecting.');
            return;
        }

        const token = await getAuthToken();
        if (!token) {
            console.error('Authentication token not available.');
            this.emit('error', new Error('Authentication token not available.'));
            return;
        }

        const url = new URL(`${WS_BASE_URL}/chats/ws/${this.chatId}`);
        url.searchParams.append('token', token);
        url.searchParams.append('model_name', this.modelName);
        if (this.apiKey) {
            url.searchParams.append('api_key', this.apiKey);
        }

        this.ws = new WebSocket(url.toString());

        this.ws.onopen = (event) => {
            this.emit('open', event);
        };

        this.ws.onmessage = (event) => {
            this.emit('message', event.data);
        };

        this.ws.onerror = (event) => {
            this.emit('error', event);
        };

        this.ws.onclose = (event) => {
            this.ws = null;
            this.emit('close', event);
        };
    }

    sendMessage(message: string | object) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const payload = typeof message === 'string' ? message : JSON.stringify(message);
            this.ws.send(payload);
        } else {
            console.error('WebSocket is not connected.');
            this.emit('error', new Error('WebSocket is not connected.'));
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }

    on(event: ChatSocketEvent, listener: ChatSocketListener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(listener);
    }

    off(event: ChatSocketEvent, listener: ChatSocketListener) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(listener);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }

    private emit(event: ChatSocketEvent, data: any) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(listener => listener(data));
        }
    }
}
