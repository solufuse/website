import { API_BASE_URL } from '../config/apiConfig';
import { handleResponse } from '../utils/handleResponse';
import { Message } from '../types/types_chat';

/**
 * Retrieves a paginated history of the chat conversation.
 * @param projectId The ID of the project.
 *  @param chatId The ID of the chat.
 * @param page The page number to retrieve.
 * @param pageSize The number of messages per page.
 * @param token The authentication token.
 * @returns A promise that resolves to an array of messages.
 */
export const getChatHistoryPage = async (
    projectId: string,
    chatId: string,
    token: string,
    page: number = 1,
    pageSize: number = 30
): Promise<Message[]> => {
    const url = `${API_BASE_URL}/api/v1/chat/${projectId}/${chatId}/history?page=${page}&page_size=${pageSize}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    return handleResponse(response);
};
