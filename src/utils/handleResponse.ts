export async function handleResponse(response: Response) {
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