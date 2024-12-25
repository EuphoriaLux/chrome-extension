console.log("Popup script loaded");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "setPostContent") {
            const postContent = request.postContent;
            const contentDiv = document.createElement('div')
            contentDiv.innerHTML = postContent;
            contentDiv.style.padding = '10px';
            contentDiv.style.border = '1px solid #ccc';
            contentDiv.style.margin = '10px';
            contentDiv.style.whiteSpace = 'pre-line';
            document.body.appendChild(contentDiv)
        }
    }
);
