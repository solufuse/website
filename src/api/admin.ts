import {
    UserAdminView,
    RoleUpdatePayload,
    BanRequestPayload,
    UserProfile,
    UserUpdatePayload,
    StorageStats,
    AuditItem
} from '../types';
import { getAuthToken } from './getAuthToken';

const API_URL = 'https://api.solufuse.com';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Invalid JSON response from server' }));
        throw new Error(error.detail || `API call failed with status ${response.status}`);
    }
    if (response.status === 204) {
        return null;
    }
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('Failed to parse JSON response from API.');
    }
};


// --- USER MANAGEMENT API ---

export const listAdminUsers = async (params: { 
    skip?: number; 
    limit?: number; 
    email_search?: string; 
    role?: string; 
}): Promise<UserAdminView[]> => {
    const token = await getAuthToken();
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_URL}/admin/users?${query}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const listAllUsers = async (): Promise<UserAdminView[]> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/admin/users/all`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const updateUserRole = async (data: RoleUpdatePayload): Promise<any> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/admin/users/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const banUser = async (data: BanRequestPayload): Promise<any> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/admin/users/ban`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const cleanupGuests = async (hours_old: number = 24): Promise<any> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/admin/guests/cleanup?hours_old=${hours_old}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const deepCleanFirebase = async (confirm: boolean): Promise<any> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/admin/firebase/cleanup?confirm=${confirm}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};


// --- STORAGE MANAGEMENT API ---

export const getStorageStats = async (): Promise<StorageStats> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/storage/stats`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const getStorageAudit = async (): Promise<AuditItem[]> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/storage/audit`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const cleanupOrphans = async (confirm: boolean = true): Promise<any> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/storage/orphans?confirm=${confirm}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const forceDeleteFolder = async (folderId: string): Promise<any> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/storage/${folderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};


// --- USER PROFILE API ---

export const getMyProfile = async (): Promise<UserProfile> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const updateMyProfile = async (data: UserUpdatePayload): Promise<UserProfile> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};
