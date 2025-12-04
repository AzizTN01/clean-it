// src/content.js
console.log('CleanWeb content script loaded');

// Wait for DOM to be ready
function initCleanWeb() {
  // helper: domain key
  function siteKey() {
    return location.hostname;
  }

  // apply a selector: hide elements and mark them
  function applySelector(sel) {
    try {
      const elements = document.querySelectorAll(sel);
      console.log(`Applying selector "${sel}" to ${elements.length} elements`);

      elements.forEach(el => {
        if (!el.dataset.cleanwebHidden) {
          el.dataset.cleanwebHidden = '1';
          el.style.setProperty('display', 'none', 'important');
          console.log('Hidden element:', el);
        }
      });
    } catch(e) {
      console.warn('Invalid selector:', sel, e);
    }
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
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;

    // If element has a unique ID, use it
    if (el.id) {
      const idSelector = `#${CSS.escape(el.id)}`;
      if (document.querySelectorAll(idSelector).length === 1) {
        return idSelector;
      }
    }

    // Build a path from the element to a reasonable ancestor
    const path = [];
    let current = el;

    while (current && current !== document.body && path.length < 6) {
      let selector = current.tagName.toLowerCase();

      // Add class if available and not too generic
      if (current.classList.length > 0) {
        const classes = Array.from(current.classList)
          .filter(cls => cls && !cls.startsWith('cleanweb'))
          .slice(0, 2); // Limit to 2 classes to avoid over-specificity

        if (classes.length > 0) {
          selector += '.' + classes.map(cls => CSS.escape(cls)).join('.');
        }
      }

      // Add nth-child for specificity
      const siblings = Array.from(current.parentNode?.children || [])
        .filter(sibling => sibling.tagName === current.tagName);

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    const finalSelector = path.join(' > ');
    console.log('Generated selector:', finalSelector);
    return finalSelector;
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

    console.log('Element clicked:', el);
    const sel = generateSelector(el);
    console.log('Generated selector:', sel);

    if (!sel) {
      console.warn('No selector generated, stopping selection mode');
      return stopSelectingMode();
    }

    const key = 'cleanweb:' + siteKey();
    chrome.storage.local.get([key], res => {
      const list = res[key] || [];
      if (!list.includes(sel)) {
        list.push(sel);
        console.log('Adding selector to storage:', sel);
      }

      chrome.storage.local.set({[key]: list}, () => {
        console.log('Selector saved, applying immediately');
        applySelector(sel);

        // Visual feedback
        const badge = document.createElement('div');
        badge.className = 'cleanweb-hidden-indicator';
        badge.textContent = 'Masqué — CleanWeb';
        badge.style.position = 'fixed';
        badge.style.left = (e.clientX + 8) + 'px';
        badge.style.top = (e.clientY + 8) + 'px';
        badge.style.background = 'rgba(255,165,0,0.9)';
        badge.style.color = '#000';
        badge.style.padding = '4px 8px';
        badge.style.borderRadius = '3px';
        badge.style.fontSize = '12px';
        badge.style.zIndex = '999999999';
        badge.style.pointerEvents = 'none';

        document.body.appendChild(badge);
        setTimeout(() => badge.remove(), 2000);
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

}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCleanWeb);
} else {
  initCleanWeb();
}
