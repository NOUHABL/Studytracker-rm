/**
 * content.js – Content Script
 * Acts as a bridge between the extension (background/popup) and the web page.
 */

// ── Visibility tracking ───────────────────────────────────────
let hidden = document.hidden;
document.addEventListener('visibilitychange', () => {
  const nowHidden = document.hidden;
  if (hidden !== nowHidden) {
    hidden = nowHidden;
    try {
      chrome.runtime.sendMessage({ type: 'VISIBILITY_CHANGE', hidden: nowHidden });
    } catch (e) {
      // Extension context invalidated — ignore
    }
  }
});

// ── Session bridge ────────────────────────────────────────────
// Listen for requests from the popup via background
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_PAGE_SESSION') {
    // Ask the page for its Supabase session
    window.postMessage({ type: 'ST_GET_SESSION' }, '*');

    // Listen for the page's response (one-time)
    function onResponse(event) {
      if (event.source !== window) return;
      if (event.data?.type !== 'ST_SESSION_RESPONSE') return;
      window.removeEventListener('message', onResponse);
      sendResponse(event.data);
    }

    window.addEventListener('message', onResponse);

    // Timeout after 3 seconds
    setTimeout(() => {
      window.removeEventListener('message', onResponse);
      sendResponse({ error: 'Timeout — make sure you are on the StudyTracker tab' });
    }, 3000);

    return true; // keep channel open for async response
  }
});