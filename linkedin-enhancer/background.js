console.log("Background script loaded");

let currentPostContent = "Could not retrieve post content.";
let popupTabId = null;
let contentTabId = null;
let popupReady = false;

function sendMessageToContentScript(tabId) {
    chrome.tabs.sendMessage(tabId, { action: "getPostContent" }, function (response) {
        if (response && response.posts) {
            console.log("Background script - Received posts from content script:", response.posts);
            currentPostContent = response.posts;
        } else if (response && response.error) {
            console.error("Background script - Error from content script:", response.error);
            currentPostContent = "Could not retrieve post content.";
        } else {
            console.error("Background script - No response or error from content script.");
            currentPostContent = "Could not retrieve post content.";
        }        
        // Create the popup after receiving the response from the content script
        chrome.tabs.create({
            url: chrome.runtime.getURL("popup.html")
        }, function (tab) {
            popupTabId = tab.id;
        });
        if (popupReady) {
            console.log("Background script - Popup is ready, sending message to popup");
            sendMessageToPopup();
        }
    });
}

chrome.action.onClicked.addListener(function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];

        contentTabId = activeTab.id;
        // Check if the tab is already loaded, if not, wait for the tab to load
        if (activeTab.status !== "complete") {
            console.log("Background script - Tab not complete, waiting for update");
            return;
        }
        sendMessageToContentScript(activeTab.id);
    });
});

chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
    if (tabId === contentTabId && changeInfo.status === "complete") {
        console.log("Background script - Tab updated, sending message to content script");
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const activeTab = tabs[0];
            sendMessageToContentScript(activeTab.id);
        });
        chrome.tabs.onUpdated.removeListener(listener);
    }
});
        function sendMessageToPopup() {
            console.log("Background script - Sending post content to popup:", currentPostContent);
            chrome.tabs.sendMessage(popupTabId, {
                action: "setPostContent",
                postContent: currentPostContent,
            });
        }
        
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            switch (request.action) {
                case "popupReady":
                    console.log("Background script - Received popup ready message");
                    popupReady = true;
                    if (popupTabId) {
                        sendMessageToPopup();
                    }
                    if (currentPostContent && popupTabId) {
                        sendMessageToPopup();
                    }
                    break;
                }
        });
