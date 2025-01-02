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
        let windowReady = false;
        
        // Listen for the window ready message
        const windowReadyListener = (request, sender, sendResponse) => {
            if (request.action === "windowReady") {
                console.log("Background script - Window ready message received");
                windowReady = true;
                chrome.runtime.onMessage.removeListener(windowReadyListener);
            }
        };
        chrome.runtime.onMessage.addListener(windowReadyListener);

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

        // Increase timeout
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            console.log("Sending message to content script to get posts...");
            const response = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(originalTabId, { action: "getPostContent" }, response => {
                    if (chrome.runtime.lastError) {
                        console.error("Content script message error:", chrome.runtime.lastError);
                        reject(new Error(chrome.runtime.lastError.message));
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
                
                // Wait for the window to be ready before sending the message
                const waitForWindowReady = () => new Promise(resolve => {
                    const check = () => {
                        if (windowReady) {
                            resolve();
                        } else {
                            setTimeout(check, 100);
                        }
                    };
                    check();
                });
                
                await waitForWindowReady();

                chrome.runtime.sendMessage({
                    action: "setPostContent",
                    postContent: response?.posts || [],
                    debug: response?.debug || {}
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message to window:", chrome.runtime.lastError);                            
                    }
                });
            } else {
                console.error("Could not find the tab in the new window");
            }
        } catch (error) {
            console.error("Error in message handling:", error);
            if (chrome.runtime.lastError) {
                console.error("Runtime error details:", chrome.runtime.lastError);
            }
        }

    } catch (error) {
        console.error("Error in click handler:", error);
        if (chrome.runtime.lastError) {
            console.error("Final error details:", chrome.runtime.lastError);
        }
    }
});
