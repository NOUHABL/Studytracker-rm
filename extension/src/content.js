/**
 * content.js – Content Script
 *
 * Injected into every page.
 * Currently used to detect page visibility changes so we don't count
 * time when the user has the tab in the background.
 */

(function () {
  let hidden = document.hidden;

  document.addEventListener('visibilitychange', () => {
    const nowHidden = document.hidden;
    if (hidden !== nowHidden) {
      hidden = nowHidden;
      chrome.runtime.sendMessage({ type: 'VISIBILITY_CHANGE', hidden: nowHidden });
    }
  });
})();
