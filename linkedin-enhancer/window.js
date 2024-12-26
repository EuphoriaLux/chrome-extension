console.log("Window script loaded");

// Theme initialization function
function initializeTheme() {
    chrome.storage.sync.get('theme', function(data) {
        if (data.theme) {
            document.body.setAttribute('data-theme', data.theme);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Window DOM loaded");
    
    // Initialize theme
    initializeTheme();
    
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
});

// Listen for theme changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.theme) {
        document.body.setAttribute('data-theme', changes.theme.newValue);
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
                sendResponse({ status: "no_posts" });
                return false;
            }

            displayPosts(request.postContent);
            sendResponse({ status: "success" });
        }
        return false;
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

    postContainer.innerHTML = '';
    if (statusMessage) {
        statusMessage.textContent = `Displaying ${posts.length} posts`;
    }

    posts.forEach((post, index) => {
        try {
            const postElement = document.importNode(postTemplate.content, true);
            
            const cleanName = post.posterName.split('\n')[0].trim();
            
            postElement.querySelector('.poster-name').textContent = cleanName;
            postElement.querySelector('.post-content').textContent = post.postContent;
            
            const generateBtn = postElement.querySelector('.generate-comment-btn');
            const generatedComment = postElement.querySelector('.generated-comment');
            const commentContent = postElement.querySelector('.comment-content');
            const copyBtn = postElement.querySelector('.copy-comment-btn');
            
            if (generateBtn) {
                generateBtn.addEventListener('click', async () => {
                    try {
                        generateBtn.disabled = true;
                        generateBtn.textContent = 'Generating...';
                        generatedComment.classList.remove('hidden');
                        commentContent.textContent = 'Generating comment...';
                        
                        const generatedText = await APIService.generateComment(
                            post.postContent,
                            cleanName
                        );
                        
                        commentContent.textContent = generatedText;
                    } catch (error) {
                        commentContent.textContent = `Error: ${error.message}`;
                    } finally {
                        generateBtn.disabled = false;
                        generateBtn.textContent = 'Generate Comment';
                    }
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
