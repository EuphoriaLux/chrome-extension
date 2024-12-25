console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

function handleWindowMessage(newWindow, response) {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === newWindow.tabs[0].id && changeInfo.status === 'complete') {
            chrome.tabs.sendMessage(tabId, {
                action: "setPostContent",
                postContent: response?.posts || null
            });
            chrome.tabs.onUpdated.removeListener(listener);
        }
    });
}

chrome.action.onClicked.addListener(async (tab) => {
    console.log("Background script - Extension icon clicked");
    
    // First, ensure we're on a LinkedIn page
    if (!tab.url.includes("linkedin.com")) {
        console.error("Not a LinkedIn page");
        return;
    }

    try {
        // Inject the content script if it hasn't been injected
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        // Create the window after ensuring content script is loaded
        chrome.windows.create({
            url: "window.html",
            type: "normal"
        }, function(newWindow) {
            // Wait a short moment before sending the message
            setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, {action: "getPostContent"}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message:", chrome.runtime.lastError);
                        handleWindowMessage(newWindow, { posts: null });
                        return;
                    }
                    
                    if (response && response.posts) {
                        console.log("Background script - Received posts from content script:", response.posts);
                        handleWindowMessage(newWindow, response);
                    } else {
                        console.error("Background script - Error or no posts from content script");
                        handleWindowMessage(newWindow, { posts: null });
                    }
                });
            }, 500); // Add a 500ms delay
        });
    } catch (error) {
        console.error("Error injecting content script:", error);
    }
});
