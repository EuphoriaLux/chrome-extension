console.log("Popup script loaded");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "setPostContent") {
            const postContent = request.postContent;
            const contentDiv = document.createElement('div');
            contentDiv.textContent = postContent;
            document.body.appendChild(contentDiv);
        }
    }
);
