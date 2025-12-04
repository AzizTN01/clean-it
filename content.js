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
      sendResponse({ok: true});
    }
  });

})();

