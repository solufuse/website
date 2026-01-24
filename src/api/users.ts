import { getAuthToken } from './getAuthToken';
import type { UserProfile, UserUpdatePayload, PaginatedUsersResponse } from '@/types/types_users';

const API_BASE_URL = 'https://api.solufuse.com';

// This interface is specific to the API key update operation.
interface ApiKeyUpdateResponse {
    status: string;
    message: string;
}

// This is a helper function to handle API responses.
async function handleResponse(response: Response) {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // No JSON body in error response
        }
        const errorMessage = errorData?.detail || `API Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
    }
    // For 204 No Content responses (like DELETE)
    if (response.status === 204) {
        return;
    }
    return response.json();
}

/**
 * Fetches the profile of the currently authenticated user.
 */
export const getMe = async (): Promise<UserProfile> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/me/`, { 
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

/**
 * Updates the profile of the currently authenticated user.
 */
export const updateMe = async (payload: UserUpdatePayload): Promise<UserProfile> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

/**
 * Sends the user's API key to the backend to be securely stored.
 * This is the new, secure way to handle API keys.
 * @param apiKey The API key to store.
 * @returns A confirmation message from the server.
 */
export const updateUserApiKey = async (apiKey: string): Promise<ApiKeyUpdateResponse> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/me/api-key/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey }),
    });
    return handleResponse(response);
};


/**
 * Searches for users by email or username.
 * NOTE: The 'page' parameter has been removed as it is no longer supported by the backend.
 * @param query The search query.
 * @param limit The number of results per page.
 * @returns A promise that resolves to a paginated list of users.
 */
export const searchUsers = async (query: string, limit: number = 10): Promise<PaginatedUsersResponse> => {
    if (!query) return { users: [], pagination: { total_items: 0, total_pages: 1, current_page: 1, limit: limit } };
    
    const token = await getAuthToken();
    // CORRECTED: Added trailing slash and removed 'page' parameter to match the backend.
    const response = await fetch(`${API_BASE_URL}/users/search/?q=${encodeURIComponent(query)}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await handleResponse(response);
    
    if (!data.users || !data.pagination) {
        console.error("Search response was not in the expected format.", data);
        return { users: [], pagination: { total_items: 0, total_pages: 1, current_page: 1, limit: limit } };
    }

    return data;
};

/**
 * NOTE: This function is likely deprecated. 
 * The backend API no longer appears to have a direct /users/{userId}/ endpoint.
 * Consider using lookupUser({ uid: userId }) instead.
 */
/*
export const getUser = async (userId: string): Promise<UserPublic> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, { 
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};
*/

/**
 * Looks up a single user by their UID or email.
 * Corresponds to the /users/lookup/ backend endpoint.
 */
export const lookupUser = async (params: { uid?: string; email?: string }): Promise<UserProfile> => {
    const { uid, email } = params;
    if (!uid && !email) {
        throw new Error("Either 'uid' or 'email' must be provided for lookup.");
    }
    if (uid && email) {
        throw new Error("Provide either 'uid' or 'email' for lookup, not both.");
    }

    const token = await getAuthToken();
    const query = uid ? `uid=${uid}` : `email=${encodeURIComponent(email!)}`;
    
    // CORRECTED: The backend route is /lookup/ with a trailing slash.
    const response = await fetch(`${API_BASE_URL}/users/lookup/?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    return handleResponse(response);
};
