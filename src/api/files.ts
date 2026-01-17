import { FileInfo } from '../types';
import { getAuthToken } from './getAuthToken';

const API_URL = 'https://api.solufuse.com'; // Base URL for the API

interface ApiParams {
    projectId?: string | null;
    sessionUid?: string | null;
}

/**
 * Appends query parameters to a URL.
 * @param {string} endpoint The base endpoint.
 * @param {ApiParams} params Object containing optional projectId and sessionUid.
 * @returns {URL} A URL object with appended query parameters.
 */
const buildUrl = (endpoint: string, { projectId, sessionUid }: ApiParams): URL => {
    const url = new URL(`${API_URL}${endpoint}`);
    if (projectId) {
        url.searchParams.append('project_id', projectId);
    }
    if (sessionUid) {
        url.searchParams.append('session_uid', sessionUid);
    }
    return url;
};

/**
 * Lists all files and folders.
 * @param {ApiParams} params - Object containing optional projectId and sessionUid.
 * @returns {Promise<FileInfo[]>} A list of file information objects.
 */
export const listFiles = async ({ projectId, sessionUid }: ApiParams = {}): Promise<FileInfo[]> => {
    const url = buildUrl('/files/details', { projectId, sessionUid });
    const token = await getAuthToken();
    url.searchParams.append('_', new Date().getTime().toString()); // Cache-busting

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store', // More aggressive cache prevention
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to list files');
    }

    const data = await response.json();
    return data.files || [];
};

/**
 * Uploads one or more files.
 * @param {File[]} files - An array of File objects to upload.
 * @param {ApiParams} params - Object containing optional projectId and sessionUid.
 * @returns {Promise<any>} The result from the API.
 */
export const uploadFiles = async (files: File[], { projectId, sessionUid }: ApiParams = {}): Promise<any> => {
    const url = buildUrl('/files/upload', { projectId, sessionUid });
    const token = await getAuthToken();
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'File upload failed');
    }

    return response.json();
};

/**
 * Deletes a list of files or folders.
 * @param {string[]} filenames - The relative paths of the items to delete.
 * @param {ApiParams} params - Object containing optional projectId and sessionUid.
 * @returns {Promise<any>} The result from the API.
 */
export const deleteItems = async (filenames: string[], { projectId, sessionUid }: ApiParams = {}): Promise<any> => {
    const url = buildUrl('/files/delete', { projectId, sessionUid });
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(filenames),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete items');
    }

    return response.json();
};

/**
 * Renames a file or folder.
 * @param {string} oldPath - The current relative path of the item.
 * @param {string} newPath - The desired new relative path.
 * @param {ApiParams} params - Object containing optional projectId and sessionUid.
 * @returns {Promise<any>} The result from the API.
 */
export const renameItem = async (oldPath: string, newPath: string, { projectId, sessionUid }: ApiParams = {}): Promise<any> => {
    const url = buildUrl('/files/rename', { projectId, sessionUid });
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ old_path: oldPath, new_path: newPath }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to rename item');
    }

    return response.json();
};

/**
 * Moves a file or folder.
 * @param {string} sourcePath - The current relative path of the item to move.
 * @param {string} destinationPath - The relative path of the destination.
 * @param {ApiParams} params - Object containing optional projectId and sessionUid.
 * @returns {Promise<any>} The result from the API.
 */
export const moveItem = async (sourcePath: string, destinationPath: string, { projectId, sessionUid }: ApiParams = {}): Promise<any> => {
    const url = buildUrl('/files/move', { projectId, sessionUid });
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ source_path: sourcePath, destination_path: destinationPath }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to move item');
    }

    return response.json();
};

/**
 * Creates a new, empty file.
 * @param {string} filePath - The relative path of the new file to create.
 * @param {ApiParams} params - Object containing optional projectId and sessionUid.
 * @returns {Promise<any>} The result from the API.
 */
export const createFile = async (filePath: string, { projectId, sessionUid }: ApiParams = {}): Promise<any> => {
    const url = buildUrl('/files/create', { projectId, sessionUid });
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ path: filePath, type: 'file' }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create file');
    }

    return response.json();
};

/**
 * Creates a new folder.
 * @param {string} folderPath - The relative path of the new folder to create.
 * @param {ApiParams} params - Object containing optional projectId and sessionUid.
 * @returns {Promise<any>} The result from the API.
 */
export const createFolder = async (folderPath: string, { projectId, sessionUid }: ApiParams = {}): Promise<any> => {
    const url = buildUrl('/files/create', { projectId, sessionUid });
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ path: folderPath, type: 'folder' }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create folder');
    }

    return response.json();
};

/**
 * Downloads a selection of files and/or folders as a single zip archive.
 * @param {string[]} filenames - The relative paths of the items to download.
 * @param {ApiParams} params - Object containing optional projectId and sessionUid.
 */
export const downloadItems = async (filenames: string[], { projectId, sessionUid }: ApiParams = {}): Promise<void> => {
    const url = buildUrl('/files/download', { projectId, sessionUid });
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(filenames),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Download failed');
    }

    // Handle the zip file download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;

    // Extract filename from Content-Disposition header
    const disposition = response.headers.get('content-disposition');
    let filename = 'download.zip'; // Default filename
    if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['|"])(.*?)\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[3]) {
            filename = matches[3];
        }
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
};

/**
 * Reads the content of a text file.
 * @param {string} path - The relative path of the file to read.
 * @param {ApiParams} params - Object containing optional projectId and sessionUid.
 * @returns {Promise<string>} The content of the file as a string.
 */
export const readFile = async (path: string, { projectId, sessionUid }: ApiParams = {}): Promise<string> => {
    const url = buildUrl('/files/read', { projectId, sessionUid });
    url.searchParams.append('path', path);
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to read file');
    }

    return response.text();
};

export const writeFile = async (path: string, content: string, { projectId, sessionUid }: ApiParams = {}): Promise<any> => {
    const url = buildUrl('/files/write', { projectId, sessionUid });
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ path, content }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to write file');
    }

    return response.json();
};
