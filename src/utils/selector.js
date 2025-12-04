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
