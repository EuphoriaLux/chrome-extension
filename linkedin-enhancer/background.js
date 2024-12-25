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
                // Wait for the new window's tab to be fully loaded
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === newWindow.tabs[0].id && changeInfo.status === 'complete') {
                        // Send the post content to the new window
                        chrome.tabs.sendMessage(tabId, { action: "setPostContent", postContent: response.posts });
                        chrome.tabs.onUpdated.removeListener(listener);
                    }
                });
            } else if (response && response.error) {
                console.error("Background script - Error from content script:", response.error);
                // Wait for the new window's tab to be fully loaded
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === newWindow.tabs[0].id && changeInfo.status === 'complete') {
                        // Send the post content to the new window
                        chrome.tabs.sendMessage(tabId, { action: "setPostContent", postContent: null });
                        chrome.tabs.onUpdated.removeListener(listener);
                    }
                });
            } else {
                console.error("Background script - Unknown error from content script");
                // Wait for the new window's tab to be fully loaded
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === newWindow.tabs[0].id && changeInfo.status === 'complete') {
                        // Send the post content to the new window
                        chrome.tabs.sendMessage(tabId, { action: "setPostContent", postContent: null });
                        chrome.tabs.onUpdated.removeListener(listener);
                    }
                });
            }
        });
    });
});
