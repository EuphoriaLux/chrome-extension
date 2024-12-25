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
    
    // Updated selector to match current LinkedIn feed posts
    const postContainers = document.querySelectorAll([
        'div.feed-shared-update-v2',
        'div.occludable-update',
        'div[data-urn]'
    ].join(', '));
    
    console.log("Found post containers:", postContainers.length);
    
    postContainers.forEach((postContainer, index) => {
        console.log(`Processing post ${index + 1}`);
        let postContent = "";
        let posterName = "";

        // Updated name selectors
        const nameSelectors = [
            'span.feed-shared-actor__name',
            'span.update-components-actor__name',
            'a.feed-shared-actor__container-link span',
            'div.update-components-actor__meta-link',
            '.actor-name', // Generic actor name class
            'a[data-control-name="actor"] span'
        ];

        // Try each name selector
        for (let selector of nameSelectors) {
            const nameElement = postContainer.querySelector(selector);
            if (nameElement) {
                posterName = nameElement.innerText.split('\n')[0].trim();
                console.log(`Found name using selector "${selector}":`, posterName);
                break;
            }
        }

        if (!posterName) {
            console.warn(`Could not find name for post ${index + 1}`);
            posterName = "Unknown User";
        }

        // Updated content selectors
        const contentSelectors = [
            'div.feed-shared-update-v2__description-wrapper',
            'div.feed-shared-text',
            'div.feed-shared-update-v2__commentary',
            'div.update-components-text',
            'span[dir="ltr"]',
            'div.feed-shared-inline-show-more-text'
        ];

        // Try each content selector
        for (let selector of contentSelectors) {
            const contentElement = postContainer.querySelector(selector);
            if (contentElement) {
                postContent = contentElement.innerText || contentElement.textContent;
                console.log(`Found content using selector "${selector}"`);
                break;
            }
        }

        if (!postContent) {
            console.warn(`Could not find content for post ${index + 1}`);
            postContent = "Content not available";
        }

        // Clean up the extracted text
        postContent = cleanUpPostContent(postContent);
        postContent = removeNameFromContent(postContent, posterName);

        console.log(`Post ${index + 1} processed:`, { posterName, postContent });
        
        posts.push({
            posterName: posterName,
            postContent: postContent
        });
    });

    console.log(`Total posts processed: ${posts.length}`);
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
