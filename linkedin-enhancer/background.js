console.log("Background script loaded");

chrome.action.onClicked.addListener((tab) => {
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "normal",
    width: 800,
    height: 600
  });
});
