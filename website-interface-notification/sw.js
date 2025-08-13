console.log('Simple Service Worker Loaded.');

// --- KEY FUNCTION 4: Handle Notification Clicks ---
// This listener waits for a user to click on any notification created by this service worker.
self.addEventListener('notificationclick', event => {
    // Always close the notification when it's clicked.
    event.notification.close();

    // Example: Open a new browser tab to a specific URL.
    // This is useful for directing the user back to your site.
    // event.waitUntil(
    //     clients.openWindow('[https://www.google.com](https://www.google.com)')
    // );

    alert('The notification was clicked!');
});