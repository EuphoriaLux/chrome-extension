console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

function handleWindowMessage(newWindow, response) {
    console.log("handleWindowMessage called with response:", response);
    
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        console.log("Tab updated:", { tabId, changeInfo, expectedTabId: newWindow.tabs[0].id });
        
        if (tabId === newWindow.tabs[0].id && changeInfo.status === 'complete') {
            console.log("Sending posts to window:", response?.posts);
            
            chrome.tabs.sendMessage(tabId, {
                action: "setPostContent",
                postContent: response?.posts || []
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to window:", chrome.runtime.lastError);
                } else {
                    console.log("Message sent successfully to window");
                }
            });
            
            chrome.tabs.onUpdated.removeListener(listener);
        }
    });
}

chrome.action.onClicked.addListener(async (tab) => {
    console.log("Extension icon clicked. Tab URL:", tab.url);
    
    if (!tab.url.includes("linkedin.com")) {
        console.error("Not a LinkedIn page");
        return;
    }

    try {
        console.log("Injecting content script...");
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
        console.log("Content script injected successfully");

        chrome.windows.create({
            url: "window.html",
            type: "popup",
            width: 800,
            height: 600
        }, function(newWindow) {
            console.log("New window created:", newWindow);
            
            setTimeout(() => {
                console.log("Sending message to content script to get posts...");
                chrome.tabs.sendMessage(tab.id, {action: "getPostContent"}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error("Error getting posts:", chrome.runtime.lastError);
                        handleWindowMessage(newWindow, { posts: [] });
                        return;
                    }
                    
                    console.log("Received response from content script:", response);
                    handleWindowMessage(newWindow, response);
                });
            }, 1000); // Increased delay to 1000ms
        });
    } catch (error) {
        console.error("Error in click handler:", error);
    }
});
