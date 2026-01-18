
// src/types/types_chat.ts

export interface Message {
    content: string;
    role: 'user' | 'assistant' | 'system';
    created_at?: string; // ISO 8601 datetime string
}

export interface Chat {
    id: string;
    short_id: string;
    project_id: string;
    title: string;
    api_key: string;
    owner_uid: string;
    created_at: string; // ISO 8601 datetime string
    messages: Message[];
}

export interface CreateChatRequest {
    api_key: string;
    title?: string;
}

export interface PostMessageRequest {
    content: string;
}

export interface DeleteMessageRequest {
    created_at: string;
}
