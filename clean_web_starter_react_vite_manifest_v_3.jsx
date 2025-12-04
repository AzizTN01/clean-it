# CleanWeb — Starter extension (React + Vite + Manifest V3)

This repository scaffold contains a minimal, ready-to-run Chrome/Firefox extension that implements the "réorganiser le web" idea:
- React (Vite) for **popup** and **options** UI
- **Content script** (vanilla JS) for selecting and hiding elements
- **Service worker** (background) for messaging and persistence via `chrome.storage`
- Manifest V3

---

## Project structure

```
cleanweb-starter/
├── manifest.json
├── package.json
├── vite.config.js
├── public/
│   └── icons/ (some icons)
├── src/
│   ├── content.js            # content script: selection + apply saved hides
│   ├── content.css
│   ├── background.js        # service worker
│   ├── utils/selector.js    # generate stable selector
│   ├── popup/               # React popup app (Vite)
│   │   ├── main.jsx
│   │   └── Popup.jsx
│   └── options/             # React options page
│       ├── main.jsx
│       └── Options.jsx
└── README.md
```

---

Below are the full files. Copy them into a folder and run the dev steps below.

---

### package.json

```json
{
  "name": "cleanweb-starter",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

---

### vite.config.js

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: 'index.html',
        options: 'options.html'
      }
    }
  }
});
```

---

### manifest.json (Manifest V3)

```json
{
  "manifest_version": 3,
  "name": "CleanWeb - Réorganiser le web",
  "version": "1.0.0",
  "description": "Masquez définitivement les éléments gênants sur vos sites préférés.",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "permissions": [
    "storage",
    "scripting",
    "activeTab"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "index.html",
    "default_title": "CleanWeb"
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ]
}
```

---

### src/utils/selector.js

A small utility that attempts to create a reproducible CSS selector for an element.

```js
// src/utils/selector.js
export function cssPath(el) {
  if (!(el instanceof Element)) return null;
  // prefer id
  if (el.id) return `#${CSS.escape(el.id)}`;

  const parts = [];
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.className) {
      const cls = Array.from(el.classList).filter(Boolean)[0];
      if (cls) selector += `.${cls}`;
    }

    const sibling = el;
    let nth = 1;
    let siblingIdx = 0;
    let siblingEl = sibling.previousElementSibling;
    while (siblingEl) {
      if (siblingEl.nodeName === sibling.nodeName) nth++;
      siblingEl = siblingEl.previousElementSibling;
    }
    selector += `:nth-of-type(${nth})`;
    parts.unshift(selector);
    if (parts.length > 5) break; // dont build huge selectors
    el = el.parentElement;
  }
  return parts.join(' > ');
}
```

---

### src/content.css

```css
/* small visual helper for selection mode */
.cleanweb-highlight { outline: 3px solid rgba(255, 165, 0, 0.9) !important; cursor: crosshair !important; }
.cleanweb-hidden-indicator { position: absolute; background: rgba(255,165,0,0.85); color: #111; font-size: 11px; padding: 2px 6px; z-index: 99999999999; border-radius: 3px; }
```

---

### src/content.js

The content script does two main things:
- Apply saved hides for the current site on load
- Provide an "edit mode" overlay that allows selecting elements to hide and saves them

```js
// src/content.js
importScripts && importScripts(); // placeholder for compatibility

// Minimal wrapper to allow direct copy-paste into manifest root
(function(){
  // helper: domain key
  function siteKey() {
    return location.hostname;
  }

  // apply a selector: hide elements and mark them
  function applySelector(sel) {
    try {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.dataset.cleanwebHidden) {
          el.dataset.cleanwebHidden = '1';
          el.style.setProperty('display','none','important');
        }
      });
    } catch(e){ console.warn('invalid selector', sel, e); }
  }

  // load stored selectors for this site and apply them
  function applySaved() {
    const key = 'cleanweb:' + siteKey();
    chrome.storage.local.get([key], res => {
      const list = res[key] || [];
      list.forEach(s => applySelector(s));
    });
  }

  applySaved();

  // Listen for messages from popup/background
  let selecting = false;
  let lastEl = null;

  function highlight(el) {
    if (lastEl && lastEl !== el) lastEl.classList.remove('cleanweb-highlight');
    if (el) el.classList.add('cleanweb-highlight');
    lastEl = el;
  }

  function clearHighlight() { if (lastEl) lastEl.classList.remove('cleanweb-highlight'); lastEl = null; }

  function generateSelector(el) {
    // naive selector generator using data attributes, id, classes and nth-of-type
    // try to get unique selector
    if (!el) return null;
    if (el.id) return `#${CSS.escape(el.id)}`;
    const path = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === Node.ELEMENT_NODE && depth < 6) {
      let name = node.nodeName.toLowerCase();
      if (node.classList && node.classList.length) {
        name += '.' + Array.from(node.classList).slice(0,1).map(c=>CSS.escape(c)).join('.');
      }
      // nth-of-type
      let nth = 1;
      let p = node.previousElementSibling;
      while (p) { if (p.nodeName === node.nodeName) nth++; p = p.previousElementSibling; }
      name += `:nth-of-type(${nth})`;
      path.unshift(name);
      node = node.parentElement;
      depth++;
    }
    return path.join(' > ');
  }

  function startSelectingMode() {
    if (selecting) return;
    selecting = true;
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
    document.body.style.cursor = 'crosshair';
  }

  function stopSelectingMode() {
    selecting = false;
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    document.body.style.cursor = '';
    clearHighlight();
  }

  function onMove(e) {
    const el = e.target;
    highlight(el);
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    const sel = generateSelector(el);
    if (!sel) return stopSelectingMode();

    const key = 'cleanweb:' + siteKey();
    chrome.storage.local.get([key], res => {
      const list = res[key] || [];
      if (!list.includes(sel)) list.push(sel);
      chrome.storage.local.set({[key]: list}, () => {
        applySelector(sel);
        // small visual feedback
        const badge = document.createElement('div');
        badge.className = 'cleanweb-hidden-indicator';
        badge.textContent = 'Masqué — CleanWeb';
        document.body.appendChild(badge);
        badge.style.left = (e.pageX + 8) + 'px';
        badge.style.top = (e.pageY + 8) + 'px';
        setTimeout(()=>badge.remove(), 1400);
      });
    });

    stopSelectingMode();
  }

  function onKey(e) {
    if (e.key === 'Escape') stopSelectingMode();
  }

  // expose simple API via window for popup to call via scripting.executeScript if needed
  window.cleanweb = window.cleanweb || {};
  window.cleanweb.startSelectingMode = startSelectingMode;
  window.cleanweb.stopSelectingMode = stopSelectingMode;
  window.cleanweb.getSiteKey = siteKey;

  // also listen for runtime messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'CLEANWEB_START_SELECT') {
      startSelectingMode();
      sendResponse({ok: true});
    }
    if (msg?.type === 'CLEANWEB_RESET_SITE') {
      const key = 'cleanweb:' + siteKey();
      chrome.storage.local.remove([key], () => { location.reload(); });
      sendResponse({ok: true});
    }
    if (msg?.type === 'CLEANWEB_TOGGLE_DISABLED') {
      // future: toggle a disabled flag stored in storage
      sendResponse({ok: true});
    }
  });

})();
```

---

### src/background.js

A minimal service worker that proxies messages from popup to content script (if needed)

```js
// src/background.js
chrome.action.onClicked.addListener((tab) => {
  // open popup is default; if you want to open a quick toggle, implement here
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // handle global commands
  sendResponse({received: true});
});
```

---

### index.html (popup entry)

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CleanWeb</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/popup/main.jsx"></script>
  </body>
</html>
```

---

### options.html (options entry)

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CleanWeb Options</title>
  </head>
  <body>
    <div id="options-root"></div>
    <script type="module" src="/src/options/main.jsx"></script>
  </body>
</html>
```

---

### src/popup/main.jsx

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';

createRoot(document.getElementById('root')).render(<Popup/>);
```

---

### src/popup/Popup.jsx

```jsx
import React, { useEffect, useState } from 'react';

function Popup(){
  const [status, setStatus] = useState('idle');
  const [site, setSite] = useState('');

  useEffect(()=>{
    // get active tab domain
    chrome.tabs.query({active:true,currentWindow:true},tabs=>{
      const url = tabs[0]?.url || '';
      try{ setSite(new URL(url).hostname); }catch(e){}
    });
  },[]);

  function startSelect(){
    chrome.tabs.query({active:true,currentWindow:true}, (tabs)=>{
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: {tabId},
        func: () => window.cleanweb && window.cleanweb.startSelectingMode && window.cleanweb.startSelectingMode()
      });
      setStatus('selecting');
    });
  }

  function resetSite(){
    chrome.tabs.query({active:true,currentWindow:true}, (tabs)=>{
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: {tabId},
        func: () => chrome.runtime.sendMessage({type:'CLEANWEB_RESET_SITE'})
      });
    });
  }

  return (
    <div style={{fontFamily:'system-ui',width:320,padding:12}}>
      <h3>CleanWeb</h3>
      <div style={{marginBottom:8}}>Site: <strong>{site}</strong></div>
      <button onClick={startSelect} style={{width:'100%',padding:8,marginBottom:6}}>Entrer en mode édition</button>
      <button onClick={resetSite} style={{width:'100%',padding:8,background:'#eee'}}>Réinitialiser ce site</button>
      <div style={{marginTop:12,fontSize:12,color:'#666'}}>Mode: {status}</div>
      <a href={'options.html'} style={{display:'block',marginTop:8}}>Gérer les sites nettoyés</a>
    </div>
  );
}

export default Popup;
```

---

### src/options/main.jsx

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Options from './Options';

createRoot(document.getElementById('options-root')).render(<Options/>);
```

---

### src/options/Options.jsx

```jsx
import React, { useEffect, useState } from 'react';

function Options(){
  const [sites, setSites] = useState({});

  useEffect(()=>{
    chrome.storage.local.get(null, res => {
      const data = {};
      Object.keys(res).forEach(k=>{
        if (k.startsWith('cleanweb:')) data[k.replace('cleanweb:','')] = res[k];
      });
      setSites(data);
    });
  },[]);

  function resetDomain(domain){
    chrome.storage.local.remove(['cleanweb:' + domain], ()=>{
      const copy = {...sites}; delete copy[domain]; setSites(copy);
    });
  }

  function resetAll(){
    const keys = Object.keys(sites).map(d=>'cleanweb:'+d);
    chrome.storage.local.remove(keys, ()=> setSites({}));
  }

  return (
    <div style={{padding:20,fontFamily:'system-ui'}}>
      <h2>Sites nettoyés</h2>
      {Object.keys(sites).length === 0 && <div>Aucun site nettoyé pour l'instant.</div>}
      <ul>
        {Object.entries(sites).map(([domain, list]) => (
          <li key={domain} style={{marginBottom:12}}>
            <div style={{fontWeight:600}}>{domain}</div>
            <div style={{fontSize:13,color:'#444'}}>{list.length} sélecteur(s)</div>
            <div style={{marginTop:6}}>
              <button onClick={()=>resetDomain(domain)} style={{marginRight:8}}>Réinitialiser</button>
            </div>
          </li>
        ))}
      </ul>
      <hr />
      <button onClick={resetAll}>Réinitialiser tout</button>
    </div>
  );
}

export default Options;
```

---

## Dev & build

1. `npm install`
2. `npm run build` — Vite outputs `dist/` with `index.html`, `options.html` and built assets.
3. Load the extension in Chrome/Edge/Firefox: `chrome://extensions` → Developer mode → "Load unpacked" → select the `dist` folder.

During development you can develop popup/options using `npm run dev` and preview them in the browser by opening `/index.html` and `/options.html` — but for full extension features you must build and load the `dist`.

---

## Notes & improvements (next steps)
- Improve selector logic to prefer stable attributes (data-*, role, aria labels)
- Add UI to temporarily disable cleaning on a page
- Add visual overlay showing hidden areas on demand
- Add undo per-selector in options
- Add syncing via `chrome.storage.sync` if you want cross-device sync (quota limits)

---

Bonne chance — vous avez maintenant un starter complet. Copiez-le dans un dossier, `npm install` puis `npm run build` et chargez `dist/` dans Chrome. Si vous voulez, je peux générer les fichiers en ZIP ou les adapter pour Firefox (manifest differences).

