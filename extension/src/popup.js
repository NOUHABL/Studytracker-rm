/**
 * popup.js
 * Auto-connects to the StudyTracker tab — no manual token/session copy-paste needed.
 */

const $ = id => document.getElementById(id);
const API_BASE = 'http://localhost:3001';

let timerInterval = null;

// ── BEM Countdown ─────────────────────────────────────────────
const BEM_DATE = new Date('2026-05-19T08:00:00');
function tickBEM() {
  const diff = BEM_DATE.getTime() - Date.now();
  const bem  = $('bem');
  if (diff <= 0) {
    bem.className = 'bem over';
    bem.innerHTML = '🎓 BEM exam has started — good luck!';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000)  / 60000);
  const s = Math.floor((diff % 60000)    / 1000);
  $('b-d').textContent = String(d).padStart(2,'0');
  $('b-h').textContent = String(h).padStart(2,'0');
  $('b-m').textContent = String(m).padStart(2,'0');
  $('b-s').textContent = String(s).padStart(2,'0');
  bem.className = d < 7 ? 'bem red' : d < 30 ? 'bem amber' : 'bem green';
}
tickBEM();
setInterval(tickBEM, 1000);

// ── Init ──────────────────────────────────────────────────────
chrome.runtime.sendMessage({ type: 'GET_STATE' }, state => {
  if (state?.tracking && state?.sessionId) {
    showActiveUI(state.sessionId, state.subject || '');
  } else {
    showIdleUI();
    refreshInfo();
  }
});

// ── Auto-connect button ───────────────────────────────────────
$('auto-btn').addEventListener('click', autoConnect);
$('refresh-btn').addEventListener('click', refreshInfo);

async function autoConnect() {
  setStatus('idle', 'Connecting…');
  $('auto-btn').disabled = true;
  $('auto-btn').textContent = 'Connecting…';

  try {
    // 1. Get token from the page
    const token = await getTokenFromPage();
    if (!token) throw new Error('Not logged in — open StudyTracker first');

    // 2. Get active session from API
    const res = await fetch(`${API_BASE}/stats/active`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.session) {
      throw new Error('No active session — start one on StudyTracker first');
    }

    const sessionId = data.session.id;
    const subject   = data.session.subject;

    // 3. Save and start tracking
    chrome.storage.local.set({ authToken: token, sessionId, subject, trackingStart: Date.now() });
    chrome.runtime.sendMessage({ type: 'START_TRACKING', sessionId, token }, res => {
      if (res?.ok) {
        showActiveUI(sessionId, subject);
      } else {
        throw new Error('Failed to start tracking');
      }
    });

  } catch (err) {
    setStatus('error', err.message);
    $('auto-btn').disabled = false;
    $('auto-btn').textContent = 'Auto-connect from tab';
  }
}

async function refreshInfo() {
  $('info-auth').textContent    = 'Checking…';
  $('info-session').textContent = 'Checking…';

  try {
    const token = await getTokenFromPage();
    if (!token) {
      $('info-auth').textContent    = 'Not logged in';
      $('info-auth').className      = 'info-value bad';
      $('info-session').textContent = '—';
      return;
    }

    $('info-auth').textContent = 'Logged in';
    $('info-auth').className   = 'info-value good';

    const res  = await fetch(`${API_BASE}/stats/active`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.session) {
      $('info-session').textContent = data.session.subject;
      $('info-session').className   = 'info-value good';
    } else {
      $('info-session').textContent = 'No active session';
      $('info-session').className   = 'info-value bad';
    }
  } catch {
    $('info-auth').textContent    = 'Tab not found';
    $('info-auth').className      = 'info-value bad';
    $('info-session').textContent = '—';
  }
}

// ── Get token from the StudyTracker tab ───────────────────────
function getTokenFromPage() {
  return new Promise((resolve, reject) => {
    // Find the StudyTracker tab
    chrome.tabs.query({ url: 'http://localhost:3000/*' }, tabs => {
      if (!tabs.length) {
        // Try production URL too
        chrome.tabs.query({ url: 'https://*.vercel.app/*' }, tabs2 => {
          if (!tabs2.length) return reject(new Error('StudyTracker tab not found — open it first'));
          askTab(tabs2[0].id, resolve, reject);
        });
        return;
      }
      askTab(tabs[0].id, resolve, reject);
    });
  });
}

function askTab(tabId, resolve, reject) {
  chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_SESSION' }, response => {
    if (chrome.runtime.lastError) {
      return reject(new Error('Cannot reach page — refresh the StudyTracker tab'));
    }
    if (response?.error) return reject(new Error(response.error));
    resolve(response?.token || null);
  });
}

// ── Stop tracking ─────────────────────────────────────────────
$('stop-btn').addEventListener('click', () => {
  $('stop-btn').disabled    = true;
  $('stop-btn').textContent = 'Stopping…';
  chrome.runtime.sendMessage({ type: 'STOP_TRACKING' }, () => {
    stopTimer();
    showIdleUI();
    refreshInfo();
  });
});

// ── UI helpers ────────────────────────────────────────────────
function showActiveUI(sessionId, subject) {
  $('idle-section').style.display   = 'none';
  $('active-section').style.display = 'block';
  $('active-subject').textContent   = subject || `Session ${sessionId.slice(0,8)}…`;
  $('stop-btn').disabled            = false;
  $('stop-btn').textContent         = 'Stop Tracking';
  setStatus('active', 'Tracking active');
  startTimer();
}

function showIdleUI() {
  $('idle-section').style.display   = 'block';
  $('active-section').style.display = 'none';
  $('auto-btn').disabled            = false;
  $('auto-btn').textContent         = 'Auto-connect from tab';
  setStatus('idle', 'Not tracking');
  stopTimer();
}

function setStatus(type, text) {
  $('status').className        = `status ${type}`;
  $('status-text').textContent = text;
}

// ── Session timer ─────────────────────────────────────────────
function startTimer() {
  stopTimer();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}
function updateTimer() {
  chrome.storage.local.get('trackingStart', data => {
    const elapsed = Math.floor((Date.now() - (data.trackingStart || Date.now())) / 1000);
    $('active-timer').textContent = fmt(elapsed);
  });
}
function fmt(s) {
  return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
    .map(v => String(v).padStart(2,'0')).join(':');
}