
const API_KEY_STORAGE_KEY = 'gemini_api_key';

/**
 * Saves the Gemini API key to the browser's local storage.
 * @param apiKey The API key to save.
 */
export const saveApiKey = (apiKey: string): void => {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
};

/**
 * Retrieves the Gemini API key from the browser's local storage.
 * @returns The saved API key or null if it doesn't exist.
 */
export const getApiKey = (): string | null => {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
};
