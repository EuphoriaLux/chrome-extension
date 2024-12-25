console.log("Window script loaded");

const statusMessage = document.getElementById('status-message');
const postTemplate = document.getElementById('post-template');
const loadingIndicator = document.getElementById('loading-indicator');

let messageCount = 0;
const debugInfo = {
    messageCount: document.getElementById('message-count'),
    lastMessage: document.getElementById('last-message')
};

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        messageCount++;
        if (debugInfo.messageCount) {
            debugInfo.messageCount.textContent = `Messages received: ${messageCount}`;
        }
        if (debugInfo.lastMessage) {
            debugInfo.lastMessage.textContent = `Last message: ${JSON.stringify(request)}`;
        }
        console.log("Window received message:", {
            request: request,
            sender: sender,
            action: request?.action,
            postContent: request?.postContent
        });
        
        if (request.action === "setPostContent") {
            if (!request.postContent) {
                console.error("No post content received");
                document.getElementById('status-message').textContent = "No posts received";
                return;
            }
            console.log("About to handle post content:", request.postContent);
            handlePostContent(request.postContent);
        } else {
            console.log("Received message with unexpected action:", request.action);
        }
    }
);

function handlePostContent(posts) {
    console.log("Starting to handle posts:", posts);
    
    const loadingIndicator = document.getElementById('loading-indicator');
    const statusMessage = document.getElementById('status-message');
    const postContainer = document.getElementById('post-container');
    
    // Hide loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    if (!postContainer) {
        console.error("Post container not found!");
        return;
    }
    
    postContainer.innerHTML = '';

    if (!posts || posts.length === 0) {
        console.log("No posts to display");
        statusMessage.textContent = "No posts found or error occurred";
        return;
    }

    try {
        posts.forEach((post, index) => {
            console.log(`Creating element for post ${index}:`, post);
            const postElement = document.importNode(postTemplate.content, true);
            
            // Set the content
            const posterNameElement = postElement.querySelector('.poster-name');
            const postContentElement = postElement.querySelector('.post-content');
            
            if (posterNameElement) posterNameElement.textContent = post.posterName;
            if (postContentElement) postContentElement.textContent = post.postContent;
            
            // Setup buttons
            const generateBtn = postElement.querySelector('.generate-comment-btn');
            const generatedComment = postElement.querySelector('.generated-comment');
            const commentContent = postElement.querySelector('.comment-content');
            const copyBtn = postElement.querySelector('.copy-comment-btn');
            
            if (generateBtn) {
                generateBtn.addEventListener('click', () => {
                    generateBtn.disabled = true;
                    generateBtn.textContent = 'Generating...';
                    
                    // Simulate comment generation (placeholder)
                    setTimeout(() => {
                        const placeholderComment = `This is a sample comment for the post by ${post.posterName}`;
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
        });
        
        console.log("All posts rendered successfully");
    } catch (error) {
        console.error("Error rendering posts:", error);
        statusMessage.textContent = "Error rendering posts";
    }
}
