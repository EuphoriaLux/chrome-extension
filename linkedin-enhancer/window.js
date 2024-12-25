console.log("Window script loaded");

const statusMessage = document.getElementById('status-message');

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "setPostContent") {
            statusMessage.textContent = '';
            const posts = request.postContent;

            if (!posts || posts.length === 0) {
                statusMessage.textContent = "No posts found or error occurred";
                return;
            }
            
            const postContainer = document.getElementById('post-container');

            // Clear previous content
            postContainer.innerHTML = '';

            if (Array.isArray(posts)) {
                posts.forEach(post => {
                    const postDiv = document.createElement('div');
                    const nameElement = document.createElement('h3');
                    nameElement.textContent = post.posterName;
                    postDiv.appendChild(nameElement);

                    const contentElement = document.createElement('div');
                    contentElement.innerHTML = post.postContent;
                    contentElement.style.whiteSpace = 'pre-line';
                    postDiv.appendChild(contentElement);

                    postDiv.style.padding = '10px';
                    postDiv.style.border = '1px solid #ccc';
                    postDiv.style.margin = '10px';
                    postContainer.appendChild(postDiv);
                });
            } else {
                const contentDiv = document.createElement('div')
                contentDiv.textContent = "Could not retrieve post content.";
                postContainer.appendChild(contentDiv)
            }
        }
    }
);
