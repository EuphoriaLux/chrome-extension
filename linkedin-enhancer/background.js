console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

chrome.action.onClicked.addListener((tab) => {
    console.log("Background script - Extension icon clicked");
    // Create a new window
    chrome.windows.create({
        url: "window.html",
        type: "normal"
    }, function(newWindow) {
        // Send a message to the content script to get the post content
        chrome.tabs.sendMessage(tab.id, {action: "getPostContent"}, function(response) {
            if (response && response.posts) {
                console.log("Background script - Received posts from content script:", response.posts);
                // Send the post content to the new window
                chrome.runtime.sendMessage({ action: "setPostContent", postContent: response.posts, windowId: newWindow.id });
            } else if (response && response.error) {
                console.error("Background script - Error from content script:", response.error);
                chrome.runtime.sendMessage({ action: "setPostContent", postContent: null, windowId: newWindow.id });
            } else {
                console.error("Background script - Unknown error from content script");
                chrome.runtime.sendMessage({ action: "setPostContent", postContent: null, windowId: newWindow.id });
            }
        });
    });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "setPostContent" && request.windowId) {
            console.log("Background script - Received setPostContent message for window:", request.windowId);
            // Send the post content to the new window
            chrome.tabs.query({windowId: request.windowId}, function(tabs) {
                if (tabs && tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "setPostContent", postContent: request.postContent });
                } else {
                    console.error("Background script - Could not find tab for window:", request.windowId);
                }
            });
        }
    }
);
