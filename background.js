// Handle keyboard shortcut
browser.commands.onCommand.addListener((command) => {
  if (command === "save-to-todoist") {
    saveCurrentUrl();
  }
});

// Handle toolbar button click (left click saves, right click handled by Firefox)
browser.browserAction.onClicked.addListener(() => {
  saveCurrentUrl();
});

// Add context menu for configuration
browser.runtime.onInstalled.addListener(() => {
  browser.menus.create({
    id: "configure-todoist",
    title: "Configure",
    contexts: ["browser_action"]
  });
  // Add context menu item for links to quickly save a link URL
  browser.menus.create({
    id: "save-link-todoist",
    title: "Todoist autosave",
    contexts: ["link"]
  });
});

// Handle context menu click
browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "configure-todoist") {
    browser.runtime.openOptionsPage();
    return;
  }

  if (info.menuItemId === "save-link-todoist") {
    // info.linkUrl contains the URL of the link that was right-clicked
    if (info.linkUrl) {
      saveUrl(info.linkUrl);
    } else {
      showNotification("Error", "No link URL available to save");
    }
    return;
  }
});

async function saveCurrentUrl() {
  try {
    // Get current tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab || !currentTab.url) {
      showNotification("Error", "Could not get current URL");
      return;
    }

    // Delegate to saveUrl to reuse logic
    await saveUrl(currentTab.url);
  } catch (error) {
    showNotification("Error", `Failed to save URL: ${error.message}`);
  }
}

// Save a provided URL as a Todoist task
async function saveUrl(url) {
  try {
    if (!url) {
      showNotification("Error", "No URL provided to save");
      return;
    }

    // Get settings from storage
    const settings = await browser.storage.sync.get(['apiKey', 'projectId']);

    if (!settings.apiKey) {
      showNotification("Configuration Required", "Please set your Todoist API key in the extension settings");
      return;
    }

    if (!settings.projectId) {
      showNotification("Configuration Required", "Please set your Todoist project ID in the extension settings");
      return;
    }

    // Create task in Todoist
    const taskContent = url;

    const response = await fetch('https://api.todoist.com/rest/v2/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        content: taskContent,
        project_id: settings.projectId
      })
    });

    if (response.ok) {
      showNotification("Success", `${taskContent} saved`);
    } else {
      // Guard against non-JSON or empty responses when parsing error details
      let errorText = response.statusText || `HTTP ${response.status}`;
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          errorText = errorData.error || JSON.stringify(errorData) || errorText;
        } else {
          const text = await response.text();
          if (text) errorText = text;
        }
      } catch (parseError) {
        // Fallback if parsing fails
        console.error('Error parsing Todoist error response:', parseError);
      }

      console.error('Todoist API error', response.status, errorText);
      showNotification("Error", `Failed to save: ${errorText}`);
    }
  } catch (error) {
    showNotification("Error", `Failed to save URL: ${error.message}`);
  }
}

function showNotification(title, message) {
  browser.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: title,
    message: message
  });
}