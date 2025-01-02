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
            files: ['contentScript.bundle.js']
        });
        console.log("Content script injected successfully");

        // Increase timeout and add error handling
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            console.log("Sending message to content script to get posts...");
            const response = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(originalTabId, {action: "getPostContent"}, response => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            console.log("Received response from content script:", response);
            
            // Get the tab in the new window
            const windowTabs = await chrome.tabs.query({windowId: newWindow.id});
            if (windowTabs && windowTabs[0]) {
                const popupTabId = windowTabs[0].id;
                
                // Send the posts to the popup window
                try {
                    await new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(popupTabId, {
                            action: "setPostContent",
                            postContent: response?.posts || [],
                            debug: response?.debug || {}
                        }, response => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(response);
                            }
                        });
                    });
                } catch (error) {
                    console.error("Error sending message to window:", error);
                    console.error("Error details:", chrome.runtime.lastError);
                }
            } else {
                console.error("Could not find the tab in the new window");
            }
        } catch (error) {
            console.error("Error in message handling:", error);
        }

    } catch (error) {
        console.error("Error in click handler:", error);
    }
});
