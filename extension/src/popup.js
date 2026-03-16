/**
 * popup.js – Extension popup logic
 * Communicates with background.js via chrome.runtime.sendMessage
 */

const $ = id => document.getElementById(id);

let timerInterval = null;
let trackingStart = null;

// ── Init: check current state ─────────────────────────────────
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
  if (state?.tracking && state?.sessionId) {
    showActiveUI(state.sessionId);
  } else {
    showIdleUI();
  }
});

// ── Restore saved token & session ────────────────────────────
chrome.storage.local.get(['authToken', 'sessionId', 'trackingStart'], (data) => {
  if (data.authToken)  $('token-input').value   = data.authToken;
  if (data.sessionId)  $('session-input').value = data.sessionId;
  if (data.trackingStart) trackingStart = data.trackingStart;
});

// ── Start tracking ────────────────────────────────────────────
$('start-btn').addEventListener('click', () => {
  const token     = $('token-input').value.trim();
  const sessionId = $('session-input').value.trim();

  if (!token)     return showError('Please paste your API token.');
  if (!sessionId) return showError('Please enter a session ID.');

  hideError();
  $('start-btn').disabled = true;
  $('start-btn').textContent = 'Starting…';

  chrome.storage.local.set({ authToken: token, sessionId, trackingStart: Date.now() });

  chrome.runtime.sendMessage({ type: 'START_TRACKING', sessionId, token }, (res) => {
    $('start-btn').disabled = false;
    $('start-btn').textContent = 'Start Tracking';
    if (res?.ok) {
      trackingStart = Date.now();
      showActiveUI(sessionId);
    } else {
      showError('Failed to start tracking. Check your token and session ID.');
    }
  });
});

// ── Stop tracking ─────────────────────────────────────────────
$('stop-btn').addEventListener('click', () => {
  $('stop-btn').disabled = true;
  $('stop-btn').textContent = 'Stopping…';

  chrome.runtime.sendMessage({ type: 'STOP_TRACKING' }, () => {
    stopTimer();
    showIdleUI();
  });
});

// ── UI helpers ────────────────────────────────────────────────
function showActiveUI(sessionId) {
  $('auth-section').style.display   = 'none';
  $('active-section').style.display = 'block';
  $('active-subject').textContent   = `Session: ${sessionId.slice(0, 8)}…`;

  setStatus('active', 'Tracking active');
  startTimer();
}

function showIdleUI() {
  $('auth-section').style.display   = 'block';
  $('active-section').style.display = 'none';
  $('stop-btn').disabled    = false;
  $('stop-btn').textContent = 'Stop Tracking';
  setStatus('idle', 'Not tracking');
  stopTimer();
}

function setStatus(type, text) {
  const el = $('status');
  el.className = `status ${type}`;
  $('status-text').textContent = text;
}

function showError(msg) {
  const el = $('error');
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError() {
  $('error').style.display = 'none';
}

// ── Timer ─────────────────────────────────────────────────────
function startTimer() {
  stopTimer();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTimer() {
  chrome.storage.local.get('trackingStart', (data) => {
    const start   = data.trackingStart || Date.now();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    $('active-timer').textContent = formatTimer(elapsed);
  });
}

function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}
