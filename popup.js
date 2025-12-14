// Load saved settings
browser.storage.sync.get(['apiKey', 'projectId']).then((settings) => {
  if (settings.apiKey) {
    document.getElementById('apiKey').value = settings.apiKey;
    document.getElementById('apiKeyStatus').textContent = 'Configured';
    document.getElementById('apiKeyStatus').className = 'field-status configured';
  }
  if (settings.projectId) {
    document.getElementById('projectId').value = settings.projectId;
    document.getElementById('projectIdStatus').textContent = 'Configured';
    document.getElementById('projectIdStatus').className = 'field-status configured';
  }
});

// Load current keyboard shortcut
browser.commands.getAll().then((commands) => {
  const saveCommand = commands.find(cmd => cmd.name === 'save-to-todoist');
  if (saveCommand && saveCommand.shortcut) {
    document.getElementById('shortcut').value = saveCommand.shortcut;
  }
});

// Save settings
document.getElementById('save').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const projectId = document.getElementById('projectId').value.trim();
  const statusDiv = document.getElementById('status');

  if (!apiKey || !projectId) {
    statusDiv.className = 'status error';
    statusDiv.textContent = 'Please fill in all fields';
    return;
  }

  try {
    await browser.storage.sync.set({
      apiKey: apiKey,
      projectId: projectId
    });

    // Update field status indicators
    document.getElementById('apiKeyStatus').textContent = 'Configured';
    document.getElementById('apiKeyStatus').className = 'field-status configured';
    document.getElementById('projectIdStatus').textContent = 'Configured';
    document.getElementById('projectIdStatus').className = 'field-status configured';

    statusDiv.className = 'status success';
    statusDiv.textContent = '✓ Settings saved successfully!';
    statusDiv.style.display = 'block';

    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.textContent = 'Failed to save settings: ' + error.message;
    statusDiv.style.display = 'block';
    console.error('Storage error:', error);
  }
});