# CleanWeb - Chrome Extension

A Chrome extension that allows you to permanently hide annoying elements on your favorite websites.

## Features

- **Element Selection Mode**: Click on any element on a webpage to hide it permanently
- **Per-Site Storage**: Hidden elements are remembered for each website separately  
- **Options Page**: Manage all your hidden elements across different sites
- **Visual Feedback**: See which elements you're about to hide with hover highlights

## Installation

1. Build the extension:
   ```bash
   npm install
   npm run build
   ```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Usage

1. **Hide Elements**: 
   - Click the CleanWeb extension icon in your browser toolbar
   - Click "Entrer en mode édition" (Enter edit mode)
   - Hover over elements on the page to see them highlighted
   - Click on any element to hide it permanently
   - Press Escape to exit edit mode

2. **Manage Hidden Elements**:
   - Click the extension icon and select "Gérer les sites nettoyés"
   - View all sites where you've hidden elements
   - Reset individual sites or all sites

3. **Reset a Site**:
   - Click the extension icon
   - Click "Réinitialiser ce site" to unhide all elements on the current site

## Development

- `npm run dev` - Start Vite dev server for popup/options development
- `npm run build` - Build the extension for production
- `npm run lint` - Run ESLint

## Debugging

If elements are not hiding properly:

1. **Check Console**: Open Developer Tools (F12) and look for CleanWeb messages
2. **Verify Selection Mode**: Elements should highlight in orange when hovering
3. **Check Storage**: Look in Application > Extension Storage for saved selectors
4. **Reload Extension**: Go to chrome://extensions and reload CleanWeb

See `TROUBLESHOOTING.md` for detailed debugging steps.

## File Structure

```
src/
├── content.js          # Content script (element selection & hiding)
├── content.css         # Styles for selection mode
├── background.js       # Service worker
├── popup/             # React popup UI
│   ├── main.jsx
│   └── Popup.jsx
└── options/           # React options page
    ├── main.jsx
    └── Options.jsx
```

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# clean-it
