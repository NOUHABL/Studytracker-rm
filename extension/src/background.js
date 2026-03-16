/**
 * background.js – Service Worker (Manifest V3)
 *
 * Responsibilities:
 *  1. Detect active-tab changes and track time per domain
 *  2. Every 30 seconds, flush accumulated activity to the API
 *  3. Listen for messages from the popup (start/stop tracking)
 */

const API_BASE = 'http://localhost:3001'; // ← update for production
const FLUSH_INTERVAL_SECONDS = 30;

// ─── In-memory state ──────────────────────────────────────────
let currentTab     = null;  // { url, domain, startedAt }
let pendingActivity = {};    // { domain: secondsSpent }
let sessionId      = null;
let authToken      = null;
let tracking       = false;

// ─── Restore state from storage on startup ────────────────────
chrome.storage.local.get(['sessionId', 'authToken', 'tracking'], (data) => {
  sessionId = data.sessionId  || null;
  authToken = data.authToken  || null;
  tracking  = data.tracking   || false;
  if (tracking && sessionId) scheduleFlush();
});

// ─── Tab change: save previous tab's time, start new timer ───
function onTabActivated(tabInfo) {
  if (!tracking) return;
  flushCurrentTab();

  chrome.tabs.get(tabInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab?.url) return;
    currentTab = { url: tab.url, domain: extractDomain(tab.url), startedAt: Date.now() };
  });
}

function onTabUpdated(tabId, changeInfo, tab) {
  if (!tracking || changeInfo.status !== 'complete') return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || tabs[0].id !== tabId) return;
    flushCurrentTab();
    currentTab = { url: tab.url, domain: extractDomain(tab.url), startedAt: Date.now() };
  });
}

function flushCurrentTab() {
  if (!currentTab) return;
  const spent = Math.round((Date.now() - currentTab.startedAt) / 1000);
  if (spent > 1 && currentTab.domain) {
    pendingActivity[currentTab.url] = {
      url:    currentTab.url,
      domain: currentTab.domain,
      spent:  (pendingActivity[currentTab.url]?.spent || 0) + spent,
    };
  }
  currentTab = null;
}

// ─── Periodic flush to API ────────────────────────────────────
function scheduleFlush() {
  chrome.alarms.create('flushActivity', { periodInMinutes: FLUSH_INTERVAL_SECONDS / 60 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flushActivity') sendPendingActivity();
});

async function sendPendingActivity() {
  if (!sessionId || !authToken) return;
  flushCurrentTab();

  const entries = Object.values(pendingActivity);
  if (!entries.length) return;

  pendingActivity = {};

  for (const entry of entries) {
    try {
      await fetch(`${API_BASE}/activity`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          url:        entry.url,
          time_spent: entry.spent,
        }),
      });
    } catch (err) {
      console.warn('[StudyTracker] Failed to send activity:', err);
      // Re-queue on failure
      pendingActivity[entry.url] = entry;
    }
  }
}

// ─── Message handler (popup ↔ background) ────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'START_TRACKING':
      sessionId = msg.sessionId;
      authToken = msg.token;
      tracking  = true;
      chrome.storage.local.set({ sessionId, authToken, tracking: true });
      scheduleFlush();
      sendResponse({ ok: true });
      break;

    case 'STOP_TRACKING':
      sendPendingActivity().then(() => {
        sessionId = null;
        tracking  = false;
        currentTab = null;
        pendingActivity = {};
        chrome.alarms.clear('flushActivity');
        chrome.storage.local.set({ sessionId: null, tracking: false });
        sendResponse({ ok: true });
      });
      return true; // async

    case 'GET_STATE':
      sendResponse({ tracking, sessionId });
      break;
  }
  return true;
});

// ─── Event listeners ──────────────────────────────────────────
chrome.tabs.onActivated.addListener(onTabActivated);
chrome.tabs.onUpdated.addListener(onTabUpdated);

// ─── Helpers ──────────────────────────────────────────────────
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
