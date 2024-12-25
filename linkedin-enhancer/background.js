console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});
