console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

function handleWindowMessage(newWindow, response) {
    console.log("handleWindowMessage called with response:", response);
    
    // Store the window ID for later use
    const windowId = newWindow.id;
    
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
        console.log("Tab updated:", { 
            tabId, 
            changeInfo, 
            windowId: tab.windowId,
            expectedWindowId: windowId 
        });
        
        // Check if this update is for a tab in our popup window
        if (tab.windowId === windowId && changeInfo.status === 'complete') {
            // Ensure we're not trying to inject into the extensions page
            if (!tab.url.startsWith('chrome://')) {
                console.log("Sending posts to window:", response?.posts);
                
                chrome.tabs.sendMessage(tabId, {
                    action: "setPostContent",
                    postContent: response?.posts || []
                }).catch(error => {
                    console.error("Error sending message:", error);
                });
            }
            
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
        // Store the original tab ID
        const originalTabId = tab.id;

        console.log("Injecting content script...");
        await chrome.scripting.executeScript({
            target: { tabId: originalTabId },
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
            
            // Use a longer delay to ensure the content script is ready
            setTimeout(() => {
                console.log("Sending message to content script to get posts...");
                chrome.tabs.sendMessage(originalTabId, {action: "getPostContent"})
                    .then(response => {
                        console.log("Received response from content script:", response);
                        handleWindowMessage(newWindow, response);
                    })
                    .catch(error => {
                        console.error("Error getting posts:", error);
                        handleWindowMessage(newWindow, { posts: [] });
                    });
            }, 2000); // Increased delay to 2000ms
        });
    } catch (error) {
        console.error("Error in click handler:", error);
    }
});
