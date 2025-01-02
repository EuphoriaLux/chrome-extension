console.log("Window script loaded");

// Send a message to the background script when the window is ready
document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.sendMessage({ action: "windowReady" }, function(response) {        
        if (chrome.runtime.lastError) {
            console.error("Window script - Error sending window ready message:", chrome.runtime.lastError);
        } else {
            console.log("Window script - Window ready message sent to background script");
        }
    });    
});

// Initialize theme
function initializeTheme() {
    chrome.storage.sync.get('theme', function(data) {
        if (data.theme) {
            document.body.setAttribute('data-theme', data.theme);
        }
    });
}

// Initialize theme when window loads
document.addEventListener('DOMContentLoaded', initializeTheme);

// Listen for theme changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.theme) {
        document.body.setAttribute('data-theme', changes.theme.newValue);
    }
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("Window script - Received message:", request);
        if (request.action === "setPostContent") {
            console.log("Window script - Received posts:", request.postContent);
            const posts = request.postContent;
            const postContainer = document.getElementById('post-container');
            postContainer.innerHTML = ''; // Clear previous content

            // Send acknowledgment back to background script with retry mechanism
            const sendAcknowledgment = (retries = 3) => {
                chrome.runtime.sendMessage({ 
                    action: "postsReceived",
                    timestamp: new Date().toISOString()
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error("Window script - Error sending posts received message:", {
                            error: chrome.runtime.lastError,
                            message: chrome.runtime.lastError.message,
                            stack: new Error().stack
                        });
                        if (retries > 0) {
                            console.log(`Retrying acknowledgment (${retries} attempts remaining)...`);
                            setTimeout(() => sendAcknowledgment(retries - 1), 500);
                        }
                    } else {
                        console.log("Window script - Posts received message sent successfully:", response);
                    }
                });
            };

            sendAcknowledgment();

            if (Array.isArray(posts)) {
                posts.forEach(post => {
                    const postDiv = document.createElement('div');
                    postDiv.classList.add('post-card');
                    postDiv.innerHTML = `
                        <div class="post-header">
                            <h3 class="poster-name">${post.posterName}</h3>
                        </div>
                        <div class="post-content">${post.postContent}</div>
                        <div class="post-actions">
                            <button class="generate-comment-btn" data-post-id="${post.index}">
                                <span class="loading-spinner hidden"></span>
                                Generate Comment
                            </button>
                            <div class="generated-comment hidden">
                                <h4>Generated Comment:</h4>
                                <div class="comment-content"></div>
                                <button class="copy-comment-btn">Copy Comment</button>
                            </div>
                        </div>
                    `;
                    postContainer.appendChild(postDiv);
                });
                setupButtonListeners();
            } else {
                const contentDiv = document.createElement('div');
                contentDiv.textContent = "Could not retrieve post content.";
                contentDiv.classList.add('status-message', 'error');
                postContainer.appendChild(contentDiv);
            }
            // Send response to acknowledge receipt
            sendResponse({ success: true });
            return true; // Keep the message channel open
        }
    }
);

function setupButtonListeners() {
    // Generate comment buttons
    document.querySelectorAll('.generate-comment-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const postId = this.dataset.postId;
            const commentSection = this.nextElementSibling;
            const commentContent = commentSection.querySelector('.comment-content');
            const loadingSpinner = this.querySelector('.loading-spinner');
            
            // Show loading state
            if (loadingSpinner) {
                loadingSpinner.classList.remove('hidden');
            }
            this.disabled = true;
            commentSection.classList.remove('hidden');

            try {
                // Get the active tab to send message to content script with retry
                const sendMessageWithRetry = async (retries = 3) => {
                    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                    if (!tabs || !tabs[0]) {
                        throw new Error("No active tab found");
                    }
                    const currentTabId = tabs[0].id;
                    console.log("Window script - Sending generateComment message to tab ID:", currentTabId);

                    return new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(
                            currentTabId,
                            { action: "generateComment", postId: postId },
                            response => {
                                if (chrome.runtime.lastError) {
                                    console.error("Window script - Error sending generateComment message:", {
                                        error: chrome.runtime.lastError,
                                        message: chrome.runtime.lastError.message,
                                        stack: new Error().stack
                                    });
                                    if (retries > 0) {
                                        console.log(`Retrying generateComment message (${retries} attempts remaining)...`);
                                        setTimeout(() => sendMessageWithRetry(retries - 1).then(resolve).catch(reject), 500);
                                    } else {
                                        reject(new Error(chrome.runtime.lastError.message));
                                    }
                                } else {
                                    resolve(response);
                                }
                            }
                        );
                    });
                };

                const response = await sendMessageWithRetry();
                if (response && response.comment) {
                    commentContent.textContent = response.comment;
                } else {
                    throw new Error("Invalid response from content script");
                }
            } catch (error) {
                console.error("Error generating comment:", error);
                commentContent.textContent = `Error generating comment: ${error.message}`;
            } finally {
                // Reset button state
                if (loadingSpinner) {
                    loadingSpinner.classList.add('hidden');
                }
                this.disabled = false;
            }
        });
    });

    // Copy comment buttons
    document.querySelectorAll('.copy-comment-btn').forEach(button => {
        button.addEventListener('click', function() {
            const commentText = this.parentElement.querySelector('.comment-content').textContent;
            navigator.clipboard.writeText(commentText).then(() => {
                const originalText = this.textContent;
                this.textContent = "Copied!";
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text:', err);
            });
        });
    });
}
