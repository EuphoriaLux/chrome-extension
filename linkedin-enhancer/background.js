console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

let popupReady = false;

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "popupReady") {
            console.log("Background script - Popup is ready");
            popupReady = true;
            // When the popup is ready, send a message to the content script to get the post content
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "getPostContent"}, function(response) {
                    if (response && response.posts) {
                        console.log("Background script - Received posts from content script:", response.posts);
                        // Send the post content to the popup
                        chrome.runtime.sendMessage({ action: "setPostContent", postContent: response.posts });
                    } else if (response && response.error) {
                        console.error("Background script - Error from content script:", response.error);
                        chrome.runtime.sendMessage({ action: "setPostContent", postContent: null });
                    } else {
                        console.error("Background script - Unknown error from content script");
                        chrome.runtime.sendMessage({ action: "setPostContent", postContent: null });
                    }
                });
            });
        }
    }
);
