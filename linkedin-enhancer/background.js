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
                handleWindowMessage(newWindow, response);
            } else {
                console.error("Background script - Error or no posts from content script");
                handleWindowMessage(newWindow, { posts: null });
            }
        });
    });
});
