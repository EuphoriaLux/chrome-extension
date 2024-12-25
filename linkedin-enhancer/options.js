// Save options to chrome.storage
function saveOptions() {
    const apiKey = document.getElementById('apiKey').value;
    const defaultPrompt = document.getElementById('defaultPrompt').value;
    const status = document.getElementById('status');

    chrome.storage.sync.set({
        apiKey: apiKey,
        defaultPrompt: defaultPrompt
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
        defaultPrompt: 'Please generate a professional and engaging comment for a LinkedIn post. The post content is: {content}. The comment should be professional, relevant, and maintain a friendly tone while adding value to the discussion.'
    }, function(items) {
        document.getElementById('apiKey').value = items.apiKey;
        document.getElementById('defaultPrompt').value = items.defaultPrompt;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
