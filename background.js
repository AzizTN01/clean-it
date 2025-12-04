chrome.action.onClicked.addListener((tab) => {
  // open popup is default; if you want to open a quick toggle, implement here
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // handle global commands
  sendResponse({received: true});
});

