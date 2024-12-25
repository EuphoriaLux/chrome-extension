console.log("Window script loaded");

const statusMessage = document.getElementById('status-message');
const postTemplate = document.getElementById('post-template');

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "setPostContent") {
            handlePostContent(request.postContent);
        }
    }
);

function handlePostContent(posts) {
    statusMessage.textContent = '';
    const postContainer = document.getElementById('post-container');
    postContainer.innerHTML = '';

    if (!posts || posts.length === 0) {
        statusMessage.textContent = "No posts found or error occurred";
        return;
    }

    posts.forEach((post, index) => {
        const postElement = createPostElement(post, index);
        postContainer.appendChild(postElement);
    });
}

function createPostElement(post, index) {
    const postElement = postTemplate.content.cloneNode(true);
    const postCard = postElement.querySelector('.post-card');
    
    postCard.querySelector('.poster-name').textContent = post.posterName;
    postCard.querySelector('.post-content').textContent = post.postContent;
    
    const generateBtn = postCard.querySelector('.generate-comment-btn');
    const generatedComment = postCard.querySelector('.generated-comment');
    const commentContent = postCard.querySelector('.comment-content');
    const copyBtn = postCard.querySelector('.copy-comment-btn');

    generateBtn.addEventListener('click', async () => {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        
        try {
            // TODO: Replace this with actual API call to your LLM service
            const comment = await generateComment(post);
            commentContent.textContent = comment;
            generatedComment.classList.remove('hidden');
        } catch (error) {
            console.error('Error generating comment:', error);
            commentContent.textContent = 'Failed to generate comment. Please try again.';
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Comment';
        }
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(commentContent.textContent)
            .then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => console.error('Failed to copy text:', err));
    });

    return postElement;
}

// Placeholder function for LLM integration
async function generateComment(post) {
    // TODO: Implement actual LLM API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`This is a placeholder for a generated comment about "${post.postContent.substring(0, 50)}..."`);
        }, 1000);
    });
}
