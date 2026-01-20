
// src/types/types_chat.ts

export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: string; // ISO 8601 datetime string
    commit_hash?: string;
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
    is_generation_cancelled?: boolean;
}

export interface CreateChatRequest {
    api_key: string;
    title?: string;
}

export interface PostMessageRequest {
    api_key: string;
    content: string;
    role?: 'user' | 'assistant' | 'system';
}

export interface DeleteMessageRequest {
    created_at: string;
}
