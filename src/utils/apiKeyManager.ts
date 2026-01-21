
const API_KEY_STORAGE_KEY = 'gemini_api_key';
const MODEL_NAME_STORAGE_KEY = 'gemini_model_name';

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

/**
 * Saves the Gemini model name to the browser's local storage.
 * @param modelName The model name to save.
 */
export const saveModelName = (modelName: string): void => {
    localStorage.setItem(MODEL_NAME_STORAGE_KEY, modelName);
};

/**
 * Retrieves the Gemini model name from the browser's local storage.
 * @returns The saved model name or null if it doesn't exist.
 */
export const getModelName = (): string | null => {
    return localStorage.getItem(MODEL_NAME_STORAGE_KEY);
};
