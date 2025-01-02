/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/api/api-service.js":
/*!********************************!*\
  !*** ./src/api/api-service.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   APIService: () => (/* binding */ APIService)
/* harmony export */ });
class APIService {
    static async generateComment(postContent, posterName) {
        try {
            const settings = await chrome.storage.sync.get(['apiKey', 'defaultPrompt', 'aiModel', 'temperature', 'maxTokens', 'blacklist']);

            if (!postContent || !posterName) {
                throw new Error('Missing required content for comment generation.');
            }

            if (!settings.apiKey) {
                throw new Error('API key not configured. Please go to extension options and configure your Google AI API key.');
            }

            const prompt = settings.defaultPrompt
                ? settings.defaultPrompt
                    .replace('{content}', postContent)
                    .replace('{name}', posterName)
                : `Generate a professional comment for LinkedIn post by ${posterName}: "${postContent}"`;

            const apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
            const model = 'gemini-pro';
            const apiUrl = `${apiBaseUrl}${model}:generateContent`;
            const apiKeyParam = `?key=${settings.apiKey}`;
            const fullApiUrl = apiUrl + apiKeyParam;

            console.log('Making API request to:', fullApiUrl);
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

            const response = await fetch(fullApiUrl, {
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


/***/ }),

/***/ "./src/contentScript.js":
/*!******************************!*\
  !*** ./src/contentScript.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _api_api_service_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api/api-service.js */ "./src/api/api-service.js");


if (window.linkedInEnhancerInitialized) {
    console.log("LinkedIn Enhancer already initialized, skipping...");
} else {
    window.linkedInEnhancerInitialized = true;

    console.log("Content script loaded and running");

    // Debug configuration
    const DEBUG = {
        enabled: true,
        logPostHTML: true,
        logSelectors: true
    };

    function debugLog(...args) {
        if (DEBUG.enabled) {
            console.log(...args);
        }
    }

    function debugError(...args) {
        if (DEBUG.enabled) {
            console.error(...args);
        }
    }

    async function generateAIComment(postId, posts) {
        try {
            // Get the post data
            const post = posts.find(p => p.index === parseInt(postId));
            if (!post) {
                throw new Error("Post not found");
            }

            debugLog("Found post:", post);

            // Call API Service to generate comment
            const apiResponse = await _api_api_service_js__WEBPACK_IMPORTED_MODULE_0__.APIService.generateComment(post.postContent, post.posterName);

            if (!apiResponse) {
                throw new Error("API response is undefined");
            }

            return {
                comment: apiResponse,
                debug: {
                    prompt: post.postContent,
                    timestamp: new Date().toISOString(),
                    model: 'gemini-2.0-flash-exp'
                }
            };

        } catch (error) {
            debugError("Error generating AI comment:", {
                error: error,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return {
                error: error.message,
                debug: {
                    errorStack: error.stack,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    // Store posts globally to access them during comment generation
    let cachedPosts = [];

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            debugLog("Content script received message:", request);
            
            if (request.action === "getPostContent") {
                try {
                    debugLog("Getting LinkedIn posts...");
                    const postContent = getLinkedInPosts();
                    cachedPosts = postContent; // Cache the posts
                    debugLog("Retrieved posts:", postContent);
                    
                    sendResponse({ 
                        posts: postContent,
                        debug: {
                            totalPostsFound: postContent.length,
                            timestamp: new Date().toISOString()
                        }
                    });
                } catch (error) {
                    debugError("Error getting posts:", error);
                    sendResponse({ 
                        posts: [], 
                        error: error.message,
                        debug: {
                            errorStack: error.stack,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            } else if (request.action === "generateComment") {
                // Use async/await with generateAIComment
                generateAIComment(request.postId, cachedPosts)
                    .then(response => {
                        debugLog("Generated comment response:", response);
                        sendResponse(response);
                    })
                    .catch(error => {
                        debugError("Error in generateComment:", error);
                        sendResponse({
                            error: error.message,
                            debug: {
                                errorStack: error.stack,
                                timestamp: new Date().toISOString()
                            }
                        });
                    });
                return true; // Keep the message channel open for async response
            }
            return true; // Keep the message channel open
        }
    );

    function getLinkedInPosts() {
        debugLog("Starting to extract posts");
        const posts = [];
        
        // Updated selectors for modern LinkedIn feed
        const postContainers = document.querySelectorAll([
            'div.feed-shared-update-v2',
            'div.occludable-update',
            'div[data-urn]',
            'div.feed-shared-update-v2__content',
            'div.update-components-actor',
            'div.feed-shared-actor'
        ].join(', '));
        
        debugLog(`Found ${postContainers.length} potential post containers`);

        if (postContainers.length === 0) {
            debugError("No post containers found. DOM structure may have changed.");
            return [];
        }

        postContainers.forEach((postContainer, index) => {
            try {
                if (DEBUG.logPostHTML) {
                    debugLog(`Post ${index + 1} HTML:`, postContainer.outerHTML);
                }

                const postData = extractPostData(postContainer, index);
                
                if (postData.isValid) {
                    posts.push({
                        posterName: postData.posterName,
                        postContent: postData.postContent,
                        timestamp: new Date().toISOString(),
                        index: index
                    });
                }
            } catch (error) {
                debugError(`Error processing post ${index + 1}:`, error);
            }
        });

        debugLog(`Successfully extracted ${posts.length} valid posts`);
        return posts.filter(post => post.postContent && post.postContent !== "Content not available");
    }

    function extractPostData(postContainer, index) {
        const nameSelectors = [
            'span.update-components-actor__name',
            'span.feed-shared-actor__name',
            'span.update-components-actor__title',
            'a.update-components-actor__meta-link',
            'a[data-control-name="actor_container"] span',
            'div.update-components-actor__meta-link',
            '.actor-name',
            'div.feed-shared-actor__title span'
        ];

        const contentSelectors = [
            'div.feed-shared-update-v2__description-wrapper',
            'div.feed-shared-text-view',
            'div.update-components-text',
            'div.feed-shared-text',
            'div.update-components-text__text-view',
            'div.feed-shared-update-v2__commentary',
            'span[dir="ltr"]',
            'div.feed-shared-inline-show-more-text'
        ];

        let posterName = findElementContent(postContainer, nameSelectors, 'name', index);
        let postContent = findElementContent(postContainer, contentSelectors, 'content', index);

        // Clean up the extracted text
        if (postContent) {
            postContent = cleanUpPostContent(postContent);
            postContent = removeNameFromContent(postContent, posterName);
        }

        return {
            posterName: posterName || "Unknown User",
            postContent: postContent || "Content not available",
            isValid: Boolean(posterName && postContent && 
                            postContent !== "Content not available")
        };
    }

    function findElementContent(container, selectors, type, postIndex) {
        for (let selector of selectors) {
            try {
                if (DEBUG.logSelectors) {
                    debugLog(`Trying ${type} selector on post ${postIndex + 1}:`, selector);
                }
                
                const element = container.querySelector(selector);
                if (element) {
                    const content = element.innerText || element.textContent;
                    if (content && content.trim()) {
                        debugLog(`Found ${type} using selector "${selector}":`, content.trim());
                        return content.trim();
                    }
                }
            } catch (error) {
                debugError(`Error with selector "${selector}":`, error);
            }
        }
        debugLog(`Could not find ${type} for post ${postIndex + 1}`);
        return null;
    }

    function cleanUpPostContent(text) {
        if (text) {
            // Remove extra whitespace and line breaks
            let cleanedText = text.replace(/\s+/g, ' ').trim();
            // Remove any leading or trailing newlines
            cleanedText = cleanedText.replace(/^\n+|\n+$/g, '');
            // Handle HTML entities and decode them
            const tempElement = document.createElement('div');
            tempElement.innerHTML = cleanedText;
            cleanedText = tempElement.textContent || tempElement.innerText || "";
            return cleanedText;
        }
        return "";
    }

    function removeNameFromContent(content, name) {
        if (!content || !name) {
            return content;
        }

        // Split name into parts to handle first/last name separately
        const nameParts = name.split(/\s+/);

        // Create a regex that matches:
        // 1. The exact full name
        // 2. The name followed by "shared" or "posted"
        // 3. The name at the start of the content
        const patterns = [
            `(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*)`,
            `(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*(shared|posted|writes|commented|likes))`,
            `^(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*)`
        ];

        let cleanContent = content;

        // Apply each pattern
        patterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'gi');
            cleanContent = cleanContent.replace(regex, '');
        });

        // Clean up any resulting double spaces and trim
        cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

        return cleanContent;
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	__webpack_require__("./src/contentScript.js");
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/api/api-service.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=contentScript.bundle.js.map