import { askGemini } from '@/api/gemini';

export const sendMessage = async (model: string, message: string): Promise<{ text: string }> => {
   // For now, we only support the gemini model.
   if (model === 'gemini') {
        // Retrieve the API key from local storage.
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            throw new Error("API key for Gemini not found. Please go to Settings to add it.");
        }

        const responseText = await askGemini({ apiKey, question: message });
        return { text: responseText };
   }
   
   // In a real-world scenario, you might have different services for different models.
   // For now, we'll throw an error for unsupported models.
   throw new Error(`Model ${model} is not supported yet.`);
};
