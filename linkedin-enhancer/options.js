// Save options to chrome.storage
function saveOptions() {
    const apiKey = document.getElementById('apiKey').value;
    const defaultPrompt = document.getElementById('defaultPrompt').value;
    const status = document.getElementById('status');

    chrome.storage.sync.set({
        apiKey: apiKey,
        defaultPrompt: defaultPrompt || 'You are a professional LinkedIn user. Generate an engaging and relevant comment for the following LinkedIn post by {name}: "{content}". The comment should be professional, add value to the discussion, and maintain a friendly tone. Keep it concise and natural.'
    }, function() {
        status.textContent = 'Settings saved.';
        status.className = 'status success';
        status.style.display = 'block';
        setTimeout(function() {
            status.style.display = 'none';
        }, 2000);
    });
}

// Restore options from chrome.storage
function restoreOptions() {
    chrome.storage.sync.get({
        apiKey: '',
        defaultPrompt: 'You are a professional LinkedIn user. Generate an engaging and relevant comment for the following LinkedIn post by {name}: "{content}". The comment should be professional, add value to the discussion, and maintain a friendly tone. Keep it concise and natural.'
    }, function(items) {
        document.getElementById('apiKey').value = items.apiKey;
        document.getElementById('defaultPrompt').value = items.defaultPrompt;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
