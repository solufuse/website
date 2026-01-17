const API_BASE_URL = 'https://api.solufuse.com';

interface GeminiRequest {
    apiKey: string;
    question: string;
}

interface BackendGeminiResponse {
    response: string;
}

export const askGemini = async ({ apiKey, question }: GeminiRequest): Promise<string> => {
    if (!apiKey) {
        throw new Error("Google API Key is required.");
    }
    if (!question) {
        throw new Error("A question is required.");
    }

    // The API endpoint on your backend
    const apiUrl = `${API_BASE_URL}/gemini/ask`;

    const requestBody = {
        api_key: apiKey, // The backend expects snake_case
        question: question,
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // If your backend requires auth for this endpoint, add it here
                // 'Authorization': `Bearer ${your_auth_token}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Error from backend API: ${response.status}`);
        }

        const backendResponse: BackendGeminiResponse = await response.json();

        return backendResponse.response;

    } catch (error) {
        if (error instanceof Error) {
            console.error("An unexpected error occurred:", error.message);
            throw new Error(`An unexpected error occurred: ${error.message}`);
        }
        throw new Error("An unknown error occurred.");
    }
};
