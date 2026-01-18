
import { getAuthToken } from '@/api/getAuthToken';
import type {
    PaginatedProjectListResponse,
    ProjectCreatePayload,
    MemberInvitePayload,
    ProjectDetail
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
    if (response.ok) {
        if (response.status === 204) {
            return;
        }
        return response.json();
    } else {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData) {
                if (typeof errorData === 'object' && errorData !== null) {
                    if (errorData.detail && Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map((e: any) => `${e.loc.join(' -> ')} - ${e.msg}`).join('\n');
                    } else if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else {
                        errorMessage = JSON.stringify(errorData);
                    }
                } else {
                    errorMessage = errorData;
                }
            }
        } catch (e) {
            // The response was not a valid JSON, so we stick with the status text
        }
        throw new Error(errorMessage);
    }
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
 * Gets the detailed information for a single project.
 * @param projectId The ID of the project to retrieve.
 * @returns A promise that resolves with the project details.
 */
export const getProjectDetails = async (projectId: string): Promise<ProjectDetail> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, { headers });
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
