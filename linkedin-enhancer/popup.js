console.log("Popup script loaded");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        chrome.runtime.sendMessage({ action: "popupReady" }, function(response) {
            console.log("Popup script - Popup ready message sent to background script");
        });
        if (request.action === "setPostContent") {
            console.log("Popup script - Received posts:", request.postContent);
            const posts = request.postContent;

            // Clear previous content
            document.body.innerHTML = '<h1>LinkedIn Enhancer</h1><p>This is the popup.</p>';

            if (Array.isArray(posts)) {
                posts.forEach(post => {
                    const postDiv = document.createElement('div');
                    postDiv.innerHTML = `<h3>${post.posterName}</h3>${post.postContent}`;
                    postDiv.style.padding = '10px';
                    postDiv.style.border = '1px solid #ccc';
                    postDiv.style.margin = '10px';
                    postDiv.style.whiteSpace = 'pre-line';
                    document.body.appendChild(postDiv);
                });
            } else {
                const contentDiv = document.createElement('div')
                contentDiv.textContent = "Could not retrieve post content.";
                document.body.appendChild(contentDiv)
            }
        }
    }
);
