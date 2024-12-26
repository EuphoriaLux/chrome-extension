// Save options to chrome.storage
function saveOptions() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const defaultPrompt = document.getElementById('defaultPrompt').value.trim();
    const status = document.getElementById('status');

    // Validate API key
    if (!apiKey) {
        showStatus('API key is required.', 'error');
        return;
    }

    if (!apiKey.match(/^[A-Za-z0-9-_]+$/)) {
        showStatus('Invalid API key format. Please check your key.', 'error');
        return;
    }

    // Validate prompt
    if (!defaultPrompt) {
        showStatus('Default prompt is required.', 'error');
        return;
    }

    if (!defaultPrompt.includes('{content}') || !defaultPrompt.includes('{name}')) {
        showStatus('Prompt must include {content} and {name} placeholders.', 'error');
        return;
    }

    chrome.storage.sync.set({
        apiKey: apiKey,
        defaultPrompt: defaultPrompt
    }, function() {
        if (chrome.runtime.lastError) {
            showStatus('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
        } else {
            showStatus('Settings saved successfully.', 'success');
        }
    });
}

// Show status message with specified type (success/error)
function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(function() {
            status.style.display = 'none';
        }, 2000);
    }
}

// Restore options from chrome.storage
function restoreOptions() {
    chrome.storage.sync.get({
        apiKey: '',
        defaultPrompt: 'You are a professional LinkedIn user. Generate an engaging and relevant comment for the following LinkedIn post by {name}: "{content}". The comment should be professional, add value to the discussion, and maintain a friendly tone. Keep it concise and natural.'
    }, function(items) {
        if (chrome.runtime.lastError) {
            showStatus('Error loading settings: ' + chrome.runtime.lastError.message, 'error');
            return;
        }
        document.getElementById('apiKey').value = items.apiKey;
        document.getElementById('defaultPrompt').value = items.defaultPrompt;
    });
}

// Add input validation listeners
function addValidationListeners() {
    const apiKeyInput = document.getElementById('apiKey');
    const promptInput = document.getElementById('defaultPrompt');
    
    apiKeyInput.addEventListener('input', function() {
        const isValid = this.value.trim().match(/^[A-Za-z0-9-_]*$/);
        this.style.borderColor = isValid ? '' : 'red';
    });

    promptInput.addEventListener('input', function() {
        const value = this.value.trim();
        const hasPlaceholders = value.includes('{content}') && value.includes('{name}');
        this.style.borderColor = hasPlaceholders ? '' : 'red';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    restoreOptions();
    addValidationListeners();
});
document.getElementById('save').addEventListener('click', saveOptions);
