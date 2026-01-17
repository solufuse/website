import { getAuthToken } from './getAuthToken';

const API_URL = 'https://api.solufuse.com'; // Base URL for the converter router

/**
 * Converts specified files (LF1S/SI2S) from a project folder.
 * This function can return data for viewing in the UI or trigger a file download.
 * @param {string} projectId - The ID of the project.
 * @param {string[]} filenames - The names of the files to convert.
 * @param {'view' | 'download'} action - The action to perform.
 * @param {'excel' | 'json'} outputFormat - The output format for the 'download' action.
 * @returns {Promise<any>} For 'view', the JSON data. For 'download', nothing.
 */
export const convertFiles = async (
    projectId: string,
    filenames: string[],
    action: 'view' | 'download' = 'download',
    outputFormat: 'excel' | 'json' = 'excel'
): Promise<any> => {
    const url = new URL(`${API_URL}/converter/${projectId}`);
    url.searchParams.append('action', action);
    url.searchParams.append('output_format', outputFormat);
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ filenames }),
    });

    if (!response.ok) {
        // Try to parse a JSON error response, otherwise fall back to status text
        const errorData = await response.json().catch(() => ({ detail: `API Error: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.detail || 'Failed to convert files');
    }

    // For 'view', return the JSON data directly
    if (action === 'view') {
        return response.json();
    }

    // For 'download', handle the file blob
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;

    // Extract filename from Content-Disposition header, which the backend now provides
    const disposition = response.headers.get('content-disposition');
    let downloadFilename = 'converted_files.zip'; // A sensible default
    if (disposition) {
        const filenameMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (filenameMatch && filenameMatch[1]) {
            // Clean up the filename
            downloadFilename = filenameMatch[1].replace(/['"]/g, '');
        }
    }
    a.download = downloadFilename;

    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
};


/**
 * Converts files and saves them in a results folder on the server.
 * @param {string} projectId - The ID of the project.
 * @param {string[]} filenames - The names of the files to convert.
 * @param {'json' | 'excel'} outputFormat - The format to save the files in.
 * @returns {Promise<any>} The result from the API, including saved files and errors.
 */
export const convertAndSaveFiles = async (
    projectId: string,
    filenames: string[],
    outputFormat: 'json' | 'excel'
): Promise<any> => {
    const url = new URL(`${API_URL}/converter/${projectId}/save`);
    url.searchParams.append('output_format', outputFormat);
    const token = await getAuthToken();

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ filenames }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred while saving.' }));
        throw new Error(errorData.detail || 'Failed to convert and save files');
    }

    return response.json(); // Returns { message, saved_files, errors? }
};