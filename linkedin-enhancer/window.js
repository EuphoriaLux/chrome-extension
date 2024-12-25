console.log("Window script loaded");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "setPostContent") {
            console.log("Window script - Received posts:", request.postContent);
            const posts = request.postContent;
            const postContainer = document.getElementById('post-container');

            // Clear previous content
            postContainer.innerHTML = '';

            if (Array.isArray(posts)) {
                posts.forEach(post => {
                    const postDiv = document.createElement('div');
                    postDiv.innerHTML = `<h3>${post.posterName}</h3>${post.postContent}`;
                    postDiv.style.padding = '10px';
                    postDiv.style.border = '1px solid #ccc';
                    postDiv.style.margin = '10px';
                    postDiv.style.whiteSpace = 'pre-line';
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
