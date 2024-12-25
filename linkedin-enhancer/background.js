console.log("Background script loaded");

let currentPostContent = "Could not retrieve post content.";
let popupTabId = null
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];

        function sendMessageToContentScript(tabId) {
            chrome.tabs.sendMessage(tabId, { action: "getPostContent" }, function (response) {
                if (response && response.postContent) {
                    console.log("Background script - Received post content:", response.postContent);
                    currentPostContent = response.postContent;
                }
                chrome.windows.create({
                    url: chrome.runtime.getURL("popup.html"),
                    type: "normal",
                    width: 800,
                    height: 600
                }, function (newWindow) {
                    popupTabId = newWindow.tabs[0].id;
                    function sendMessageToPopup(tabId) {
                        console.log("Background script - Sending post content to popup:", currentPostContent);
                        chrome.tabs.sendMessage(tabId, {
                            action: "setPostContent",
                            postContent: currentPostContent,
                        });
                    }
                    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                        if (tabId === popupTabId && changeInfo.status === "complete") {
                            sendMessageToPopup(tabId);
                            chrome.tabs.onUpdated.removeListener(listener);
                        }
                    });
                });
            });
        }

        // Check if the tab is already loaded
        if (activeTab.status === "complete") {
            sendMessageToContentScript(activeTab.id);
        } else {
            // If not, wait for the tab to load
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === activeTab.id && changeInfo.status === "complete") {
                    sendMessageToContentScript(tabId);
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });
            }
        });
});
