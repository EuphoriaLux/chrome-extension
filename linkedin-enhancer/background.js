console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

function handleWindowMessage(newWindow, response) {
    console.log("handleWindowMessage called with response:", response);
    
    // Store the window ID for later use
    const windowId = newWindow.id;
    
    // Get the first tab in the new window
    chrome.tabs.query({windowId: windowId}, function(tabs) {
        if (tabs && tabs[0]) {
            const tabId = tabs[0].id;
            
            // Wait for the tab to be ready
            chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo, tab) {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                    console.log("Sending posts to window:", response?.posts);
                    
                    chrome.tabs.sendMessage(tabId, {
                        action: "setPostContent",
                        postContent: response?.posts || [],
                        debug: response?.debug || {}
                    }).catch(error => {
                        console.error("Error sending message:", error);
                    });
                    
                    // Remove the listener after sending the message
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });
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
