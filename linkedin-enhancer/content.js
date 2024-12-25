console.log("Content script loaded");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "getPostContent") {
            const postContent = getLinkedInPostContent();
            sendResponse({postContent: postContent});
        }
    }
);

function getLinkedInPostContent() {
    // Attempt to find the main post content container
    const postContainer = document.querySelector('.feed-shared-update-v2');

    if (postContainer) {
        // Extract the text content from the post container
        return postContainer.innerText;
    } else {
        // If the main container is not found, try to find a more specific post container
        const specificPostContainer = document.querySelector('.update-components-text');
        if (specificPostContainer) {
            return specificPostContainer.innerText;
        }
        else {
            return "Could not find post content.";
        }
    }
}
