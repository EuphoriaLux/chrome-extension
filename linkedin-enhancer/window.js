console.log("Window script loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("Window DOM loaded");
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
});

// Initialize debug elements
const debugInfo = {
    messageCount: document.getElementById('message-count'),
    lastMessage: document.getElementById('last-message')
};

let messageCount = 0;

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("Window received message:", request);
        
        messageCount++;
        if (debugInfo.messageCount) {
            debugInfo.messageCount.textContent = `Messages received: ${messageCount}`;
        }
        if (debugInfo.lastMessage) {
            debugInfo.lastMessage.textContent = `Last message: ${JSON.stringify(request)}`;
        }

        const loadingIndicator = document.getElementById('loading-indicator');
        const statusMessage = document.getElementById('status-message');

        if (request.action === "setPostContent") {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }

            if (request.debug) {
                showDebugInfo(request.debug);
            }

            if (!request.postContent || !Array.isArray(request.postContent) || request.postContent.length === 0) {
                console.log("No posts received in message");
                if (statusMessage) {
                    statusMessage.textContent = "No posts received";
                }
                return;
            }

            displayPosts(request.postContent);
        }
    }
);

function displayPosts(posts) {
    console.log("Displaying posts:", posts);
    
    const postContainer = document.getElementById('post-container');
    const postTemplate = document.getElementById('post-template');
    const statusMessage = document.getElementById('status-message');
    
    if (!postContainer || !postTemplate) {
        console.error("Required elements not found!", {
            postContainer: !!postContainer,
            postTemplate: !!postTemplate
        });
        if (statusMessage) {
            statusMessage.textContent = "Error: Required elements not found";
        }
        return;
    }

    if (!Array.isArray(posts) || posts.length === 0) {
        console.log("No posts to display");
        if (statusMessage) {
            statusMessage.textContent = "No posts found";
        }
        return;
    }

    // Clear existing posts
    postContainer.innerHTML = '';
    if (statusMessage) {
        statusMessage.textContent = `Displaying ${posts.length} posts`;
    }

    posts.forEach((post, index) => {
        try {
            // Clone the template
            const postElement = document.importNode(postTemplate.content, true);
            
            // Clean up the name (remove duplicate lines and extra whitespace)
            const cleanName = post.posterName.split('\n')[0].trim();
            
            // Set the content
            postElement.querySelector('.poster-name').textContent = cleanName;
            postElement.querySelector('.post-content').textContent = post.postContent;
            
            // Add buttons and their event listeners
            const generateBtn = postElement.querySelector('.generate-comment-btn');
            const generatedComment = postElement.querySelector('.generated-comment');
            const commentContent = postElement.querySelector('.comment-content');
            const copyBtn = postElement.querySelector('.copy-comment-btn');
            
            if (generateBtn) {
                generateBtn.addEventListener('click', () => {
                    generateBtn.disabled = true;
                    generateBtn.textContent = 'Generating...';
                    
                    // Simulate comment generation (replace with actual API call later)
                    setTimeout(() => {
                        const placeholderComment = `This is a sample comment for the post by ${cleanName}`;
                        commentContent.textContent = placeholderComment;
                        generatedComment.classList.remove('hidden');
                        generateBtn.disabled = false;
                        generateBtn.textContent = 'Generate Comment';
                    }, 1000);
                });
            }
            
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    if (commentContent.textContent) {
                        navigator.clipboard.writeText(commentContent.textContent)
                            .then(() => {
                                copyBtn.textContent = 'Copied!';
                                setTimeout(() => {
                                    copyBtn.textContent = 'Copy';
                                }, 2000);
                            })
                            .catch(err => console.error('Failed to copy:', err));
                    }
                });
            }
            
            postContainer.appendChild(postElement);
            console.log(`Successfully added post ${index + 1}`);
        } catch (error) {
            console.error(`Error displaying post ${index}:`, error);
        }
    });
}

function showDebugInfo(debugData) {
    const debugContainer = document.getElementById('debug-info');
    if (debugData && debugContainer) {
        debugContainer.innerHTML = `
            <div>Debug Information:</div>
            <div>Total Posts Found: ${debugData.totalPostsFound || 0}</div>
            <div>Timestamp: ${debugData.timestamp || 'N/A'}</div>
            ${debugData.errorStack ? `<div>Error: ${debugData.errorStack}</div>` : ''}
        `;
    }
}
