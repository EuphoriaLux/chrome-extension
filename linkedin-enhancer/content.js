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

            // Updated selectors for poster name
            const nameElements = postContainer.querySelectorAll([
                '.update-components-actor__title span[dir="ltr"]',
                '.feed-shared-actor__title span[dir="ltr"]',
                '.update-components-actor__name',
                '.feed-shared-actor__name',
                '.update-components-actor__meta-link'
            ].join(', '));

            if (nameElements.length > 0) {
                posterName = nameElements[0].innerText.trim();
            } else {
                // Fallback method to find name
                const nameLink = postContainer.querySelector('a[data-tracking-control-name="feed_shared-actor-name"]');
                if (nameLink) {
                    posterName = nameLink.innerText.trim();
                } else {
                    console.warn("Content script - Could not find name using primary or fallback selectors");
                    posterName = "Unknown User";
                }
            }

            // Updated selectors for post content
            const textContentElement = postContainer.querySelector('.update-components-text, .feed-shared-update-v2__commentary');
            const articleContentElement = postContainer.querySelector('[data-text-entity-list-container="true"]');

            if (textContentElement) {
                postContent = textContentElement.innerHTML;
            } else if (articleContentElement) {
                postContent = articleContentElement.innerHTML;
            } else {
                console.warn("Content script - Could not find content using any selectors.");
                postContent = "Content not available.";
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
        // Handle HTML entities and decode them
        const tempElement = document.createElement('div');
        tempElement.innerHTML = cleanedText;
        cleanedText = tempElement.textContent || tempElement.innerText || "";
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
