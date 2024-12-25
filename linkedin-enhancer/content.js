console.log("Content script loaded");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "getPostContent") {
            try {
                const postContent = getLinkedInPosts();
                console.log("Content script - Post content:", postContent);
                sendResponse({ posts: postContent });
            } catch (error) {
                console.error("Content script - Error getting post content:", error);
                sendResponse({ error: "Could not retrieve post content." });
            }
        }
    }
);

function getLinkedInPosts() {
    try {
        const posts = [];
        const postContainers = document.querySelectorAll('.feed-shared-update-v2');

        if (postContainers.length === 0) {
            throw new Error("No posts found on the page");
        }

        postContainers.forEach(postContainer => {
            let postContent = "";
            let posterName = "";
            // Extract poster name
            const nameElements = postContainer.querySelectorAll('.update-components-actor__title > span > span[aria-hidden="true"], .feed-shared-actor__name');

            if (nameElements.length > 0) {
                posterName = nameElements[0].innerText.trim();
            } else {
                console.error("Content script - Could not find any heading elements for this post.");
            }

            // Attempt to find the main post content container for text-based posts
            const textPostContainer = postContainer.querySelector('.update-components-text');

            if (textPostContainer) {
                // Extract the text content from the text post container
                postContent = textPostContainer.innerHTML;
            } else {
                // If the text post container is not found, try to find a more specific post container for article-based posts
                const articleContainer = postContainer.querySelector('article div[data-test-text-entity-container]');
                if (articleContainer) {
                    // Extract the text content from the article container
                    postContent = articleContainer.innerHTML;
                } else {
                    console.error("Could not find post content using any selectors.");
                    postContent = "Could not find post content.";
                }
            }

            // Clean up the extracted text
            postContent = cleanUpPostContent(postContent);
        
            // Remove the poster's name from the post content
            postContent = removeNameFromContent(postContent, posterName);

            posts.push({
                posterName: posterName,
                postContent: postContent
            });
        });

        return posts;
    } catch (error) {
        console.error("Error in getLinkedInPosts:", error);
        return [];
    }
}

function cleanUpPostContent(text) {
    if (text) {
        // Remove extra whitespace and line breaks
        let cleanedText = text.replace(/\s+/g, ' ').trim();
        // Remove any leading or trailing newlines
        cleanedText = cleanedText.replace(/^\n+|\n+$/g, '');
        return cleanedText;
    }
    return "";
}

function removeNameFromContent(content, name) {
    if (!content || !name) {
        return content;
    }
    // Create a regex to match the name, with consecutive occurrences
    const nameRegex = new RegExp(`(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*)+`, 'gi');
    // Replace all occurrences of the name with an empty string
    return content.replace(nameRegex, '').trim();
}
