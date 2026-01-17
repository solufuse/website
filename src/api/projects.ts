import { getAuthToken } from '@/api/getAuthToken';
import type {
    PaginatedProjectSearchResponse,
    ProjectCreatePayload,
    MemberInvitePayload,
    PaginatedProjectListResponse
} from '@/types/types_projects';

const API_BASE_URL = 'https://api.solufuse.com/';

// --- HELPER FUNCTIONS ---

/**
 * Handles the response from fetch calls.
 * @param response The Response object from the API.
 * @returns The JSON response.
 * @throws An error if the response is not "ok".
 */
async function handleResponse(response: Response) {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // No JSON body in the error response
        }
        const errorMessage = errorData?.detail || `API Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
    }
    // Handle responses without content (e.g., DELETE)
    if (response.status === 204) {
        return;
    }
    return response.json();
}

// --- API FUNCTIONS ---

/**
 * Provides a lightweight list of all projects accessible to the user.
 * @returns A promise that resolves with the paginated project list response.
 */
export const listProjects = async (): Promise<PaginatedProjectListResponse> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/projects/list`, { headers });
    return handleResponse(response);
};


/**
 * Searches for projects by name (q) or exact ID (id).
 * If no parameters are provided, it lists all projects accessible to the user.
 * @param params An object containing 'q' or 'id'.
 * @returns A promise that resolves with the paginated project response.
 */
export const searchProjects = async (params: { q?: string; id?: string }): Promise<PaginatedProjectSearchResponse> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.id) queryParams.append('id', params.id);

    const response = await fetch(`${API_BASE_URL}/projects/search?${queryParams.toString()}`, { headers });
    return handleResponse(response);
};

/**
 * Creates a new project.
 * @param payload The project creation data.
 * @returns A promise that resolves with the status, ID, and the creator's role.
 */
export const createProject = async (payload: ProjectCreatePayload): Promise<{ status: string; id: string; role: string; }> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/projects/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

/**
 * Deletes a project.
 * @param projectId The ID of the project to delete.
 * @returns A promise that resolves with the status and ID of the deleted project.
 */
export const deleteProject = async (projectId: string): Promise<{ status: string; id: string; }> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers,
    });
    return handleResponse(response);
};

/**
 * Invites or updates a member's role in a project.
 * @param projectId The project ID.
 * @param payload The invitation details (email or uid, and role).
 * @returns A promise that resolves with the status, UID, and the new role.
 */
export const inviteOrUpdateMember = async (projectId: string, payload: MemberInvitePayload): Promise<{ status: string; uid: string; role: string; }> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

/**
 * Kicks a member from a project.
 * @param projectId The project ID.
 * @param targetUid The UID of the member to kick.
 * @returns A promise that resolves with the status and UID of the kicked user.
 */
export const kickMember = async (projectId: string, targetUid: string): Promise<{ status: string; uid: string; }> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/members/${targetUid}`, {
        method: 'DELETE',
        headers,
    });
    return handleResponse(response);
};
