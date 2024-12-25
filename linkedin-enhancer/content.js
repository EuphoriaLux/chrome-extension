console.log("Content script loaded");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "getPostContent") {
            const postContent = getLinkedInPostContent();
            console.log("Content script - Post content:", postContent);
            sendResponse({postContent: postContent});
        }
    }
);

function getLinkedInPostContent() {
    let postContent = "";
    // Attempt to find the main post content container for text-based posts
    const textPostContainer = document.querySelector('.feed-shared-update-v2 .update-components-text');

    if (textPostContainer) {
        // Extract the text content from the text post container
        postContent = textPostContainer.innerText;
    } else {
        // If the text post container is not found, try to find a more specific post container for article-based posts
        const articleContainer = document.querySelector('article div[data-test-text-entity-container]');
        if (articleContainer) {
            // Extract the text content from the article container
            postContent = articleContainer.innerText;
        } else {
            console.error("Could not find post content using any selectors.");
            postContent = "Could not find post content.";
        }
    }

    // Clean up the extracted text
    postContent = cleanUpPostContent(postContent);

    return postContent
}

function cleanUpPostContent(text) {
    // Remove extra whitespace and line breaks
    let cleanedText = text.replace(/\s+/g, ' ').trim();

    // Remove any leading or trailing newlines
    cleanedText = cleanedText.replace(/^\n+|\n+$/g, '');

    return cleanedText;
}
