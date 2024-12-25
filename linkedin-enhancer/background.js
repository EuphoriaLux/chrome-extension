console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

chrome.action.onClicked.addListener(async (tab) => {
    console.log("Extension icon clicked. Tab URL:", tab.url);
    
    if (!tab.url.includes("linkedin.com")) {
        console.error("Not a LinkedIn page");
        return;
    }

    try {
        // Store the original tab ID
        const originalTabId = tab.id;

        // Create the window first
        const newWindow = await chrome.windows.create({
            url: "window.html",
            type: "popup",
            width: 800,
            height: 600
        });

        console.log("Injecting content script...");
        await chrome.scripting.executeScript({
            target: { tabId: originalTabId },
            files: ['content.js']
        });
        console.log("Content script injected successfully");

        // Wait for both the content script and window to be ready
        setTimeout(async () => {
            try {
                console.log("Sending message to content script to get posts...");
                const response = await chrome.tabs.sendMessage(originalTabId, {action: "getPostContent"});
                console.log("Received response from content script:", response);
                
                // Get the tab in the new window
                const windowTabs = await chrome.tabs.query({windowId: newWindow.id});
                if (windowTabs && windowTabs[0]) {
                    const popupTabId = windowTabs[0].id;
                    
                    // Send the posts to the popup window
                    await chrome.tabs.sendMessage(popupTabId, {
                        action: "setPostContent",
                        postContent: response?.posts || [],
                        debug: response?.debug || {}
                    });
                }
            } catch (error) {
                console.error("Error in message handling:", error);
            }
        }, 2000);

    } catch (error) {
        console.error("Error in click handler:", error);
    }
});
