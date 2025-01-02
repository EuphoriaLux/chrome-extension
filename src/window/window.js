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

            // Send acknowledgment back to background script immediately
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
                } else {
                    console.log("Window script - Posts received message sent successfully:", response);
                }
            });

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
                setupButtonListeners(); // Setup listeners after posts are rendered
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
                // Send message to background script to generate comment and await response
                const response = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({ action: "generateComment", postId: postId }, response => {
                        if (chrome.runtime.lastError) {
                            console.error("Window script - Error sending generateComment message:", {
                                error: chrome.runtime.lastError,
                                message: chrome.runtime.lastError.message,
                                stack: new Error().stack
                            });
                            reject(new Error(chrome.runtime.lastError.message));
                        } else if (response && response.error) {
                            console.error("Window script - Error generating comment:", response.error);
                            reject(new Error(response.error));
                        } else {
                            resolve(response);
                        }
                    });
                });

                commentContent.textContent = response.comment;
            } catch (error) {
                console.error("Error generating comment:", error);
                commentContent.textContent = `Error generating comment: ${error.message}`;
            } finally {                
                loadingSpinner.classList.add('hidden');
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
