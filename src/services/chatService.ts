import axios from 'axios';

const API_ENDPOINTS = {
    gemini: 'YOUR_GEMINI_API_ENDPOINT',
    chatgpt: 'YOUR_CHATGPT_API_ENDPOINT',
    claude: 'YOUR_CLAUDE_API_ENDPOINT',
};

export const sendMessage = async (model: string, message: string): Promise<{ text: string }> => {
   const endpoint = API_ENDPOINTS[model as keyof typeof API_ENDPOINTS];
   
   // Mock response for Gemini
   if (model === 'gemini') {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          text: `This is a mocked response for your message: "${message}"`
        });
      }, 1000);
    });
  }

   // This is a placeholder. You'll need to replace this with the actual API call logic for each service.
   try {
       const response = await axios.post(endpoint, { message });
       return response.data;
   } catch (error) {
       console.error(`Error sending message to ${model}:`, error);
       throw error;
   }
};