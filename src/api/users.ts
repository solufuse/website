import { getAuthToken } from './getAuthToken';
// UPDATED: Importing user-specific types from the new dedicated file.
import type { UserProfile, UserPublic, UserUpdatePayload, PaginatedUsersResponse } from '@/types/types_users';

const API_BASE_URL = 'https://api.solufuse.com';

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
 * Searches for users by email or username with pagination.
 * @param query The search query.
 * @param page The page number to retrieve.
 * @param limit The number of results per page.
 * @returns A promise that resolves to a paginated list of users.
 */
export const searchUsers = async (query: string, page: number = 1, limit: number = 10): Promise<PaginatedUsersResponse> => {
    if (!query) return { users: [], pagination: { total_items: 0, total_pages: 1, current_page: 1, limit: limit } };
    
    const token = await getAuthToken();
    // CORRECTED: Removed the trailing slash from /search to match the backend route defined in FastAPI.
    const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
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
 * Fetches the public profile of a specific user by their ID.
 */
export const getUser = async (userId: string): Promise<UserPublic> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, { 
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

/**
 * [NEW] Looks up a single user by their UID or email.
 * Corresponds to the /users/lookup backend endpoint.
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
    
    // The backend route is /lookup without a trailing slash.
    const response = await fetch(`${API_BASE_URL}/users/lookup?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    return handleResponse(response);
};
