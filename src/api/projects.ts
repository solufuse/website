
import { getAuthToken } from '@/api/getAuthToken';
import { API_BASE_URL } from '@/config/apiConfig';
import type {
    PaginatedProjectListResponse,
    ProjectCreatePayload,
    MemberInvitePayload,
    ProjectDetail,
    ProjectListDetail
} from '@/types/types_projects';
import { handleResponse } from '@/utils/handleResponse';

// --- API FUNCTIONS ---

/**
 * Provides a lightweight list of all projects accessible to the user.
 * @param accessLevel Optional filter to get projects by a specific access level.
 * @returns A promise that resolves with the paginated project list response.
 */
export const listProjects = async (accessLevel?: ProjectListDetail['access_level']): Promise<PaginatedProjectListResponse> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let url = `${API_BASE_URL}/projects/list`;
    if (accessLevel) {
        const params = new URLSearchParams({ accessLevel });
        url += `?${params.toString()}`;
    }

    const response = await fetch(url, { headers });
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
 * Sets the visibility of a project.
 * @param projectId The ID of the project.
 * @param visibility The new visibility setting ('public' or 'private').
 * @returns A promise that resolves with the status, project ID, and new visibility.
 */
export const setProjectVisibility = async (projectId: string, visibility: 'public' | 'private'): Promise<{ status: string; project_id: string; visibility: string; }> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/visibility`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ visibility }),
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
 * @param payload The invitation details (email or user_id, and role).
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
