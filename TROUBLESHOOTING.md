# CleanWeb Troubleshooting Guide

## Extension Not Hiding Elements?

Follow these steps to debug the issue:

### 1. Check Browser Console
1. Open the website where elements aren't hiding
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Look for CleanWeb messages:
   - "CleanWeb content script loaded" - indicates script is running
   - "Element clicked: ..." - shows when you click elements
   - "Generated selector: ..." - shows the CSS selector being created
   - "Applying selector ... to X elements" - shows hiding attempts

### 2. Test Selection Mode
1. Click the CleanWeb extension icon
2. Click "Entrer en mode édition"
3. Hover over elements - they should highlight in orange
4. If no highlighting appears, the content script isn't loading properly

### 3. Check Extension Permissions
1. Go to `chrome://extensions/`
2. Find CleanWeb extension
3. Click "Details"
4. Ensure "Allow access to file URLs" is enabled (if testing on local files)
5. Check that "Site access" shows "On all sites"

### 4. Reload Extension
1. Go to `chrome://extensions/`
2. Find CleanWeb extension
3. Click the refresh button (↻)
4. Reload the webpage and try again

### 5. Check Storage
1. Right-click on the page and select "Inspect"
2. Go to Application tab
3. Look for "Extension storage" or "Local Storage"
4. Check if selectors are being saved under keys like "cleanweb:example.com"

### 6. Test on Different Sites
- Try the extension on different websites (news sites, social media, etc.)
- Some sites may block content scripts or have strict CSP policies

### 7. Debug Mode
Open the browser console and paste this to enable debug mode:
```javascript
localStorage.setItem('cleanweb-debug', 'true');
```

### 8. Manual Test
Paste this in the console to test if the hiding function works:
```javascript
// Test selector generation
function testElement(el) {
  console.log('Testing element:', el);
  // Hide it manually
  el.style.display = 'none';
}

// Click any element to test
document.addEventListener('click', (e) => {
  e.preventDefault();
  testElement(e.target);
}, {once: true});
```

## Common Issues

### Elements Reappear After Page Reload
- This is normal - the extension hides elements when the page loads
- If elements still appear, check if the selector is saved in storage

### Can't Enter Selection Mode
- Make sure you're not on a chrome:// page
- Some sites block extension scripts
- Try refreshing the page and the extension

### Orange Highlight Not Showing
- Check if content.css is loaded
- Some sites may override the CSS styles
- The highlight class should be `.cleanweb-highlight`

## Still Not Working?

1. Check the extension manifest in `dist/manifest.json`
2. Verify all files are present in the `dist` folder
3. Try rebuilding: `npm run build`
4. Reload the extension in Chrome

## Reset Everything
If nothing works, reset the extension:
1. Remove from Chrome extensions
2. Delete the `dist` folder
3. Run `npm run build`
4. Reload the extension
