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

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "user",
                        content: prompt
                    }],
                    temperature: 0.7,
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error generating comment:', error);
            throw error;
        }
    }
}
