console.log("Content script loaded and running");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("Content script received message:", request);
        
        if (request.action === "getPostContent") {
            try {
                console.log("Getting LinkedIn posts...");
                const postContent = getLinkedInPosts();
                console.log("Retrieved posts:", postContent);
                sendResponse({ posts: postContent });
            } catch (error) {
                console.error("Error getting posts:", error);
                sendResponse({ posts: [], error: error.message });
            }
            return true; // Keep the message channel open for async response
        }
    }
);

function getLinkedInPosts() {
    console.log("Starting to extract posts");
    const posts = [];
    const postContainers = document.querySelectorAll('.feed-shared-update-v2');
    console.log("Found post containers:", postContainers.length);
    
    postContainers.forEach(postContainer => {
        let postContent = "";
        let posterName = "";

        // Simplified name extraction
        const nameElement = postContainer.querySelector([
            '.update-components-actor__title span[dir="ltr"]',
            '.feed-shared-actor__title span[dir="ltr"]',
            '.update-components-actor__name',
            '.feed-shared-actor__name',
            '.update-components-actor__meta-link'
        ].join(', '));

        if (nameElement) {
            // Take only the first line of text and clean it
            posterName = nameElement.innerText.split('\n')[0].trim();
        } else {
            // Fallback method
            const nameLink = postContainer.querySelector('a[data-tracking-control-name="feed_shared-actor-name"]');
            if (nameLink) {
                posterName = nameLink.innerText.split('\n')[0].trim();
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

    // Split name into parts to handle first/last name separately
    const nameParts = name.split(/\s+/);

    // Create a regex that matches:
    // 1. The exact full name
    // 2. The name followed by "shared" or "posted"
    // 3. The name at the start of the content
    const patterns = [
        `(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*)`,
        `(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*(shared|posted|writes|commented|likes))`,
        `^(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*)`
    ];

    let cleanContent = content;

    // Apply each pattern
    patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        cleanContent = cleanContent.replace(regex, '');
    });

    // Clean up any resulting double spaces and trim
    cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

    return cleanContent;
}
