console.log("Background script loaded");

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { action: "getPostContent" }, function(response) {
            let postContent = "Could not retrieve post content.";
            if (response && response.postContent) {
                postContent = response.postContent;
            }

            chrome.windows.create({
                url: chrome.runtime.getURL("popup.html"),
                type: "normal",
                width: 800,
                height: 600
            }, function(newWindow) {
                chrome.runtime.sendMessage({
                    action: "setPostContent",
                    postContent: postContent
                });
            });
        });
  });
});
