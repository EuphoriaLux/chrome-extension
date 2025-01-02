class APIService {
    static async generateComment(postContent, posterName) {
        try {
            const settings = await chrome.storage.sync.get(['apiKey', 'defaultPrompt', 'aiModel', 'temperature', 'maxTokens', 'blacklist']);

            if (!postContent || !posterName) {
                throw new Error('Missing required content for comment generation.');
            }

            // Get the access token from storage
            const accessToken = await new Promise((resolve) => {
                chrome.storage.sync.get(['accessToken'], (result) => {
                    resolve(result.accessToken);
                });
            });

            if (!accessToken) {
                throw new Error('OAuth 2 access token not configured. Please go to extension options and authenticate.');
            }

            const prompt = settings.defaultPrompt
                ? settings.defaultPrompt
                    .replace('{content}', postContent)
                    .replace('{name}', posterName)
                : `Generate a professional comment for LinkedIn post by ${posterName}: "${postContent}"`;

            const apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
            const model = settings.aiModel || 'gemini-2.0-flash-exp';
            const apiUrl = `${apiBaseUrl}${model}:generateContent`;

            console.log('Making API request to:', apiUrl);
            console.log('Request body:', {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: settings.temperature || 0.7,
                    maxOutputTokens: settings.maxTokens || 150,
                }
            });

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: settings.temperature || 0.7,
                        maxOutputTokens: settings.maxTokens || 150,
                    }
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const responseBody = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(responseBody);
                } catch (e) {
                    errorData = { parseError: e.message, responseBody: responseBody };
                }
                console.error('API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    errorData: errorData,
                    responseBody: responseBody
                });
                throw new Error(
                    `API request failed with status ${response.status}. ${errorData.error?.message || 'Unknown error'}. Response body: ${responseBody}`
                );
            }

            const data = await response.json();
            console.log('API Response data:', data);
            
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                let generatedText = data.candidates[0].content.parts[0].text.trim();

                // Apply blacklist filtering if configured
                if (settings.blacklist) {
                    const blacklistWords = settings.blacklist.split('\n')
                        .map(word => word.trim())
                        .filter(word => word);
                    if (blacklistWords.length > 0) {
                        const regex = new RegExp(blacklistWords.join('|'), 'gi');
                        generatedText = generatedText.replace(regex, '***');
                    }
                }

                return generatedText;
            } else {
                throw new Error('The AI service returned an unexpected response format. Please try again.');
            }
        } catch (error) {
            console.error('Error generating comment:', error);
            console.error('Error stack:', error.stack);
            // Enhance error message for user display
            const userMessage = error.message.includes('API key') 
                ? error.message 
                : `Failed to generate comment: ${error.message}`;
            throw new Error(userMessage);
        }
    }
}
