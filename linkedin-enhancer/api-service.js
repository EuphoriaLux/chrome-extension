class APIService {
    static async generateComment(postContent, posterName) {
        try {
            const settings = await chrome.storage.sync.get(['apiKey', 'defaultPrompt']);
            
            if (!settings.apiKey) {
                throw new Error('API key not configured. Please set it in the extension options.');
            }

            const prompt = settings.defaultPrompt
                .replace('{content}', postContent)
                .replace('{name}', posterName);

            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + settings.apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150,
                    }
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text.trim();
            } else {
                throw new Error('Unexpected API response format');
            }
        } catch (error) {
            console.error('Error generating comment:', error);
            throw error;
        }
    }
}
