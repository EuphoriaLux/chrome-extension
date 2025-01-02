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
            this.disabled = true;
            loadingSpinner.classList.remove('hidden');
            commentSection.classList.remove('hidden');
            
            try {
                // Request comment generation from background script
                const response = await chrome.runtime.sendMessage({
                    action: "generateComment",
                    postId: postId
                });
                
                if (response && response.comment) {
                    commentContent.textContent = response.comment;
                } else {
                    commentContent.textContent = "Failed to generate comment.";
                }
            } catch (error) {
                commentContent.textContent = "Error generating comment: " + error.message;
            } finally {
                // Reset button state
                this.disabled = false;
                loadingSpinner.classList.add('hidden');
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
