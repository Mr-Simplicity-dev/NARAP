// ==================== UTILITY CLASSES ====================

// Performance Monitor Class
class PerformanceMonitor {
    constructor() {
        this.startTime = Date.now();
        this.metrics = {};
    }
    
    start(label = 'default') {
        this.metrics[label] = Date.now();
        return this;
    }
    
    end(label = 'default') {
        if (this.metrics[label]) {
            return Date.now() - this.metrics[label];
        }
        return 0;
    }
    
    log(message, label = 'default') {
        const duration = this.end(label);
        return duration;
    }
    
    reset() {
        this.metrics = {};
        this.startTime = Date.now();
    }
}

// Notification Manager Class
// Notification Manager Class (ghost box safe)
// Notification Manager Class (fixed: no ghost box, no duplicates)
class NotificationManager {
  constructor() {
    this.container = null;
    this._ensureStyles();
  }

  _ensureStyles() {
    try {
      if (document.getElementById('notification-styles')) return;
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        #notification-container { position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px; }
        #notification-container:empty { display: none !important; }
        .notification { border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; color: #fff; }
        .notification-info    { background: #17a2b8; }
        .notification-success { background: #28a745; }
        .notification-error   { background: #dc3545; }
        .notification-warning { background: #ffc107; color: #222; }
        .notification button { background: none; border: none; cursor: pointer; font-size: 18px; margin-left: 8px; color: inherit; }
      `;
      document.head.appendChild(style);
    } catch (_) {}
  }

  _getContainer() {
    if (this.container && document.body.contains(this.container)) return this.container;
    const div = document.createElement('div');
    div.id = 'notification-container';
    document.body.appendChild(div);
    this.container = div;
    return div;
  }

  _destroyIfEmpty() {
    try {
      if (this.container && this.container.childElementCount === 0) {
        this.container.remove();
        this.container = null;
      }
    } catch (_) {}
  }

  show(message, type = 'info', duration = 5000) {
    // Ignore empty/whitespace messages to avoid ghost pill
    if (message == null || String(message).trim() === '') {
      this._destroyIfEmpty();
      return;
    }

    this._ensureStyles();
    const container = this._getContainer();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${String(message)}</span>
      <button aria-label="Close notification" title="Close">&times;</button>
    `;

    notification.querySelector('button').addEventListener('click', () => {
      if (notification.parentNode) notification.remove();
      this._destroyIfEmpty();
    });

    container.appendChild(notification);

    if (duration > 0 && Number.isFinite(duration)) {
      setTimeout(() => {
        if (notification.parentNode) notification.remove();
        this._destroyIfEmpty();
      }, duration);
    }
  }

  // Back-compat: keep this alias
  showFallback(message, type = 'info', duration = 5000) {
    this.show(message, type, duration);
  }

  // Back-compat helper (not used when CSS classes apply)
  getBackgroundColor(type) {
    switch (type) {
      case 'success': return '#28a745';
      case 'error':   return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info':
      default:        return '#17a2b8';
    }
  }
}

// Data Cache Class
class DataCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    }

    set(key, data, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

// ==================== GLOBAL CONSTANTS AND STATE ====================


// ==================== ACTIVITY LOGGING (Members & Certificates) ====================
// Persisted in localStorage key: 'narap_activity_log'
(function(){
  if (window.ActivityLogger) return; // don't redefine

  class ActivityLogger {
    constructor(key='narap_activity_log', max=5000){
      this.key = key;
      this.max = max;
    }
    _read(){
      try {
        const raw = localStorage.getItem(this.key);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch(_) { return []; }
    }
    _write(list){
      try {
        const arr = Array.isArray(list) ? list.slice(-this.max) : [];
        localStorage.setItem(this.key, JSON.stringify(arr));
      } catch(e){ console.warn('ActivityLogger write failed:', e); }
    }
    all(){ return this._read().slice().sort((a,b)=>new Date(b.ts)-new Date(a.ts)); }
    clear(){ localStorage.removeItem(this.key); }
    log(entry){
      try {
        const now = new Date();
        const e = Object.assign({
          ts: now.toISOString(),
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString(),
        }, entry || {});
        const list = this._read();
        list.push(e);
        this._write(list);
        return e;
      } catch (err){
        console.warn('ActivityLogger.log failed:', err);
        return null;
      }
    }
    // Convenience API
    member(action, data){ return this.log({entity:'member', action, data}); }
    certificate(action, data){ return this.log({entity:'certificate', action, data}); }
    system(action, data){ return this.log({entity:'system', action, data}); }
  }

  window.ActivityLogger = ActivityLogger;
  window.activityLogger = new ActivityLogger();

  // Simple utilities
  window.getActivityLog = () => activityLogger.all();
  window.logMemberAdd = (m)=>activityLogger.member('added', {id: m?._id||m?.id, code: m?.code, name: m?.name||m?.fullName, state: m?.state||m?.State});
  window.logMemberUpdate = (m)=>activityLogger.member('updated', {id: m?._id||m?.id, code: m?.code, name: m?.name||m?.fullName, state: m?.state||m?.State});
  window.logMemberDelete = (m)=>activityLogger.member('deleted', {id: m?._id||m?.id, code: m?.code, name: m?.name||m?.fullName});
  window.logCertificateAdd = (c)=>activityLogger.certificate('added', {id: c?._id||c?.id, number: c?.certificateNumber||c?.number, member: c?.memberName||c?.recipientName});
  window.logCertificateUpdate = (c)=>activityLogger.certificate('updated', {id: c?._id||c?.id, number: c?.certificateNumber||c?.number, member: c?.memberName||c?.recipientName});
  window.logCertificateDelete = (c)=>activityLogger.certificate('deleted', {id: c?._id||c?.id, number: c?.certificateNumber||c?.number, member: c?.memberName||c?.recipientName});

  // Hook upsertMemberFormData if present (to capture create/update)
  const _origUpsert = window.upsertMemberFormData;
  if (typeof _origUpsert === 'function') {
    window.upsertMemberFormData = async function(mm, formData){
      const existed = (()=>{
        try{
          const locals = (typeof getLocalMembers==='function' ? getLocalMembers() : []) || [];
          const key = (mm?._id||mm?.id) || (mm?.code ? 'c:'+String(mm.code).toLowerCase() : (mm?.email ? 'e:'+String(mm.email).toLowerCase() : null));
          if (!key) return false;
          return locals.some(m=> (m._id&&mm._id&&m._id===mm._id) ||
                                 (m.id&&mm.id&&m.id===mm.id) ||
                                 (mm.code && String(m.code||'').toLowerCase()===String(mm.code).toLowerCase()) ||
                                 (mm.email && String(m.email||'').toLowerCase()===String(mm.email).toLowerCase()));
        }catch(_){ return false; }
      })();
      const res = await _origUpsert.apply(this, arguments);
      try {
        if (res && res.ok) {
          existed ? logMemberUpdate(mm) : logMemberAdd(mm);
        }
      } catch(_){}
      return res;
    }
  }

  // Expose a helper to log deletions when UI deletes locally
  window.logDeletionIfOk = function(entity, original, response){
    try{
      if (response === true || (response && response.ok) || response === 'ok') {
        if (entity === 'member') logMemberDelete(original);
        if (entity === 'certificate') logCertificateDelete(original);
      }
    } catch(_){}
  };

})();


    
// ---- Pagination: persistent values & defaults (DROP-IN, safe) ----
let membersPerPage = parseInt(localStorage.getItem('narap_members_per_page') || '10', 10);
let certificatesPerPage = parseInt(localStorage.getItem('narap_certificates_per_page') || '10', 10);

// Guard current page vars if not present
if (typeof window.membersCurrentPage !== 'number') window.membersCurrentPage = 1;
if (typeof window.certificatesCurrentPage !== 'number') window.certificatesCurrentPage = 1;

// Keep per-page dropdowns in sync with current values
function syncPerPageDropdowns() {
  const savedM = parseInt(localStorage.getItem('narap_members_per_page') || '10', 10);
  const savedC = parseInt(localStorage.getItem('narap_certificates_per_page') || '10', 10);
  const mSel = document.getElementById('membersPerPage');
  if (mSel && String(mSel.value) !== String(savedM)) mSel.value = String(savedM);
  const cSel = document.getElementById('certificatesPerPage');
  if (cSel && String(cSel.value) !== String(savedC)) cSel.value = String(savedC);
}
window.syncPerPageDropdowns = syncPerPageDropdowns;


const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjQ0NDIi8+CjxwYXRoIGQ9Ik0yMCA3NUMyMCA2NS4wNTc2IDI4LjA1NzYgNTcgMzggNTdINjJDNzEuOTQyNCA1NyA4MCA2NS4wNTc2IDgwIDc1VjgwSDIwVjc1WiIgZmlsbD0iI0NDQyIvPgo8L3N2Zz4K';

// ---- Alphabetical sort helpers (safe, non-breaking) ----
function compareByStateThenName(a, b) {
    const sa = (a && a.state ? String(a.state) : '').trim().toLowerCase();
    const sb = (b && b.state ? String(b.state) : '').trim().toLowerCase();
    if (sa !== sb) return sa.localeCompare(sb);
    const na = (a && a.name ? String(a.name) : (a.fullName ? String(a.fullName) : '')).trim().toLowerCase();
    const nb = (b && b.name ? String(b.name) : (b.fullName ? String(b.fullName) : '')).trim().toLowerCase();
    return na.localeCompare(nb);
}

function enforceMembersAlpha() {
  if (!Array.isArray(window.members)) window.members = [];
  window.members = sortMembersAlpha(window.members);
  if (typeof saveLocalMembers === 'function') saveLocalMembers(window.members);
}

function sortMembersAlpha(list) {
    if (!Array.isArray(list)) return list;
    // Create a shallow copy to avoid mutating external arrays unexpectedly
    return list.slice().sort(compareByStateThenName);
}

// ---- Certificates alphabetical sort (safe) ----
function compareCertificatesAlpha(a, b) {
    const ra = (a && (a.recipientName || a.memberName || a.name) ? String(a.recipientName || a.memberName || a.name) : '').trim().toLowerCase();
    const rb = (b && (b.recipientName || b.memberName || b.name) ? String(b.recipientName || b.memberName || b.name) : '').trim().toLowerCase();
    if (ra !== rb) return ra.localeCompare(rb);
    const ca = (a && (a.certificateNumber || a.number) ? String(a.certificateNumber || a.number) : '').trim().toLowerCase();
    const cb = (b && (b.certificateNumber || b.number) ? String(b.certificateNumber || b.number) : '').trim().toLowerCase();
    return ca.localeCompare(cb);
}

function sortCertificatesAlpha(list) {
    if (!Array.isArray(list)) return list;
    return list.slice().sort(compareCertificatesAlpha);
}


// Global state
window.appState = {
    members: [],
    certificates: [],
    isAuthenticated: false
};

// ==================== BACKEND URL CONFIGURATION ====================

function getBackendUrl() {
    if (window.BACKEND_URL) {
        return window.BACKEND_URL;
    }
    
    const customBackendUrl = localStorage.getItem('narap_backend_url');
    if (customBackendUrl) {
        return customBackendUrl;
    }
    
    // Always use production backend by default
    return 'https://narap-backend.onrender.com';
}

const backendUrl = getBackendUrl();

// ---- Safe JSON helper: never throws on empty/invalid JSON bodies ----
async function tryJson(res) { try { return await res.json(); } catch (_) { return null; } }

window.backendUrl = backendUrl;
function updateBackendUrl(newUrl) {
    if (!newUrl || typeof newUrl !== 'string') {
        
        return false;
    }
    
    try {
        new URL(newUrl);
    } catch (error) {
        
        return false;
    }
    
    window.backendUrl = newUrl;
    localStorage.setItem('narap_backend_url', newUrl);
    
    testBackendConnection(newUrl);
    return true;
}

async function testBackendConnection(url = backendUrl) {
    try {
        
        
        const response = await fetch(`${url}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        
        if (response.ok) {
            
            return true;
        } else {
            
            return false;
        }
    } catch (error) {
        
        return false;
    }
}

// Add after the checkServerStatus function
async function testCorsConnectivity() {
    console.log('🔍 Testing CORS connectivity...');
    
    try {
        const response = await fetch(`${backendUrl}/api/health/cors-test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                test: true,
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            const data = await tryJson(response);
            console.log('✅ CORS test successful:', data);
            return { success: true, data };
        } else {
            console.log('❌ CORS test failed with status:', response.status);
            return { success: false, status: response.status };
        }
    } catch (error) {
        console.log('❌ CORS test error:', error.message);
        return { success: false, error: error.message };
    }
}

async function testBackendConnectivity() {
    console.log('🔍 Testing backend connectivity...');
    
    const tests = [
        { name: 'Health Check', url: '/api/health' },
        { name: 'Connection Test', url: '/api/health/connection' },
        { name: 'CORS Test', url: '/api/health/cors-test', method: 'POST' }
    ];
    
    const results = {};
    
    for (const test of tests) {
        try {
            const response = await fetch(`${backendUrl}${test.url}`, {
                method: test.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                ...(test.method === 'POST' && {
                    body: JSON.stringify({ test: true })
                })
            });
            
            if (response.ok) {
                const data = await tryJson(response);
                results[test.name] = { success: true, data };
                console.log(`✅ ${test.name} successful`);
            } else {
                results[test.name] = { success: false, status: response.status };
                console.log(`❌ ${test.name} failed with status:`, response.status);
            }
        } catch (error) {
            results[test.name] = { success: false, error: error.message };
            console.log(`❌ ${test.name} error:`, error.message);
        }
    }
    
    console.log('📊 Connectivity test results:', results);
    return results;
}

// Add to window object
window.testCorsConnectivity = testCorsConnectivity;
window.testBackendConnectivity = testBackendConnectivity;

// ==================== UTILITY FUNCTIONS ====================

function showMessage(message, type = 'info') {
    if (notificationManager) {
        notificationManager.show(message, type);
    } else {
        // Fallback to alert if notification manager is not available
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

function convertToCSV(data) {
    // Validate input data
    if (!data) {
        
        return '';
    }
    
    if (!Array.isArray(data)) {
        
        return '';
    }
    
    if (data.length === 0) {
        
        return '';
    }
    
    // Ensure first item is an object
    if (!data[0] || typeof data[0] !== 'object') {
        
        return '';
    }
    
    const headers = Object.keys(data[0]);
    if (headers.length === 0) {
        
        return '';
    }
    
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        if (!row || typeof row !== 'object') {
            
            continue;
        }
        
        const values = headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) {
                return '';
            }
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// --- Date normalization: robustly convert to 'YYYY-MM-DD' or return null ---
function toISODate(input) {
  if (input == null) return null;

  // Excel serial number (days since 1899-12-30)
  if (typeof input === 'number' && isFinite(input)) {
    var ms = Math.round((input - 25569) * 86400 * 1000);
    var d0 = new Date(ms);
    return isNaN(d0) ? null : d0.toISOString().slice(0, 10);
  }

  var s = String(input).replace(/\u00a0/g, ' ').trim();
  if (!s) return null;

  // YYYY-MM-DD, YYYY/M/D, YYYY.M.D
  var m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (m) {
    var y = +m[1], mo = +m[2], d = +m[3];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return y + '-' + String(mo).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    }
  }

  // D/M/Y or M/D/Y (2 or 4 digit year)
  m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/);
  if (m) {
    var a = +m[1], b = +m[2], y2 = +m[3]; if (y2 < 100) y2 += 2000;
    var dd, mm;
    if (a > 12 && b <= 12) { dd = a; mm = b; }      // DMY
    else if (b > 12 && a <= 12) { dd = b; mm = a; } // MDY
    else { dd = a; mm = b; }                        // ambiguous -> assume DMY
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return y2 + '-' + String(mm).padStart(2,'0') + '-' + String(dd).padStart(2,'0');
    }
  }

  // Native parse fallback (handles "Aug 16, 2025", etc.)
  var d2 = new Date(s);
  return isNaN(d2) ? null : d2.toISOString().slice(0, 10);
}



function checkPasswordStrength(password) {
    if (!password) return { strength: 0, message: 'No password entered' };
    
    let strength = 0;
    let message = '';
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    if (strength <= 2) {
        message = 'Weak password';
    } else if (strength <= 4) {
        message = 'Fair password';
    } else if (strength <= 5) {
        message = 'Good password';
    } else {
        message = 'Strong password';
    }
    
    return { strength, message };
}

// ==================== LOCAL STORAGE FUNCTIONS ====================

function getLocalCertificates() {
    try {
        const certificates = localStorage.getItem('narap_certificates');
        if (certificates) {
            return JSON.parse(certificates);
        }
    } catch (error) {
        
    }
    return [];
}

function saveLocalCertificates(certificates) {
    try {
        localStorage.setItem('narap_certificates', JSON.stringify(certificates));
    } catch (error) {
        
    }
}

function getLocalMembers() {
  try {
    const raw = localStorage.getItem('narap_members');
    if (!raw) return [];
    const arr = JSON.parse(raw) || [];
    return sortMembersAlpha(arr);
  } catch (_) {
    return [];
  }
}

function saveLocalMembers(members) {
  try {
    const arr = Array.isArray(members) ? members : [];
    const sorted = sortMembersAlpha(arr);
    localStorage.setItem('narap_members', JSON.stringify(sorted));
  } catch (error) {
    // ignore write errors (quota, privacy mode, etc.)
  }
}


// --- UI refresh helper for members (safe) ---

// --- Commit members to localStorage + refresh the UI ---
function hardenCommitMembers(list) {
  try {
    const arr = Array.isArray(list) ? list.slice() : [];
    const keyOf = (m) => {
      const id = m && (m._id || m.id);
      if (id) return 'id:' + id;
      const c = String(m?.code || '').trim().toLowerCase();
      if (c) return 'c:' + c;
      const e = String(m?.email || '').trim().toLowerCase();
      if (e) return 'e:' + e;
      return null;
    };
    const byKey = new Map();
    arr.forEach(m => { const k = keyOf(m); if (!k) return; const prev = byKey.get(k); byKey.set(k, prev ? { ...prev, ...m } : m); });
    const merged = Array.from(byKey.values());
    if (typeof saveLocalMembers === 'function') saveLocalMembers(merged);
    window.members = merged;
    window.currentMembers = merged;

    if (typeof refreshMembersUI === 'function') refreshMembersUI();
    else if (typeof loadMembers === 'function') {
      const per = Number(window.membersPerPage || localStorage.getItem('narap_members_per_page') || 10) || 10;
      loadMembers(1, per);
    }

    const count = merged.length;
    ['totalMembers','membersCount'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(count);
    });
  } catch (e) {
    console.error('hardenCommitMembers failed:', e);
  }
}

function refreshMembersUI() {
  try {
    const per =
      Number(window.membersPerPage || localStorage.getItem('narap_members_per_page') || 10) || 10;
    const page =
      (typeof window.membersCurrentPage === 'number' && window.membersCurrentPage > 0)
        ? window.membersCurrentPage
        : 1;

    if (typeof window.applyMemberFilters === 'function') {
      // Often re-renders internally
      window.applyMemberFilters();
    } else if (typeof window.loadMembers === 'function') {
      // Loader path
      window.loadMembers(page, per);
    } else if (typeof window.displayMembers === 'function' && Array.isArray(window.currentMembers)) {
      // Direct render fallback
      const total = window.currentMembers.length;
      const totalPages = Math.max(1, Math.ceil(total / per));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * per;
      const slice = window.currentMembers.slice(start, start + per);

      window.displayMembers(slice, total, safePage, totalPages, per);
      if (typeof window.renderPagination === 'function') {
        window.renderPagination(safePage, totalPages, total, per, 'members');
      }
    }
  } catch (e) {
    console.error('refreshMembersUI render error:', e);
  }

  // Update counters
  try {
    const count = Array.isArray(window.currentMembers) ? window.currentMembers.length : 0;
    const ids = ['totalMembers', 'membersCount'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.textContent = String(count);
    }
  } catch (e) {
    console.error('refreshMembersUI counter error:', e);
  }
}


function getPendingSync() {
    try {
        const pendingSync = localStorage.getItem('narap_pending_sync');
        if (pendingSync) {
            return JSON.parse(pendingSync);
        }
    } catch (error) {
        
    }
    
    return {
        certificateCreations: [],
        certificateUpdates: [],
        certificateDeletions: [],
        memberCreations: [],
        memberUpdates: [],
        memberDeletions: []
    };
}


// --- Dedup pending sync by id/code/email ---
function dedupePendingSyncObject(pending) {
  try {
    pending = pending || {};
    const list = Array.isArray(pending.memberUpdates) ? pending.memberUpdates : [];
    const map = new Map();
    for (const m of list) {
      if (!m) continue;
      const id = m && (m._id || m.id);
      const c = String(m?.code || '').trim().toLowerCase();
      const e = String(m?.email || '').trim().toLowerCase();
      const key = id ? ('id:'+id) : (c ? ('c:'+c) : (e ? ('e:'+e) : null));
      if (!key) continue;
      map.set(key, { ...(map.get(key)||{}), ...m });
    }
    pending.memberUpdates = Array.from(map.values());
  } catch (e) { console.warn('dedupePendingSyncObject failed:', e); }
  return pending;
}

function savePendingSync(pendingSync) {
  try {
    pendingSync = dedupePendingSyncObject(pendingSync || {});
    localStorage.setItem('narap_pending_sync', JSON.stringify(pendingSync));
  } catch (e) {
    // ignore write errors
  }
}

// Queue a member update for backend sync (used during import to avoid immediate 404s)
function queueMemberUpdate(member) {
  try {
    const pending = (typeof getPendingSync === 'function') ? getPendingSync() : {
      certificateCreations: [], certificateUpdates: [],
      memberCreations: [], memberUpdates: [], memberDeletions: []
    };
    pending.memberUpdates = Array.isArray(pending.memberUpdates) ? pending.memberUpdates : [];
    // Use a stable key to avoid duplicate updates
    const codeKey = String(member?.code || '').trim().toLowerCase();
    const emailKey = String(member?.email || '').trim().toLowerCase();
    const idKey = member?._id || member?.id || null;

    const existsIdx = pending.memberUpdates.findIndex(m => {
      return (idKey && (m._id === idKey || m.id === idKey)) ||
             (codeKey && String(m.code || '').trim().toLowerCase() === codeKey) ||
             (emailKey && String(m.email || '').trim().toLowerCase() === emailKey);
    });
    if (existsIdx !== -1) {
      pending.memberUpdates[existsIdx] = { ...pending.memberUpdates[existsIdx], ...member };
    } else {
      pending.memberUpdates.push({ ...member });
    }
    if (typeof savePendingSync === 'function') savePendingSync(pending);
  } catch (e) {
    console.warn('queueMemberUpdate failed:', e);
  }
}
// ==================== EXPORT FUNCTIONS ====================

async function exportMembers(format = 'csv') {
    try {
        showMessage('Preparing member export...', 'info');
        
        // Try to get members from backend first
        let members = null;
        try {
            const response = await fetch(`${backendUrl}/api/users/getUsers`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const responseData = await tryJson(response);
            
            // Handle different response formats
            if (Array.isArray(responseData)) {
                members = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                members = responseData.data;
            } else if (responseData && responseData.success && Array.isArray(responseData.success.data)) {
                members = responseData.success.data;
            } else {
                
                members = [];
            }
        } catch (apiError) {
            
            // Fallback to local storage
            members = getLocalMembers();
        }
        
        // Validate members data
        if (!members) {
            
            showMessage('No member data available for export', 'error');
            return;
        }
        
        if (!Array.isArray(members)) {
            
            showMessage('Invalid member data format', 'error');
            return;
        }
        
        if (members.length === 0) {
            showMessage('No members to export', 'warning');
            return;
        }
        
        
        
        let content, filename, contentType;
        
        if (format === 'csv') {
            content = convertToCSV(members);
            if (!content) {
                showMessage('Failed to convert members to CSV format', 'error');
                return;
            }
            filename = `members_${new Date().toISOString().split('T')[0]}.csv`;
            contentType = 'text/csv';
        } else if (format === 'json') {
            content = JSON.stringify(members, null, 2);
            filename = `members_${new Date().toISOString().split('T')[0]}.json`;
            contentType = 'application/json';
        } else {
            showMessage('Unsupported export format', 'error');
            return;
        }
        
        downloadFile(content, filename, contentType);
        showMessage(`Members exported successfully as ${format.toUpperCase()}!`, 'success');
        
    } catch (error) {
        
        showMessage('Failed to export members: ' + error.message, 'error');
    }
}

async function exportCertificates(format = 'csv') {
    try {
        showMessage('Preparing certificate export...', 'info');
        
        const certificates = await getCertificates();
        
        // Validate certificates data
        if (!certificates) {
            
            showMessage('No certificate data available for export', 'error');
            return;
        }
        
        if (!Array.isArray(certificates)) {
            
            showMessage('Invalid certificate data format', 'error');
            return;
        }
        
        if (certificates.length === 0) {
            showMessage('No certificates to export', 'warning');
            return;
        }
        
        
        
        let content, filename, contentType;
        
        if (format === 'csv') {
            content = convertToCSV(certificates);
            if (!content) {
                showMessage('Failed to convert certificates to CSV format', 'error');
                return;
            }
            filename = `certificates_${new Date().toISOString().split('T')[0]}.csv`;
            contentType = 'text/csv';
        } else if (format === 'json') {
            content = JSON.stringify(certificates, null, 2);
            filename = `certificates_${new Date().toISOString().split('T')[0]}.json`;
            contentType = 'application/json';
        } else {
            showMessage('Unsupported export format', 'error');
            return;
        }
        
        downloadFile(content, filename, contentType);
        showMessage(`Certificates exported successfully as ${format.toUpperCase()}!`, 'success');
        
    } catch (error) {
        
        showMessage('Failed to export certificates: ' + error.message, 'error');
    }
}

// Overload for the button that doesn't pass format parameter
function exportCertificatesButton() {
    exportCertificates('csv');
}

async function exportAllData(format = 'json') {
    try {
        showMessage('Preparing complete data export...', 'info');
        
        const [members, certificates] = await Promise.all([
            fetch(`${backendUrl}/api/users/getUsers`).then(async res => (await tryJson(res))).catch(() => []),
            getCertificates()
        ]);
        
        if ((!members || members.length === 0) && (!certificates || certificates.length === 0)) {
            showMessage('No data to export', 'warning');
            return;
        }
        
        const allData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            members: members || [],
            certificates: certificates || [],
            pendingSync: getPendingSync(),
            metadata: {
                totalMembers: members ? members.length : 0,
                totalCertificates: certificates ? certificates.length : 0,
                exportFormat: format
            }
        };
        
        let content, filename, contentType;
        
        if (format === 'json') {
            content = JSON.stringify(allData, null, 2);
            filename = `narap_complete_export_${new Date().toISOString().split('T')[0]}.json`;
            contentType = 'application/json';
        } else if (format === 'csv') {
            const memberCSV = convertToCSV(members || []);
            const certificateCSV = convertToCSV(certificates || []);
            
            const zipContent = `=== NARAP COMPLETE EXPORT ===
Export Date: ${new Date().toISOString()}
Total Members: ${members ? members.length : 0}
Total Certificates: ${certificates ? certificates.length : 0}

=== MEMBERS DATA ===
${memberCSV}

=== CERTIFICATES DATA ===
${certificateCSV}`;
            
            content = zipContent;
            filename = `narap_complete_export_${new Date().toISOString().split('T')[0]}.txt`;
            contentType = 'text/plain';
        } else {
            showMessage('Unsupported export format', 'error');
            return;
        }
        
        downloadFile(content, filename, contentType);
        showMessage(`Complete data exported successfully as ${format.toUpperCase()}!`, 'success');
        
    } catch (error) {
        
        showMessage('Failed to export complete data: ' + error.message, 'error');
    }
}

// ==================== SYNC FUNCTIONS ====================

// === Pending queue helpers ===

// === Inspect pending queue helper ===
if (typeof window.debugPending !== 'function') {
  window.debugPending = function(){
    try {
      const raw = localStorage.getItem('narap_pending_sync');
      const q = raw ? JSON.parse(raw) : {memberCreations:[], memberUpdates:[], memberDeletes:[]};
      const c = (q.memberCreations||[]).length;
      const u = (q.memberUpdates||[]).length;
      const d = (q.memberDeletes||[]).length;
      console.table([
        {kind:'creations', count:c},
        {kind:'updates',   count:u},
        {kind:'deletes',   count:d},
      ]);
      // Print a sample of the first stuck item for quick diagnosis
      const sample = (q.memberCreations&&q.memberCreations[0]) || (q.memberUpdates&&q.memberUpdates[0]) || (q.memberDeletes&&q.memberDeletes[0]) || null;
      if (sample) {
        console.log('Sample pending item:', sample);
      } else {
        console.log('No pending items.');
      }
      return q;
    } catch(e){
      console.error('debugPending failed:', e);
      return null;
    }
  }
}

function __bumpAttempts(item){
  if (!item) return item;
  item.__attempts = (item.__attempts || 0) + 1;
  return item;
}
function __filterRetry(arr){
  return (Array.isArray(arr) ? arr : []).filter(m => (m && (m.__attempts || 0) < 3));
}
function __droppedRetry(arr){
  return (Array.isArray(arr) ? arr : []).filter(m => (m && (m.__attempts || 0) >= 3));
}
if (typeof window.forceClearPendingChanges !== 'function') {
  window.forceClearPendingChanges = function(){
    try {
      localStorage.removeItem('narap_pending_sync'); // correct key
      localStorage.removeItem('pendingChanges');     // legacy key
    } catch(_) {}
    if (typeof updateSyncIndicators === 'function') updateSyncIndicators({pending:0, synced:0});
    if (typeof updateSyncStatus === 'function') updateSyncStatus();
    if (typeof showMessage === 'function') showMessage('Cleared pending sync queue.', 'success');
    console.info('forceClearPendingChanges: cleared narap_pending_sync and pendingChanges');
  };
}

async function syncPendingChanges() {
  const errors = [];

  // Small helpers (safe fallbacks if your globals don't exist)
  const _safeJson = typeof safeJson === 'function' ? safeJson : async (res) => {
    try { return await res.json(); } catch { return null; }
  };
  const _tryJson = typeof tryJson === 'function' ? tryJson : _safeJson;

  // Abortable fetch with timeout (since fetch doesn't support {timeout})
  async function fetchWithTimeout(url, opts = {}, ms = 5000) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    try {
      return await fetch(url, { ...opts, signal: ctrl.signal });
    } finally {
      clearTimeout(id);
    }
  }

  try {
    const pending = getPendingSync ? getPendingSync() : {
      certificateCreations: [],
      certificateUpdates: [],
      memberCreations: [],
      memberUpdates: [],
      memberDeletions: []
    };

    let syncedCount = 0;

    // Validate backend URL first
    if (!backendUrl || backendUrl === 'undefined' || backendUrl === 'null') {
      console.error('❌ Invalid backend URL:', backendUrl);
      if (typeof showMessage === 'function') {
        showMessage('Backend URL not configured. Please check settings.', 'error');
      }
      return;
    }

    // Health check (non-fatal; we can still try)
    try {
      const health = await fetchWithTimeout(`${backendUrl}/api/health`, { method: 'GET' }, 5000);
      if (!health.ok) {
        console.warn('⚠️ Backend health check failed - sync may fail');
        if (typeof showMessage === 'function') {
          showMessage('Backend appears to be down. Sync will be retried when available.', 'warning');
        }
      }
    } catch (e) {
      console.warn('⚠️ Backend connectivity test failed:', e?.message || e);
      if (typeof showMessage === 'function') {
        showMessage('Cannot reach backend server. Sync will be retried when connection is restored.', 'warning');
      }
    }

    // Prepare new queues with items that FAIL (we keep only unsynced)
    const remain = {
      certificateCreations: [],
      certificateUpdates: [],
      memberCreations: [],
      memberUpdates: [],
      memberDeletions: []
    };

    // ---- Certificates: CREATE ----
    for (const cert of pending.certificateCreations || []) {
      try {
        const c = { ...cert };
        if (!c.number || !String(c.number).trim()) {
          c.number = (typeof generateUniqueCertificateNumber === 'function')
            ? generateUniqueCertificateNumber()
            : `N/${Date.now()}`;
        }
        if (!c.certificateNumber || !String(c.certificateNumber).trim()) c.certificateNumber = c.number;

        const resp = await fetch(`${backendUrl}/api/certificates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(c)
        });
        if (resp.ok) {
          syncedCount++;
          try { logCertificateAdd(c); } catch(_) {}
        } else {
          remain.certificateCreations.push(cert);
        }
      } catch {
        remain.certificateCreations.push(cert);
      }
    }

    // ---- Certificates: UPDATE ----
    for (const cert of pending.certificateUpdates || []) {
      try {
        const id = cert._id || cert.id;
        if (!id) { remain.certificateUpdates.push(cert); continue; }
        const resp = await fetch(`${backendUrl}/api/certificates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cert)
        });
        if (resp.ok) {
          syncedCount++;
          try { logCertificateUpdate(cert); } catch(_){ }
        } else {
          remain.certificateUpdates.push(cert);
        }
      } catch {
        remain.certificateUpdates.push(cert);
      }
    }

    // ---- Members: CREATE (with UPSERT fallback) ----
    for (const member of pending.memberCreations || []) {
        try {
          const mm = sanitizeMemberForFormData(member);
          const formData = new FormData();
          const fields = ['name','email','code','position','state','zone','password'];
          for (const k of fields) if (mm[k] != null && mm[k] !== '') formData.append(k, String(mm[k]));

          // Attach files using both key names to satisfy backend variance
          const passFile = mm.passport || mm.passportFile || mm.passport_photo || mm.passportPhoto;
          const sigFile  = mm.signature || mm.signatureFile || mm.signature_photo || mm.signaturePhoto;
          if (passFile instanceof File) { formData.append('passport', passFile); formData.append('passportPhoto', passFile); }
          if (sigFile  instanceof File) { formData.append('signature', sigFile); }

          const upsertResult = await upsertMemberFormData(mm, formData);
          if (upsertResult.ok) {
            // increment counts if present; otherwise ignore
            if (typeof counts !== 'undefined') { counts.updated = (counts.updated || 0) + 1; }
          } else {
            if (remain && remain.memberUpdates) if ((member.__attempts||0) >= 1) {
  console.warn('Auto-dropping repeatedly failing UPDATE item:', {name: member.name, code: member.code, email: member.email});
  if (typeof showMessage === 'function') showMessage('Dropped failing update for ' + (member.code||member.name||'unknown') + '.', 'warning');
} else {
  remain.memberUpdates.push(__bumpAttempts(member));
}
            if (typeof errors !== 'undefined') errors.push({ member, error: 'Upsert failed', details: upsertResult });
          }
        } catch (err) {
          if (remain && remain.memberUpdates) if ((member.__attempts||0) >= 1) {
  console.warn('Auto-dropping repeatedly failing UPDATE item:', {name: member.name, code: member.code, email: member.email});
  if (typeof showMessage === 'function') showMessage('Dropped failing update for ' + (member.code||member.name||'unknown') + '.', 'warning');
} else {
  remain.memberUpdates.push(__bumpAttempts(member));
}
          if (typeof errors !== 'undefined') errors.push({ member, error: 'Exception during upsert', details: err?.message || String(err) });
        }
    }

    // ---- Members: UPDATE ----
    for (const member of pending.memberUpdates || []) {
        try {
          const mm = sanitizeMemberForFormData(member);
          const formData = new FormData();
          const fields = ['name','email','code','position','state','zone','password'];
          for (const k of fields) if (mm[k] != null && mm[k] !== '') formData.append(k, String(mm[k]));

          // Attach files using both key names to satisfy backend variance
          const passFile = mm.passport || mm.passportFile || mm.passport_photo || mm.passportPhoto;
          const sigFile  = mm.signature || mm.signatureFile || mm.signature_photo || mm.signaturePhoto;
          if (passFile instanceof File) { formData.append('passport', passFile); formData.append('passportPhoto', passFile); }
          if (sigFile  instanceof File) { formData.append('signature', sigFile); }

          const upsertResult = await upsertMemberFormData(mm, formData);
          if (upsertResult.ok) {
            // increment counts if present; otherwise ignore
            if (typeof counts !== 'undefined') { counts.updated = (counts.updated || 0) + 1; }
          } else {
            if (remain && remain.memberUpdates) if ((member.__attempts||0) >= 1) {
  console.warn('Auto-dropping repeatedly failing UPDATE item:', {name: member.name, code: member.code, email: member.email});
  if (typeof showMessage === 'function') showMessage('Dropped failing update for ' + (member.code||member.name||'unknown') + '.', 'warning');
} else {
  remain.memberUpdates.push(__bumpAttempts(member));
}
            if (typeof errors !== 'undefined') errors.push({ member, error: 'Upsert failed', details: upsertResult });
          }
        } catch (err) {
          if (remain && remain.memberUpdates) if ((member.__attempts||0) >= 1) {
  console.warn('Auto-dropping repeatedly failing UPDATE item:', {name: member.name, code: member.code, email: member.email});
  if (typeof showMessage === 'function') showMessage('Dropped failing update for ' + (member.code||member.name||'unknown') + '.', 'warning');
} else {
  remain.memberUpdates.push(__bumpAttempts(member));
}
          if (typeof errors !== 'undefined') errors.push({ member, error: 'Exception during upsert', details: err?.message || String(err) });
        }
    }

    // ---- Members: DELETE ----
    for (const member of pending.memberDeletions || []) {
      try {
        const id = member._id || member.id;
        if (!id) { /* nothing to do */ syncedCount++; continue; }
        const resp = await fetch(`${backendUrl}/api/users/deleteUser/${id}`, { method: 'DELETE' });
        if (resp.ok) {
          syncedCount++;
          try { logMemberDelete(member); } catch(_){ }
        } else {
          const body = (await _tryJson(resp)) || {};
          const msg = (body.message || '').toLowerCase();
          if (resp.status === 404 || msg.includes('not found')) {
            // Desired end-state already achieved
            syncedCount++;
            try { logMemberDelete(member); } catch(_){ }
          } else {
            remain.memberDeletions.push(member);
          }
        }
      } catch {
        remain.memberDeletions.push(member);
      }
    }

    // ---- Persist remaining unsynced items
    const stillPendingTotal =
      remain.memberCreations.length +
      remain.memberUpdates.length +
      remain.memberDeletions.length +
      remain.certificateCreations.length +
      remain.certificateUpdates.length;

    if (typeof savePendingSync === 'function') { savePendingSync(remain); }
    try { if (typeof refreshMembersUI === 'function') refreshMembersUI(); } catch (_) {}

    // ---- Feedback + status
    if (syncedCount > 0) {
      if (typeof showMessage === 'function') {
        showMessage(`Synced ${syncedCount} pending change${syncedCount === 1 ? '' : 's'}` + (stillPendingTotal ? ` - ${stillPendingTotal} still pending` : ''), 'success');
      }
      if (typeof updateSyncStatus === 'function') updateSyncStatus();
    } else if (stillPendingTotal > 0) {
      if (typeof showMessage === 'function') {
        showMessage(`No changes synced - ${stillPendingTotal} pending`, 'warning');
      }
      if (typeof updateSyncStatus === 'function') updateSyncStatus();
    } else {
      if (typeof showMessage === 'function') {
        showMessage('Nothing to sync', 'info');
      }
    }
  } catch (err) {
    console.error('Failed to sync pending changes:', err);
    if (typeof showMessage === 'function') showMessage('Failed to sync pending changes', 'error');
  }
  
  // === Finalize pending queue ===
  // Ensure 'remain' exists
  if (typeof remain === 'undefined' || !remain) { var remain = { memberCreations: [], memberUpdates: [], memberDeletes: [] }; }
  try {
    // Drop items that exceeded retry threshold
    const droppedList = [
      ...__droppedRetry(remain.memberCreations),
      ...__droppedRetry(remain.memberUpdates),
      ...__droppedRetry(remain.memberDeletes),
    ];
    if (droppedList.length) {
      console.warn('Dropping permanently failed pending items after 3 attempts:', droppedList);
      if (typeof showMessage === 'function') showMessage('Dropped ' + droppedList.length + ' permanently failing pending item(s).', 'warning');
    }

    remain.memberCreations = __filterRetry(remain.memberCreations);
    remain.memberUpdates   = __filterRetry(remain.memberUpdates);
    remain.memberDeletes   = __filterRetry(remain.memberDeletes);

    /*logOnePending*/
const totalRemain =
      (remain.memberCreations?.length || 0) +
      (remain.memberUpdates?.length || 0) +
      (remain.memberDeletes?.length || 0);

    if (totalRemain === 1) {
  try {
    const qraw = localStorage.getItem('narap_pending_sync');
    const q = qraw ? JSON.parse(qraw) : remain;
    const item = (q.memberCreations && q.memberCreations[0]) ||
                 (q.memberUpdates && q.memberUpdates[0])   ||
                 (q.memberDeletes && q.memberDeletes[0])   || null;
    console.warn('Exactly 1 pending remains. Item details:', item);
    if (typeof showMessage === 'function' && item) {
      showMessage('1 item still pending: ' + (item.code || item.name || 'unknown'), 'warning');
    }
  } catch(e) { console.warn('Could not log remaining pending item:', e); }
}
if (totalRemain === 0) {
      localStorage.removeItem('narap_pending_sync'); // correct key
      localStorage.removeItem('pendingChanges');     // legacy key
    } else {
      if (typeof savePendingSync === 'function') {
        savePendingSync(remain); // uses narap_pending_sync internally
      } else {
        localStorage.setItem('narap_pending_sync', JSON.stringify(remain));
      }
    }

    if (typeof updateSyncIndicators === 'function') {
      const syncedCount = (counts?.updated || 0) + (counts?.createdOrUpdated || 0);
      updateSyncIndicators({ pending: totalRemain, synced: syncedCount });
    }
    if (typeof updateSyncStatus === 'function') updateSyncStatus();
  } catch (e) {
    console.error('Finalize pending queue failed:', e);
  }
}


// Function to clear problematic pending deletions
function clearPendingDeletions() {
    const pendingSync = getPendingSync();
    pendingSync.memberDeletions = [];
    savePendingSync(pendingSync);
    console.log('✅ Pending deletions cleared');
}

async function syncWithBackend() {
    try {
        showMessage('Syncing with backend...', 'info');
        
        await syncPendingChanges();
        
        if (typeof loadMembers === 'function') await loadMembers();
        if (typeof loadCertificates === 'function') await loadCertificates();
        
        showMessage('Backend sync completed successfully!', 'success');
        
    } catch (error) {
        
        showMessage('Failed to sync with backend: ' + error.message, 'error');
    }
}

// ==================== BACKUP FUNCTIONS ====================

// === [Injected] Members: backend-first fetch with offline fallback (DROP-IN) ===
// This block makes the members list behave like certificates: backend-first for display when online,
// but still supports offline entry and later sync. It is self-guarded to avoid double registration.
if (typeof window.getMembers !== 'function') {
  window.getMembers = async function getMembers(opts = {}) {
    const forceRefresh = !!opts.forceRefresh;

    // Prefer backend if we're online (or explicitly forced)
    if (navigator.onLine || forceRefresh) {
      try {
        const resp = await fetch(`${backendUrl}/api/users/getUsers`, { method: 'GET' });
        if (resp.ok) {
          const body = await (typeof tryJson === 'function' ? tryJson(resp) : resp.json().catch(()=>null));
          let members = Array.isArray(body) ? body
                      : (Array.isArray(body?.data) ? body.data
                      : (Array.isArray(body?.success?.data) ? body.success.data : []));
          if (typeof sortMembersAlpha === 'function') members = sortMembersAlpha(members);
          if (typeof saveLocalMembers === 'function') saveLocalMembers(members);
          window.members = members;
          window.currentMembers = members;
          return members;
        }
      } catch (_) {
        // fall through to local
      }
    }

    // Offline or API failed → use local cache
    const locals = (typeof getLocalMembers === 'function') ? getLocalMembers() : (window.members || []);
    window.members = locals;
    window.currentMembers = locals;
    return locals;
  };
}

if (typeof window.reloadMembersBackendFirst !== 'function') {
  window.reloadMembersBackendFirst = async function reloadMembersBackendFirst(force = false) {
    await window.getMembers({ forceRefresh: !!force });
    if (typeof window.applyMemberFilters === 'function') {
      window.applyMemberFilters();
    } else if (typeof window.loadMembers === 'function') {
      const per = Number(window.membersPerPage || localStorage.getItem('narap_members_per_page') || 10) || 10;
      window.loadMembers(1, per);
    } else if (typeof window.refreshMembersUI === 'function') {
      window.refreshMembersUI();
    }
  };
}

// Ensure a backend pull on page load (guarded)
(function(){
  if (!window.__membersBackendFirstBound) {
    window.__membersBackendFirstBound = true;
    document.addEventListener('DOMContentLoaded', async () => {
      try { await window.reloadMembersBackendFirst(true); } catch(_){}
    });

    window.addEventListener('online', async () => {
      if (typeof showMessage === 'function') showMessage('Back online — fetching latest members and syncing changes…', 'info');
      try { await window.reloadMembersBackendFirst(true); } catch(_){}
      if (typeof syncPendingChanges === 'function') {
        try { await syncPendingChanges(); } catch(_){}
      }
    });

    window.addEventListener('offline', () => {
      if (typeof showMessage === 'function') showMessage('You are offline. New changes will be stored locally and synced later.', 'warning');
    });
  }
})();
// === [/Injected] End ===



async function createBackup() {
    try {
        showMessage('Creating backup...', 'info');
        
        const [members, certificates] = await Promise.all([
            fetch(`${backendUrl}/api/users/getUsers`).then(async res => (await tryJson(res))).catch(() => []),
            getCertificates()
        ]);
        
        const pendingSync = getPendingSync();
        
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            members: members || [],
            certificates: certificates || [],
            pendingSync: pendingSync,
            metadata: {
                totalMembers: members ? members.length : 0,
                totalCertificates: certificates ? certificates.length : 0,
                pendingChanges: pendingSync.certificateCreations.length + 
                               pendingSync.certificateUpdates.length + 
                               pendingSync.certificateDeletions.length
            }
        };
        
        const content = JSON.stringify(backup, null, 2);
        const filename = `narap_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        
        downloadFile(content, filename, 'application/json');
        showMessage('Backup created successfully!', 'success');
        
    } catch (error) {
        
        showMessage('Failed to create backup: ' + error.message, 'error');
    }
}

async function clearAllData() {
    try {
        // Check if there's any data to clear
        const members = getLocalMembers() || [];
        const certificates = getLocalCertificates() || [];
        const pendingSync = getPendingSync();
        
        const hasData = members.length > 0 || certificates.length > 0 || 
                       pendingSync.memberCreations.length > 0 || 
                       pendingSync.certificateCreations.length > 0;
        
        if (!hasData) {
            showMessage('No data to clear. Database is already empty.', 'info');
            return;
        }
        
        showMessage('Clearing all data...', 'info');
        
        // Clear backend database first
        try {
            console.log('🗑️ Clearing backend database...');
            const backendUrl = getBackendUrl();
            console.log('🔍 Backend URL:', backendUrl);
            
            if (backendUrl && navigator.onLine) {
                console.log('🌐 Attempting to clear backend at:', `${backendUrl}/api/clear-database`);
                
                const response = await fetch(`${backendUrl}/api/clear-database`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('🔍 Backend response status:', response.status);
                
                if (response.ok) {
                    const result = await tryJson(response);
                    console.log('✅ Backend database cleared:', result);
                    showMessage(`Backend cleared: ${result.data.totalDeleted} records deleted`, 'success');
                } else {
                    let errorData = {};
                    try {
                        errorData = await tryJson(response);
                    } catch (parseError) {
                        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
                    }
                    console.error('❌ Backend clear failed:', errorData);
                    showMessage(`Backend clear failed: ${errorData.message || `HTTP ${response.status}`}`, 'warning');
                }
            } else {
                console.log('⚠️ Backend not accessible, clearing frontend only');
                showMessage('Backend not accessible, clearing frontend data only', 'warning');
            }
        } catch (backendError) {
            console.error('❌ Backend clear error:', backendError);
            showMessage(`Backend clear failed: ${backendError.message}`, 'warning');
        }
        
        // Clear frontend data
        console.log('🗑️ Clearing frontend data...');
        
        // Clear all NARAP-related localStorage items
        const localStorageKeys = [
            // Main data
            'narap_certificates',
            'narap_pending_sync', 
            'narap_members',
            'narapUsers',
            'narapMembersCache',
            'narapPendingSync',
            'narapUsageData',
            
            // Settings and preferences
            'narap_backend_url',
            'narap_theme',
            'narap_logged_in',
            'narap_debug',
            
            // Pagination settings
            'narap_members_per_page',
            'narap_certificates_per_page',
            'narap_members_current_page',
            'narap_members_total_pages',
            'narap_certificates_current_page',
            'narap_certificates_total_pages',
            
            // Timestamps
            'narap_last_backup',
            'narap_last_sync'
        ];
        
        // Remove all known localStorage items
        localStorageKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed localStorage item: ${key}`);
        });
        
        // Clear all cache items (they start with 'narap_cache_')
        const allKeys = Object.keys(localStorage);
        const cacheKeys = allKeys.filter(key => key.startsWith('narap_cache_'));
        cacheKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed cache item: ${key}`);
        });
        
        // Clear all pagination state items (they start with 'narap_' and contain 'page')
        const paginationKeys = allKeys.filter(key => key.startsWith('narap_') && key.includes('page'));
        paginationKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed pagination item: ${key}`);
        });
        
        console.log(`✅ Cleared ${localStorageKeys.length + cacheKeys.length + paginationKeys.length} localStorage items`);
        
        // Clear any remaining NARAP-related items (catch-all)
        const remainingKeys = Object.keys(localStorage).filter(key => key.includes('narap'));
        remainingKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed remaining item: ${key}`);
        });
        
        // Clear sessionStorage as well (if any NARAP items exist there)
        const sessionKeys = Object.keys(sessionStorage).filter(key => key.includes('narap'));
        sessionKeys.forEach(key => {
            sessionStorage.removeItem(key);
            console.log(`🗑️ Removed sessionStorage item: ${key}`);
        });
        
        // Clear memory variables
        if (typeof window.currentCertificates !== 'undefined') window.currentCertificates = [];
        if (typeof window.currentMembers !== 'undefined') window.currentMembers = [];
        
        // Clear any pagination state objects
        if (typeof window.membersPaginationState !== 'undefined') window.membersPaginationState = null;
        if (typeof window.certificatesPaginationState !== 'undefined') window.certificatesPaginationState = null;
        
        savePendingSync({
            certificateCreations: [],
            certificateUpdates: [],
            certificateDeletions: [],
            memberCreations: [],
            memberUpdates: [],
            memberDeletions: []
        });
        
        // Clear UI tables directly instead of reloading data
        console.log('🗑️ Clearing UI tables...');
        
        // Clear members table
        const membersTable = document.getElementById('membersTable');
        if (membersTable) {
            const tbody = membersTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #6c757d;">No members found</td></tr>';
            }
        }
        
        // Clear certificates table
        const certificatesTable = document.getElementById('certificatesTable');
        if (certificatesTable) {
            const tbody = certificatesTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #6c757d;">No certificates found</td></tr>';
            }
        }
        
        // Clear dashboard stats
        const dashboardStats = document.querySelectorAll('.stat-number');
        dashboardStats.forEach(stat => {
            if (stat) stat.textContent = '0';
        });
        
        // Clear pagination
        const membersPagination = document.getElementById('membersPagination');
        const certificatesPagination = document.getElementById('certificatesPagination');
        if (membersPagination) membersPagination.innerHTML = '';
        if (certificatesPagination) certificatesPagination.innerHTML = '';
        
        // Clear search inputs
        const memberSearchInput = document.getElementById('memberSearch');
        const certificateSearchInput = document.getElementById('certificateSearch');
        if (memberSearchInput) memberSearchInput.value = '';
        if (certificateSearchInput) certificateSearchInput.value = '';
        
        // Update counts
        const membersCountElement = document.getElementById('membersCount');
        const certificatesCountElement = document.getElementById('certificatesCount');
        if (membersCountElement) membersCountElement.textContent = '0';
        if (certificatesCountElement) certificatesCountElement.textContent = '0';
        
        console.log('✅ UI tables cleared successfully');
        
        // Clear any charts or analytics
        const chartContainers = document.querySelectorAll('.chart-container, .analytics-chart');
        chartContainers.forEach(container => {
            if (container) {
                container.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No data available</div>';
            }
        });
        
        // Clear any activity logs
        const activityLogs = document.querySelectorAll('.activity-log, .recent-activity');
        activityLogs.forEach(log => {
            if (log) {
                log.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No recent activity</div>';
            }
        });
        
        // Show summary of what was cleared
        const summary = [];
        if (members.length > 0) summary.push(`${members.length} members`);
        if (certificates.length > 0) summary.push(`${certificates.length} certificates`);
        if (pendingSync.memberCreations.length > 0) summary.push(`${pendingSync.memberCreations.length} pending member creations`);
        if (pendingSync.certificateCreations.length > 0) summary.push(`${pendingSync.certificateCreations.length} pending certificate creations`);
        
        // Add localStorage clearing info
        const totalLocalStorageItems = localStorageKeys.length + cacheKeys.length + paginationKeys.length + remainingKeys.length + sessionKeys.length;
        if (totalLocalStorageItems > 0) {
            summary.push(`${totalLocalStorageItems} localStorage items`);
        }
        
        const summaryText = summary.length > 0 ? `Cleared: ${summary.join(', ')}` : 'All data cleared';
        showMessage(`${summaryText} successfully!`, 'success');
        
        // Verify localStorage is completely cleared
        const remainingNarapItems = Object.keys(localStorage).filter(key => key.includes('narap'));
        if (remainingNarapItems.length > 0) {
            console.warn('⚠️ Some NARAP localStorage items remain:', remainingNarapItems);
        } else {
            console.log('✅ All NARAP localStorage items successfully cleared');
        }
        
    } catch (error) {
        console.error('❌ Clear data error:', error);
        showMessage('Failed to clear data: ' + error.message, 'error');
    }
}

// Clear all certificates function
async function clearAllCertificates() {
    try {
        // Check if there are certificates to clear
        const certificates = getLocalCertificates() || [];
        const pendingSync = getPendingSync();
        
        const hasCertificates = certificates.length > 0 || 
                               pendingSync.certificateCreations.length > 0 ||
                               pendingSync.certificateUpdates.length > 0 ||
                               pendingSync.certificateDeletions.length > 0;
        
        if (!hasCertificates) {
            showMessage('No certificates to clear. Certificate database is already empty.', 'info');
            return;
        }
        
        showMessage('Clearing all certificates...', 'info');
        
        // Clear backend certificates first
        try {
            console.log('🗑️ Clearing backend certificates...');
            const backendUrl = getBackendUrl();
            console.log('🔍 Backend URL:', backendUrl);
            
            if (backendUrl && navigator.onLine) {
                console.log('🌐 Attempting to clear certificates at:', `${backendUrl}/api/clear-certificates`);
                
                const response = await fetch(`${backendUrl}/api/clear-certificates`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('🔍 Backend response status:', response.status);
                
                if (response.ok) {
                    const result = await tryJson(response);
                    console.log('✅ Backend certificates cleared:', result);
                    showMessage(`Backend certificates cleared: ${result.data.certificatesDeleted} certificates deleted`, 'success');
                } else {
                    let errorData = {};
                    try {
                        errorData = await tryJson(response);
                    } catch (parseError) {
                        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
                    }
                    console.error('❌ Backend certificate clear failed:', errorData);
                    showMessage(`Backend certificate clear failed: ${errorData.message || `HTTP ${response.status}`}`, 'warning');
                }
            } else {
                console.log('⚠️ Backend not accessible, clearing frontend certificates only');
                showMessage('Backend not accessible, clearing frontend certificates only', 'warning');
            }
        } catch (backendError) {
            console.error('❌ Backend certificate clear error:', backendError);
            showMessage(`Backend certificate clear failed: ${backendError.message}`, 'warning');
        }
        
        // Clear frontend certificate data
        console.log('🗑️ Clearing frontend certificate data...');
        
        // Clear certificate-related localStorage items
        const certificateLocalStorageKeys = [
            'narap_certificates',
            'narap_certificates_cache',
            'narap_certificates_current_page',
            'narap_certificates_total_pages',
            'narap_certificates_per_page'
        ];
        
        // Remove certificate-related localStorage items
        certificateLocalStorageKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed certificate localStorage item: ${key}`);
        });
        
        // Clear certificate-related cache items
        const allKeys = Object.keys(localStorage);
        const certificateCacheKeys = allKeys.filter(key => key.startsWith('narap_cache_') && key.includes('certificate'));
        certificateCacheKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed certificate cache item: ${key}`);
        });
        
        console.log(`✅ Cleared ${certificateLocalStorageKeys.length + certificateCacheKeys.length} certificate localStorage items`);
        
        // Clear memory variables
        if (typeof window.currentCertificates !== 'undefined') window.currentCertificates = [];
        if (typeof window.certificatesPaginationState !== 'undefined') window.certificatesPaginationState = null;
        
        // Clear certificate-related pending sync
        const currentPendingSync = getPendingSync();
        currentPendingSync.certificateCreations = [];
        currentPendingSync.certificateUpdates = [];
        currentPendingSync.certificateDeletions = [];
        savePendingSync(currentPendingSync);
        
        // Clear certificates table UI
        console.log('🗑️ Clearing certificates table...');
        const certificatesTable = document.getElementById('certificatesTable');
        if (certificatesTable) {
            const tbody = certificatesTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #6c757d;">No certificates found</td></tr>';
            }
        }
        
        // Clear certificates pagination
        const certificatesPagination = document.getElementById('certificatesPagination');
        if (certificatesPagination) certificatesPagination.innerHTML = '';
        
        // Clear certificate search input
        const certificateSearchInput = document.getElementById('certificateSearch');
        if (certificateSearchInput) certificateSearchInput.value = '';
        
        // Update certificate count
        const certificatesCountElement = document.getElementById('certificatesCount');
        if (certificatesCountElement) certificatesCountElement.textContent = '0';
        
        // Clear certificate-related charts
        const certificateChartContainers = document.querySelectorAll('.certificate-chart, .certificate-analytics');
        certificateChartContainers.forEach(container => {
            if (container) {
                container.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No certificate data available</div>';
            }
        });
        
        console.log('✅ Certificates table cleared successfully');
        
        // Show summary of what was cleared
        const summary = [];
        if (certificates.length > 0) summary.push(`${certificates.length} certificates`);
        if (pendingSync.certificateCreations.length > 0) summary.push(`${pendingSync.certificateCreations.length} pending certificate creations`);
        if (pendingSync.certificateUpdates.length > 0) summary.push(`${pendingSync.certificateUpdates.length} pending certificate updates`);
        if (pendingSync.certificateDeletions.length > 0) summary.push(`${pendingSync.certificateDeletions.length} pending certificate deletions`);
        
        // Add localStorage clearing info
        const totalCertificateLocalStorageItems = certificateLocalStorageKeys.length + certificateCacheKeys.length;
        if (totalCertificateLocalStorageItems > 0) {
            summary.push(`${totalCertificateLocalStorageItems} certificate localStorage items`);
        }
        
        const summaryText = summary.length > 0 ? `Cleared: ${summary.join(', ')}` : 'All certificates cleared';
        showMessage(`${summaryText} successfully!`, 'success');
        
        // Verify certificate localStorage is completely cleared
        const remainingCertificateItems = Object.keys(localStorage).filter(key => key.includes('certificate'));
        if (remainingCertificateItems.length > 0) {
            console.warn('⚠️ Some certificate localStorage items remain:', remainingCertificateItems);
        } else {
            console.log('✅ All certificate localStorage items successfully cleared');
        }
        
    } catch (error) {
        console.error('❌ Clear certificates error:', error);
        showMessage('Failed to clear certificates: ' + error.message, 'error');
    }
}



// ---- Event delegation for per-page dropdowns (DROP-IN, safe) ----
if (!window.__perPageHandlersBound) {
  document.addEventListener('change', function (e) {
    const t = e.target;

    // Members per-page
    if (t && t.matches('#membersPerPage')) {
      if (typeof changeMembersPerPage === 'function') {
        changeMembersPerPage();
      } else {
        const val = parseInt(t.value, 10);
        if (!Number.isNaN(val) && val > 0) {
          membersPerPage = val;
          localStorage.setItem('narap_members_per_page', String(val));
          window.membersCurrentPage = 1;
          if (typeof window.applyMemberFilters === 'function') {
            window.applyMemberFilters();
          } else if (typeof window.renderMembers === 'function') {
            window.renderMembers();
          } else if (typeof window.loadMembers === 'function') {
            window.loadMembers(1, val);
          }
          syncPerPageDropdowns();
        }
      }
      return;
    }

    // Certificates per-page
    if (t && t.matches('#certificatesPerPage')) {
      if (typeof changeCertificatesPerPage === 'function') {
        changeCertificatesPerPage();
      } else {
        const val = parseInt(t.value, 10);
        if (!Number.isNaN(val) && val > 0) {
          certificatesPerPage = val;
          localStorage.setItem('narap_certificates_per_page', String(val));
          window.certificatesCurrentPage = 1;
          if (typeof window.applyCertificateFilters === 'function') {
            window.applyCertificateFilters();
          } else if (typeof window.renderCertificates === 'function') {
            window.renderCertificates();
          } else if (typeof window.loadCertificates === 'function') {
            window.loadCertificates(1, val);
          }
          syncPerPageDropdowns();
        }
      }
      return;
    }

  }, false);
  window.__perPageHandlersBound = true;
}

// ==================== LOGIN FUNCTIONS ====================

function login(event) {
    event.preventDefault();
    
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username && password) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminSection').style.display = 'block';
        
        
  try {
    ['panel-members','panel-certificates','panel-analytics','panel-system'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.style.display='none';
    });
    var dash=document.getElementById('panel-dashboard');
    if(dash) dash.style.display='block';
    if (typeof switchTab==='function') switchTab('dashboard');
  } catch(_){}
  Promise.resolve().then(function(){ if (typeof loadDashboard==='function') loadDashboard(); });
localStorage.setItem('narap_logged_in', 'true');
        
        
        showMessage('Login successful! Welcome to NARAP Admin Panel.', 'success');
        
        setTimeout(() => {
            if (typeof loadDashboard === 'function') {
                loadDashboard();
            }
        }, 500);
    } else {
        
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.innerHTML = '<div class="error">Please enter both username and password</div>';
        }
    }
}

function fillAdminCredentials() {
    
    
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    
    if (usernameField && passwordField) {
        usernameField.value = 'admin@narap.org';
        passwordField.value = 'admin123';
        
    } else {
        
    }
}

function clearLoginForm() {
    
    
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const errorDiv = document.getElementById('loginError');
    
    if (usernameField) usernameField.value = '';
    if (passwordField) passwordField.value = '';
    if (errorDiv) errorDiv.innerHTML = '';
    
    
}

function logout() {
    
    
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'flex';
    
    localStorage.removeItem('narap_logged_in');
    
    clearLoginForm();
    
    
    showMessage('Logged out successfully', 'info');
}

// ==================== DASHBOARD FUNCTIONS ====================

async function loadDashboardStats() {
    try {
        
        
        // Get data from local storage first
        const localMembers = getLocalMembers();
        const localCertificates = getLocalCertificates();
        
        // Calculate statistics from local data
        const totalMembers = localMembers ? localMembers.length : 0;
        const totalCertificates = localCertificates ? localCertificates.length : 0;
        
        // Calculate new members this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const newThisMonth = localMembers ? localMembers.filter(member => {
            if (!member.createdAt && !member.dateAdded) return false;
            const memberDate = new Date(member.createdAt || member.dateAdded);
            return memberDate.getMonth() === currentMonth && memberDate.getFullYear() === currentYear;
        }).length : 0;
        
        // Try to get additional stats from backend if available
        let backendStats = null;
        if (navigator.onLine) {
            try {
                const response = await fetch(`${backendUrl}/api/analytics/dashboard`);
                if (response.ok) {
                    const stats = await tryJson(response);
                    if (stats && stats.success) {
                        backendStats = stats;
                    }
                }
            } catch (error) {
                
            }
        }
        
        // Update dashboard elements
        const totalMembersEl = document.getElementById('totalMembers');
        const totalCertificatesEl = document.getElementById('totalCertificates');
        const newThisMonthEl = document.getElementById('newThisMonth');
        const systemUptimeEl = document.getElementById('systemUptime');
        
        if (totalMembersEl) totalMembersEl.textContent = backendStats ? (backendStats.totalMembers || totalMembers) : totalMembers;
        if (totalCertificatesEl) totalCertificatesEl.textContent = backendStats ? (backendStats.totalCertificates || totalCertificates) : totalCertificates;
        if (newThisMonthEl) newThisMonthEl.textContent = backendStats ? (backendStats.newThisMonth || newThisMonth) : newThisMonth;
        
        if (systemUptimeEl) {
            // Calculate system uptime (days since epoch)
            const uptimeDays = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
            systemUptimeEl.textContent = uptimeDays + 'd';
        }
        
        
        
        
        return {
            totalMembers: backendStats ? (backendStats.totalMembers || totalMembers) : totalMembers,
            totalCertificates: backendStats ? (backendStats.totalCertificates || totalCertificates) : totalCertificates,
            newThisMonth: backendStats ? (backendStats.newThisMonth || newThisMonth) : newThisMonth
        };
        
    } catch (error) {
        
        
        // Fallback to local data only
        const localMembers = getLocalMembers();
        const localCertificates = getLocalCertificates();
        
        const totalMembersEl = document.getElementById('totalMembers');
        const totalCertificatesEl = document.getElementById('totalCertificates');
        const newThisMonthEl = document.getElementById('newThisMonth');
        const systemUptimeEl = document.getElementById('systemUptime');
        
        if (totalMembersEl) totalMembersEl.textContent = localMembers ? localMembers.length : 0;
        if (totalCertificatesEl) totalCertificatesEl.textContent = localCertificates ? localCertificates.length : 0;
        if (newThisMonthEl) newThisMonthEl.textContent = '0';
        if (systemUptimeEl) systemUptimeEl.textContent = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) + 'd';
        
        return null;
    }
}

async function loadDashboard() {
    try {
        
        
        await loadDashboardStats();
        await loadRecentActivity();
        
        
        
    await loadSystemActivityLogs();
        if (typeof initLogScrollArrows === 'function') initLogScrollArrows();
    if (typeof updateActivityOverlayVisibility === 'function') updateActivityOverlayVisibility();
        } catch (error) {
        
        showMessage('Failed to load dashboard: ' + error.message, 'error');
    }
}


async function loadRecentActivity() {
  try {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    // read persisted logs
    const logs = (typeof getActivityLog === 'function') ? getActivityLog() : [];
    // also derive pending actions as "system" notes
    const pending = (typeof getPendingSync === 'function') ? getPendingSync() : null;
    if (pending) {
      const totalPending =
        (pending.memberCreations?.length||0) + (pending.memberUpdates?.length||0) + (pending.memberDeletions?.length||0) +
        (pending.certificateCreations?.length||0) + (pending.certificateUpdates?.length||0) + (pending.certificateDeletions?.length||0);
      if (totalPending > 0) {
        logs.unshift({
          entity: 'system',
          action: 'pending',
          data: { totalPending },
          ts: new Date().toISOString(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        });
      }
    }

    // Render
    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'recent-activity-list';
    list.style.maxHeight = '320px';
    list.style.overflow = 'auto';
    list.style.padding = '6px 0';

    const fmt = (e) => {
      const when = (e.date && e.time) ? `${e.date} - ${e.time}` : new Date(e.ts || Date.now()).toLocaleString();
      let who = '';
      if (e.entity === 'member') who = e.data?.name || e.data?.code || 'Member';
      if (e.entity === 'certificate') who = e.data?.number || e.data?.member || 'Certificate';
      const badge = `<span class="badge badge-${e.action}" style="background:#eee;color:#333;border-radius:10px;padding:2px 8px;margin-right:8px;text-transform:capitalize;">${e.action}</span>`;
      const label = `<strong style="text-transform:capitalize;">${e.entity}</strong> - ${who || ''}`;
      return `<div class="ra-item" style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid #f0f0f0;">
        <div>${badge}${label}</div>
        <div style="color:#6c757d;font-size:12px;">${when}</div>
      </div>`;
    };

    if (!logs || !logs.length) {
      list.innerHTML = `<div style="text-align:center;color:#6c757d;padding:16px;">No recent activity</div>`;
    } else {
      list.innerHTML = logs.map(fmt).join('');
    }
    container.appendChild(list);

    // Activate scroll arrows for this container
    if (typeof initLogScrollArrows === 'function') initLogScrollArrows();
    if (typeof updateActivityOverlayVisibility === 'function') updateActivityOverlayVisibility();
  } catch (err) {
    console.error('loadRecentActivity failed:', err);
  }
}


function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

function getActivityIcon(type) {
    switch (type) {
        case 'member': return '👤';
        case 'certificate': return '📜';
        case 'sync': return 'Loading';
        default: return '📝';
    }
}

function getActivityColor(type) {
    switch (type) {
        case 'member': return '#007bff';
        case 'certificate': return '#28a745';
        case 'sync': return '#ffc107';
        default: return '#6c757d';
    }
}

// ==================== ANALYTICS FUNCTIONS ====================

async function loadAnalytics() {
  try {
    // Show loading state (if available)
    if (typeof showAnalyticsLoading === 'function') showAnalyticsLoading();

    // Get analytics (can be null/empty)
    const analyticsData = await getAnalyticsData();

    // Normalize / fallback so charts always have membersByState, etc.
    const normalizedData = (typeof normalizeAnalytics === 'function')
      ? normalizeAnalytics(analyticsData)
      : analyticsData;

    // Render charts and stats
    renderAnalyticsCharts(normalizedData);
    renderAnalyticsStats(normalizedData);
  } catch (error) {
    // Optional: log for diagnostics
    if (typeof console !== 'undefined' && console.error) {
      console.error('loadAnalytics failed:', error);
    }
    if (typeof showAnalyticsError === 'function') showAnalyticsError();
  } finally {
    // Hide loading spinner if your app provides a helper
    if (typeof hideAnalyticsLoading === 'function') hideAnalyticsLoading();
  }
}


async function getAnalyticsData() {
    try {
        // Try to get data from backend first
        if (navigator.onLine) {
            
            const response = await fetch(`${backendUrl}/api/analytics/dashboard`);
            
            
            if (response.ok) {
                const data = await tryJson(response);
                
                
                if (data && data.success) {
                    
                    return data.data;
                } else {
                    
                }
            } else {
                
            }
        }
        
        // Fallback to local data
        
        return generateLocalAnalyticsData();
        
    } catch (error) {
        
        return generateLocalAnalyticsData();
    }
}

function generateLocalAnalyticsData() {
    const localMembers = getLocalMembers();
    const localCertificates = getLocalCertificates();
    
    // Calculate basic statistics
    const totalMembers = localMembers ? localMembers.length : 0;
    const totalCertificates = localCertificates ? localCertificates.length : 0;
    
    // Calculate active and revoked certificates
    const activeCertificates = localCertificates ? localCertificates.filter(cert => 
        cert.status === 'active' || !cert.status
    ).length : 0;
    const revokedCertificates = localCertificates ? localCertificates.filter(cert => 
        cert.status === 'revoked'
    ).length : 0;
    
    // Calculate revoked certificates analytics
    const revokedAnalytics = calculateRevokedCertificateAnalytics(localCertificates);
    
    // Calculate new members this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = localMembers ? localMembers.filter(member => {
        const memberDate = new Date(member.createdAt || member.dateAdded || Date.now());
        return memberDate >= currentMonth;
    }).length : 0;
    
    // Calculate members by state
    const membersByState = {};
    if (localMembers) {
        localMembers.forEach(member => {
            const state = member.state || 'Unknown';
            membersByState[state] = (membersByState[state] || 0) + 1;
        });
    }
    
    // Calculate members by position
    const membersByPosition = {};
    if (localMembers) {
        localMembers.forEach(member => {
            const position = member.position || 'Unknown';
            membersByPosition[position] = (membersByPosition[position] || 0) + 1;
        });
    }
    
    // Calculate certificate types distribution
    const certificateTypes = {};
    if (localCertificates) {
        localCertificates.forEach(cert => {
            const type = cert.type || cert.certificateType || 'Unknown';
            certificateTypes[type] = (certificateTypes[type] || 0) + 1;
        });
    }
    
    return {
        totalMembers,
        totalCertificates,
        activeCertificates,
        revokedCertificates,
        newThisMonth,
        membersByState: Object.entries(membersByState).map(([state, count]) => ({ _id: state, count })),
        membersByPosition: Object.entries(membersByPosition).map(([position, count]) => ({ _id: position, count })),
        certificateTypes: Object.entries(certificateTypes).map(([type, count]) => ({ _id: type, count })),
        revokedAnalytics
    };
}

function calculateRevokedCertificateAnalytics(certificates) {
    if (!certificates || certificates.length === 0) {
        return {
            totalRevoked: 0,
            revocationRate: 0,
            revocationTrend: [],
            revokedByType: [],
            revokedByMonth: [],
            averageTimeToRevocation: 0,
            recentRevocations: []
        };
    }
    
    const revokedCerts = certificates.filter(cert => cert.status === 'revoked');
    const totalRevoked = revokedCerts.length;
    const totalCerts = certificates.length;
    const revocationRate = totalCerts > 0 ? (totalRevoked / totalCerts * 100).toFixed(1) : 0;
    
    // Calculate revocation trend (last 6 months)
    const revocationTrend = calculateRevocationTrend(revokedCerts);
    
    // Calculate revoked certificates by type
    const revokedByType = {};
    revokedCerts.forEach(cert => {
        const type = cert.type || cert.certificateType || 'Unknown';
        revokedByType[type] = (revokedByType[type] || 0) + 1;
    });
    
    // Calculate revoked certificates by month
    const revokedByMonth = {};
    revokedCerts.forEach(cert => {
        const revokedDate = new Date(cert.revokedAt || cert.updatedAt || Date.now());
        const monthKey = `${revokedDate.getFullYear()}-${String(revokedDate.getMonth() + 1).padStart(2, '0')}`;
        revokedByMonth[monthKey] = (revokedByMonth[monthKey] || 0) + 1;
    });
    
    // Calculate average time to revocation
    const timeToRevocation = revokedCerts.map(cert => {
        const issueDate = new Date(cert.issueDate || cert.createdAt || Date.now());
        const revokedDate = new Date(cert.revokedAt || cert.updatedAt || Date.now());
        return (revokedDate - issueDate) / (1000 * 60 * 60 * 24); // Days
    }).filter(days => days > 0);
    
    const averageTimeToRevocation = timeToRevocation.length > 0 
        ? Math.round(timeToRevocation.reduce((sum, days) => sum + days, 0) / timeToRevocation.length)
        : 0;
    
    // Get recent revocations (last 5)
    const recentRevocations = revokedCerts
        .sort((a, b) => new Date(b.revokedAt || b.updatedAt) - new Date(a.revokedAt || a.updatedAt))
        .slice(0, 5)
        .map(cert => ({
            id: cert._id || cert.id,
            recipientName: cert.recipientName || cert.recipient || cert.name,
            certificateNumber: cert.certificateNumber || cert.number,
            revokedAt: cert.revokedAt || cert.updatedAt,
            type: cert.type || cert.certificateType
        }));
    
    return {
        totalRevoked,
        revocationRate,
        revocationTrend,
        revokedByType: Object.entries(revokedByType).map(([type, count]) => ({ _id: type, count })),
        revokedByMonth: Object.entries(revokedByMonth).map(([month, count]) => ({ _id: month, count })),
        averageTimeToRevocation,
        recentRevocations
    };
}

function calculateRevocationTrend(revokedCerts) {
    const trend = [];
    const now = new Date();
    
    // Calculate last 6 months
    for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        const monthName = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const count = revokedCerts.filter(cert => {
            const revokedDate = new Date(cert.revokedAt || cert.updatedAt || Date.now());
            return revokedDate.getFullYear() === month.getFullYear() && 
                   revokedDate.getMonth() === month.getMonth();
        }).length;
        
        trend.push({ month: monthName, count });
    }
    
    return trend;
}

function showAnalyticsLoading() {
    const systemHealth = document.getElementById('systemHealth');
    if (systemHealth) {
        systemHealth.innerHTML = '<div class="loading">Loading analytics data...</div>';
    }
}

function showAnalyticsError() {
    const systemHealth = document.getElementById('systemHealth');
    if (systemHealth) {
        systemHealth.innerHTML = '<div class="error">Failed to load analytics data</div>';
    }
}



// Ensure analytics object has membersByState array; derive from local if missing

function normalizeAnalytics(data) {
  try {
    // Use existing normalizer if present; else a safe default.
    const normalize =
      (typeof _normalizeStateName === 'function')
        ? _normalizeStateName
        : (raw => {
            let s = (raw || 'Unknown').toString().trim().replace(/\s+/g, ' ');
            s = s.replace(/\s*state\s*$/i, '');                 // drop trailing "State"
            if (/^(fct|abuja|fct abuja|abuja fct)$/i.test(s)) s = 'FCT Abuja';
            return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
          });

    // Prefer backend if valid; otherwise build from the full local list.
    let arr = Array.isArray(data && data.membersByState) ? data.membersByState.slice() : null;

    if (!arr || !arr.length) {
      const fullList =
        (typeof getAllMembers === 'function') ? getAllMembers()
        : (typeof allMembers !== 'undefined') ? allMembers
        : (typeof getLocalMembers === 'function') ? getLocalMembers()
        : [];

      const counts = {};
      (fullList || []).forEach(m => {
        const st = normalize(m && (m.state || m.State || m.STATE));
        counts[st] = (counts[st] || 0) + 1;
      });

      arr = Object.entries(counts).map(([st, count]) => ({ _id: st, count: Number(count) || 0 }));
    } else {
      // Clean backend keys and numbers too
      arr = arr.map(it => ({
        _id: normalize(it._id || it.state || it.name),
        count: Number(it.count || it.total || it.value || 0)
      }));
    }

    // Sort by count (desc), then alphabetically
    arr.sort((a, b) => (b.count - a.count) || a._id.localeCompare(b._id));

    return Object.assign({}, data, { membersByState: arr });
  } catch (e) {
    // Hard fallback from local members if anything goes wrong
    const local = (typeof getLocalMembers === 'function') ? getLocalMembers() : [];
    const counts = {};
    (local || []).forEach(m => {
      const st = (typeof _normalizeStateName === 'function')
        ? _normalizeStateName(m && (m.state || m.State || m.STATE))
        : ((raw) => {
            let s = (raw || 'Unknown').toString().trim().replace(/\s+/g, ' ');
            s = s.replace(/\s*state\s*$/i, '');
            if (/^(fct|abuja|fct abuja|abuja fct)$/i.test(s)) s = 'FCT Abuja';
            return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
          })(m && (m.state || m.State || m.STATE));
      counts[st] = (counts[st] || 0) + 1;
    });

    const arr = Object.entries(counts)
      .map(([st, count]) => ({ _id: st, count: Number(count) || 0 }))
      .sort((a, b) => (b.count - a.count) || a._id.localeCompare(b._id));

    return Object.assign({}, data, { membersByState: arr });
  }
}


function renderAnalyticsCharts(data) {
    renderMemberChart(data);
    renderCertificateChart(data);
    renderStateChart(data);
    renderSystemHealth(data);
}

function renderAnalyticsStats(data) {
    // Calculate average members per month (last 6 months)
    const avgMembersPerMonth = calculateAverageMembersPerMonth();
    
    // Update basic statistics
    updateStatElement('avgMembersPerMonth', avgMembersPerMonth);
    updateStatElement('activeCertificates', data.activeCertificates);
    updateStatElement('revokedCertificates', data.revokedCertificates);
    updateStatElement('systemLoad', calculateSystemLoad());
    
    // Update revoked certificate statistics
    if (data.revokedAnalytics) {
        const revokedAnalytics = data.revokedAnalytics;
        
        // Update summary cards
        updateStatElement('totalRevokedCertificates', revokedAnalytics.totalRevoked || 0);
        updateStatElement('revocationRate', `${revokedAnalytics.revocationRate || 0}%`);
        updateStatElement('avgTimeToRevocation', `${revokedAnalytics.averageTimeToRevocation || 0} days`);
        
        // Update revocation trend summary
        const recentTrend = revokedAnalytics.revocationTrend || [];
        const lastMonthRevocations = recentTrend.length > 0 ? recentTrend[recentTrend.length - 1].count : 0;
        updateStatElement('lastMonthRevocations', lastMonthRevocations);
        
        // Update trend indicators
        updateRevocationTrendIndicators(revokedAnalytics);
        
        // Update chart counts
        updateStatElement('trendCount', recentTrend.reduce((sum, item) => sum + item.count, 0));
        updateStatElement('typeCount', revokedAnalytics.revokedByType ? revokedAnalytics.revokedByType.length : 0);
        
        // Update certificate type distribution
        if (data.certificateTypes) {
            const totalByType = data.certificateTypes.reduce((sum, type) => sum + type.count, 0);
            updateStatElement('totalCertificatesByType', totalByType);
        }
    }
}

function updateRevocationTrendIndicators(revokedAnalytics) {
    // Update trend indicators with meaningful data
    const trendElement = document.getElementById('revocationTrend');
    const rateElement = document.getElementById('rateTrend');
    const timeElement = document.getElementById('timeTrend');
    const monthElement = document.getElementById('monthTrend');
    
    if (trendElement) {
        const totalRevoked = revokedAnalytics.totalRevoked || 0;
        if (totalRevoked === 0) {
            trendElement.textContent = 'No revocations';
            trendElement.className = 'revoked-summary-trend';
        } else {
            trendElement.textContent = `${totalRevoked} total`;
            trendElement.className = 'revoked-summary-trend negative';
        }
    }
    
    if (rateElement) {
        const rate = parseFloat(revokedAnalytics.revocationRate || 0);
        if (rate === 0) {
            rateElement.textContent = 'Perfect';
            rateElement.className = 'revoked-summary-trend positive';
        } else if (rate < 5) {
            rateElement.textContent = 'Low';
            rateElement.className = 'revoked-summary-trend positive';
        } else if (rate < 15) {
            rateElement.textContent = 'Moderate';
            rateElement.className = 'revoked-summary-trend';
        } else {
            rateElement.textContent = 'High';
            rateElement.className = 'revoked-summary-trend negative';
        }
    }
    
    if (timeElement) {
        const avgTime = revokedAnalytics.averageTimeToRevocation || 0;
        if (avgTime === 0) {
            timeElement.textContent = 'No data';
            timeElement.className = 'revoked-summary-trend';
        } else if (avgTime < 30) {
            timeElement.textContent = 'Quick';
            timeElement.className = 'revoked-summary-trend negative';
        } else if (avgTime < 90) {
            timeElement.textContent = 'Normal';
            timeElement.className = 'revoked-summary-trend';
        } else {
            timeElement.textContent = 'Slow';
            timeElement.className = 'revoked-summary-trend positive';
        }
    }
    
    if (monthElement) {
        const recentTrend = revokedAnalytics.revocationTrend || [];
        if (recentTrend.length >= 2) {
            const currentMonth = recentTrend[recentTrend.length - 1].count;
            const previousMonth = recentTrend[recentTrend.length - 2].count;
            const change = currentMonth - previousMonth;
            
            if (change === 0) {
                monthElement.textContent = 'No change';
                monthElement.className = 'revoked-summary-trend';
            } else if (change > 0) {
                monthElement.textContent = `+${change} more`;
                monthElement.className = 'revoked-summary-trend negative';
            } else {
                monthElement.textContent = `${change} less`;
                monthElement.className = 'revoked-summary-trend positive';
            }
        } else {
            monthElement.textContent = 'No trend';
            monthElement.className = 'revoked-summary-trend';
        }
    }
}

function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function calculateAverageMembersPerMonth() {
    const localMembers = getLocalMembers();
    if (!localMembers || localMembers.length === 0) return 0;
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentMembers = localMembers.filter(member => {
        const memberDate = new Date(member.createdAt || member.dateAdded || Date.now());
        return memberDate >= sixMonthsAgo;
    });
    
    return Math.round(recentMembers.length / 6);
}

function calculateSystemLoad() {
    // Simulate system load based on data size and pending sync
    const localMembers = getLocalMembers();
    const localCertificates = getLocalCertificates();
    const pendingSync = getPendingSync();
    
    const totalItems = (localMembers ? localMembers.length : 0) + 
                      (localCertificates ? localCertificates.length : 0);
    const pendingItems = (pendingSync.memberCreations ? pendingSync.memberCreations.length : 0) +
                        (pendingSync.memberUpdates ? pendingSync.memberUpdates.length : 0) +
                        (pendingSync.memberDeletions ? pendingSync.memberDeletions.length : 0);
    
    const loadPercentage = Math.min(100, Math.round((totalItems + pendingItems) / 10));
    return loadPercentage + '%';
}

function renderMemberChart(data) {
    const canvas = document.getElementById('memberChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Generate member registration trend (last 6 months)
    const months = [];
    const counts = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toLocaleDateString('en-US', { month: 'short' }));
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const localMembers = getLocalMembers();
        const monthCount = localMembers ? localMembers.filter(member => {
            const memberDate = new Date(member.createdAt || member.dateAdded || Date.now());
            return memberDate >= monthStart && memberDate <= monthEnd;
        }).length : 0;
        
        counts.push(monthCount);
    }
    
    // Create simple chart using canvas
    drawSimpleChart(ctx, months, counts, 'Member Registrations', '#007bff');
}

function renderCertificateChart(data) {
    const canvas = document.getElementById('certificateChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Certificate status distribution with enhanced revoked analytics
    const labels = ['Active', 'Revoked', 'Pending'];
    const values = [
        data.activeCertificates || 0,
        data.revokedCertificates || 0,
        (data.totalCertificates || 0) - (data.activeCertificates || 0) - (data.revokedCertificates || 0)
    ];
    
    // Create simple chart using canvas
    drawSimpleChart(ctx, labels, values, 'Certificate Status Distribution', '#28a745');
    
    // Render additional revoked certificate analytics
    renderRevokedCertificateAnalytics(data.revokedAnalytics);
}

function renderRevokedCertificateAnalytics(revokedAnalytics) {
    if (!revokedAnalytics) return;
    
    // Update revoked certificate statistics
    updateStatElement('totalRevokedCertificates', revokedAnalytics.totalRevoked || 0);
    updateStatElement('revocationRate', `${revokedAnalytics.revocationRate || 0}%`);
    updateStatElement('avgTimeToRevocation', `${revokedAnalytics.averageTimeToRevocation || 0} days`);
    
    // Render revocation trend chart
    renderRevocationTrendChart(revokedAnalytics.revocationTrend);
    
    // Render revoked certificates by type chart
    renderRevokedByTypeChart(revokedAnalytics.revokedByType);
    
    // Render recent revocations list
    renderRecentRevocationsList(revokedAnalytics.recentRevocations);
}

function renderRevocationTrendChart(trendData) {
    const canvas = document.getElementById('revocationTrendChart');
    if (!canvas || !trendData || trendData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const labels = trendData.map(item => item.month);
    const values = trendData.map(item => item.count);
    
    drawSimpleChart(ctx, labels, values, 'Revocation Trend (Last 6 Months)', '#dc3545');
}

function renderRevokedByTypeChart(revokedByType) {
    const canvas = document.getElementById('revokedByTypeChart');
    if (!canvas || !revokedByType || revokedByType.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const labels = revokedByType.map(item => item._id);
    const values = revokedByType.map(item => item.count);
    
    drawSimpleChart(ctx, labels, values, 'Revoked Certificates by Type', '#fd7e14');
}

function renderRecentRevocationsList(recentRevocations) {
    const container = document.getElementById('recentRevocationsList');
    if (!container) return;
    
    if (!recentRevocations || recentRevocations.length === 0) {
        container.innerHTML = '<div class="no-data">No recent revocations</div>';
        return;
    }
    
    const revocationsHTML = recentRevocations.map(revocation => {
        const revokedDate = new Date(revocation.revokedAt);
        const timeAgo = getTimeAgo(revokedDate);
        
        return `
            <div class="recent-revocation-item">
                <div class="revocation-info">
                    <div class="recipient-name">${revocation.recipientName || 'Unknown'}</div>
                    <div class="certificate-number">${revocation.certificateNumber || 'N/A'}</div>
                    <div class="certificate-type">${revocation.type || 'Unknown'}</div>
                </div>
                <div class="revocation-time">
                    <span class="time-ago">${timeAgo}</span>
                    <span class="revocation-date">${revokedDate.toLocaleDateString()}</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="recent-revocations-header">
            <h4>Recent Revocations</h4>
            <span class="revocation-count">${recentRevocations.length} recent</span>
        </div>
        <div class="recent-revocations-list">
            ${revocationsHTML}
        </div>
    `;
}



// Canonicalize state names so counts aren't split by tiny differences
function _normalizeStateName(raw) {
    let s = (raw || 'Unknown').toString().trim();
    // collapse internal whitespace
    s = s.replace(/\s+/g, ' ');
    // strip trailing "State" (case-insensitive)
    s = s.replace(/\s*state\s*$/i, '');
    // unify common FCT variants
    if (/^(fct|abuja|fct abuja|abuja fct)$/i.test(s)) s = 'FCT Abuja';
    // Title Case basic
    s = s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return s;
}

function renderStateChart(data) {
    const canvas = document.getElementById('stateChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Check if data.membersByState exists and is an array

    // Fallback: derive from local if array missing
    if (!data.membersByState || !Array.isArray(data.membersByState)) {
        const localMembers = (typeof getLocalMembers === 'function') ? getLocalMembers() : [];
        const map = {};
        (localMembers || []).forEach(m => {
            const st = (m && m.state) ? m.state : 'Unknown';
            map[st] = (map[st] || 0) + 1;
        });
        data.membersByState = Object.entries(map).map(([st, count]) => ({ _id: st, count }));
    }
    
    // Top 5 states by member count
    const topStates = data.membersByState;
    const labels = topStates.map(state => state._id);
    const values = topStates.map(state => state.count);
    
    // Create simple chart using canvas
    drawSimpleChart(ctx, labels, values, 'Members by State', '#ffc107');
}

function renderSystemHealth(data) {
    const systemHealth = document.getElementById('systemHealth');
    if (!systemHealth) return;
    
    const healthScore = calculateHealthScore(data);
    const healthStatus = getHealthStatus(healthScore);
    
    systemHealth.innerHTML = `
        <div class="health-indicator">
            <div class="health-score" style="color: ${healthStatus.color}">
                ${healthScore}%
            </div>
            <div class="health-status" style="color: ${healthStatus.color}">
                ${healthStatus.text}
            </div>
            <div class="health-details">
                <div>Total Members: ${data.totalMembers}</div>
                <div>Total Certificates: ${data.totalCertificates}</div>
                <div>Active Certificates: ${data.activeCertificates}</div>
            </div>
        </div>
    `;
}

function calculateHealthScore(data) {
    let score = 100;
    
    // Deduct points for various issues
    if (data.totalMembers === 0) score -= 20;
    if (data.totalCertificates === 0) score -= 15;
    
    // Revoked certificate analysis
    if (data.revokedAnalytics) {
        const revocationRate = parseFloat(data.revokedAnalytics.revocationRate || 0);
        
        // Deduct points for high revocation rates
        if (revocationRate > 50) score -= 25;
        else if (revocationRate > 30) score -= 15;
        else if (revocationRate > 15) score -= 10;
        else if (revocationRate > 5) score -= 5;
        
        // Deduct points if revoked certificates exceed active ones
        if (data.revokedAnalytics.totalRevoked > data.activeCertificates) score -= 20;
        
        // Bonus points for low revocation rates
        if (revocationRate < 2) score += 10;
        if (revocationRate === 0) score += 5;
    }
    
    // Check pending sync operations
    const pendingSync = getPendingSync();
    const pendingCount = (pendingSync.memberCreations ? pendingSync.memberCreations.length : 0) +
                        (pendingSync.memberUpdates ? pendingSync.memberUpdates.length : 0) +
                        (pendingSync.memberDeletions ? pendingSync.memberDeletions.length : 0) +
                        (pendingSync.certificates ? pendingSync.certificates.length : 0);
    
    if (pendingCount > 10) score -= 15;
    if (pendingCount > 5) score -= 10;
    if (pendingCount > 0) score -= 5;
    
    return Math.max(0, Math.min(100, score));
}

function getHealthStatus(score) {
    if (score >= 90) return { text: 'Excellent', color: '#28a745' };
    if (score >= 75) return { text: 'Good', color: '#17a2b8' };
    if (score >= 60) return { text: 'Fair', color: '#ffc107' };
    return { text: 'Poor', color: '#dc3545' };
}

function drawSimpleChart(ctx, labels, values, title, color) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up chart area
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Find max value
    const maxValue = Math.max(...values, 1);
    
    // Draw bars
    const barWidth = chartWidth / labels.length;
    const barSpacing = barWidth * 0.1;
    const actualBarWidth = barWidth - barSpacing;
    
    ctx.fillStyle = color;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
        const barHeight = (values[index] / maxValue) * chartHeight;
        const x = padding + index * barWidth + barSpacing / 2;
        const y = height - padding - barHeight;
        
        // Draw bar
        ctx.fillRect(x, y, actualBarWidth, barHeight);
        
        // Draw value
        ctx.fillStyle = '#333';
        ctx.fillText(values[index], x + actualBarWidth / 2, y - 5);
        
        // Draw label
        ctx.fillText(label, x + actualBarWidth / 2, height - padding + 15);
        ctx.fillStyle = color;
    });
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 20);
}

// ==================== SYSTEM PAGE FUNCTIONS ====================

async function loadSystemPage() {
    try {
        
        
        // Show loading state
        showSystemLoading();
        
        // Load system information
        await loadSystemInfo();
        
        // Load system logs
        loadSystemLogs();
        
        // Update connection status
        updateConnectionStatus();
        
        
        
    } catch (error) {
        
        showSystemError();
    }
}

async function loadSystemInfo() {
    try {
        // Calculate database size
        const dbSize = calculateDatabaseSize();
        updateSystemStat('dbSize', dbSize);
        
        // Get last backup time
        const lastBackup = getLastBackupTime();
        updateSystemStat('lastBackup', lastBackup);
        
        // Get last sync time
        const lastSync = getLastSyncTime();
        updateSystemStat('lastSync', lastSync);
        
        // Check server status
        const serverStatus = await checkServerStatus();
        updateSystemStat('serverStatus', serverStatus);
        
    } catch (error) {
        
    }
}

function calculateDatabaseSize() {
    try {
        let totalSize = 0;
        
        // Calculate size of all localStorage items
        const keys = ['narap_members', 'narap_certificates', 'narap_pending_sync', 'narap_theme'];
        keys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                totalSize += new Blob([item]).size;
            }
        });
        
        // Convert to MB
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        return sizeInMB + ' MB';
        
    } catch (error) {
        
        return '0 MB';
    }
}

function getLastBackupTime() {
    try {
        const lastBackup = localStorage.getItem('narap_last_backup');
        if (lastBackup) {
            const date = new Date(parseInt(lastBackup));
            return date.toLocaleString();
        }
        return 'Never';
    } catch (error) {
        
        return 'Never';
    }
}

function getLastSyncTime() {
    try {
        const lastSync = localStorage.getItem('narap_last_sync');
        if (lastSync) {
            const date = new Date(parseInt(lastSync));
            return date.toLocaleString();
        }
        return 'Never';
    } catch (error) {
        
        return 'Never';
    }
}

async function checkServerStatus() {
    try {
        // First check if browser is online
        if (!navigator.onLine) {
            console.log('🌐 Browser is offline');
            return 'Offline';
        }
        
        console.log('🔍 Checking server status at:', `${backendUrl}/api/health`);
        
        // Create a more robust timeout mechanism
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('⏰ Server status check timed out after 15 seconds');
            controller.abort();
        }, 15000); // Increased timeout to 15 seconds
        
        try {
            const response = await fetch(`${backendUrl}/api/health`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache' // Prevent caching issues
                },
                mode: 'cors', // Explicitly set CORS mode
                credentials: 'omit' // Don't send credentials for health check
            });
            
            clearTimeout(timeoutId);
            
            console.log('📡 Server response status:', response.status);
            console.log('📡 Server response headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
                const data = await tryJson(response);
                console.log('📊 Server health data:', data);
                
                if (data && data.status === 'healthy') {
                    console.log('✅ Server is healthy');
                    return 'Online';
                } else {
                    console.log('⚠️ Server returned unhealthy status:', data);
                    return 'Error';
                }
            } else {
                console.log('❌ Server returned error status:', response.status);
                console.log('❌ Response text:', await response.text());
                return 'Error';
            }
            
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }
        
    } catch (error) {
        console.log('❌ Server status check failed:', error.message);
        console.log('❌ Error type:', error.name);
        console.log('❌ Error stack:', error.stack);
        
        if (error.name === 'AbortError') {
            console.log('⏰ Server status check timed out');
            return 'Timeout';
        }
        
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('ERR_NETWORK') ||
            error.message.includes('ERR_INTERNET_DISCONNECTED')) {
            console.log('🌐 Network error - server may be offline');
            return 'Offline';
        }
        
        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
            console.log('🚫 CORS error - server may be blocking requests');
            return 'CORS Error';
        }
        
        return 'Error';
    }
}

function updateSystemStat(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        if (elementId === 'serverStatus') {
            // Add styling for server status
            element.className = 'server-status ' + value.toLowerCase();
            element.textContent = value;
        } else {
            element.textContent = value;
        }
    }
}

function showSystemLoading() {
    const systemLogs = document.getElementById('systemLogs');
    if (systemLogs) {
        systemLogs.innerHTML = '<div class="loading">Loading system information...</div>';
    }
}

function showSystemError() {
    const systemLogs = document.getElementById('systemLogs');
    if (systemLogs) {
        systemLogs.innerHTML = '<div class="error">Failed to load system information</div>';
    }
}

function loadSystemLogs() {
    try {
        const systemLogs = document.getElementById('systemLogs');
        if (!systemLogs) return;
        
        // Get recent system activities
        const activities = getSystemActivities();
        
        if (activities.length === 0) {
            systemLogs.innerHTML = '<div class="no-data">No system activities found</div>';
            return;
        }
        
        const logsHTML = activities.map(activity => {
            const timeAgo = getTimeAgo(activity.timestamp);
            const icon = getSystemActivityIcon(activity.type);
            const color = getSystemActivityColor(activity.type);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${color};">${icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        systemLogs.innerHTML = logsHTML;
        
    } catch (error) {
        
        const systemLogs = document.getElementById('systemLogs');
        if (systemLogs) {
            systemLogs.innerHTML = '<div class="error">Failed to load system logs</div>';
        }
    }
}

function getSystemActivities() {
    try {
        const activities = [];
        
        // Get last backup time
        const lastBackup = localStorage.getItem('narap_last_backup');
        if (lastBackup) {
            activities.push({
                type: 'backup',
                title: 'System backup created',
                timestamp: parseInt(lastBackup)
            });
        }
        
        // Get last sync time
        const lastSync = localStorage.getItem('narap_last_sync');
        if (lastSync) {
            activities.push({
                type: 'sync',
                title: 'Data synchronized with backend',
                timestamp: parseInt(lastSync)
            });
        }
        
        // Get recent member activities
        const localMembers = getLocalMembers();
        if (localMembers && localMembers.length > 0) {
            const recentMembers = localMembers
                .sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.dateAdded || a.updatedAt || 0);
                    const dateB = new Date(b.createdAt || b.dateAdded || b.updatedAt || 0);
                    return dateB - dateA;
                })
                .slice(0, 3);
            
            recentMembers.forEach(member => {
                const date = new Date(member.createdAt || member.dateAdded || member.updatedAt);
                activities.push({
                    type: 'member',
                    title: `${member.createdAt ? 'Added' : 'Updated'} member: ${member.name || member.fullName}`,
                    timestamp: date.getTime()
                });
            });
        }
        
        // Get pending sync activities
        const pendingSync = getPendingSync();
        const pendingCount = 
            (pendingSync.memberCreations ? pendingSync.memberCreations.length : 0) +
            (pendingSync.memberUpdates ? pendingSync.memberUpdates.length : 0) +
            (pendingSync.memberDeletions ? pendingSync.memberDeletions.length : 0);
        
        if (pendingCount > 0) {
            activities.push({
                type: 'pending',
                title: `${pendingCount} changes pending sync`,
                timestamp: Date.now()
            });
        }
        
        // Sort by timestamp (most recent first)
        activities.sort((a, b) => b.timestamp - a.timestamp);
        
        return activities.slice(0, 10); // Return last 10 activities
        
    } catch (error) {
        
        return [];
    }
}

function getSystemActivityIcon(type) {
    switch (type) {
        case 'backup': return '💾';
        case 'sync': return 'Loading';
        case 'member': return '👤';
        case 'pending': return '⏳';
        default: return '📝';
    }
}

function getSystemActivityColor(type) {
    switch (type) {
        case 'backup': return '#28a745';
        case 'sync': return '#007bff';
        case 'member': return '#17a2b8';
        case 'pending': return '#ffc107';
        default: return '#6c757d';
    }
}

// Enhanced backup function
async function createBackup() {
    try {
        showMessage('Creating backup...', 'info');
        
        const [members, certificates] = await Promise.all([
            fetch(`${backendUrl}/api/users/getUsers`).then(async res => (await tryJson(res))).catch(() => []),
            getCertificates()
        ]);
        
        const pendingSync = getPendingSync();
        
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            members: members || [],
            certificates: certificates || [],
            pendingSync: pendingSync,
            metadata: {
                totalMembers: members ? members.length : 0,
                totalCertificates: certificates ? certificates.length : 0,
                pendingChanges: pendingSync.certificateCreations.length + 
                               pendingSync.certificateUpdates.length + 
                               pendingSync.certificateDeletions.length
            }
        };
        
        const content = JSON.stringify(backup, null, 2);
        const filename = `narap_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        
        downloadFile(content, filename, 'application/json');
        
        // Save backup timestamp
        localStorage.setItem('narap_last_backup', Date.now().toString());
        
        showMessage('Backup created successfully!', 'success');
        
        // Refresh system page if currently on it
        const activePanel = document.querySelector('.panel.active');
        if (activePanel && activePanel.id === 'panel-system') {
            loadSystemPage();
        }
        
    } catch (error) {
        
        showMessage('Failed to create backup: ' + error.message, 'error');
    }
}

// Enhanced sync function
async function syncWithBackend() {
    try {
        showMessage('Syncing with backend...', 'info');
        
        await syncPendingChanges();
        
        if (typeof loadMembers === 'function') await loadMembers();
        if (typeof loadCertificates === 'function') await loadCertificates();
        
        // Save sync timestamp
        localStorage.setItem('narap_last_sync', Date.now().toString());
        
        showMessage('Backend sync completed successfully!', 'success');
        
        // Refresh system page if currently on it
        const activePanel = document.querySelector('.panel.active');
        if (activePanel && activePanel.id === 'panel-system') {
            loadSystemPage();
        }
        
    } catch (error) {
        
        showMessage('Failed to sync with backend: ' + error.message, 'error');
    }
}

// Export all data function
async function exportAllData() {
    try {
        showMessage('Preparing data export...', 'info');
        
        // Get all data
        const [members, certificates] = await Promise.all([
            fetch(`${backendUrl}/api/users/getUsers`).then(async res => (await tryJson(res))).catch(() => getLocalMembers()),
            getCertificates()
        ]);
        
        const pendingSync = getPendingSync();
        const systemInfo = {
            lastBackup: getLastBackupTime(),
            lastSync: getLastSyncTime(),
            databaseSize: calculateDatabaseSize(),
            serverStatus: await checkServerStatus()
        };
        
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            members: members || [],
            certificates: certificates || [],
            pendingSync: pendingSync,
            systemInfo: systemInfo,
            metadata: {
                totalMembers: members ? members.length : 0,
                totalCertificates: certificates ? certificates.length : 0,
                pendingChanges: (pendingSync.memberCreations ? pendingSync.memberCreations.length : 0) +
                               (pendingSync.memberUpdates ? pendingSync.memberUpdates.length : 0) +
                               (pendingSync.memberDeletions ? pendingSync.memberDeletions.length : 0)
            }
        };
        
        const content = JSON.stringify(exportData, null, 2);
        const filename = `narap_export_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        
        downloadFile(content, filename, 'application/json');
        
        showMessage('Data export completed successfully!', 'success');
        
    } catch (error) {
        
        showMessage('Failed to export data: ' + error.message, 'error');
    }
}

// ==================== MEMBER FUNCTIONS ====================



async function loadMembers(page = 1, limit = 10, searchTerm = '', positionFilter = '', stateFilter = '') {
  // --- Full Nigeria State priority (A→Z) with FCT, plus alias normalization ---
  const STATE_PRIORITY = [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta',
    'Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
    'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
    'Yobe','Zamfara','FCT'
  ];

  // Aliases and common variations → canonical state names
  const STATE_ALIASES = {
    'federal capital territory': 'FCT',
    'abuja': 'FCT', 'abuja fct': 'FCT', 'fct abuja': 'FCT',
    'akwa-ibom': 'Akwa Ibom', 'akwa_ibom': 'Akwa Ibom',
    'cross-river': 'Cross River', 'cross_river': 'Cross River',
    'nassarawa': 'Nasarawa',
    'osun state': 'Osun', 'oyo state': 'Oyo', 'kogi state': 'Kogi', 'kwara state': 'Kwara','lagos state': 'Lagos',
    'akwa ibom state': 'Akwa Ibom', 'cross river state': 'Cross River',
    'abia state': 'Abia',
'adamawa state': 'Adamawa',
'anambra state': 'Anambra',
'bauchi state': 'Bauchi',
'bayelsa state': 'Bayelsa',
'benue state': 'Benue',
'borno state': 'Borno',
'delta state': 'Delta',
'ebonyi state': 'Ebonyi',
'edo state': 'Edo',
'ekiti state': 'Ekiti',
'enugu state': 'Enugu',
'gombe state': 'Gombe',
'imo state': 'Imo',
'jigawa state': 'Jigawa',
'kaduna state': 'Kaduna',
'kano state': 'Kano',
'katsina state': 'Katsina',
'kebbi state': 'Kebbi',
'niger state': 'Niger',
'ogun state': 'Ogun',
'ondo state': 'Ondo',
'plateau state': 'Plateau',
'rivers state': 'Rivers',
'sokoto state': 'Sokoto',
'taraba state': 'Taraba',
'yobe state': 'Yobe',
'zamfara state': 'Zamfara'
  };

  function normalizeStateName(s) {
    let t = String(s || '').trim();
    // remove trailing "State"
    t = t.replace(/\s+state$/i, '').trim();
    // unify dashes/underscores to spaces
    t = t.replace(/[-_]+/g, ' ').trim();
    const key = t.toLowerCase();
    if (STATE_ALIASES[key]) return STATE_ALIASES[key];
    return t;
  }

  function __stateRank(s) {
    const canon = normalizeStateName(s);
    const idx = STATE_PRIORITY.findIndex(x => x.toLowerCase() == canon.toLowerCase());
    return idx === -1 ? Number.POSITIVE_INFINITY : idx;
  }

  // Comparator: Name INITIAL (A→Z) → State by PRIORITY → State (A→Z) → Full Name (A→Z) → Code
  function __memberCmp(a, b) {
    const rawA = String(a?.name || '').trim();
    const rawB = String(b?.name || '').trim();
    const initA = rawA ? rawA[0].toUpperCase() : '~';
    const initB = rawB ? rawB[0].toUpperCase() : '~';
    if (initA !== initB) return initA.localeCompare(initB);

    const stateA = normalizeStateName(a?.state);
    const stateB = normalizeStateName(b?.state);
    const rankA = __stateRank(stateA);
    const rankB = __stateRank(stateB);
    if (rankA !== rankB) return rankA - rankB;

    const as = String(stateA).toLowerCase();
    const bs = String(stateB).toLowerCase();
    if (as !== bs) return as.localeCompare(bs);

    const an = rawA.toLowerCase();
    const bn = rawB.toLowerCase();
    if (an !== bn) return an.localeCompare(bn);

    const ac = String(a?.code || '').trim().toLowerCase();
    const bc = String(b?.code || '').trim().toLowerCase();
    return ac.localeCompare(bc);
  }

  try {
    // 1) Gather data from backend + local
    let backendMembers = [];
    const localMembers = Array.isArray(getLocalMembers()) ? getLocalMembers() : [];

    if (navigator.onLine) {
      try {
        const res = await fetch(`${backendUrl}/api/users/members`);
        if (res && res.ok) {
          const data = await tryJson(res);
          if (Array.isArray(data)) {
            backendMembers = data.map(m => ({
              ...m,
              // Normalize common fields used in the UI
              name: m.name || m.fullName || m.memberName || '',
              email: m.email || '',
              code: m.code || m.Code || '',
              position: m.position || '',
              state: normalizeStateName(m.state || ''),
              zone: m.zone || '',
              isFromBackend: true
            }));
          }
        }
      } catch (_) {
        // If backend fails, proceed with local only
      }
    }

    // 2) Merge by stable key; local wins on conflicts
    const keyOf = (m) => {
      const c = String(m?.code || '').trim().toLowerCase();
      if (c) return 'c:' + c;
      const e = String(m?.email || '').trim().toLowerCase();
      if (e) return 'e:' + e;
      return null;
    };

    const byKey = new Map();
    backendMembers.forEach(m => { const k = keyOf(m); if (k) byKey.set(k, m); });
    localMembers.forEach(lm => {
      const k = keyOf(lm);
      if (!k) return;
      const ex = byKey.get(k);
      byKey.set(k, ex ? { ...ex, ...lm } : lm); // local overwrites backend
    });

    let mergedMembers = Array.from(byKey.values()).map(m => ({
      ...m,
      state: normalizeStateName(m.state) // normalize states for sorting/display
    }));

    // 3) Sort + Persist + cache
    mergedMembers = mergedMembers.slice().sort(__memberCmp);
    saveLocalMembers(mergedMembers);
    window.members = mergedMembers;
    window.currentMembers = mergedMembers;

    // 4) Filter (and keep sorted)
    let filtered = mergedMembers;

    const q = (searchTerm || '').toString().trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(m =>
        (m.name || '').toString().toLowerCase().includes(q) ||
        (m.code || '').toString().toLowerCase().includes(q) ||
        (m.email || '').toString().toLowerCase().includes(q)
      );
    }

    if (positionFilter) {
      const pf = positionFilter.toString().trim().toLowerCase();
      filtered = filtered.filter(m => (m.position || '').toString().trim().toLowerCase() === pf);
    }

    if (stateFilter) {
      const sf = normalizeStateForExport(stateFilter).toLowerCase();
      filtered = filtered.filter(m => normalizeStateForExport(m.state).toLowerCase() === sf);
    }

    // Keep filtered order stable
    filtered = filtered.slice().sort(__memberCmp);

    // 5) Paginate + render
    const perPage = limit || 10;
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const safePage = Math.min(Math.max(1, page || 1), totalPages);
    const startIndex = (safePage - 1) * perPage;
    const endIndex = startIndex + perPage;

    if (typeof displayMembers === 'function') {
      displayMembers(filtered.slice(startIndex, endIndex), totalItems, safePage, totalPages, perPage);
    }
    if (typeof renderPagination === 'function') {
      renderPagination(safePage, totalPages, totalItems, perPage, 'members');
    }

  } catch (err) {
    console.error('Failed to load members:', err);
    if (typeof showMessage === 'function') showMessage('Failed to load members', 'error');
  }
}



async function addMember(event) {
    event.preventDefault();
    
    // Get form elements with error checking
    const nameField = document.getElementById('memberName');
    const emailField = document.getElementById('memberEmail');
    const passwordField = document.getElementById('memberPassword');
    const codeField = document.getElementById('memberCode');
    const positionField = document.getElementById('memberPosition');
    const stateField = document.getElementById('memberState');
    const zoneField = document.getElementById('memberZone');
    
    // Check if all form elements exist
    if (!nameField || !passwordField || !codeField || !positionField || !stateField || !zoneField) {
        console.error('❌ Form elements not found:', {
            nameField: !!nameField,
            passwordField: !!passwordField,
            codeField: !!codeField,
            positionField: !!positionField,
            stateField: !!stateField,
            zoneField: !!zoneField
        });
        showMessage('Form elements not found. Please refresh the page.', 'error');
        return;
    }
    
    const formData = {
        name: nameField.value.trim(),
        email: emailField ? emailField.value.trim() : '',
        password: passwordField.value,
        code: codeField.value.trim(),
        position: positionField.value,
        state: stateField.value.trim(),
        zone: zoneField.value.trim()
    };
    
    console.log('🔍 Form data collected:', {
        name: formData.name,
        email: formData.email,
        code: formData.code,
        position: formData.position,
        state: formData.state,
        zone: formData.zone,
        hasPassword: !!formData.password,
        passwordLength: formData.password ? formData.password.length : 0
    });
    
    // Create FormData for file upload
    const formDataObj = new FormData();
    
    // Add text fields with validation
    formDataObj.append('name', formData.name);
    
    // Add email (optional)
    if (formData.email && formData.email.trim()) {
        formDataObj.append('email', formData.email.trim());
    }
    
    formDataObj.append('password', formData.password || 'defaultPassword123');
    formDataObj.append('code', formData.code);
    formDataObj.append('position', formData.position);
    formDataObj.append('state', formData.state);
    formDataObj.append('zone', formData.zone);
    
    // Debug: Log all FormData entries
    console.log('🔍 FormData contents:');
    for (let [key, value] of formDataObj.entries()) {
        if (value instanceof File) {
            console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
            console.log(`  ${key}: "${value}"`);
        }
    }
    
    // Add files
    const passportInput = document.getElementById('memberPassport');
    const signatureInput = document.getElementById('memberSignature');
    
    if (passportInput && passportInput.files[0]) {
        formDataObj.append('passportPhoto', passportInput.files[0]);
    }
    if (signatureInput && signatureInput.files[0]) {
        formDataObj.append('signature', signatureInput.files[0]);
    }
    
    // Final validation: Check if all required fields are in FormData
    const requiredFields = ['name', 'password', 'code', 'state', 'zone'];
    const missingFields = [];
    
    for (const field of requiredFields) {
        const value = formDataObj.get(field);
        if (!value || value.toString().trim() === '') {
            missingFields.push(field);
        }
    }
    
    if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        showMessage(`Missing required fields: ${missingFields.join(', ')}`, 'error');
        return;
    }
    
    console.log('✅ All required fields present in FormData');
    
    // Validate required fields
    if (!formData.name || !formData.code || !formData.state || !formData.zone) {
        showMessage('Please fill in all required fields (Name, Code, State, Zone)', 'error');
        return;
    }
    
    // Ensure password is provided
    if (!formData.password || formData.password.trim() === '') {
        showMessage('Password is required', 'error');
        return;
    }
    
    // Check if member with same code already exists
    const currentMembers = window.currentMembers || [];
    const existingMember = currentMembers.find(member => 
        member.code === formData.code
    );
    
    if (existingMember) {
        showMessage('A member with this code already exists', 'error');
        return;
    }
    
    try {
        showMessage('Adding member...', 'info');
        
        let backendResponse = null;
        let isOnline = navigator.onLine;
        
        // Get file inputs first
        const passportInput = document.getElementById('memberPassport');
        const signatureInput = document.getElementById('memberSignature');
        
        // Try to add to backend if online
        if (isOnline) {
            try {
                console.log('🔍 Adding member to backend with data:', {
                    name: formData.name,
                    email: formData.email,
                    code: formData.code,
                    position: formData.position,
                    state: formData.state,
                    zone: formData.zone,
                    hasPassword: !!formData.password,
                    hasPassport: !!(passportInput && passportInput.files[0]),
                    hasSignature: !!(signatureInput && signatureInput.files[0])
                });
                
                const response = await fetch(`${backendUrl}/api/users/addUser`, {
                    method: 'POST',
                    body: formDataObj // Don't set Content-Type header for FormData
                });
                
                console.log('🔍 Backend response status:', response.status);
                
                if (response.ok) {
                    backendResponse = await tryJson(response);
                    console.log('✅ Member added successfully to backend:', backendResponse);
                } else {
                    const errorData = await tryJson(response).catch(() => ({}));
                    console.error('❌ Backend error response:', errorData);
                    showMessage(errorData?.message || `Failed to add member (HTTP ${response.status})`, 'error');
                    return; // do NOT fall back to local on server validation errors
                }
            } catch (error) {
                console.error('❌ Error adding member to backend:', error);
                isOnline = false;
            }
        }
        
        // Create member object
        const newMember = {
            _id: backendResponse?.data?._id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...formData,
            createdAt: new Date().toISOString(),
            dateAdded: new Date().toISOString(),
            isActive: true,
            isFromBackend: isOnline,
            pendingSync: !isOnline
        };
        
        // Handle file data - always use multipart/form-data approach
        
        // Store file references for offline sync
        if (passportInput && passportInput.files[0]) {
            newMember.passportFile = passportInput.files[0]; // Store file reference
            
        }
        
        if (signatureInput && signatureInput.files[0]) {
            newMember.signatureFile = signatureInput.files[0]; // Store file reference
            
        }
        
        // For online storage, use the filename from backend response
        if (isOnline && backendResponse && backendResponse.data && backendResponse.data.passportPhoto) {
            newMember.passportPhoto = backendResponse.data.passportPhoto;
            
        }
        if (isOnline && backendResponse && backendResponse.data && backendResponse.data.signature) {
            newMember.signature = backendResponse.data.signature;
            
        }
        
        // Add to current members
        const updatedMembers = [...currentMembers, newMember];
        window.currentMembers = updatedMembers;
        
        
        // Save to local storage
        saveLocalMembers(updatedMembers);
        // Activity log: member added
        try {
            if (typeof logMemberAdd === 'function') logMemberAdd(newMember);
            if (typeof loadRecentActivity === 'function') { setTimeout(loadRecentActivity, 0); }
            if (typeof updateActivityOverlayVisibility === 'function') { setTimeout(updateActivityOverlayVisibility, 0); }
        } catch (e) { try { console.warn('logMemberAdd failed:', e); } catch(_) {} }
        // Add to pending sync if offline
        if (!isOnline) {
            const pendingSync = getPendingSync();
            pendingSync.memberCreations.push(newMember);
            savePendingSync(pendingSync);
            showMessage('Member added locally. Will sync when online.', 'warning');
        } else {
            showMessage('Member added successfully!', 'success');
        }
        
        closeAddMemberModal();
        displayMembers(updatedMembers);
        updateSyncStatus();
        
        // Refresh dashboard stats and recent activity
        if (typeof loadDashboardStats === 'function') {
            await loadDashboardStats();
        }
        if (typeof loadRecentActivity === 'function') {
            await loadRecentActivity();
        }
        
    } catch (error) {
        
        showMessage('Failed to add member: ' + error.message, 'error');
    }
}

// ==================== CERTIFICATE FUNCTIONS ====================


// === Helper: robust certificate number extractor (supports imported columns like "cert#", "cert no", etc.) ===
function __extractCertNumber(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const keys = [
    'certificateNumber','number','certNumber','certNo','cert','cert_code','certCode','certNum',
    'cert#','cert #','certno','cert no','certificate no','certificate_no','certificate #','certificate id','certid'
  ];
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return String(obj[k]);
    }
  }
  return '';
}
// === End helper ===
async function getCertificates() {
    try {
        
        
        let backendCertificates = [];
        let localCertificates = getLocalCertificates();
        
        try {
            const res = await fetch(`${backendUrl}/api/certificates`, {
                method: 'GET'
            });
            
            if (res.ok) {
                const responseData = await tryJson(res);
                
                // Handle different response formats
                if (Array.isArray(responseData)) {
                    backendCertificates = responseData;
                } else if (responseData && Array.isArray(responseData.data)) {
                    backendCertificates = responseData.data;
                } else if (responseData && responseData.success && Array.isArray(responseData.data)) {
                    backendCertificates = responseData.data;
                } else {
                    backendCertificates = [];
                }
                
                backendCertificates = backendCertificates.map(cert => ({ ...cert, isFromBackend: true }));
            }
        } catch (error) {
            
        }
        
        // Ensure localCertificates is an array
        if (!Array.isArray(localCertificates)) {
            localCertificates = [];
        }
        
        // Create a map of local certificates by ID for easy lookup
        const localCertMap = new Map();
        localCertificates.forEach(localCert => {
            const key = localCert._id || localCert.id || localCert.certificateNumber || localCert.number;
            if (key) {
                localCertMap.set(key, { ...localCert, isFromBackend: false });
            }
        });
        
        // Merge backend and local certificates, giving priority to local changes
        const mergedCertificates = [];
        
        // Process backend certificates first
        backendCertificates.forEach(backendCert => {
            const key = backendCert._id || backendCert.id || backendCert.certificateNumber || backendCert.number;
            const localCert = localCertMap.get(key);
            
            if (localCert) {
                // Certificate exists in both backend and local
                // Check if local version is more recent or has important changes
                const localUpdatedAt = new Date(localCert.updatedAt || localCert.revokedAt || 0);
                const backendUpdatedAt = new Date(backendCert.updatedAt || backendCert.revokedAt || 0);
                
                if (localUpdatedAt > backendUpdatedAt || localCert.status === 'revoked') {
                    // Local version is more recent or has been revoked - use local
                    mergedCertificates.push(localCert);
                } else {
                    // Backend version is more recent - use backend
                    mergedCertificates.push(backendCert);
                }
                
                // Remove from local map to avoid duplication
                localCertMap.delete(key);
            } else {
                // Certificate only exists in backend
                mergedCertificates.push(backendCert);
            }
        });
        
        // Add remaining local certificates (not in backend)
        localCertMap.forEach(localCert => {
            mergedCertificates.push(localCert);
        });
        
        // Sort by creation date (newest first)
        mergedCertificates.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.issueDate || 0);
            const dateB = new Date(b.createdAt || b.issueDate || 0);
            return dateB - dateA;
        });
        
        if (typeof window !== 'undefined') {
            window.currentCertificates = mergedCertificates;
        }
        
        // Save the merged certificates back to local storage to ensure consistency
        saveLocalCertificates(mergedCertificates);
        
        return mergedCertificates;
        
    } catch (error) {
        
        showMessage('Failed to load certificates: ' + error.message, 'error');
        
        const localCertificates = getLocalCertificates();
        const fallbackCertificates = Array.isArray(localCertificates) 
            ? localCertificates.map(cert => ({ ...cert, isFromBackend: false }))
            : [];
        
        if (typeof window !== 'undefined') {
            window.currentCertificates = fallbackCertificates;
        }
        
        return fallbackCertificates;
    }
}

async function loadCertificates(
  page = 1,
  limit = 10,
  searchTerm = '',
  statusFilter = '',
  typeFilterUI = '',
  stateFilterUI = ''
) {
  try {
    const tableBody = document.getElementById('certificatesTableBody');
    if (tableBody) {
      tableBody.innerHTML = (
        '<tr>' +
          '<td colspan="7" class="loading">Loading certificates...</td>' +
        '</tr>'
      );
    }

    // Fetch/merge from your existing source
    let mergedCertificates = [];
    if (typeof getCertificates === 'function') {
      try {
        const res = await getCertificates();
        if (Array.isArray(res)) mergedCertificates = res;
        else if (res && Array.isArray(res.items)) mergedCertificates = res.items;
      } catch (_) {}
    }
    if (!Array.isArray(mergedCertificates) || mergedCertificates.length === 0) {
      if (typeof getLocalCertificates === 'function') {
        try { mergedCertificates = getLocalCertificates() || []; } catch (_) {}
      } else {
        mergedCertificates = [];
      }
    }

    if (typeof window !== 'undefined') {
      window.currentCertificates = mergedCertificates;
    }

    // Normalize filters (case-insensitive compare)
    const q = String(searchTerm || '').toLowerCase().trim();
    const statusF = String(statusFilter || '').toLowerCase().trim();
    const typeFUI = String(typeFilterUI || '').toLowerCase().trim();
    const stateF = String(stateFilterUI || '').toLowerCase().trim();

    // Map UI type → stored type if needed
    const typeMap = {
      membership: 'membership',
      achievement: 'achievement', // change to 'award' if that's what you store
      training: 'training',
      recognition: 'recognition',
      service: 'service'
    };
    const typeF = typeFUI ? (typeMap[typeFUI] || typeFUI) : '';

// --- Helper: state name ↔ 3-letter code mapping used in certificate numbers ---
const normalizeStateName = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
const stateToCode = (name) => {
  const s = normalizeStateName(name);
  if (!s) return '';
  if (s === 'fct' || s === 'abuja' || s === 'abujafct') return 'FCT';
  return s.slice(0, 3).toUpperCase();
};
const extractCodeFromCertNumber = (num) => {
  const raw = String(num || '').toUpperCase();
  if (!raw) return '';
  const parts = raw.split('/').map(p => p.replace(/[^A-Z]/g, ''));
  // Prefer the 3rd segment if it looks like a code
  if (parts.length >= 3 && /^[A-Z]{3}$/.test(parts[2])) return parts[2];
  // Otherwise, return the first 3-letter segment we find
  for (const p of parts) { if (/^[A-Z]{3}$/.test(p)) return p; }
  return '';
};


    const getCertState = function (c) {
      var user = (c && c.userId) ? c.userId : {};
      var st = (c && c.state) ? c.state : (user.state || '');
      return String(st).toLowerCase();
    };

    // Apply filters
    var filtered = (mergedCertificates || []).filter(function (c) {
      var num = String(__extractCertNumber(c) || '').toLowerCase();
      var recipient = String((c && (c.recipientName || c.recipient)) || '').toLowerCase();
      var email = String((c && c.email) || '').toLowerCase();
      var title = String((c && (c.certificateTitle || c.title)) || '').toLowerCase();
      var type = String((c && c.type) || '').toLowerCase();
      var status = String((c && c.status) || '').toLowerCase();
      var issuedBy = String((c && c.issuedBy) || '').toLowerCase();

      var user = (c && c.userId) ? c.userId : {};
      var userName = String(user.name || '').toLowerCase();
      var userEmail = String(user.email || '').toLowerCase();
      var userCode = String(user.code || '').toLowerCase();
      var certState = getCertState(c);

      var haystack = [num, recipient, email, title, type, status, issuedBy, userName, userEmail, userCode].join(' ');
      var matchSearch = !q || haystack.indexOf(q) !== -1;
      var matchStatus = !statusF || status === statusF;
      var matchType = !typeF || type === typeF;
      var wantedCode = stateToCode(stateF);
      var certCode = extractCodeFromCertNumber(num);
      var matchState = !stateF || certState === stateF || (wantedCode && (certCode === wantedCode || num.indexOf('/' + wantedCode + '/') !== -1));

      return matchSearch && matchStatus && matchType && matchState;
    });

    // Pagination
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, limit)));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * Math.max(1, limit);
    const endIndex = startIndex + Math.max(1, limit);
    const paginated = filtered.slice(startIndex, endIndex);

    // Store pagination state
    if (typeof window !== 'undefined') {
      window.certificatesPaginationState = {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: limit
      };
    }

    if (typeof displayCertificates === 'function') {
      displayCertificates(paginated, totalItems, currentPage, totalPages, limit);
    }

    if (typeof renderPagination === 'function') {
      renderPagination(currentPage, totalPages, totalItems, limit, 'certificates');
    }
  } catch (error) {
    if (typeof showMessage === 'function') {
      showMessage('Error loading certificates: ' + (error && error.message ? error.message : String(error)), 'error');
    }

    // Fallback to local
    let localCertificates = [];
    try {
      if (typeof getLocalCertificates === 'function') {
        localCertificates = getLocalCertificates() || [];
      }
      if (typeof sortCertificatesAlpha === 'function') {
        localCertificates = sortCertificatesAlpha(localCertificates) || localCertificates;
      }
    } catch (_) {}

    if (typeof window !== 'undefined') {
      window.currentCertificates = localCertificates;
    }

    if (typeof displayCertificates === 'function') {
      displayCertificates(localCertificates, localCertificates.length, 1, 1, limit);
    }
  }
}


function filterCertificates() {
  const searchTerm   = document.getElementById('certificateSearch')?.value || '';
  const statusFilter = document.getElementById('certificateStatusFilter')?.value || '';
  const typeFilter   = document.getElementById('certificateTypeFilter')?.value || '';
  const stateFilter  = document.getElementById('certificateStateFilter')?.value || '';

  console.log('🔍 Filtering certificates with:', {
    searchTerm: `"${searchTerm}"`,
    statusFilter: `"${statusFilter}"`,
    typeFilter: `"${typeFilter}"`,
    stateFilter: `"${stateFilter}"`
  });

  // Optional: log state filter element like you did for members
  const stateEl = document.getElementById('certificateStateFilter');
  console.log('🔍 Cert state filter element:', {
    value: stateEl?.value,
    selectedIndex: stateEl?.selectedIndex,
    options: stateEl?.options ? Array.from(stateEl.options).map(o => ({ value: o.value, text: o.text })) : []
  });

  // Use a separate per-page preference for certificates (or reuse members one if you prefer)
  const savedCertsPerPage = parseInt(localStorage.getItem('narap_certificates_per_page')) || 10;

  // Reload list with ALL filters and reset to page 1
  // Make sure your loadCertificates signature accepts these args:
  // (page, limit, searchTerm, statusFilter, typeFilter, stateFilter)
  loadCertificates(1, savedCertsPerPage, searchTerm, statusFilter, typeFilter, stateFilter);
}


// ==================== TAB SWITCHING ====================

function switchTab(tabName) {
  try {
    // Show only the active panel
    var ids = ['dashboard', 'members', 'certificates', 'analytics', 'system'];
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var panel = document.getElementById('panel-' + id);
      var link  = document.querySelector('[data-tab="' + id + '"]');
      if (panel) {
        var isActive = (id === tabName);
        panel.style.display = isActive ? 'block' : 'none';
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        panel.classList.toggle('active', isActive);
      }
      if (link) {
        var isActiveNav = (id === tabName);
        link.classList.toggle('active', isActiveNav);
        link.setAttribute('aria-current', isActiveNav ? 'page' : 'false');
      }
    }

    // Update sidebar button states (if you use #btn-*)
    var navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(function (item) { item.classList.remove('active'); });
    var selectedNavItem = document.getElementById('btn-' + tabName);
    if (selectedNavItem) selectedNavItem.classList.add('active');

    // Update page title
    var headerTitle = document.getElementById('headerTitle');
    if (headerTitle) headerTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);

    // Show/hide pagination controls
    var membersPaginationContainer = document.getElementById('membersPagination');
    if (membersPaginationContainer) {
      membersPaginationContainer.style.display = (tabName === 'members') ? 'flex' : 'none';
    }
    var certificatesPaginationContainer = document.getElementById('certificatesPagination');
    if (certificatesPaginationContainer) {
      certificatesPaginationContainer.style.display = (tabName === 'certificates') ? 'flex' : 'none';
    }

    // Auto-load data for the selected tab
    switch (tabName) {
      case 'members': {
        var savedMembersPerPage = parseInt(localStorage.getItem('narap_members_per_page')) || 10;
        if (!Array.isArray(window.currentMembers) || window.currentMembers.length === 0) {
          if (typeof loadMembers === 'function') loadMembers(1, savedMembersPerPage);
        } else if (typeof displayMembers === 'function') {
          displayMembers(window.currentMembers);
        }
        break;
      }
      case 'certificates': {
        if (!Array.isArray(window.currentCertificates) || window.currentCertificates.length === 0) {
          if (typeof loadCertificates === 'function') loadCertificates(1, 10);
        } else if (typeof displayCertificates === 'function') {
          displayCertificates(window.currentCertificates);
        }
        break;
      }
      case 'dashboard':
        if (typeof loadDashboard === 'function') loadDashboard();
        break;
      case 'analytics':
        if (typeof loadAnalytics === 'function') loadAnalytics();
        break;
      case 'system':
        if (typeof loadSystemPage === 'function') loadSystemPage();
        break;
    }

    // Ensure the user lands at the top
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (_) { window.scrollTo(0, 0); }
  } catch (e) {
    // no-op
  }
}


// ==================== SIDEBAR FUNCTIONS ====================

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const hamburger = document.querySelector('.hamburger-btn');
    
    
    
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
    
    if (overlay) {
        overlay.classList.toggle('active');
    }
    
    if (hamburger) {
        hamburger.classList.toggle('active');
    }
}

// ==================== MODAL FUNCTIONS ====================

function showAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        const form = document.getElementById('addMemberForm');
        if (form) {
            form.reset();
        }
        // Clear password strength indicator
        const strengthIndicator = document.getElementById('passwordStrength');
        if (strengthIndicator) {
            strengthIndicator.innerHTML = '';
        }
        // Clear file uploads
        const passportInput = document.getElementById('memberPassport');
        const signatureInput = document.getElementById('memberSignature');
        if (passportInput) clearFileUpload(passportInput, 'passportLabel');
        if (signatureInput) clearFileUpload(signatureInput, 'signatureLabel');
        
        // Hide ID card preview
        const previewContainer = document.getElementById('idCardPreview');
        if (previewContainer) {
            previewContainer.classList.add('hidden');
        }
    }
}

function showEditMemberModal(memberId) {
    const modal = document.getElementById('editMemberModal');
    if (modal) {
        // Populate form with member data
        const member = window.currentMembers?.find(m => m._id === memberId || m.id === memberId);
        if (member) {
            const form = document.getElementById('editMemberForm');
            if (form) {
                // Populate all form fields with member data
                const nameField = form.querySelector('#editMemberName');
                const emailField = form.querySelector('#editMemberEmail');
                const codeField = form.querySelector('#editMemberCode');
                const positionField = form.querySelector('#editMemberPosition');
                const stateField = form.querySelector('#editMemberState');
                const zoneField = form.querySelector('#editMemberZone');
                
                if (nameField) nameField.value = member.name || '';
                if (emailField) emailField.value = member.email || '';
                if (codeField) codeField.value = member.code || '';
                if (positionField) positionField.value = member.position || '';
                if (stateField) stateField.value = member.state || '';
                if (zoneField) zoneField.value = member.zone || '';
                
                form.dataset.memberId = memberId;
                
                console.log('📋 Populated edit form with member data:', {
                    name: member.name,
                    email: member.email,
                    code: member.code,
                    position: member.position,
                    state: member.state,
                    zone: member.zone
                });
                
                // Show existing photos if available
                const passportPreview = document.getElementById('editMemberPassportPreview');
                const signaturePreview = document.getElementById('editMemberSignaturePreview');
                
                if (passportPreview && member.passportPhoto) {
                    const photoUrl = getImageUrl(member.passportPhoto);
                    passportPreview.src = photoUrl;
                    passportPreview.style.display = 'block';
                    console.log('📸 Showing existing passport photo:', photoUrl);
                }
                
                if (signaturePreview && member.signature) {
                    const signatureUrl = getImageUrl(member.signature);
                    signaturePreview.src = signatureUrl;
                    signaturePreview.style.display = 'block';
                    console.log('✍️ Showing existing signature:', signatureUrl);
                }
            }
        } else {
            showMessage('Member not found', 'error');
            return;
        }
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeEditMemberModal() {
    const modal = document.getElementById('editMemberModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        const form = document.getElementById('editMemberForm');
        if (form) {
            form.reset();
            delete form.dataset.memberId;
        }
        // Clear file uploads
        const passportInput = document.getElementById('editMemberPassport');
        const signatureInput = document.getElementById('editMemberSignature');
        if (passportInput) clearFileUpload(passportInput, 'editPassportLabel');
        if (signatureInput) clearFileUpload(signatureInput, 'editSignatureLabel');
        
        // Clear preview images
        const passportPreview = document.getElementById('editMemberPassportPreview');
        const signaturePreview = document.getElementById('editMemberSignaturePreview');
        if (passportPreview) {
            passportPreview.src = '';
            passportPreview.style.display = 'none';
        }
        if (signaturePreview) {
            signaturePreview.src = '';
            signaturePreview.style.display = 'none';
        }
    }
}

function showImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        const form = document.getElementById('importForm');
        if (form) {
            form.reset();
        }
    }
}

// ==================== MEMBER DISPLAY FUNCTIONS ====================

function displayMembers(members, totalItems = 0, currentPage = 1, totalPages = 1, itemsPerPage = 10) {
    const tableBody = document.getElementById('membersTableBody');
    if (!tableBody) {
        
        return;
    }
    
    // Ensure members is an array
    if (!Array.isArray(members)) {
        
        members = [];
    }
    
    if (members.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data">No members found</td>
            </tr>
        `;
        return;
    }
    
    try {
        tableBody.innerHTML = members.map((member, index) => {
            // Ensure member is an object
            if (!member || typeof member !== 'object') {
                
                return '';
            }
            
            const memberId = member._id || member.id || '';
            const name = member.name || 'N/A';
            const email = member.email || 'N/A';
            const code = member.code || 'N/A';
            const position = member.position || 'N/A';
            const state = member.state || 'N/A';
            const zone = member.zone || 'N/A';
            
            // Get photo URL with improved logic (same as verification page)
            const passportPhoto = member.passportPhoto || member.passport;
            let validPhotoUrl = null;
            
            if (passportPhoto) {
                try {
                    // Handle different URL formats
                    if (passportPhoto.startsWith('http://') || passportPhoto.startsWith('https://') || passportPhoto.startsWith('data:')) {
                        validPhotoUrl = passportPhoto;
                    } else if (passportPhoto.startsWith('/')) {
                        validPhotoUrl = `${backendUrl}${passportPhoto}`;
                    } else if (passportPhoto.includes('passportPhoto-') || passportPhoto.includes('signature-')) {
                        // Handle filename patterns
                        const fieldType = passportPhoto.includes('passportPhoto-') ? 'passports' : 'signatures';
                        validPhotoUrl = `${backendUrl}/api/uploads/${fieldType}/${passportPhoto}`;
                    } else {
                        // Fallback for other cases
                        validPhotoUrl = `${backendUrl}/api/uploads/passports/${passportPhoto}`;
                    }
                } catch (error) {
                    console.log('❌ Error processing photo URL:', error);
                    validPhotoUrl = null;
                }
            }
            
            console.log('🔍 Image debug for member:', member.name, {
                passportPhoto: member.passportPhoto,
                passport: member.passport,
                validPhotoUrl: validPhotoUrl
            });
            
            // Enhanced error handling with multiple fallback URLs
            const alternativeUrls = validPhotoUrl ? [
                validPhotoUrl,
                `${backendUrl}/api/uploads/passports/${passportPhoto}`,
                `${backendUrl}/api/uploads/signatures/${passportPhoto}`,
                `https://res.cloudinary.com/dh5wjtvlf/image/upload/v1/NARAP/passportPhoto/${passportPhoto}`,
                `https://res.cloudinary.com/dh5wjtvlf/image/upload/v1/NARAP/signature/${passportPhoto}`
            ] : [];
            
            const imgElement = `
                <img alt="Passport" class="img-thumbnail" height="50" width="50" 
                     src="${validPhotoUrl || DEFAULT_AVATAR}" 
                     onload="console.log('✅ Image loaded successfully:', this.src);" 
                     onerror="handleMemberTableImageError(this, '${validPhotoUrl || DEFAULT_AVATAR}', ${JSON.stringify(alternativeUrls)});">
            `;
            
            const rowHTML = `
                <tr>
                    <td>${index + 1}</td>
                    <td class=\"checkbox-cell\"><input type=\"checkbox\" class=\"member-checkbox\" value="${memberId}" 
                               onchange="toggleMemberSelection(this)">
                    </td>
                    
                    <td>${imgElement}</td>
                    <td>${name}</td>
                    <td>${email}</td>
                    <td>${code}</td>
                    <td>${position}</td>
                    <td>${state}</td>
                    <td>${zone}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewMember('${memberId}')" title="View Member">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="showEditMemberModal('${memberId}')" title="Edit Member">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteMember('${memberId}')" title="Delete Member">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            
            return rowHTML;
        }).join('');
        
        // Update members count
        updateMembersCount();
        
    } catch (error) {
        
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="error">Error displaying members</td>
            </tr>
        `;
    }
}

function filterMembers() {
    const searchTerm = document.getElementById('memberSearch')?.value || '';
    const positionFilter = document.getElementById('positionFilter')?.value || '';
    const stateFilter = document.getElementById('stateFilter')?.value || '';
    
    console.log('🔍 Filtering members with:', {
        searchTerm: `"${searchTerm}"`,
        positionFilter: `"${positionFilter}"`,
        stateFilter: `"${stateFilter}"`
    });
    
    // Debug: Log the actual DOM elements
    const stateFilterElement = document.getElementById('stateFilter');
    console.log('🔍 State filter element:', {
        value: stateFilterElement?.value,
        selectedIndex: stateFilterElement?.selectedIndex,
        options: stateFilterElement?.options ? Array.from(stateFilterElement.options).map(opt => ({ value: opt.value, text: opt.text })) : []
    });
    
    // Get user's saved pagination preference
    const savedMembersPerPage = parseInt(localStorage.getItem('narap_members_per_page')) || 10;
    
    // Reload members with all filters and reset to page 1
    loadMembers(1, savedMembersPerPage, searchTerm, positionFilter, stateFilter);
}

function refreshMembers() {
    // Clear any cached data
    window.currentMembers = null;
    
    // Clear all filters
    const searchInput = document.getElementById('memberSearch');
    const positionFilter = document.getElementById('positionFilter');
    const stateFilter = document.getElementById('stateFilter');
    
    if (searchInput) searchInput.value = '';
    if (positionFilter) positionFilter.value = '';
    if (stateFilter) stateFilter.value = '';
    
    // Get user's saved pagination preference
    const savedMembersPerPage = parseInt(localStorage.getItem('narap_members_per_page')) || 10;
    
    // Force reload with pagination
    loadMembers(1, savedMembersPerPage);
}

function clearMemberSearch() {
    const searchInput = document.getElementById('memberSearch');
    const positionFilter = document.getElementById('positionFilter');
    const stateFilter = document.getElementById('stateFilter');
    
    if (searchInput) {
        searchInput.value = '';
    }
    if (positionFilter) {
        positionFilter.value = '';
    }
    if (stateFilter) {
        stateFilter.value = '';
    }
    
    console.log('🧹 Cleared all member filters');
    filterMembers(); // Reload without any filters
}

// Debug function to test state filtering
function debugStateFilter() {
    console.log('🔍 === STATE FILTER DEBUG ===');
    
    // Get current members
    const currentMembers = window.currentMembers || [];
    console.log('Total members:', currentMembers.length);
    
    // Get state filter value
    const stateFilter = document.getElementById('stateFilter')?.value || '';
    console.log('Current state filter value:', `"${stateFilter}"`);
    
    // Show all unique states in the data
    const uniqueStates = [...new Set(currentMembers.map(m => m.state).filter(s => s))];
    console.log('Unique states in data:', uniqueStates);
    
    // Test filtering manually
    if (stateFilter) {
        const filtered = currentMembers.filter(m => m.state === stateFilter);
        console.log(`Manual filter results for "${stateFilter}":`, filtered.length, 'members');
        console.log('Filtered members:', filtered.map(m => ({ name: m.name, state: m.state })));
    }
    
    console.log('🔍 === END DEBUG ===');
}

async function deleteMember(memberId) {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
        return;
    }
    
    try {
        showMessage('Deleting member...', 'info');
        
        const currentMembers = window.currentMembers || [];
        const memberToDelete = currentMembers.find(member => 
            member._id === memberId || member.id === memberId
        );
        
        if (!memberToDelete) {
            showMessage('Member not found', 'error');
            return;
        }
        
        let isOnline = navigator.onLine;
        let backendDeleteSuccess = false;
        
        // Try to delete from backend if online and member exists in backend
        if (isOnline && memberToDelete.isFromBackend !== false && !memberToDelete._id.startsWith('local_')) {
            try {
                const response = await fetch(`${backendUrl}/api/users/deleteUser/${memberToDelete._id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    backendDeleteSuccess = true;
                    console.log('✅ Member deleted from backend successfully');
                } else {
                    const errorData = await tryJson(response).catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('❌ Backend deletion failed:', error);
                isOnline = false;
            }
        }
        
        // Always remove from local storage and current members
        const updatedMembers = currentMembers.filter(member => 
            member._id !== memberId && member.id !== memberId
        );
        window.currentMembers = updatedMembers;
        
        // Save to local storage immediately
        saveLocalMembers(updatedMembers);
        // Activity log: member deleted
        try {
            if (typeof logMemberDelete === 'function') logMemberDelete(memberToDelete);
            if (typeof loadRecentActivity === 'function') { setTimeout(loadRecentActivity, 0); }
            if (typeof updateActivityOverlayVisibility === 'function') { setTimeout(updateActivityOverlayVisibility, 0); }
        } catch (e) { try { console.warn('logMemberDelete failed:', e); } catch(_) {} }
        // Add to pending sync if backend deletion failed or member was local
        if (!backendDeleteSuccess) {
            const pendingSync = getPendingSync();
            pendingSync.memberDeletions.push({
                _id: memberToDelete._id || memberToDelete.id,
                code: memberToDelete.code,
                name: memberToDelete.name,
                email: memberToDelete.email
            });
            savePendingSync(pendingSync);
            
            if (!isOnline) {
                showMessage('Member deleted locally. Will sync with database when online.', 'warning');
            } else {
                showMessage('Member deleted locally. Will retry database sync.', 'warning');
            }
        } else {
            showMessage('Member deleted successfully from both local storage and database!', 'success');
        }
        
        // Update display and sync status
        displayMembers(updatedMembers);
        updateSyncStatus();
        
        // Refresh dashboard stats and recent activity
        if (typeof loadDashboardStats === 'function') {
            await loadDashboardStats();
        }
        if (typeof loadRecentActivity === 'function') {
            await loadRecentActivity();
        }
        
    } catch (error) {
        console.error('❌ Delete member error:', error);
        showMessage('Failed to delete member: ' + error.message, 'error');
    }
}

// ==================== VIEW MEMBER FUNCTION ====================

async function viewMember(memberId) {
    console.log('🔍 Viewing member with ID:', memberId);
    
    try {
        const currentMembers = window.currentMembers || [];
        console.log('🔍 Current members count:', currentMembers.length);
        
        const member = currentMembers.find(m => 
            m._id === memberId || m.id === memberId
        );
        
        if (!member) {
            console.error('❌ Member not found with ID:', memberId);
            showMessage('Member not found', 'error');
            return;
        }
        
        console.log('✅ Found member:', member.name, member);
        
        // Create and show the view modal
        showViewMemberModal(member);
        
    } catch (error) {
        console.error('❌ Error viewing member:', error);
        showMessage('Failed to view member: ' + error.message, 'error');
    }
}

function showViewMemberModal(member) {
    console.log('🔍 Opening member preview for:', member.name, member);
    
    // Get image URL with debugging
    const imageUrl = getImageUrl(member.passportPhoto || member.passport);
    console.log('🔍 Image URL:', imageUrl);
    
    // Create modal HTML
    const modalHTML = `
        <div id="viewMemberModal" class="modal-overlay" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: white; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">View Member Details</h3>
                    <button class="close-btn" onclick="closeViewMemberModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div class="member-view-container" style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <div class="member-photo-section" style="flex: 0 0 200px;">
                            <img src="${imageUrl}" 
                                 alt="Member Photo" 
                                 class="member-view-photo"
                                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;"
                                 onerror="this.src='${DEFAULT_AVATAR}'; console.log('Image failed to load, using default avatar');"
                                 onload="console.log('Image loaded successfully');">
                            ${member.signature ? `
                                <div style="margin-top: 15px; text-align: center;">
                                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Signature:</div>
                                    <img src="${getImageUrl(member.signature)}" 
                                         alt="Member Signature" 
                                         style="max-width: 150px; max-height: 60px; object-fit: contain; border: 1px solid #eee; border-radius: 4px;"
                                         onerror="this.style.display='none'; console.log('Signature failed to load');"
                                         onload="console.log('Signature loaded successfully');">
                                </div>
                            ` : ''}
                        </div>
                        <div class="member-details-section" style="flex: 1; min-width: 300px;">
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Full Name:</label>
                                <span style="color: #666;">${member.name || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Email:</label>
                                <span style="color: #666;">${member.email || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">NARAP Code:</label>
                                <span style="color: #666;">${member.code || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Position:</label>
                                <span style="color: #666;">${member.position || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">State:</label>
                                <span style="color: #666;">${member.state || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Zone:</label>
                                <span style="color: #666;">${member.zone || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Phone:</label>
                                <span style="color: #666;">${member.phone || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Address:</label>
                                <span style="color: #666;">${member.address || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Member Since:</label>
                                <span style="color: #666;">${member.dateAdded ? new Date(member.dateAdded).toLocaleDateString() : 
                                        member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 
                                        member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Status:</label>
                                <span class="status-badge ${member.isActive !== false ? 'active' : 'inactive'}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; ${member.isActive !== false ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
                                    ${member.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee; display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="closeViewMemberModal()" style="padding: 10px 20px; border: 1px solid #ddd; background: #f8f9fa; color: #333; border-radius: 4px; cursor: pointer;">Close</button>
                    <button class="btn btn-warning" onclick="showEditMemberModal('${member._id || member.id}')" style="padding: 10px 20px; border: 1px solid #ffc107; background: #ffc107; color: #000; border-radius: 4px; cursor: pointer;">Edit Member</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal first
    const existingModal = document.getElementById('viewMemberModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal with error handling
    try {
        const modal = document.getElementById('viewMemberModal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('✅ Member preview modal displayed successfully');
        } else {
            console.error('❌ Failed to find modal element');
        }
    } catch (error) {
        console.error('❌ Error displaying member preview modal:', error);
    }
}

function closeViewMemberModal() {
    console.log('🔍 Closing member preview modal');
    const modal = document.getElementById('viewMemberModal');
    if (modal) {
        modal.remove();
        console.log('✅ Member preview modal closed successfully');
    } else {
        console.log('ℹ️ No modal found to close');
    }
}

async function editMember(event) {
  event.preventDefault();

  const form = event.target;
  const memberId = (form.dataset.memberId || '').trim();
  if (!memberId) {
    showMessage('Member ID not found', 'error');
    return;
  }

  console.log('🔧 Starting member update for ID:', memberId);

  // Fields
  const nameField     = form.querySelector('#editMemberName');
  const emailField    = form.querySelector('#editMemberEmail');
  const codeField     = form.querySelector('#editMemberCode');
  const positionField = form.querySelector('#editMemberPosition');
  const stateField    = form.querySelector('#editMemberState');
  const zoneField     = form.querySelector('#editMemberZone');
  const passwordField = form.querySelector('#editMemberPassword');

  // Basic presence check
  if (!nameField || !codeField || !positionField || !stateField || !zoneField) {
    console.error('❌ Form elements not found:', {
      nameField: !!nameField, codeField: !!codeField, positionField: !!positionField,
      stateField: !!stateField, zoneField: !!zoneField
    });
    showMessage('Form elements not found. Please refresh the page.', 'error');
    return;
  }

  // Collect values
  const formData = {
    name: nameField.value.trim(),
    email: emailField ? emailField.value.trim() : '',
    code: codeField.value.trim(),
    position: positionField.value,
    state: stateField.value.trim(),
    zone: zoneField.value.trim(),
    password: passwordField ? passwordField.value : ''
  };
  console.log('📋 Form data collected:', formData);

  // Build multipart body
  const formDataObj = new FormData();
  formDataObj.append('name', formData.name);
  if (formData.email) formDataObj.append('email', formData.email);
  formDataObj.append('code', formData.code);
  formDataObj.append('position', formData.position);
  formDataObj.append('state', formData.state);
  formDataObj.append('zone', formData.zone);
  if (formData.password && formData.password.trim()) {
    formDataObj.append('password', formData.password.trim());
    console.log('🔐 Password update included');
  }

  // Files
  const passportInput  = document.getElementById('editMemberPassport');
  const signatureInput = document.getElementById('editMemberSignature');
  if (passportInput?.files?.[0]) {
    formDataObj.append('passportPhoto', passportInput.files[0]);
    console.log('📸 Passport photo added:', passportInput.files[0].name);
  }
  if (signatureInput?.files?.[0]) {
    formDataObj.append('signature', signatureInput.files[0]);
    console.log('✍️ Signature added:', signatureInput.files[0].name);
  }

  // Final required check
  const required = ['name', 'code', 'position', 'state', 'zone'];
  const missing  = required.filter(k => {
    const v = formDataObj.get(k);
    return !v || String(v).trim() === '';
  });
  if (missing.length) {
    console.error('❌ Missing required fields:', missing);
    showMessage(`Missing required fields: ${missing.join(', ')}`, 'error');
    return;
  }

  // Locate member in local list
  const list = Array.isArray(window.currentMembers) ? window.currentMembers : [];
  const idx  = list.findIndex(m => (m._id === memberId) || (m.id === memberId));
  if (idx === -1) {
    showMessage('Member not found', 'error');
    return;
  }
  const original = list[idx];

  try {
    showMessage('Updating member...', 'info');

    // Always try backend first
    const res = await fetch(`${backendUrl}/api/users/updateUser/${memberId}`, {
      method: 'PUT',
      body: formDataObj
    });
    console.log('📡 Backend response status:', res.status);

    if (!res.ok) {
      const err = await (typeof tryJson === 'function' ? tryJson(res) : res.json().catch(() => null));
      console.error('❌ Backend update failed:', res.status, err);
      showMessage(err?.message || `Failed to update member (HTTP ${res.status})`, 'error');
      return; // IMPORTANT: do not fall back to local on server errors
    }

    const payload = await (typeof tryJson === 'function' ? tryJson(res) : res.json().catch(() => ({})));

    // Build updated member for the local cache
    const updated = {
      ...original,
      ...formData,
      updatedAt: new Date().toISOString(),
      pendingSync: false
    };
    // If backend returned file names, prefer them
    if (payload?.data?.passportPhoto) updated.passportPhoto = payload.data.passportPhoto;
    if (payload?.data?.signature)     updated.signature     = payload.data.signature;

    list[idx] = updated;
    window.currentMembers = list;
    if (typeof saveLocalMembers === 'function') saveLocalMembers(list);

    // Activity log: UPDATE (not delete)
    try { if (typeof logMemberUpdate === 'function') logMemberUpdate(updated); } catch(_) {}

    showMessage('Member updated successfully!', 'success');
    if (typeof closeEditMemberModal   === 'function') closeEditMemberModal();
    if (typeof displayMembers         === 'function') displayMembers(list);
    if (typeof updateSyncStatus       === 'function') updateSyncStatus();
    if (typeof loadDashboardStats     === 'function') await loadDashboardStats();
    if (typeof loadRecentActivity     === 'function') await loadRecentActivity();

  } catch (networkErr) {
    // Only true network/offline errors reach here
    console.warn('🌐 Network error during update, queueing for sync:', networkErr);

    const updated = {
      ...original,
      ...formData,
      updatedAt: new Date().toISOString(),
      pendingSync: true
    };
    // Keep file refs for later sync
    if (passportInput?.files?.[0])  updated.passportFile  = passportInput.files[0];
    if (signatureInput?.files?.[0]) updated.signatureFile = signatureInput.files[0];

    list[idx] = updated;
    window.currentMembers = list;
    if (typeof saveLocalMembers === 'function') saveLocalMembers(list);

    // Queue for sync
    const pending = (typeof getPendingSync === 'function') ? getPendingSync() : { memberUpdates: [] };
    pending.memberUpdates = Array.isArray(pending.memberUpdates) ? pending.memberUpdates : [];
    pending.memberUpdates.push(updated);
    if (typeof savePendingSync === 'function') savePendingSync(pending);

    try { if (typeof logMemberUpdate === 'function') logMemberUpdate(updated); } catch(_) {}
    showMessage('Offline: member updated locally and queued for sync.', 'warning');

    if (typeof closeEditMemberModal   === 'function') closeEditMemberModal();
    if (typeof displayMembers         === 'function') displayMembers(list);
    if (typeof updateSyncStatus       === 'function') updateSyncStatus();
  }
}


// ==================== CERTIFICATE DISPLAY FUNCTIONS ====================

function displayCertificates(certificates, totalItems = 0, currentPage = 1, totalPages = 1, itemsPerPage = 10) {
    const tableBody = document.getElementById('certificatesTableBody');
    if (!tableBody) return;
    
    if (!certificates || certificates.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data" style="text-align: center; padding: 40px; color: #6c757d; font-style: italic;">
                    No certificates found
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = certificates.map((certificate, index) => {
        // Ensure all data is properly formatted
        const certificateNumber = __extractCertNumber(certificate) || 'N/A';
        const recipientName = certificate.recipientName || certificate.recipient || certificate.name || 'N/A';
        const title = certificate.title || certificate.certificateTitle || 'N/A';
        const issueDate = certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : 'N/A';
        const status = certificate.status || 'Active';
        const statusClass = status.toLowerCase();
        const certificateId = certificate._id || certificate.id || (__extractCertNumber(certificate) || '');
        
        // Ensure title is properly formatted and aligned
        const formattedTitle = title.trim() || 'N/A';
        
        return `
            <tr>
                <td>${index + 1}</td><td style=\"display:none;\"><input type="checkbox" class="certificate-checkbox" value="${certificateId}" 
                           onchange="toggleCertificateSelection(this)">
                </td>
                
                    <td>${certificateNumber}</td>
                <td>${recipientName}</td>
                <td class="title-cell">${formattedTitle}</td>
                <td>${issueDate}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-info" onclick="viewCertificate('${certificateId}')" title="View Certificate">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editCertificate('${certificateId}')" title="Edit Certificate">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="downloadCertificate('${certificateId}')" title="Download Certificate">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCertificate('${certificateId}')" title="Delete Certificate">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="revokeCertificate('${certificateId}')" title="Revoke Certificate">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewCertificate(certificateId) {
    try {
        const certificates = window.currentCertificates || getLocalCertificates();
        const normalizeNum = (s)=>String(s||'').toUpperCase().replace(/\s+/g,'').trim();
        const certificate = certificates.find(cert => (
            cert._id === certificateId || cert.id === certificateId ||
            normalizeNum(__extractCertNumber(cert)) === normalizeNum(certificateId)
        ));
        
        if (!certificate) {
            showMessage('Certificate not found', 'error');
            return;
        }
        
        // Create beautiful certificate view modal
        showCertificateViewModal(certificate);
        
    } catch (error) {
        
        showMessage('Failed to view certificate', 'error');
    }
}

function showCertificateViewModal(certificate) {
    // Create modal HTML with modern document preview UI
    const modalHTML = `
        <div id="certificateViewModal" class="modal-overlay document-preview-overlay">
            <div class="modal-content document-preview-modal">
                <div class="document-preview-header">
                    <div class="preview-title">
                        <h3>Certificate Preview</h3>
                        <span class="certificate-info">${certificate.certificateNumber || certificate.number || 'N/A'} - ${certificate.recipientName || certificate.recipient || certificate.name || 'N/A'}</span>
                    </div>
                    <button class="close-btn" onclick="closeCertificateViewModal()">&times;</button>
                </div>
                
                <div class="document-preview-toolbar">
                    <div class="toolbar-left">
                        <div class="zoom-controls">
                            <button class="toolbar-btn" onclick="zoomOut()" title="Zoom Out">
                                <i class="fas fa-search-minus"></i>
                            </button>
                            <span class="zoom-level" id="zoomLevel">100%</span>
                            <button class="toolbar-btn" onclick="zoomIn()" title="Zoom In">
                                <i class="fas fa-search-plus"></i>
                            </button>
                            <button class="toolbar-btn" onclick="toggleFitToScreen()" title="Fit to Screen" id="fitToScreenBtn">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="toolbar-center">
                        <div class="page-navigation" id="pageNavigation" style="display: none;">
                            <button class="toolbar-btn" onclick="previousPage()" title="Previous Page">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span class="page-indicator" id="pageIndicator">Page 1 of 1</span>
                            <button class="toolbar-btn" onclick="nextPage()" title="Next Page">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="toolbar-right">
                        <button class="toolbar-btn primary" onclick="editCertificate('${certificate._id || certificate.id}')" title="Edit Certificate">
                            <i class="fas fa-edit"></i>
                            <span>Edit</span>
                        </button>
                        <button class="toolbar-btn success" onclick="downloadCertificate('${certificate._id || certificate.id}')" title="Download PDF">
                            <i class="fas fa-download"></i>
                            <span>Download</span>
                        </button>
                        <button class="toolbar-btn info" onclick="printCertificate('${certificate._id || certificate.id}')" title="Print Certificate">
                            <i class="fas fa-print"></i>
                            <span>Print</span>
                        </button>
                    </div>
                </div>
                
                <div class="document-preview-container">
                    <div class="document-preview-wrapper" id="documentPreviewWrapper">
                        <div class="document-preview-content" id="documentPreviewContent">
                            ${generateCertificateHTML(certificate)}
                        </div>
                    </div>
                </div>
                
                <div class="document-preview-footer">
                    <div class="footer-info">
                        <span class="certificate-status">
                            Status: <span class="status-badge ${certificate.status || 'active'}">${certificate.status || 'Active'}</span>
                        </span>
                        <span class="certificate-date">
                            Issued: ${certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                    <div class="footer-actions">
                        <button class="btn btn-secondary" onclick="closeCertificateViewModal()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    document.getElementById('certificateViewModal').style.display = 'flex';
    
    // Initialize document preview functionality
    initializeDocumentPreview();
}

function closeCertificateViewModal() {
    const modal = document.getElementById('certificateViewModal');
    if (modal) {
        modal.remove();
    }
}

// ==================== DOCUMENT PREVIEW FUNCTIONALITY ====================

let currentZoom = 100;
let isFitToScreen = false;
let currentPage = 1;
let totalPages = 1;

function initializeDocumentPreview() {
    currentZoom = 100;
    isFitToScreen = false;
    currentPage = 1;
    totalPages = 1;
    
    updateZoomDisplay();
    updatePageDisplay();
}

function zoomIn() {
    if (currentZoom < 300) {
        currentZoom += 25;
        applyZoom();
    }
}

function zoomOut() {
    if (currentZoom > 25) {
        currentZoom -= 25;
        applyZoom();
    }
}

function toggleFitToScreen() {
    isFitToScreen = !isFitToScreen;
    const fitBtn = document.getElementById('fitToScreenBtn');
    
    if (isFitToScreen) {
        fitToScreen();
        if (fitBtn) {
            fitBtn.innerHTML = '<i class="fas fa-compress"></i>';
            fitBtn.title = 'Actual Size';
        }
    } else {
        resetZoom();
        if (fitBtn) {
            fitBtn.innerHTML = '<i class="fas fa-expand"></i>';
            fitBtn.title = 'Fit to Screen';
        }
    }
}

function fitToScreen() {
    const container = document.getElementById('documentPreviewWrapper');
    const content = document.getElementById('documentPreviewContent');
    
    if (container && content) {
        const containerRect = container.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        
        const scaleX = (containerRect.width - 40) / contentRect.width;
        const scaleY = (containerRect.height - 40) / contentRect.height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        currentZoom = Math.round(scale * 100);
        applyZoom();
    }
}

function resetZoom() {
    currentZoom = 100;
    applyZoom();
}

function applyZoom() {
    const content = document.getElementById('documentPreviewContent');
    if (content) {
        content.style.transform = `scale(${currentZoom / 100})`;
        content.style.transformOrigin = 'top left';
        updateZoomDisplay();
    }
}

function updateZoomDisplay() {
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = `${currentZoom}%`;
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        updatePageDisplay();
        // Here you would load the previous page content
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        updatePageDisplay();
        // Here you would load the next page content
    }
}

function updatePageDisplay() {
    const pageIndicator = document.getElementById('pageIndicator');
    const pageNavigation = document.getElementById('pageNavigation');
    
    if (pageIndicator) {
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    
    if (pageNavigation) {
        pageNavigation.style.display = totalPages > 1 ? 'flex' : 'none';
    }
}

function downloadCertificate(certificateId) {
    try {
        const certificates = window.currentCertificates || getLocalCertificates();
        const normalizeNum = (s)=>String(s||'').toUpperCase().replace(/\s+/g,'').trim();
        const certificate = certificates.find(cert => (
            cert._id === certificateId || cert.id === certificateId ||
            normalizeNum(__extractCertNumber(cert)) === normalizeNum(certificateId)
        ));
        
        if (!certificate) {
            showMessage('Certificate not found', 'error');
            return;
        }
        
        // Generate certificate content
        const certificateHTML = generateCertificateHTML(certificate);
        const filename = `certificate_${certificate.certificateNumber || certificate.number || certificateId}.html`;
        
        downloadFile(certificateHTML, filename, 'text/html');
        showMessage('Certificate downloaded successfully!', 'success');
        
    } catch (error) {
        
        showMessage('Failed to download certificate', 'error');
    }
}

// ==================== ENHANCED CERTIFICATE ACTIONS ====================

async function editCertificate(certificateId) {
    try {
        const certificates = window.currentCertificates || getLocalCertificates();
        const normalizeNum = (s)=>String(s||'').toUpperCase().replace(/\s+/g,'').trim();
        const certificate = certificates.find(cert => (
            cert._id === certificateId || cert.id === certificateId ||
            normalizeNum(__extractCertNumber(cert)) === normalizeNum(certificateId)
        ));
        
        if (!certificate) {
            showMessage('Certificate not found', 'error');
            return;
        }
        
        // Populate the certificate form with existing data
        const fields = {
            'certificateNumber': certificate.certificateNumber || certificate.number || '',
            'certificateSerialNumber': certificate.serialNumber || certificate.certificateSerialNumber || '',
            'certificateRecipient': certificate.recipientName || certificate.recipient || certificate.name || '',
            'certificateEmail': certificate.email || '',
            'certificateTitle': certificate.title || certificate.certificateTitle || '',
            'certificateType': certificate.type || certificate.certificateType || '',
            'certificateIssueDate': certificate.issueDate ? new Date(certificate.issueDate).toISOString().split('T')[0] : '',
            'certificateValidUntil': certificate.validUntil ? new Date(certificate.validUntil).toISOString().split('T')[0] : '',
            'certificatePosition': certificate.position || '',
            'certificateCode': certificate.code || '',
            'certificateState': certificate.state || '',
            'certificateZone': certificate.zone || '',
            'certificateDescription': certificate.description || certificate.certificateDescription || ''
        };
        
        // Fill the form fields
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
            }
        });
        
        // Store the certificate ID for update
        document.getElementById('issueCertificateForm').dataset.certificateId = certificateId;
        
        // Change modal title and button
        const modalTitle = document.querySelector('#issueCertificateModal .modal-title');
        const submitButton = document.querySelector('#issueCertificateForm button[type="submit"]');
        
        if (modalTitle) modalTitle.textContent = 'Edit Certificate';
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-save"></i> Update Certificate';
            submitButton.onclick = updateCertificate;
        }
        
        // Show the modal
        showIssueCertificateModal();
        
    } catch (error) {
        
        showMessage('Failed to edit certificate', 'error');
    }
}

async function updateCertificate(event) {
    event.preventDefault();
    
    try {
        let certificateId = document.getElementById('issueCertificateForm').dataset.certificateId;
        const formDataPre = typeof getCertificateFormData === 'function' ? getCertificateFormData() : {};
        const fallbackNumber = formDataPre && (formDataPre.certificateNumber || formDataPre.number || '');
        const normalizeNum = (s)=>String(s||'').toUpperCase().replace(/\s+/g,'').trim();
        // Resolve id using number if ID is missing or a number-like value was stored
        if (!certificateId || certificateId.trim() === '' || certificateId.includes('/')) {
            const list = (window.currentCertificates && Array.isArray(window.currentCertificates)) ? window.currentCertificates : (typeof getLocalCertificates === 'function' ? getLocalCertificates() : []);
            const match = (list||[]).find(c => normalizeNum(__extractCertNumber(c)) === normalizeNum(certificateId || fallbackNumber));
            if (match && (match._id || match.id)) {
                certificateId = match._id || match.id;
                document.getElementById('issueCertificateForm').dataset.certificateId = certificateId;
            }
        }
        if (!certificateId) {
            showMessage('Certificate ID not found', 'error');
            return;
        }
const formData = getCertificateFormData();
        formData._id = certificateId;
        
        const certificates = window.currentCertificates || getLocalCertificates();
        const certificateIndex = certificates.findIndex(cert => 
            cert._id === certificateId || cert.id === certificateId
        );
        
        if (certificateIndex === -1) {
            showMessage('Certificate not found', 'error');
            return;
        }
        
        // Update the certificate
        certificates[certificateIndex] = {
            ...certificates[certificateIndex],
            ...formData,
            updatedAt: new Date().toISOString()
        };
        
        window.currentCertificates = certificates;
        saveLocalCertificates(certificates);
        // Log and refresh Recent Activity immediately
        try { if (typeof logCertificateUpdate === 'function') logCertificateUpdate(certificates[certificateIndex]); } catch (_) {}
        try { if (typeof loadRecentActivity === 'function') setTimeout(loadRecentActivity, 0); } catch (_) {}
        try { if (typeof updateActivityOverlayVisibility === 'function') setTimeout(updateActivityOverlayVisibility, 0); } catch (_) {}

        
        // Reset form and close modal
        document.getElementById('issueCertificateForm').reset();
        document.getElementById('issueCertificateForm').dataset.certificateId = '';
        
        // Reset modal title and button
        const modalTitle = document.querySelector('#issueCertificateModal .modal-title');
        const submitButton = document.querySelector('#issueCertificateForm button[type="submit"]');
        
        if (modalTitle) modalTitle.textContent = 'Issue Certificate';
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-certificate"></i> Issue Certificate';
            submitButton.onclick = issueCertificate;
        }
        
        closeIssueCertificateModal();
        displayCertificates(certificates);
        
        showMessage('Certificate updated successfully!', 'success');
        
    } catch (error) {
        
        showMessage('Failed to update certificate', 'error');
    }
}

async function deleteCertificate(certificateId) {
    if (!confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
        return;
    }
    
    try {
        showMessage('Deleting certificate...', 'info');
        
        const certificates = window.currentCertificates || getLocalCertificates();
        const certificateToDelete = certificates.find(cert => 
            cert._id === certificateId || cert.id === certificateId
        );
        
        if (!certificateToDelete) {
            showMessage('Certificate not found', 'error');
            return;
        }
        
        // Remove from local storage first
        const updatedCertificates = certificates.filter(cert => 
            cert._id !== certificateId && cert.id !== certificateId
        );
        
        window.currentCertificates = updatedCertificates;
        saveLocalCertificates(updatedCertificates);
        
        // Update display immediately for better UX
        displayCertificates(updatedCertificates);
        // Log and refresh Recent Activity immediately
        try { if (typeof logCertificateDelete === 'function') logCertificateDelete(certificateToDelete); } catch (_) {}
        try { if (typeof loadRecentActivity === 'function') setTimeout(loadRecentActivity, 0); } catch (_) {}
        try { if (typeof updateActivityOverlayVisibility === 'function') setTimeout(updateActivityOverlayVisibility, 0); } catch (_) {}

        
        // Refresh analytics if analytics tab is active
        const analyticsPanel = document.getElementById('panel-analytics');
        if (analyticsPanel && analyticsPanel.classList.contains('active')) {
            
            loadAnalytics();
        }
        
        // Try to sync with backend if online
        if (navigator.onLine) {
            try {
                
                
                // Delete certificate from backend
                const response = await fetch(`${backendUrl}/api/certificates/${certificateId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    
                    showMessage('Certificate deleted successfully and synced with server!', 'success');
                } else {
                    
                    showMessage('Certificate deleted locally. Will sync when connection is restored.', 'warning');
                    
                    // Add to pending sync for later
                    const pendingSync = getPendingSync();
                    pendingSync.certificates.push({
                        action: 'delete',
                        data: { id: certificateId },
                        timestamp: new Date().toISOString()
                    });
                    savePendingSync(pendingSync);
                }
            } catch (backendError) {
                
                showMessage('Certificate deleted locally. Will sync when connection is restored.', 'warning');
                
                // Add to pending sync for later
                const pendingSync = getPendingSync();
                pendingSync.certificates.push({
                    action: 'delete',
                    data: { id: certificateId },
                    timestamp: new Date().toISOString()
                });
                savePendingSync(pendingSync);
            }
        } else {
            // Offline mode - just delete locally
            
            showMessage('Certificate deleted locally. Will sync when connection is restored.', 'info');
            
            // Add to pending sync for later
            const pendingSync = getPendingSync();
            pendingSync.certificates.push({
                action: 'delete',
                data: { id: certificateId },
                timestamp: new Date().toISOString()
            });
            savePendingSync(pendingSync);
        }
        
    } catch (error) {
        
        showMessage('Failed to delete certificate', 'error');
    }
}

async function revokeCertificate(certificateId) {
    if (!confirm('Are you sure you want to revoke this certificate? This will mark it as revoked.')) {
        return;
    }
    
    try {
        showMessage('Revoking certificate...', 'info');
        
        const certificates = window.currentCertificates || getLocalCertificates();
        const certificateIndex = certificates.findIndex(cert => 
            cert._id === certificateId || cert.id === certificateId
        );
        
        if (certificateIndex === -1) {
            showMessage('Certificate not found', 'error');
            return;
        }
        
        const certificateToRevoke = certificates[certificateIndex];
        
        // Update certificate status to revoked
        const updatedCertificate = {
            ...certificateToRevoke,
            status: 'revoked',
            revokedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Update local storage first
        certificates[certificateIndex] = updatedCertificate;
        window.currentCertificates = certificates;
        saveLocalCertificates(certificates);

        // Log and refresh Recent Activity immediately
        try { if (typeof logCertificateUpdate === 'function') logCertificateUpdate(updatedCertificate); } catch (_) {}
        try { if (typeof loadRecentActivity === 'function') setTimeout(loadRecentActivity, 0); } catch (_) {}
        try { if (typeof updateActivityOverlayVisibility === 'function') setTimeout(updateActivityOverlayVisibility, 0); } catch (_) {}

        
        // Update display immediately for better UX
        displayCertificates(certificates);
        
        // Refresh analytics if analytics tab is active
        const analyticsPanel = document.getElementById('panel-analytics');
        if (analyticsPanel && analyticsPanel.classList.contains('active')) {
            
            loadAnalytics();
        }
        
        // Try to sync with backend if online
        if (navigator.onLine) {
            try {
                
                
                // Update certificate in backend
                const response = await fetch(`${backendUrl}/api/certificates/${certificateId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedCertificate)
                });
                
                if (response.ok) {
                    
                    showMessage('Certificate revoked successfully and synced with server!', 'success');
                } else {
                    
                    showMessage('Certificate revoked locally. Will sync when connection is restored.', 'warning');
                    
                    // Add to pending sync for later
                    const pendingSync = getPendingSync();
                    pendingSync.certificates.push({
                        action: 'update',
                        data: updatedCertificate,
                        timestamp: new Date().toISOString()
                    });
                    savePendingSync(pendingSync);
                }
            } catch (backendError) {
                
                showMessage('Certificate revoked locally. Will sync when connection is restored.', 'warning');
                
                // Add to pending sync for later
                const pendingSync = getPendingSync();
                pendingSync.certificates.push({
                    action: 'update',
                    data: updatedCertificate,
                    timestamp: new Date().toISOString()
                });
                savePendingSync(pendingSync);
            }
        } else {
            // Offline mode - just update locally
            
            showMessage('Certificate revoked locally. Will sync when connection is restored.', 'info');
            
            // Add to pending sync for later
            const pendingSync = getPendingSync();
            pendingSync.certificates.push({
                action: 'update',
                data: updatedCertificate,
                timestamp: new Date().toISOString()
            });
            savePendingSync(pendingSync);
        }
        
    } catch (error) {
        
        showMessage('Failed to revoke certificate', 'error');
    }
}

// ==================== THEME AND UI FUNCTIONS ====================

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('narap_theme', 'light');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggle.title = 'Switch to Dark Theme';
        }
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('narap_theme', 'dark');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.title = 'Switch to Light Theme';
        }
    }
}

// ==================== CERTIFICATE MODAL FUNCTIONS ====================

function showIssueCertificateModal() {
    const modal = document.getElementById('issueCertificateModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeIssueCertificateModal() {
    const modal = document.getElementById('issueCertificateModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        const form = document.getElementById('issueCertificateForm');
        if (form) {
            form.reset();
        }
    }
}

function closeViewCertificateModal() {
    const modal = document.getElementById('viewCertificateModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function closeViewIdCardModal() {
    const modal = document.getElementById('viewIdCardModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ==================== CERTIFICATE HELPER FUNCTIONS ====================

function getCertificateFormData() {
    try {
        
        
        // Get form values directly by ID since FormData requires name attributes
        const data = {
            certificateNumber: document.getElementById('certificateNumber')?.value || '',
            certificateSerialNumber: document.getElementById('certificateSerialNumber')?.value || '',
            certificateRecipient: document.getElementById('certificateRecipient')?.value || '',
            certificateEmail: document.getElementById('certificateEmail')?.value || '',
            certificateTitle: document.getElementById('certificateTitle')?.value || '',
            certificateType: document.getElementById('certificateType')?.value || '',
            certificateIssueDate: document.getElementById('certificateIssueDate')?.value || '',
            certificateValidUntil: document.getElementById('certificateValidUntil')?.value || '',
            certificatePosition: document.getElementById('certificatePosition')?.value || '',
            certificateCode: document.getElementById('certificateCode')?.value || '',
            certificateState: document.getElementById('certificateState')?.value || '',
            certificateDescription: document.getElementById('certificateDescription')?.value || ''
        };
        
        
        
        // Ensure certificate number is always generated and unique
        if (!data.certificateNumber || data.certificateNumber.trim() === '') {
            data.certificateNumber = generateUniqueCertificateNumber();
            
        }
        
        // Ensure serial number is always generated
        if (!data.certificateSerialNumber || data.certificateSerialNumber.trim() === '') {
            data.certificateSerialNumber = generateUniqueSerialNumber();
            
        }
        
        // Validate required fields
        const requiredFields = [
            'certificateRecipient', 'certificateTitle', 
            'certificateType', 'certificateIssueDate'
        ];
        
        
        for (const field of requiredFields) {
            const value = data[field];
            
            if (!value || value.trim() === '') {
                
                return null;
            }
        }
        
        
        
        // Map form data to certificate structure
        const certificateData = {
            // Backend expects these field names
            number: data.certificateNumber,
            recipient: data.certificateRecipient,
            title: data.certificateTitle,
            email: data.certificateEmail,
            type: data.certificateType,
            issueDate: data.certificateIssueDate,
            validUntil: data.certificateValidUntil || null,
            description: data.certificateDescription || '',
            
            // Additional fields for local storage
            certificateNumber: data.certificateNumber,
            serialNumber: data.certificateSerialNumber,
            recipientName: data.certificateRecipient,
            position: data.certificatePosition || '',
            code: data.certificateCode || '',
            state: data.certificateState || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            _id: 'local_' + Date.now()
        };
        
        
        return certificateData;
        
    } catch (error) {
        
        return null;
    }
}

function generateUniqueCertificateNumber() {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const certificateNumber = `NARAP-CERT-${timestamp}-${randomSuffix}`;
    
    // Check if this certificate number already exists in local storage
    const existingCertificates = getLocalCertificates() || [];
    const isDuplicate = existingCertificates.some(cert => 
        cert.certificateNumber === certificateNumber || cert.number === certificateNumber
    );
    
    if (isDuplicate) {
        // If duplicate, generate a new one with additional randomness
        return generateUniqueCertificateNumber();
    }
    
    return certificateNumber;
}

function generateUniqueSerialNumber() {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SN-${timestamp}-${randomSuffix}`;
}

function generateUniqueCode() {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `M${timestamp}${randomSuffix}`;
    
    // Check if this code already exists in local storage
    const existingMembers = getLocalMembers() || [];
    const isDuplicate = existingMembers.some(member => member.code === code);
    
    if (isDuplicate) {
        // If duplicate, generate a new one with additional randomness
        return generateUniqueCode();
    }
    
    return code;
}

function generateCertificateHTML(certificate) {
    const issueDate = certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';
    
    return `
        <div class="certificate-container">
            <div class="certificate">
                <!-- Header Section -->
                <div class="certificate-header">
                    <div class="logo-section">
                        <img src="/images/narap-logo.jpg" alt="NARAP Logo" class="logo">
                    </div>
                    <div class="organization-info">
                        <h1 class="org-name">NARAP</h1>
                        <p class="org-full-name">National Association of Refrigeration and Air Conditioning Professionals</p>
                    </div>
                </div>
                
                <!-- Main Certificate Content -->
                <div class="certificate-body">
                    <div class="certificate-title">
                        <h2>${certificate.title || 'Certificate of Membership'}</h2>
                        <div class="title-decoration"></div>
                    </div>
                    
                    <div class="certificate-content">
                        <div class="presentation-text">
                            <p class="presentation">This is to certify that</p>
                        </div>
                        
                        <div class="recipient-info">
                            <h3 class="recipient-name">${certificate.recipientName || certificate.recipient || certificate.name}</h3>
                            <p class="recipient-description">has successfully completed all requirements and demonstrated exceptional competence in the field of Refrigeration and Air Conditioning. This certificate is hereby granted in recognition of their professional achievements.</p>
                        </div>
                        
                        <div class="certificate-details">
                            <div class="details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Certificate Number:</span>
                                    <span class="detail-value">${certificate.certificateNumber || certificate.number}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Issue Date:</span>
                                    <span class="detail-value">${issueDate}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Position:</span>
                                    <span class="detail-value">${certificate.position || 'Member'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">State:</span>
                                    <span class="detail-value">${certificate.state || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Signature Section -->
                <div class="certificate-signature">
                    <div class="signature-area">
                        <div class="signature-line"></div>
                        <p class="signature-title">Authorized Signature</p>
                        <p class="signature-name">NARAP Executive Director</p>
                    </div>
                    <div class="official-seal">
                        <div class="seal-circle">
                            <span>NARAP</span>
                        </div>
                    </div>
                </div>
                
                <!-- Footer Section -->
                <div class="certificate-footer">
                    <div class="footer-content">
                        <p class="footer-text">This certificate is issued by NARAP and is valid for professional recognition.</p>
                        <div class="certificate-meta">
                            <span class="meta-item">Certificate ID: ${certificate.certificateNumber || certificate.number}</span>
                            <span class="meta-item">Issue Date: ${issueDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function issueCertificate(event) {
    event.preventDefault();
    
    try {
        
        showMessage('Issuing certificate...', 'info');
        
        // Get form data
        const certificateData = getCertificateFormData();
        
        if (!certificateData) {
            
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        
        
        // Try to save to backend first
        let backendSuccess = false;
        if (navigator.onLine) {
            try {
                // Prepare data for backend (only required fields)
                const backendData = {
                    number: certificateData.number,
                    recipient: certificateData.recipient,
                    title: certificateData.title,
                    email: certificateData.email,
                    type: certificateData.type,
                    issueDate: certificateData.issueDate,
                    validUntil: certificateData.validUntil,
                    description: certificateData.description
                };
                
                const response = await fetch(`${backendUrl}/api/certificates`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(backendData)
                });
                
                if (response.ok) {
                    const result = await tryJson(response);
                    if (result.certificate) {
                        certificateData._id = result.certificate._id;
                        backendSuccess = true;
                    }
                }
            } catch (error) {
                
            }
        }
        
        // Save to local storage
        const localCertificates = getLocalCertificates() || [];
        localCertificates.push(certificateData);
        saveLocalCertificates(localCertificates);
        // Log and refresh Recent Activity immediately
        try { if (typeof logCertificateAdd === 'function') logCertificateAdd(certificateData); } catch (_) {}
        try { if (typeof loadRecentActivity === 'function') setTimeout(loadRecentActivity, 0); } catch (_) {}
        try { if (typeof updateActivityOverlayVisibility === 'function') setTimeout(updateActivityOverlayVisibility, 0); } catch (_) {}

        
        // Add to pending sync if backend failed
        if (!backendSuccess) {
            const pendingSync = getPendingSync();
            pendingSync.certificateCreations.push(certificateData);
            savePendingSync(pendingSync);
        }
        
        // Update current certificates
        window.currentCertificates = localCertificates;
        
        // Close modal and refresh
        closeIssueCertificateModal();
        displayCertificates(localCertificates);
        
        showMessage('Certificate issued successfully!', 'success');
        
        // Refresh dashboard if on dashboard
        const activePanel = document.querySelector('.panel.active');
        if (activePanel && activePanel.id === 'panel-dashboard') {
            loadDashboard();
        }
        
    } catch (error) {
        
        showMessage('Failed to issue certificate: ' + error.message, 'error');
    }
}

async function autoFillCertificateFields() {
    try {
        const email = document.getElementById('certificateEmail').value;
        if (!email) return;
        
        
        
        let member = null;
        
        // First check local members
        const localMembers = getLocalMembers();
        if (localMembers && localMembers.length > 0) {
            member = localMembers.find(m => 
                m.email && m.email.toLowerCase() === email.toLowerCase()
            );
            
        }
        
        // If not found locally and online, try backend
        if (!member && navigator.onLine) {
            try {
                
                const response = await fetch(`${backendUrl}/api/users/getUsers`);
                if (response.ok) {
                    const result = await tryJson(response);
                    let backendMembers = [];
                    
                    // Handle different response formats
                    if (Array.isArray(result)) {
                        backendMembers = result;
                    } else if (result && Array.isArray(result.data)) {
                        backendMembers = result.data;
                    } else if (result && result.success && Array.isArray(result.success.data)) {
                        backendMembers = result.success.data;
                    }
                    
                    member = backendMembers.find(m => 
                        m.email && m.email.toLowerCase() === email.toLowerCase()
                    );
                    
                }
            } catch (error) {
                
            }
        }
        
        if (member) {
            
            
            // Fill all the certificate form fields with comprehensive member data
            const fields = {
                'certificateRecipient': member.name || member.fullName || '',
                'certificatePosition': member.position || '',
                'certificateCode': member.code || '',
                'certificateState': member.state || '',
                'certificateZone': member.zone || ''
            };
            
            // Update each field
            Object.entries(fields).forEach(([fieldId, value]) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                    
                }
            });
            
            // Auto-generate certificate number if empty
            const certNumberField = document.getElementById('certificateNumber');
            if (certNumberField && !certNumberField.value.trim()) {
                certNumberField.value = generateUniqueCertificateNumber();
            }
            
            // Auto-generate serial number if empty
            const serialNumberField = document.getElementById('certificateSerialNumber');
            if (serialNumberField && !serialNumberField.value.trim()) {
                serialNumberField.value = generateUniqueSerialNumber();
            }
            
            // Set issue date to today if empty
            const issueDateField = document.getElementById('certificateIssueDate');
            if (issueDateField && !issueDateField.value) {
                const today = new Date().toISOString().split('T')[0];
                issueDateField.value = today;
            }
            
            // Set certificate type to membership if empty
            const typeField = document.getElementById('certificateType');
            if (typeField && !typeField.value) {
                typeField.value = 'membership';
            }
            
            // Also update the certificate title if it's empty
            const titleField = document.getElementById('certificateTitle');
            if (titleField && !titleField.value.trim()) {
                titleField.value = 'Certificate of Membership';
            }
            
            // Add member details to description if empty
            const descField = document.getElementById('certificateDescription');
            if (descField && !descField.value.trim()) {
                const description = `This certificate is issued to ${member.name || member.fullName} in recognition of their membership in the Nigerian Association of Refrigeration and Air Conditioning Practitioners (NARAP).`;
                descField.value = description;
            }
            
            showMessage(`✅ Member details auto-filled for ${member.name || member.fullName}!`, 'success');
            
        } else {
            
            // Clear fields if no member found
            const fields = ['certificateRecipient', 'certificatePosition', 'certificateCode', 'certificateState'];
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = '';
                }
            });
        }
        
    } catch (error) {
        
        showMessage('Error auto-filling fields', 'error');
    }
}

// Handle real-time email input for better UX
function handleEmailInput() {
    const email = document.getElementById('certificateEmail').value;
    const emailField = document.getElementById('certificateEmail');
    
    if (!email) {
        // Clear the visual indicator
        emailField.style.borderColor = '';
        return;
    }
    
    // Check if email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailField.style.borderColor = '#dc3545'; // Red for invalid email
        return;
    }
    
    // Check if member exists (local check only for performance)
    const localMembers = getLocalMembers();
    if (localMembers && localMembers.length > 0) {
        const member = localMembers.find(m => 
            m.email && m.email.toLowerCase() === email.toLowerCase()
        );
        
        if (member) {
            emailField.style.borderColor = '#28a745'; // Green for found member
        } else {
            emailField.style.borderColor = '#ffc107'; // Yellow for valid email but no member found
        }
    } else {
        emailField.style.borderColor = '#ffc107'; // Yellow for valid email
    }
}

// ==================== CERTIFICATE FUNCTIONS ====================

function refreshCertificates() {
    loadCertificates(1, 10);
}

function clearCertificateFilters() {
    // Inputs used by certificate filtering UI
    const searchBoxes = [
      document.getElementById('certificateSearch')
    ];
    const statusBoxes = [
      document.getElementById('certificateStatusFilter'),
      document.getElementById('statusFilter') // legacy id (fallback)
    ];
    const typeBoxes = [
      document.getElementById('certificateTypeFilter'),
      document.getElementById('typeFilter'), // legacy fallback
      document.getElementById('typeFilterUI') // if present
    ];
    const stateBoxes = [
      document.getElementById('certificateStateFilter'),
      document.getElementById('stateFilter'), // legacy fallback
      document.getElementById('stateFilterUI') // if present
    ];
    const dateBoxes = [
      document.getElementById('dateFilter')
    ];

    // Reset values
    for (const el of [...searchBoxes, ...statusBoxes, ...typeBoxes, ...stateBoxes, ...dateBoxes]) {
      if (!el) continue;
      if ('value' in el) el.value = '';
      // If it's a <select>, also reset to the first option if 'All...' exists
      if (el.tagName === 'SELECT') {
        const idx = Array.from(el.options || []).findIndex(o => (/all/i.test(o.text) || o.value === '' ));
        el.selectedIndex = idx !== -1 ? idx : 0;
      }
      // Fire change/input for any listeners
      try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch(_) {}
      try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch(_) {}
    }

    // Reset pagination to page 1 and reload with blank filters
    const per = parseInt(localStorage.getItem('narap_certificates_per_page')) || 10;
    if (typeof loadCertificates === 'function') {
      loadCertificates(1, per, '', '', '', '');
    } else if (typeof refreshCertificates === 'function') {
      refreshCertificates();
    }

    // Optional toast
    try { showMessage('Certificate filters cleared', 'success'); } catch(_){}
}

function generateCertificatePreview() {
    try {
        
        
        // Get form data
        const formData = getCertificateFormData();
        
        if (!formData) {
            
            showMessage('Please fill in all required fields', 'warning');
            return;
        }
        
        
        
        // Create a certificate object for preview
        const previewCertificate = {
            certificateNumber: formData.certificateNumber,
            serialNumber: formData.certificateSerialNumber,
            recipientName: formData.certificateRecipient,
            email: formData.certificateEmail,
            title: formData.certificateTitle,
            type: formData.certificateType,
            issueDate: formData.certificateIssueDate,
            validUntil: formData.certificateValidUntil,
            position: formData.certificatePosition,
            code: formData.certificateCode,
            state: formData.certificateState,
            description: formData.certificateDescription,
            status: 'Active'
        };
        
        // Show certificate in modern preview modal
        showCertificatePreviewModal(previewCertificate);
        
    } catch (error) {
        
        showMessage('Failed to generate preview', 'error');
    }
}

function showCertificatePreviewModal(certificate) {
    // Create modal HTML with modern document preview UI
    const modalHTML = `
        <div id="certificatePreviewModal" class="modal-overlay document-preview-overlay">
            <div class="modal-content document-preview-modal">
                <div class="document-preview-header">
                    <div class="preview-title">
                        <h3>Certificate Preview</h3>
                        <span class="certificate-info">${certificate.certificateNumber || 'N/A'} - ${certificate.recipientName || 'N/A'}</span>
                    </div>
                    <button class="close-btn" onclick="closeCertificatePreviewModal()">&times;</button>
                </div>
                
                <div class="document-preview-toolbar">
                    <div class="toolbar-left">
                        <div class="zoom-controls">
                            <button class="toolbar-btn" onclick="zoomOut()" title="Zoom Out">
                                <i class="fas fa-search-minus"></i>
                            </button>
                            <span class="zoom-level" id="zoomLevel">100%</span>
                            <button class="toolbar-btn" onclick="zoomIn()" title="Zoom In">
                                <i class="fas fa-search-plus"></i>
                            </button>
                            <button class="toolbar-btn" onclick="toggleFitToScreen()" title="Fit to Screen" id="fitToScreenBtn">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="toolbar-center">
                        <div class="page-navigation" id="pageNavigation" style="display: none;">
                            <button class="toolbar-btn" onclick="previousPage()" title="Previous Page">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span class="page-indicator" id="pageIndicator">Page 1 of 1</span>
                            <button class="toolbar-btn" onclick="nextPage()" title="Next Page">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="toolbar-right">
                        <button class="toolbar-btn success" onclick="downloadCertificatePreview()" title="Download PDF">
                            <i class="fas fa-download"></i>
                            <span>Download</span>
                        </button>
                        <button class="toolbar-btn info" onclick="printCertificatePreview()" title="Print Certificate">
                            <i class="fas fa-print"></i>
                            <span>Print</span>
                        </button>
                    </div>
                </div>
                
                <div class="document-preview-container">
                    <div class="document-preview-wrapper" id="documentPreviewWrapper">
                        <div class="document-preview-content" id="documentPreviewContent">
                            ${generateCertificateHTML(certificate)}
                        </div>
                    </div>
                </div>
                
                <div class="document-preview-footer">
                    <div class="footer-info">
                        <span class="certificate-status">
                            Status: <span class="status-badge active">Preview</span>
                        </span>
                        <span class="certificate-date">
                            Issue Date: ${certificate.issueDate || 'Not set'}
                        </span>
                    </div>
                    <div class="footer-actions">
                        <button class="btn btn-secondary" onclick="closeCertificatePreviewModal()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    document.getElementById('certificatePreviewModal').style.display = 'flex';
    
    // Initialize document preview functionality
    initializeDocumentPreview();
}

function closeCertificatePreviewModal() {
    const modal = document.getElementById('certificatePreviewModal');
    if (modal) {
        modal.remove();
    }
}

function downloadCertificatePreview() {
    try {
        const content = document.getElementById('documentPreviewContent');
        if (content) {
            const certificateHTML = content.innerHTML;
            const filename = `certificate_preview_${Date.now()}.html`;
            downloadFile(certificateHTML, filename, 'text/html');
            showMessage('Certificate preview downloaded successfully!', 'success');
        }
    } catch (error) {
        
        showMessage('Failed to download certificate preview', 'error');
    }
}

function printCertificatePreview() {
    try {
        const content = document.getElementById('documentPreviewContent');
        if (content) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Certificate Preview</title>
                        <style>
                            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                            .certificate { max-width: 210mm; margin: 0 auto; }
                        </style>
                    </head>
                    <body>
                        ${content.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    } catch (error) {
        
        showMessage('Failed to print certificate preview', 'error');
    }
}

function printCertificate(certificateId = null) {
    try {
        let certificate;
        
        if (certificateId) {
            // Print existing certificate
            const certificates = window.currentCertificates || getLocalCertificates();
            certificate = certificates.find(cert => 
                cert._id === certificateId || cert.id === certificateId
            );
        } else {
            // Print preview certificate
            certificate = getCertificateFormData();
        }
        
        if (!certificate) {
            showMessage('No certificate to print', 'error');
            return;
        }
        
        // Generate certificate HTML
        const certificateHTML = generateCertificateHTML(certificate);
        
        // Create print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificate - ${certificate.recipientName || certificate.recipient || certificate.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .certificate { border: 3px solid #gold; padding: 40px; text-align: center; background: #fff; }
                    .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333; }
                    .title { font-size: 28px; font-weight: bold; margin: 30px 0; color: #2c3e50; }
                    .recipient { font-size: 20px; margin: 20px 0; color: #34495e; }
                    .description { font-size: 16px; margin: 20px 0; color: #7f8c8d; }
                    .footer { margin-top: 40px; font-size: 14px; color: #95a5a6; }
                    .signature { margin-top: 30px; }
                    @media print { body { margin: 0; } .certificate { border: none; } }
                </style>
            </head>
            <body>
                ${certificateHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        
        showMessage('Certificate sent to printer!', 'success');
        
    } catch (error) {
        
        showMessage('Failed to print certificate', 'error');
    }
}

// ==================== ID CARD FUNCTIONS ====================

function generateIdCardPreview() {
    // Get form data
    const name = document.getElementById('memberName')?.value || '';
    const email = document.getElementById('memberEmail')?.value || '';
    const code = document.getElementById('memberCode')?.value || '';
    const position = document.getElementById('memberPosition')?.value || '';
    const state = document.getElementById('memberState')?.value || '';
    const zone = document.getElementById('memberZone')?.value || '';
    
    // Get file inputs
    const passportInput = document.getElementById('memberPassport');
    const signatureInput = document.getElementById('memberSignature');
    
    // Validate required fields
    if (!name || !code || !position || !state || !zone) {
        showMessage('Please fill in all required fields before previewing ID card', 'warning');
        return;
    }
    
    // Generate passport photo URL
    let passportPhotoUrl = '';
    if (passportInput && passportInput.files[0]) {
        passportPhotoUrl = URL.createObjectURL(passportInput.files[0]);
    } else {
        // Use default avatar
        passportPhotoUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IiM2NjdFRUEiLz4KPHBhdGggZD0iTTMwIDE1QzM0LjE0MjEgMTUgMzcuNSAxOC4zNTc5IDM3LjUgMjIuNUMzNy41IDI2LjY0MjEgMzQuMTQyMSAzMCAzMCAzMEMyNS44NTc5IDMwIDIyLjUgMjYuNjQyMSAyMi41IDIyLjVDMjIuNSAxOC4zNTc5IDI1Ljg1NzkgMTUgMzAgMTVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDUgNDVDNDUgMzUuMDU5IDM4LjQ0MSAyOC41IDI5IDI4LjVDMTkuNTU5IDI4LjUgMTMgMzUuMDU5IDEzIDQ1SDQ1WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
    }
    
    // Generate signature URL
    let signatureUrl = '';
    if (signatureInput && signatureInput.files[0]) {
        signatureUrl = URL.createObjectURL(signatureInput.files[0]);
    }
    
    // Generate current date
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Create ID card HTML
    const idCardHTML = `
        <div class="id-card">
            <div class="id-card-header">
                NIGERIAN ASSOCIATION OF REGISTERED ADMINISTRATIVE PROFESSIONALS<br>
                MEMBER IDENTIFICATION CARD
            </div>
            <div class="id-card-content">
                <img src="${passportPhotoUrl}" alt="Member Photo" class="id-card-photo" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IiM2NjdFRUEiLz4KPHBhdGggZD0iTTMwIDE1QzM0LjE0MjEgMTUgMzcuNSAxOC4zNTc5IDM3LjUgMjIuNUMzNy41IDI2LjY0MjEgMzQuMTQyMSAzMCAzMCAzMEMyNS44NTc5IDMwIDIyLjUgMjYuNjQyMSAyMi41IDIyLjVDMjIuNSAxOC4zNTc5IDI1Ljg1NzkgMTUgMzAgMTVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNDUgNDVDNDUgMzUuMDU5IDM4LjQ0MSAyOC41IDI5IDI4LjVDMTkuNTU5IDI4LjUgMTMgMzUuMDU5IDEzIDQ1SDQ1WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';">
                <div class="id-card-info">
                    <div class="id-card-field"><strong>Name:</strong> ${name}</div>
                    <div class="id-card-field"><strong>Code:</strong> ${code}</div>
                    <div class="id-card-field"><strong>Position:</strong> ${position}</div>
                    <div class="id-card-field"><strong>State:</strong> ${state}</div>
                    <div class="id-card-field"><strong>Zone:</strong> ${zone}</div>
                    ${email ? `<div class="id-card-field"><strong>Email:</strong> ${email}</div>` : ''}
                    <div class="id-card-field"><strong>Issue Date:</strong> ${currentDate}</div>
                </div>
            </div>
            ${signatureUrl ? `<img src="${signatureUrl}" alt="Signature" class="id-card-signature">` : ''}
        </div>
    `;
    
    // Show the preview
    const previewContainer = document.getElementById('idCardPreview');
    const generatedIdCard = document.getElementById('generatedIdCard');
    
    if (previewContainer && generatedIdCard) {
        generatedIdCard.innerHTML = idCardHTML;
        previewContainer.classList.remove('hidden');
        
        // Scroll to preview
        previewContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        showMessage('ID Card preview generated successfully!', 'success');
    } else {
        showMessage('Preview container not found', 'error');
    }
}

function hideIdCardPreview() {
    const previewContainer = document.getElementById('idCardPreview');
    if (previewContainer) {
        previewContainer.classList.add('hidden');
        showMessage('ID Card preview hidden', 'info');
    }
}

function printIdCard() {
    showMessage('ID card print feature coming soon!', 'info');
}

function downloadIdCard() {
    showMessage('ID card download feature coming soon!', 'info');
}

// ==================== TABLE UTILITY FUNCTIONS ====================

// Bulk operations removed - no longer needed without checkboxes

function updateMembersCount() {
    const membersCount = document.getElementById('membersCount');
    const totalMembers = window.currentMembers?.length || 0;
    
    if (membersCount) {
        membersCount.textContent = `Showing ${totalMembers} of ${totalMembers} members`;
    }
}


// ==================== MODERN PAGINATION FUNCTIONS ====================

function changeMembersPerPage() {
    const perPageSelect = document.getElementById('membersPerPage');
    const perPage = perPageSelect ? parseInt(perPageSelect.value) : 10;
    
    // Store preference
    localStorage.setItem('narap_members_per_page', perPage);
    
    // Get current filters
    const searchTerm = document.getElementById('memberSearch')?.value || '';
    const positionFilter = document.getElementById('positionFilter')?.value || '';
    const stateFilter = document.getElementById('stateFilter')?.value || '';
    
    // Reload members with new pagination and current filters
    loadMembers(1, perPage, searchTerm, positionFilter, stateFilter);
}

function changeCertificatesPerPage() {
    const perPageSelect = document.getElementById('certificatesPerPage');
    const perPage = perPageSelect ? parseInt(perPageSelect.value) : 25;
    
    // Store preference
    localStorage.setItem('narap_certificates_per_page', perPage);
    
    // Reload certificates with new pagination
    loadCertificates(1, perPage);
}

function goToMembersPage(page) {
    const perPageSelect = document.getElementById('membersPerPage');
    const perPage = perPageSelect ? parseInt(perPageSelect.value) : 10;
    
    // Get current filters
    const searchTerm = document.getElementById('memberSearch')?.value || '';
    const positionFilter = document.getElementById('positionFilter')?.value || '';
    const stateFilter = document.getElementById('stateFilter')?.value || '';
    
    loadMembers(page, perPage, searchTerm, positionFilter, stateFilter);
}

function goToCertificatesPage(page) {
    const perPageSelect = document.getElementById('certificatesPerPage');
    const perPage = perPageSelect ? parseInt(perPageSelect.value) : 25;
    
    loadCertificates(page, perPage);
}

function setupPaginationEventListeners() {
    // Members pagination
    const membersPerPageSelect = document.getElementById('membersPerPage');
    if (membersPerPageSelect) {
        membersPerPageSelect.addEventListener('change', changeMembersPerPage);
    }
    
    const membersFirstPage = document.getElementById('firstPage');
    const membersPrevPage = document.getElementById('prevPage');
    const membersNextPage = document.getElementById('nextPage');
    const membersLastPage = document.getElementById('lastPage');
    
    if (membersFirstPage) membersFirstPage.addEventListener('click', () => goToMembersPage(1));
    if (membersPrevPage) membersPrevPage.addEventListener('click', () => {
        const currentPage = parseInt(localStorage.getItem('narap_members_current_page') || '1');
        if (currentPage > 1) goToMembersPage(currentPage - 1);
    });
    if (membersNextPage) membersNextPage.addEventListener('click', () => {
        const currentPage = parseInt(localStorage.getItem('narap_members_current_page') || '1');
        const totalPages = parseInt(localStorage.getItem('narap_members_total_pages') || '1');
        if (currentPage < totalPages) goToMembersPage(currentPage + 1);
    });
    if (membersLastPage) membersLastPage.addEventListener('click', () => {
        const totalPages = parseInt(localStorage.getItem('narap_members_total_pages') || '1');
        goToMembersPage(totalPages);
    });
    
    // Certificates pagination
    const certificatesPerPageSelect = document.getElementById('certificatesPerPage');
    if (certificatesPerPageSelect) {
        certificatesPerPageSelect.addEventListener('change', changeCertificatesPerPage);
    }
    
    const certificatesFirstPage = document.getElementById('certificatesFirstPage');
    const certificatesPrevPage = document.getElementById('certificatesPrevPage');
    const certificatesNextPage = document.getElementById('certificatesNextPage');
    const certificatesLastPage = document.getElementById('certificatesLastPage');
    
    if (certificatesFirstPage) certificatesFirstPage.addEventListener('click', () => goToCertificatesPage(1));
    if (certificatesPrevPage) certificatesPrevPage.addEventListener('click', () => {
        const currentPage = parseInt(localStorage.getItem('narap_certificates_current_page') || '1');
        if (currentPage > 1) goToCertificatesPage(currentPage - 1);
    });
    if (certificatesNextPage) certificatesNextPage.addEventListener('click', () => {
        const currentPage = parseInt(localStorage.getItem('narap_certificates_current_page') || '1');
        const totalPages = parseInt(localStorage.getItem('narap_certificates_total_pages') || '1');
        if (currentPage < totalPages) goToCertificatesPage(currentPage + 1);
    });
    if (certificatesLastPage) certificatesLastPage.addEventListener('click', () => {
        const totalPages = parseInt(localStorage.getItem('narap_certificates_total_pages') || '1');
        goToCertificatesPage(totalPages);
    });
}

function renderPagination(currentPage, totalPages, totalItems, itemsPerPage, type = 'members') {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    // Update count text
    const countElement = document.getElementById(type === 'members' ? 'membersCount' : 'certificatesCount');
    if (countElement) {
        countElement.textContent = `Showing ${startItem}-${endItem} of ${totalItems} ${type}`;
    }
    
    // Update page numbers
    const pageNumbersElement = document.getElementById(type === 'members' ? 'pageNumbers' : 'certificatesPageNumbers');
    if (pageNumbersElement) {
        pageNumbersElement.innerHTML = '';
        
        if (totalPages <= 1) {
            // Hide pagination if only one page
            const paginationContainer = document.getElementById(type === 'members' ? 'membersPagination' : 'certificatesPagination');
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
            return;
        }
        
        // Show pagination
        const paginationContainer = document.getElementById(type === 'members' ? 'membersPagination' : 'certificatesPagination');
        if (paginationContainer) {
            paginationContainer.style.display = 'flex';
        }
        
        // Generate page numbers with ellipsis
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            const firstPageBtn = document.createElement('div');
            firstPageBtn.className = 'page-number';
            firstPageBtn.textContent = '1';
            firstPageBtn.onclick = () => goToPage(1, type);
            pageNumbersElement.appendChild(firstPageBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('div');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersElement.appendChild(ellipsis);
            }
        }
        
        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('div');
            pageBtn.className = 'page-number';
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.textContent = i;
            pageBtn.onclick = () => goToPage(i, type);
            pageNumbersElement.appendChild(pageBtn);
        }
        
        // Add last page and ellipsis if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('div');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersElement.appendChild(ellipsis);
            }
            
            const lastPageBtn = document.createElement('div');
            lastPageBtn.className = 'page-number';
            lastPageBtn.textContent = totalPages;
            lastPageBtn.onclick = () => goToPage(totalPages, type);
            pageNumbersElement.appendChild(lastPageBtn);
        }
    }
    
    // Update navigation buttons
    updatePaginationButtons(currentPage, totalPages, type);
    
    // Store pagination state
    localStorage.setItem(`narap_${type}_current_page`, currentPage.toString());
    localStorage.setItem(`narap_${type}_total_pages`, totalPages.toString());
}

function updatePaginationButtons(currentPage, totalPages, type = 'members') {
    const firstBtn = document.getElementById(type === 'members' ? 'firstPage' : 'certificatesFirstPage');
    const prevBtn = document.getElementById(type === 'members' ? 'prevPage' : 'certificatesPrevPage');
    const nextBtn = document.getElementById(type === 'members' ? 'nextPage' : 'certificatesNextPage');
    const lastBtn = document.getElementById(type === 'members' ? 'lastPage' : 'certificatesLastPage');
    
    if (firstBtn) firstBtn.disabled = currentPage === 1;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    if (lastBtn) lastBtn.disabled = currentPage === totalPages;
}

function goToPage(page, type = 'members') {
    if (type === 'members') {
        goToMembersPage(page);
    } else {
        goToCertificatesPage(page);
    }
}

// ==================== SYSTEM FUNCTIONS ====================

function testServerConnection() {
    testBackendConnection();
}

function refreshMembersTable() {
    // Get user's saved pagination preference
    const savedMembersPerPage = parseInt(localStorage.getItem('narap_members_per_page')) || 10;
    loadMembers(1, savedMembersPerPage);
}

// Password for clearing data and certificates
const AUTHORIZED_PASSWORD = '07068172915';

// Function to show password dialog
function showPasswordDialog(action, callback) {
    console.log(`🔐 Showing password dialog for: ${action}`);
    
    // Wait a bit for DOM to be ready
    setTimeout(() => {
        const modal = document.getElementById('confirmModal');
        const title = document.getElementById('confirmTitle');
        const message = document.getElementById('confirmMessage');
        const confirmButton = document.getElementById('confirmYes');
        const cancelButton = document.getElementById('confirmNo');
        
        console.log('🔍 Checking modal elements:', {
            modal: !!modal,
            title: !!title,
            message: !!message,
            confirmButton: !!confirmButton,
            cancelButton: !!cancelButton
        });
        
        if (!modal || !title || !message || !confirmButton || !cancelButton) {
            console.error('❌ Modal elements not found:', {
                modal: !!modal,
                title: !!title,
                message: !!message,
                confirmButton: !!confirmButton,
                cancelButton: !!cancelButton
            });
            
            // Try to create a simple alert as fallback
            const password = prompt(`🔐 AUTHORIZATION REQUIRED\n\nThis action will permanently delete ALL ${action.toUpperCase()} from both the frontend and backend database.\n\nThis action cannot be undone! Please enter the authorized password to continue.\n\nPassword: `);
            
            if (password === AUTHORIZED_PASSWORD) {
                console.log('✅ Password correct via fallback, proceeding with action');
                callback();
            } else if (password !== null) {
                console.log('❌ Password incorrect via fallback');
                alert('❌ Incorrect password. Please try again.');
            } else {
                console.log('❌ Password dialog cancelled via fallback');
            }
            return;
        }
    
            // Set up the modal content
        title.textContent = `Clear ${action}`;
        message.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-lock" style="font-size: 48px; color: #dc3545; margin-bottom: 15px;"></i>
                <h3 style="color: #dc3545; margin-bottom: 15px;">🔐 AUTHORIZATION REQUIRED</h3>
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
                    This action will permanently delete <strong>ALL ${action.toUpperCase()}</strong> from both the frontend and backend database.
                </p>
                <p style="font-size: 14px; color: #6c757d; margin-bottom: 20px;">
                    This action cannot be undone! Please enter the authorized password to continue.
                </p>
                <div style="margin-bottom: 20px;">
                    <input type="password" id="authPassword" placeholder="Enter authorized password" 
                           style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px;"
                           onkeypress="if(event.key === 'Enter') handlePasswordSubmit()">
                </div>
                <div id="passwordError" style="color: #dc3545; font-size: 14px; margin-top: 10px; display: none;">
                    ❌ Incorrect password. Please try again.
                </div>
            </div>
        `;
        
        // Clear any existing event listeners by removing and re-adding
        const newConfirmButton = confirmButton.cloneNode(true);
        const newCancelButton = cancelButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
        
        // Add event listener to the confirm button
        newConfirmButton.addEventListener('click', handlePasswordSubmit);
        
        // Add event listener to the cancel button
        newCancelButton.addEventListener('click', () => {
            console.log('❌ Password dialog cancelled');
            closeConfirmModal();
        });
        
        // Handle password submission
        function handlePasswordSubmit() {
            const passwordInput = document.getElementById('authPassword');
            const passwordError = document.getElementById('passwordError');
            
            if (!passwordInput) {
                console.error('❌ Password input not found');
                return;
            }
            
            console.log(`🔐 Password check for action: ${action}`);
            
            if (passwordInput.value === AUTHORIZED_PASSWORD) {
                console.log('✅ Password correct, proceeding with action');
                closeConfirmModal();
                callback();
            } else {
                console.log('❌ Password incorrect');
                passwordError.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
        
        // Show the modal and focus on password input
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on password input after modal is shown
        setTimeout(() => {
            const passwordInput = document.getElementById('authPassword');
            if (passwordInput) {
                passwordInput.focus();
            }
        }, 100);
        
        console.log('✅ Password dialog displayed successfully');
    }, 100); // Small delay to ensure DOM is ready
}

function confirmClearAllData() {
    console.log('🗑️ Clear All Data button clicked');
    showPasswordDialog('All Data', async () => {
        console.log('✅ Password verified, starting clear all data...');
        try {
            await clearAllData();
        } catch (error) {
            console.error('❌ Error in clearAllData:', error);
            showMessage('Failed to clear all data: ' + error.message, 'error');
        }
    });
}

function confirmClearCertificates() {
    console.log('🗑️ Clear Certificates button clicked');
    showPasswordDialog('Certificates', async () => {
        console.log('✅ Password verified, starting clear certificates...');
        try {
            await clearAllCertificates();
        } catch (error) {
            console.error('❌ Error in clearAllCertificates:', error);
            showMessage('Failed to clear certificates: ' + error.message, 'error');
        }
    });
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showRestoreModal() {
    const modal = document.getElementById('restoreModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeRestoreModal() {
    const modal = document.getElementById('restoreModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        const form = document.getElementById('restoreForm');
        if (form) {
            form.reset();
        }
    }
}

// ==================== ONLINE/OFFLINE HANDLING ====================

function handleOnline() {
    
    showMessage('Connection restored. Syncing pending changes...', 'info');
    
    // Sync pending changes when back online
    setTimeout(async () => {
        await syncPendingChanges();
        // Reload data to get latest from backend
        if (typeof loadMembers === 'function') await loadMembers();
        if (typeof loadCertificates === 'function') await loadCertificates();
    }, 1000);
}

function handleOffline() {
    
    showMessage('Connection lost. Working in offline mode. Changes will sync when online.', 'warning');
}

function updateConnectionStatus() {
    const statusIndicator = document.querySelector('.connection-indicator');
    const statusText = document.querySelector('.connection-text');
    
    if (statusIndicator && statusText) {
        if (navigator.onLine) {
            statusIndicator.classList.remove('offline');
            statusText.textContent = 'Online';
        } else {
            statusIndicator.classList.add('offline');
            statusText.textContent = 'Offline';
        }
    }
}

// ==================== AUTO-SYNC FUNCTIONS ====================

async function autoSync() {
    if (!navigator.onLine) {
        
        return;
    }
    
    const pendingSync = getPendingSync();
    const hasPendingChanges = 
        pendingSync.memberCreations.length > 0 ||
        pendingSync.memberUpdates.length > 0 ||
        pendingSync.memberDeletions.length > 0 ||
        pendingSync.certificateCreations.length > 0 ||
        pendingSync.certificateUpdates.length > 0;
    
    if (hasPendingChanges) {
        
        await syncPendingChanges();
    }
}

// Set up auto-sync interval (every 30 seconds when online)
function setupAutoSync() {
    setInterval(autoSync, 30000);
}

// ==================== IMPORT/EXPORT FUNCTIONS ====================

// ---- Existing members helpers (dedupe / upsert locally) ----
function getLocalMembersArray(){
  try { return Array.isArray(window.members) ? window.members : []; } catch(_) { return []; }
}
function buildExistingMemberIndex(){
  const byCode = Object.create(null);
  const byEmail = Object.create(null);
  const arr = getLocalMembersArray();
  for (const m of arr){
    const code = (m && (m.code || m.Code || m.regNo || m.RegNo || m['Reg No'])) || '';
    const email = (m && (m.email || m.Email)) || '';
    if (code) byCode[String(code).toLowerCase()] = m;
    if (email) byEmail[String(email).toLowerCase()] = m;
  }
  return { byCode, byEmail, base: arr };
}



// ===== Import Progress UI (members & certificates) + Cancel Support =====
window.__importProgress = { done:0, total:0, label:'' };
window.__importCancel = false;
window.__importAbortController = null;

function ensureImportProgressUI() {
  var status = document.getElementById('importStatus');
  if (!status) {
    var modalBody = document.querySelector('#importModal .modal-body') || document.body;
    status = document.createElement('div');
    status.id = 'importStatus';
    modalBody.appendChild(status);
  }
  if (!document.getElementById('importProgress')) {
    var barWrap = document.createElement('div');
    barWrap.id = 'importProgress';
    barWrap.style.cssText = 'width:100%;background:#eee;border-radius:6px;overflow:hidden;height:12px;margin-top:8px;';
    var inner = document.createElement('div');
    inner.id = 'importProgressInner';
    inner.style.cssText = 'width:0%;height:100%;background:#17a2b8;transition:width .2s;';
    barWrap.appendChild(inner);
    status.appendChild(barWrap);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;justify-content:space-between;margin-top:6px;';

    var text = document.createElement('small');
    text.id = 'importProgressText';
    text.textContent = '0%';
    text.style.cssText = 'display:inline-block;';
    row.appendChild(text);

    var btn = document.createElement('button');
    btn.id = 'importCancelBtn';
    btn.type = 'button';
    btn.textContent = 'Cancel';
    btn.style.cssText = 'padding:4px 10px;border:1px solid #dc3545;background:#dc3545;color:#fff;border-radius:4px;cursor:pointer;';
    btn.onclick = function(){
      if (typeof window.cancelImport === 'function') window.cancelImport();
    };
    row.appendChild(btn);

    status.appendChild(row);
  }
}

function updateImportProgress(done, total, label) {
  window.__importProgress = { done: done||0, total: total||0, label: label||'' };
  var inner = document.getElementById('importProgressInner');
  var txt = document.getElementById('importProgressText');
  if (!inner || !txt) return;
  var pct = total ? Math.floor((done/total)*100) : 0;
  inner.style.width = pct + '%';
  txt.textContent = (label ? label + ' - ' : '') + pct + '% (' + done + '/' + total + ')';
}

function resetImportProgress() {
  window.__importProgress = { done:0, total:0, label:'' };
  window.__importCancel = false;
  var inner = document.getElementById('importProgressInner');
  var txt = document.getElementById('importProgressText');
  var btn = document.getElementById('importCancelBtn');
  if (inner) inner.style.width = '0%';
  if (txt) txt.textContent = '0%';
  if (btn) { btn.disabled = false; btn.textContent = 'Cancel'; btn.style.opacity = '1'; }
}

window.cancelImport = function(){
  window.__importCancel = true;
  var btn = document.getElementById('importCancelBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Cancelling…'; btn.style.opacity = '0.6'; }
  try { if (window.__importAbortController) window.__importAbortController.abort(); } catch(e){}
  // keep progress percentage as-is, just change the label
  var p = window.__importProgress || {done:0,total:1};
  updateImportProgress(p.done, p.total, 'Cancelling');
};

function finishImportProgress(state) {
  var btn = document.getElementById('importCancelBtn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
  var p = window.__importProgress || {done:0,total:1};
  var label = (state === 'cancelled') ? 'Cancelled' : 'Done';
  updateImportProgress(p.total, p.total, label);
}
function resolveImportType() {
  try {
    // 1) Checked radio: <input type="radio" name="importType" value="members|certificates">
    var r = document.querySelector('#importModal input[name="importType"]:checked') 
         || document.querySelector('input[name="importType"]:checked');
    if (r && r.value) return String(r.value).toLowerCase();

    // 2) Select element: <select id="importType"> or name="importType"
    var s = document.getElementById('importType') 
         || document.querySelector('#importModal select[name="importType"]')
         || document.querySelector('select[name="importType"]');
    if (s && typeof s.value !== 'undefined') return String(s.value).toLowerCase();

    // 3) Data attribute on a trigger button in modal
    var btn = document.querySelector('#importModal [data-import-type]') 
           || document.querySelector('[data-import-type]');
    if (btn && btn.dataset && btn.dataset.importType) {
      return String(btn.dataset.importType).toLowerCase();
    }

    // 4) Global variable (guard against ID globals returning element objects)
    if (typeof window.importType !== 'undefined' && typeof window.importType === 'string') {
      return String(window.importType).toLowerCase();
    }

    // Fallback
    return 'members';
  } catch (_) {
    return 'members';
  }
}
async function importData(){
  try {
    // Determine import type robustly (radios, select, data-attr, or global string)
    var type = resolveImportType();
    if (type && type.indexOf('[object ') === 0) type = 'members'; // safety
    if (type.includes('member')) type = 'members';
    else if (type.includes('cert')) type = 'certificates';

    // Resolve file input
    var fileInput = document.getElementById('csvFileInput')
                  || document.querySelector('#importModal input[type="file"]')
                  || document.querySelector('input[type="file"][name="csvFile"]')
                  || document.querySelector('input[type="file"][accept*="csv"]');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      if (typeof showMessage === 'function') showMessage('Please choose a CSV file to import.', 'warning');
      return;
    }

    var file = fileInput.files[0];

    // Prep progress UI
    if (typeof ensureImportProgressUI === 'function') ensureImportProgressUI();
    if (typeof resetImportProgress === 'function') resetImportProgress();
    if (typeof updateImportProgress === 'function') updateImportProgress(0, 1, 'Preparing');

    // Prepare cancel infra for this run
    window.__importAbortController = ('AbortController' in window) ? new AbortController() : null;
    window.__importCancel = false;

    // Read file
    var reader = new FileReader();
    reader.onload = async function(e){
      try {
        var csvText = e.target.result;
        var rows = (typeof parseCSV === 'function') ? parseCSV(csvText) : [];
        if (!rows || !rows.length) {
          if (typeof showMessage === 'function') showMessage('No valid data found in CSV.', 'warning');
          if (typeof finishImportProgress === 'function') finishImportProgress('cancelled');
          return;
        }

        // Optional header normalization
        var normalized = (typeof normalizeRows === 'function') ? normalizeRows(rows, type) : rows;

        // Dispatch
        if (type === 'members') {
          if (typeof importMembersData === 'function') await importMembersData(normalized, true);
          else if (typeof showMessage === 'function') showMessage('importMembersData() not found', 'error');
        } else if (type === 'certificates') {
          if (typeof importCertificateData === 'function') await importCertificateData(normalized, true);
          else if (typeof showMessage === 'function') showMessage('importCertificateData() not found', 'error');
        } else {
          if (typeof showMessage === 'function') showMessage('Unknown import type: ' + String(type), 'error');
          if (typeof finishImportProgress === 'function') finishImportProgress('cancelled');
          return;
        }

        if (typeof finishImportProgress === 'function') finishImportProgress('done');
        if (typeof showMessage === 'function') showMessage((type === 'members' ? 'Members' : 'Certificates') + ' imported successfully!', 'success');

      } catch (err) {
        if (typeof finishImportProgress === 'function') finishImportProgress('cancelled');
        console.error('CSV Import Error:', err);
        if (typeof showMessage === 'function') showMessage('Failed to import CSV: ' + (err && err.message ? err.message : String(err)), 'error');
      }
    };
    reader.onerror = function(){
      if (typeof finishImportProgress === 'function') finishImportProgress('cancelled');
      if (typeof showMessage === 'function') showMessage('Failed to read CSV file.', 'error');
    };
    reader.readAsText(file);
  } catch (e) {
    if (typeof finishImportProgress === 'function') finishImportProgress('cancelled');
    console.error('CSV Import Error:', e);
    if (typeof showMessage === 'function') showMessage('Failed to import CSV: ' + (e && e.message ? e.message : String(e)), 'error');
  }
}


async function importMembersData(parsedData, withProgress = false) {
  let existingMember = undefined; // placeholder to avoid ReferenceError

  console.log('Importing members data...');

  // Ensure the local list exists
  window.members = Array.isArray(window.members) ? window.members : [];
  if (typeof enforceMembersAlpha === 'function') enforceMembersAlpha();

  const newMembers = [];
  const errors = [];
  const total = Array.isArray(parsedData) ? parsedData.length : 0;

  // Abort support (for the Cancel button)
  const controller =
    (window.__importAbortController && ('signal' in (window.__importAbortController || {})))
      ? window.__importAbortController
      : (typeof AbortController !== 'undefined' ? new AbortController() : null);
  let cancelled = false;

  // Local duplicate index (by code/email)
  const idx = (typeof buildExistingMemberIndex === 'function')
    ? buildExistingMemberIndex()
    : (function () {
        const byCode = Object.create(null), byEmail = Object.create(null);
        for (const m of window.members) {
          const c = String((m && (m.code || m.Code)) || '').trim().toLowerCase();
          const e = String((m && (m.email || m.Email)) || '').trim().toLowerCase();
          if (c) byCode[c] = m;
          if (e) byEmail[e] = m;
        }
        return { byCode, byEmail, base: window.members };
      })();

  let updatedLocal = 0, skippedDup = 0, updatedBackend = 0;

  // Build a quick index of known member IDs for backend updates
  const idByCode = Object.create(null);
  const idByEmail = Object.create(null);
  try {
    for (const m of idx.base) {
      const code = String((m && (m.code || m.Code)) || '').trim().toLowerCase();
      const email = String((m && (m.email || m.Email)) || '').trim().toLowerCase();
      const id = (m && (m._id || m.id));
      if (id) {
        if (code) idByCode[code] = id;
        if (email) idByEmail[email] = id;
      }
    }
    // If we have no IDs, try to fetch once from backend to enrich map
    if (navigator.onLine && Object.keys(idByCode).length === 0 && Object.keys(idByEmail).length === 0) {
      try {
        const r = await fetch(String(backendUrl) + '/api/users/getUsers');
        if (r.ok) {
          const arr = await tryJson(r);
          if (Array.isArray(arr)) {
            for (const m of arr) {
              const code = String((m && m.code) || '').trim().toLowerCase();
              const email = String((m && m.email) || '').trim().toLowerCase();
              const id = (m && (m._id || m.id));
              if (id) {
                if (code) idByCode[code] = id;
                if (email) idByEmail[email] = id;
              }
            }
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  if (withProgress) {
    if (typeof ensureImportProgressUI === 'function') ensureImportProgressUI();
    if (typeof updateImportProgress === 'function') updateImportProgress(0, total, 'Importing members');
  }

  for (let i = 0; i < total; i++) {
    if (window.__importCancel) { cancelled = true; break; }

    const row = parsedData[i];
    const rowNumber = i + 2; // +2: CSV header + 0-indexed array

    try {
      // Validate required fields
      if (!row || !row.Name || !row.Code || !row.State || !row.Zone) {
        errors.push('Row ' + rowNumber + ': Missing required fields (Name, Code, State, Zone)');
        if (withProgress && typeof updateImportProgress === 'function') {
          updateImportProgress(i + 1, total, 'Importing members');
        }
        continue;
      }

      const codeUpper = String(row.Code).trim().toUpperCase();
      const codeKey   = codeUpper.toLowerCase();
      const emailTrim = row.Email ? String(row.Email).trim() : '';
      const emailKey  = emailTrim.toLowerCase();

      // Local duplicate check (by code or email)
      const dup = (codeKey && idx.byCode[codeKey]) || (emailKey && idx.byEmail[emailKey]);
      if (dup) {
        // Upsert locally so the table reflects new data
        dup.name     = String(row.Name).trim() || dup.name;
        dup.email    = emailTrim || dup.email;
        dup.code     = codeUpper || dup.code;
        dup.position = (row.Position ? String(row.Position) : (dup.position || 'MEMBER')).toUpperCase();
        dup.state    = String(row.State).trim() || dup.state;
        dup.zone     = String(row.Zone).trim() || dup.zone;
        if (row.Password) dup.password = row.Password;

        // Activity log: member updated via import
        try { if (typeof logMemberUpdate === 'function') logMemberUpdate(dup); } catch (_) {}

        // Queue backend update (avoid 404 on missing _id during import)
        try {
          let memberId = dup._id || dup.id || idByCode[codeKey] || idByEmail[emailKey];
          if (!memberId && typeof dup.code === 'string') memberId = idByCode[String(dup.code).trim().toLowerCase()];
          if (!memberId && typeof dup.email === 'string') memberId = idByEmail[String(dup.email).trim().toLowerCase()];
          if (typeof queueMemberUpdate === 'function') {
            queueMemberUpdate({
              _id: memberId,
              name: dup.name, email: dup.email, code: dup.code,
              position: dup.position, state: dup.state, zone: dup.zone
            });
            updatedBackend++; // counts as queued backend update
          }
        } catch (e) {
          errors.push('Row ' + rowNumber + ': Update error - ' + e.message);
        }

        updatedLocal++;
        skippedDup++;

        if (withProgress && typeof updateImportProgress === 'function') {
          updateImportProgress(i + 1, total, 'Updating duplicates');
        }
        continue;
      }

      // Build the member object to send/store
      const member = {
        name: String(row.Name).trim(),
        email: emailTrim,
        code: codeUpper,
        position: (row.Position || 'MEMBER').toString().toUpperCase(),
        state: String(row.State).trim(),
        zone: String(row.Zone).trim(),
        password: row.Password || (typeof generateDefaultPassword === 'function' ? generateDefaultPassword() : 'Password@123'),
        dateAdded: new Date().toISOString(),
        cardGenerated: false
      };

      // Try network create; fall back to keeping it locally if it fails
      let created = null;
      try {
        const baseUrl = (typeof backendUrl !== 'undefined' && backendUrl) ? backendUrl : 'https://narap-backend.onrender.com';
        const url = baseUrl + '/api/users/addUser';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(member),
          signal: controller ? controller.signal : undefined
        });

        if (res.ok) {
          const json = await tryJson(res);
          created = (json && (json.data || json.user || json.result)) || member;
        } else {
          let msg = '';
          try { const err = await tryJson(res); msg = (err && err.message) || ''; } catch (_) {}
          if (/exists/i.test(msg)) {
            // Server says duplicate -> keep locally so user still sees it
            created = member;
            errors.push('Row ' + rowNumber + ': ' + msg);
          } else {
            errors.push('Row ' + rowNumber + ': ' + (msg || ('HTTP ' + res.status)));
          }
        }
      } catch (e) {
        if (window.__importCancel || (e && (e.name === 'AbortError' || /aborted/i.test(String(e))))) {
          cancelled = true;
          break;
        }
        errors.push('Row ' + rowNumber + ': Network error - ' + e.message);
        created = member; // keep locally
      }

      if (created) {
        newMembers.push(created);
        // Activity log: member added via import
        try { if (typeof logMemberAdd === 'function') logMemberAdd(created); } catch (_) {}

        // Update indices so later rows see the new addition
        idx.byCode[codeKey] = created;
        if (emailKey) idx.byEmail[emailKey] = created;
      }

      if (withProgress && typeof updateImportProgress === 'function') {
        updateImportProgress(i + 1, total, 'Importing members');
      }

    } catch (err) {
      errors.push('Row ' + rowNumber + ': ' + (err && err.message ? err.message : 'Unknown error'));
      if (withProgress && typeof updateImportProgress === 'function') {
        updateImportProgress(i + 1, total, 'Importing members');
      }
    }
  }

  // Merge newly created/kept members into the main list
  if (newMembers.length) {
    window.members = Array.isArray(window.members)
      ? [...window.members, ...newMembers]
      : [...newMembers];
  }

  // If 'updatedMembers' array exists from import, merge it too (by id/code/email)
  try {
    if (typeof updatedMembers !== 'undefined' && Array.isArray(updatedMembers) && updatedMembers.length) {
      const toMerge = Array.from(updatedMembers);
      const byKey = new Map();
      const keyOf = function (m) {
        const id = m && (m._id || m.id);
        if (id) return 'id:' + id;
        const c = String((m && m.code) || '').trim().toLowerCase();
        if (c) return 'c:' + c;
        const e = String((m && m.email) || '').trim().toLowerCase();
        if (e) return 'e:' + e;
        return null;
      };
      (Array.isArray(window.members) ? window.members : []).forEach(function (m) {
        const k = keyOf(m);
        if (k && !byKey.has(k)) byKey.set(k, m);
      });
      toMerge.forEach(function (m) {
        const k = keyOf(m);
        if (!k) return;
        const prev = byKey.get(k);
        byKey.set(k, prev ? Object.assign({}, prev, m) : m);
      });
      window.members = Array.from(byKey.values());
      window.currentMembers = window.members;
      if (typeof saveLocalMembers === 'function') saveLocalMembers(window.members);
    }
  } catch (e) {
    console.warn('Post-import merge updatedMembers failed:', e);
  }

  // ---- Persist + refresh UI so user immediately sees imported/updated rows ----
  try {
    // De-duplicate by stable key (id, code, email) in case window.members has overlaps
    const keyOf2 = function (m) {
      if (!m) return null;
      const id = (m._id || m.id);
      if (id) return 'id:' + id;
      const c = String((m && m.code) || '').trim().toLowerCase();
      if (c) return 'c:' + c;
      const e = String((m && m.email) || '').trim().toLowerCase();
      if (e) return 'e:' + e;
      return null;
    };
    const seen = new Set();
    const list = [];
    (Array.isArray(window.members) ? window.members : []).forEach(function (m) {
      const k = keyOf2(m);
      if (!k || !seen.has(k)) { if (k) seen.add(k); list.push(m); }
    });

    // Persist + expose
    window.members = list;
    window.currentMembers = list;
    if (typeof saveLocalMembers === 'function') saveLocalMembers(list);

    // Refresh activity panel after import
    try { if (typeof loadRecentActivity === 'function') { setTimeout(loadRecentActivity, 0); } } catch (_) {}
    try { if (typeof updateActivityOverlayVisibility === 'function') { setTimeout(updateActivityOverlayVisibility, 0); } } catch (_) {}

    // UI refresh (prefer filters -> loader -> direct render)
    if (typeof refreshMembersUI === 'function') {
      refreshMembersUI();
    } else if (typeof loadMembers === 'function') {
      const per = Number(window.membersPerPage || localStorage.getItem('narap_members_per_page') || 10) || 10;
      try { await loadMembers(1, per); } catch (_) {}
    }
  } catch (e) {
    console.error('Post-import commit error:', e);
  }

  if (withProgress && typeof finishImportProgress === 'function') {
    try { finishImportProgress(cancelled ? 'cancelled' : 'done'); } catch (_) {}
  }

  // Optional extra load (if your UI expects it)
  if (typeof loadMembers === 'function') {
    try { await loadMembers(); } catch (_) {}
  }

  // Toast
  if (errors.length) {
    console.error('Import errors:', errors);
    if (typeof showMessage === 'function') {
      showMessage('Import completed with ' + errors.length + ' issue(s). Check console.', 'warning');
    }
  } else {
    if (typeof showMessage === 'function') {
      showMessage(
        'Import finished - Created: ' + newMembers.length +
        ' - Updated (backend): ' + updatedBackend +
        ' - Updated (local): ' + updatedLocal +
        ' - Duplicates skipped: ' + skippedDup +
        ' - Errors: ' + errors.length,
        'success'
      );
    }
  }

  // Summary log
  try {
    const msg = 'New: ' + newMembers.length +
                ' - Updated (local): ' + updatedLocal +
                ' - Duplicates skipped: ' + skippedDup;
    console.log('Import summary:', msg);
  } catch (_) {}
}


function parseCSV(csvString) {
    const lines = csvString.split('\n');
    if (lines.length === 0) return [];
    
    // Extract headers (first line)
    const headers = lines[0].split(',').map(header => header.trim());
    
    console.log('📋 CSV Headers:', headers);
    
    // Process remaining lines
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        // Handle quoted values and commas within quotes
        const values = parseCSVLine(lines[i]);
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        
        // Only add rows that have at least some data
        const hasData = Object.values(row).some(value => value && value.trim() !== '');
        if (hasData) {
            result.push(row);
        }
    }
    
    console.log(`📊 Parsed ${result.length} rows from CSV`);
    return result;
}

// Normalize parsed rows headers to expected keys (case-insensitive, common variants)
function normalizeRows(rows, type) {
  const canon = (s)=> (s||'').toString().trim().toLowerCase();
  const keyMapMembers = {
    'Name': ['name','full name','member name'],
    'Email': ['email','e-mail','mail'],
    'Code': ['code','member code','membership code','reg no','regno','reg no.'],
    'Position': ['position','role'],
    'State': ['state','state name','st'],
    'Zone': ['zone','region','zonal'],
    'Password': ['password','pass']
  };
  const keyMapCerts = {
    'Certificate Number': ['certificate number','cert #','cert number','number','no','certificate no','certificate no.'],
    'Recipient': ['recipient','name','full name','member name'],
    'Email': ['email','e-mail','mail'],
    'Title': ['title','certificate title','course title'],
    'Type': ['type','category'],
    'Status': ['status','state'],
    'Issue Date': ['issue date','date issued','issued on','date'],
    'Issued By': ['issued by','issuer','authorized by']
  };
  const remap = (row, map) => {
    const out = {}; 
    const entries = Object.entries(row||{});
    for (const [k,v] of entries) {
      const lk = canon(k);
      let matched = false;
      for (const target in map) {
        const aliases = map[target];
        if (aliases.some(a=>lk===canon(a))) { out[target] = v; matched = true; break; }
      }
      if (!matched) out[k] = v;
    }
    return out;
  };
  const map = (type==='certificates') ? keyMapCerts : keyMapMembers;
  return (rows||[]).map(r=>remap(r,map));
}

// Helper function to parse CSV line with proper quote handling
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    result.push(current);
    
    return result;
}

async function importCertificateData(parsedData, withProgress) {
  withProgress = !!withProgress;

  const errors = [];
  const created = [];
  const updated = [];
  const total = Array.isArray(parsedData) ? parsedData.length : 0;

  // Progress UI (guarded)
  try {
    if (withProgress && typeof ensureImportProgressUI === 'function') ensureImportProgressUI();
    if (withProgress && typeof updateImportProgress === 'function') updateImportProgress(0, total, 'Importing certificates');
  } catch (_) {}

  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    if (typeof showMessage === 'function') showMessage('No certificate rows to import', 'warning');
    return { created: 0, updated: 0, errors };
  }

  // pick(row, ...aliases) — supports varargs OR a single array of aliases
  function pick(row) {
    var aliases = Array.prototype.slice.call(arguments, 1);
    if (aliases.length === 1 && Array.isArray(aliases[0])) aliases = aliases[0];
    for (var i = 0; i < aliases.length; i++) {
      var k = aliases[i];
      if (Object.prototype.hasOwnProperty.call(row, k)) {
        var v = row[k];
        if (v != null && String(v).trim() !== '') return v;
      }
    }
    return null;
  }

  // Local index by certificate number for dup/PUT logic
  var local = [];
  try { local = (typeof getLocalCertificates === 'function') ? (getLocalCertificates() || []) : []; } catch (_) {}
  var byNumber = Object.create(null);
  for (var i = 0; i < local.length; i++) {
    var nn = String(local[i].certificateNumber || local[i].number || '').trim().toLowerCase();
    if (nn) byNumber[nn] = local[i];
  }

  for (var r = 0; r < parsedData.length; r++) {
    var row = parsedData[r] || {};
    var rowNumber = r + 2; // header + 0-index

    try {
      // Requireds (+aliases)
      var number = pick(row, 'Certificate Number','certificateNumber','Number','number','Cert Number','CertNumber','CertificateID');
      var recipientName = pick(row, 'Recipient Name','recipientName','Member Name','memberName','Recipient','Name','name');
      var title = pick(row, 'Certificate Title','certificateTitle','Title','title');
      var issueRaw = pick(row, 'Issue Date','issueDate','Issued Date','Issued','Date Issued','Date');

      // Optionals
      var issuedBy = pick(row, 'Issued By','issuedBy','Author','author','Issuer','issuer');
      var email = pick(row, 'Email','email');
      var memberCode = pick(row, 'Code','code','Member Code','memberCode');
      var typeRaw = pick(row, 'Type','type');
      var statusRaw = pick(row, 'Status','status');
      var validRaw = pick(row, 'Valid Until','validUntil','Expiry Date','expiryDate','Expires','Expiration','Expiration Date');

      // Normalize requireds
      number = number == null ? '' : String(number).trim();
      recipientName = recipientName == null ? '' : String(recipientName).trim();
      title = title == null ? '' : String(title).trim();

      if (!number || !recipientName || !title || !issueRaw) {
        errors.push('Row ' + rowNumber + ': Missing required fields (Certificate Number, Recipient Name, Certificate Title, Issue Date)');
        if (withProgress && typeof updateImportProgress === 'function') updateImportProgress(r + 1, total, 'Skipping invalid rows');
        continue;
      }

      // Date normalization
      function _toISO(s) {
        if (typeof toISODate === 'function') return toISODate(s);
        var d = new Date(String(s));
        return isNaN(d) ? null : d.toISOString().slice(0, 10);
      }

      var issueDateISO = _toISO(issueRaw);
      if (!issueDateISO) {
        errors.push('Row ' + rowNumber + ': Invalid Issue Date "' + issueRaw + '". Use YYYY-MM-DD.');
        if (withProgress && typeof updateImportProgress === 'function') updateImportProgress(r + 1, total, 'Skipping invalid rows');
        continue;
      }

      var validUntilISO = null;
      if (validRaw != null && String(validRaw).trim() !== '') {
        validUntilISO = _toISO(validRaw);
        if (!validUntilISO) {
          // Optional: omit but record a warning
          errors.push('Row ' + rowNumber + ': Invalid Expiry/Valid-Until "' + validRaw + '". Field was omitted.');
        }
      }

      // Other fields
      var type = typeRaw ? String(typeRaw).trim().toLowerCase() : '';
      var status = statusRaw ? String(statusRaw).trim().toLowerCase() : 'active';

      // Payload (include both legacy and new keys for compatibility)
      var payload = {
        certificateNumber: number,
        number: number,
        recipientName: recipientName,
        recipient: recipientName,
        certificateTitle: title,
        title: title,
        type: type || 'membership',
        status: status || 'active',
        issuedBy: issuedBy ? String(issuedBy).trim() : '',
        email: email ? String(email).trim() : '',
        memberCode: memberCode ? String(memberCode).trim().toUpperCase() : '',
        issueDate: issueDateISO
      };
      if (validUntilISO) payload.validUntil = validUntilISO;

      // Dup by number
      var key = number.toLowerCase();
      var dup = byNumber[key];

      // Backend create/update
      var ok = false;
      try {
        var base = (typeof backendUrl !== 'undefined' ? backendUrl : '').replace(/\/+$/,'');
        var url = base + '/api/certificates';
        var method = 'POST';
        if (dup && (dup._id || dup.id)) {
          url = base + '/api/certificates/' + (dup._id || dup.id);
          method = 'PUT';
        }
        var res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          ok = true;
        } else {
          var err = (typeof tryJson === 'function') ? await tryJson(res) : null;
          var msg = (err && err.message) ? err.message : ('HTTP ' + res.status);
          errors.push('Row ' + rowNumber + ': ' + msg);
        }
      } catch (netErr) {
        errors.push('Row ' + rowNumber + ': Network error - ' + (netErr && netErr.message ? netErr.message : String(netErr)));
      }

      // Local commit on success or offline fallback
      if (ok || !navigator.onLine) {
        var obj = Object.assign({}, dup || {}, payload);
        if (validUntilISO) obj.validUntil = validUntilISO;

        if (dup) updated.push(number); else created.push(number);

        try {
          var current = (typeof getLocalCertificates === 'function') ? (getLocalCertificates() || []) : [];
          var replaced = false;
          for (var j = 0; j < current.length; j++) {
            var jj = String(current[j].certificateNumber || current[j].number || '').trim().toLowerCase();
            if (jj === key) {
              current[j] = Object.assign({}, current[j], obj);
              replaced = true;
              break;
            }
          }
          if (!replaced) current.push(obj);
          if (typeof saveLocalCertificates === 'function') saveLocalCertificates(current);
        } catch (_) {}
      }

      if (withProgress && typeof updateImportProgress === 'function') {
        updateImportProgress(r + 1, total, 'Importing certificates');
      }
    } catch (rowErr) {
      errors.push('Row ' + rowNumber + ': ' + (rowErr && rowErr.message ? rowErr.message : 'Unknown error'));
      if (withProgress && typeof updateImportProgress === 'function') {
        updateImportProgress(r + 1, total, 'Importing certificates');
      }
    }
  }

  // Post-import UI refresh
  try {
    if (typeof loadRecentActivity === 'function') setTimeout(loadRecentActivity, 0);
    if (typeof updateActivityOverlayVisibility === 'function') setTimeout(updateActivityOverlayVisibility, 0);
  } catch (_) {}

  try {
    if (typeof loadCertificates === 'function') await loadCertificates();
  } catch (_) {}

  // Final message
  try {
    if (errors.length) {
      console.error('Certificate import errors:', errors);
      if (typeof showMessage === 'function') showMessage('Certificate import finished with ' + errors.length + ' issue(s). Check console.', 'warning');
    } else {
      if (typeof showMessage === 'function') showMessage('Certificates imported — Created: ' + created.length + ' • Updated: ' + updated.length, 'success');
    }
  } catch (_) {}

  return { created: created.length, updated: updated.length, errors };
}



function downloadSampleCSV() {
  const importType = document.getElementById('importType')?.value || 'certificatess';
  
  if (importType === 'members') {
    const sampleData = [
      { Name: 'John Doe', Email: 'john@example.com', Code: 'NARAP001', Position: 'MEMBER', State: 'LAGOS', Zone: 'South West', Password: 'password123' },
      { Name: 'Jane Smith', Email: 'jane@example.com', Code: 'NARAP002', Position: 'SECRETARY', State: 'FCT', Zone: 'North Central', Password: 'password123' },
      { Name: 'Mike Johnson', Email: 'mike@example.com', Code: 'NARAP003', Position: 'TREASURER', State: 'KANO', Zone: 'North West', Password: 'password123' }
    ];
    const csvContent = convertToCSV(sampleData);
    downloadFile(csvContent, 'sample_certificates.csv', 'text/csv');
    showMessage('Sample certificates CSV downloaded!', 'success');

  } else if (importType === 'certificates') {
    // Must match backend importer headers exactly:
    // Certificate Number, Recipient, Email, Title, Type, Status, Issue Date, Valid Until, Issued By
    const sampleData = [
      {
        "Certificate Number": "NARAP-CERT-0001",
        "Recipient": "John Doe",
        "Email": "john@example.com",
        "Title": "Membership Certificate",
        "Type": "membership",
        "Status": "active",
        "Issue Date": "2024-01-15",
        "Valid Until": "",
        "Issued By": "NARAP Authority"
      },
      {
        "Certificate Number": "NARAP-CERT-0002",
        "Recipient": "Jane Smith",
        "Email": "jane@example.com",
        "Title": "Membership Certificate",
        "Type": "membership",
        "Status": "active",
        "Issue Date": "2024-02-20",
        "Valid Until": "",
        "Issued By": "NARAP Authority"
      },
      {
        "Certificate Number": "NARAP-CERT-0003",
        "Recipient": "Mike Johnson",
        "Email": "mike@example.com",
        "Title": "Leadership Award",
        "Type": "award",
        "Status": "active",
        "Issue Date": "2024-03-10",
        "Valid Until": "",
        "Issued By": "NARAP Authority"
      }
    ];
    const csvContent = convertToCSV(sampleData);
    downloadFile(csvContent, 'sample_certificates.csv', 'text/csv');
    showMessage('Sample certificates CSV downloaded!', 'success');
  }
}


function generateDefaultPassword() {
    return 'NARAP' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function downloadSampleCSV() {
  var sel = document.getElementById('importType');
  var importType = (sel && sel.value) ? sel.value : 'members';

  if (importType === 'members') {
    var sampleMembers = [
      { Name: 'John Doe', Email: 'john@example.com', Code: 'NARAP001', Position: 'MEMBER', State: 'LAGOS', Zone: 'South West', Password: 'Password@123' },
      { Name: 'Jane Smith', Email: 'jane@example.com', Code: 'NARAP002', Position: 'PRESIDENT', State: 'FCT', Zone: 'North Central', Password: 'Password@123' }
    ];
    var csv1 = convertToCSV(sampleMembers);
    downloadFile(csv1, 'sample_members.csv', 'text/csv');
    if (typeof showMessage === 'function') showMessage('Sample members CSV downloaded!', 'success');
    return;
  }

  // certificates
  var sampleCerts = [
    {
      "Certificate Number": "NARAP-CERT-0001",
      "Recipient": "John Doe",
      "Email": "john@example.com",
      "Title": "Membership Certificate",
      "Type": "membership",
      "Status": "active",
      "Issue Date": "2025-08-16",
      "Valid Until": "",
      "Issued By": "NARAP Authority"
    },
    {
      "Certificate Number": "NARAP-CERT-0002",
      "Recipient": "Jane Smith",
      "Email": "jane@example.com",
      "Title": "Membership Certificate",
      "Type": "membership",
      "Status": "active",
      "Issue Date": "2025-09-01",
      "Valid Until": "",
      "Issued By": "NARAP Authority"
    }
  ];
  var csv2 = convertToCSV(sampleCerts);
  downloadFile(csv2, 'sample_certificates.csv', 'text/csv');
  if (typeof showMessage === 'function') showMessage('Sample certificates CSV downloaded!', 'success');
}

function updateCsvFormat() {
  var sel = document.getElementById('importType');
  var importType = (sel && sel.value) ? sel.value : 'members';
  var helpDiv = document.getElementById('csvFormatHelp');
  if (!helpDiv) return;

  if (importType === 'members') {
    helpDiv.innerHTML =
      '<strong>Required columns:</strong> Name, Code, State, Zone<br/>' +
      '<strong>Optional columns:</strong> Email, Position, Password (auto-generated if missing)<br/>' +
      '<strong>Valid positions:</strong> MEMBER, PRESIDENT, SECRETARY, TREASURER, etc. (must be uppercase)<br/>' +
      '<strong>Example:</strong> Name,Email,Code,Position,State,Zone,Password';
  } else {
    helpDiv.innerHTML =
      '<strong>Required columns:</strong> Certificate Number, Recipient, Issue Date<br/>' +
      '<strong>Optional columns:</strong> Email, Title, Type, Status, Valid Until, Issued By<br/>' +
      '<strong>Date format:</strong> YYYY-MM-DD (ISO). Example: 2025-08-16<br/>' +
      '<strong>Type:</strong> membership (default)<br/>' +
      '<strong>Status:</strong> active (default)<br/>' +
      '<strong>Example:</strong><br/>' +
      'Certificate Number,Recipient,Email,Title,Type,Status,Issue Date,Valid Until,Issued By<br/>' +
      'NARAP-CERT-0001,John Doe,john@example.com,Membership Certificate,membership,active,2025-08-16,,NARAP Authority';
  }
}

async function importCertificateData(parsedData, withProgress) {
  withProgress = !!withProgress;

  const errors = [];
  const created = [];
  const updated = [];
  const total = Array.isArray(parsedData) ? parsedData.length : 0;

  // Progress UI (safe-guarded)
  try {
    if (withProgress && typeof ensureImportProgressUI === 'function') ensureImportProgressUI();
    if (withProgress && typeof updateImportProgress === 'function') updateImportProgress(0, total, 'Importing certificates');
  } catch (_) {}

  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    if (typeof showMessage === 'function') showMessage('No certificate rows to import', 'warning');
    return { created: 0, updated: 0, errors };
  }

  // pick(row, ...aliases) – supports varargs aliases
  function pick(row) {
    var aliases = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < aliases.length; i++) {
      var k = aliases[i];
      if (Object.prototype.hasOwnProperty.call(row, k)) {
        var v = row[k];
        if (v != null && String(v).trim() !== '') return v;
      }
    }
    return null;
  }

  // Local index by number (for upsert logic / local merge)
  var local = [];
  try { local = (typeof getLocalCertificates === 'function') ? (getLocalCertificates() || []) : []; } catch (_) {}
  var byNumber = Object.create(null);
  for (var i = 0; i < local.length; i++) {
    var nn = String(local[i].certificateNumber || local[i].number || '').trim().toLowerCase();
    if (nn) byNumber[nn] = local[i];
  }

  for (var r = 0; r < parsedData.length; r++) {
    var row = parsedData[r] || {};
    var rowNumber = r + 2; // header + 0-index

    try {
      // Requireds (+aliases)
      var number = pick(row, 'Certificate Number', 'certificateNumber', 'Number', 'number', 'Cert Number', 'CertNumber', 'CertificateID');
      var recipientName = pick(row, 'Recipient Name', 'recipientName', 'Member Name', 'memberName', 'Recipient', 'Name', 'name');
      var title = pick(row, 'Certificate Title', 'certificateTitle', 'Title', 'title');
      var issueRaw = pick(row, 'Issue Date', 'issueDate', 'Issued Date', 'Issued', 'Date Issued', 'Date');

      // Optionals
      var issuedBy = pick(row, 'Issued By', 'issuedBy', 'Author', 'author', 'Issuer', 'issuer');
      var email = pick(row, 'Email', 'email');
      var memberCode = pick(row, 'Code', 'code', 'Member Code', 'memberCode');
      var typeRaw = pick(row, 'Type', 'type');
      var statusRaw = pick(row, 'Status', 'status');
      var validRaw = pick(row, 'Valid Until', 'validUntil', 'Expiry Date', 'expiryDate', 'Expires', 'Expiration', 'Expiration Date');

      // Normalize requireds
      number = number == null ? '' : String(number).trim();
      recipientName = recipientName == null ? '' : String(recipientName).trim();
      title = title == null ? '' : String(title).trim();

      if (!number || !recipientName || !title || !issueRaw) {
        errors.push('Row ' + rowNumber + ': Missing required fields (Certificate Number, Recipient Name, Certificate Title, Issue Date)');
        if (withProgress && typeof updateImportProgress === 'function') updateImportProgress(r + 1, total, 'Skipping invalid rows');
        continue;
      }

      // Normalize dates
      var issueDateISO = (typeof toISODate === 'function') ? toISODate(issueRaw) : (new Date(issueRaw).toISOString().slice(0,10));
      if (!issueDateISO) {
        errors.push('Row ' + rowNumber + ': Invalid Issue Date "' + issueRaw + '". Use YYYY-MM-DD.');
        if (withProgress && typeof updateImportProgress === 'function') updateImportProgress(r + 1, total, 'Skipping invalid rows');
        continue;
      }

      var validUntilISO = null;
      if (validRaw != null && String(validRaw).trim() !== '') {
        validUntilISO = (typeof toISODate === 'function') ? toISODate(validRaw) : null;
        if (!validUntilISO) {
          // Expiry/Valid-Until is optional; if invalid, omit but record a warning for visibility
          errors.push('Row ' + rowNumber + ': Invalid Expiry/Valid-Until "' + validRaw + '". Field was omitted.');
        }
      }

      // Normalize other fields
      var type = typeRaw ? String(typeRaw).trim().toLowerCase() : '';
      var status = statusRaw ? String(statusRaw).trim().toLowerCase() : 'active';

      // Build payload with compatibility keys
      var payload = {
        certificateNumber: number,
        number: number, // compatibility
        recipientName: recipientName,
        recipient: recipientName, // compatibility
        certificateTitle: title,
        title: title, // compatibility
        type: type || 'membership',
        status: status || 'active',
        issuedBy: issuedBy ? String(issuedBy).trim() : '',
        email: email ? String(email).trim() : '',
        memberCode: memberCode ? String(memberCode).trim().toUpperCase() : '',
        issueDate: issueDateISO
      };
      if (validUntilISO) payload.validUntil = validUntilISO;

      // Local dup check by number (to decide local merge; server may still handle idempotency)
      var key = number.toLowerCase();
      var dup = byNumber[key];

      // POST (or PUT if you have an id locally)
      var ok = false;
      try {
        var url = backendUrl + '/api/certificates';
        var method = 'POST';
        if (dup && (dup._id || dup.id)) {
          url = backendUrl + '/api/certificates/' + (dup._id || dup.id);
          method = 'PUT';
        }

        var res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          ok = true;
        } else {
          var err = (typeof tryJson === 'function') ? await tryJson(res) : null;
          var msg = (err && err.message) ? err.message : ('HTTP ' + res.status);
          errors.push('Row ' + rowNumber + ': ' + msg);
        }
      } catch (netErr) {
        errors.push('Row ' + rowNumber + ': Network error - ' + (netErr && netErr.message ? netErr.message : String(netErr)));
      }

      // Local commit on success or offline fallback
      if (ok || !navigator.onLine) {
        var obj = Object.assign({}, dup || {}, payload);
        if (validUntilISO) obj.validUntil = validUntilISO;

        // Update local index/storage
        if (dup) {
          updated.push(number);
        } else {
          created.push(number);
        }

        try {
          var current = (typeof getLocalCertificates === 'function') ? (getLocalCertificates() || []) : [];
          var replaced = false;
          for (var j = 0; j < current.length; j++) {
            var jj = String(current[j].certificateNumber || current[j].number || '').trim().toLowerCase();
            if (jj === key) {
              current[j] = Object.assign({}, current[j], obj);
              replaced = true;
              break;
            }
          }
          if (!replaced) current.push(obj);
          if (typeof saveLocalCertificates === 'function') saveLocalCertificates(current);
        } catch (_) {}
      }

      if (withProgress && typeof updateImportProgress === 'function') updateImportProgress(r + 1, total, 'Importing certificates');
    } catch (rowErr) {
      errors.push('Row ' + rowNumber + ': ' + (rowErr && rowErr.message ? rowErr.message : 'Unknown error'));
      if (withProgress && typeof updateImportProgress === 'function') updateImportProgress(r + 1, total, 'Importing certificates');
    }
  }

  // Post-import UI refresh
  try {
    if (typeof loadRecentActivity === 'function') setTimeout(loadRecentActivity, 0);
    if (typeof updateActivityOverlayVisibility === 'function') setTimeout(updateActivityOverlayVisibility, 0);
  } catch (_) {}

  try {
    if (typeof loadCertificates === 'function') await loadCertificates();
  } catch (_) {}

  // Final message
  try {
    if (errors.length) {
      console.error('Certificate import errors:', errors);
      if (typeof showMessage === 'function') showMessage('Certificate import finished with ' + errors.length + ' issue(s). Check console.', 'warning');
    } else {
      if (typeof showMessage === 'function') showMessage('Certificates imported — Created: ' + created.length + ' • Updated: ' + updated.length, 'success');
    }
  } catch (_) {}

  return { created: created.length, updated: updated.length, errors };
}

// Optional: show detailed errors inside the import modal
function showImportErrors(errors) {
  let box = document.getElementById('importErrorsBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'importErrorsBox';
    box.style.maxHeight = '200px';
    box.style.overflowY = 'auto';
    box.style.marginTop = '12px';
    box.style.padding = '10px';
    box.style.border = '1px solid #f5c2c7';
    box.style.background = '#f8d7da';
    box.style.color = '#842029';
    const modalBody = document.querySelector('#importModal .modal-body') || document.body;
    modalBody.appendChild(box);
  }
  box.innerHTML = `<strong>Import Errors (${errors.length}):</strong><br>` +
    errors.map(e => `<div>- ${e}</div>`).join('');
}


function restoreBackup() {
    const fileInput = document.getElementById('restoreFile');
    if (!fileInput || !fileInput.files[0]) {
        showMessage('Please select a backup file to restore', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            showMessage('Restore feature coming soon!', 'info');
            closeRestoreModal();
        } catch (error) {
            showMessage('Invalid backup file format.', 'error');
        }
    };
    
    reader.readAsText(file);
}

// ==================== SYNC STATUS FUNCTIONS ====================

function updateSyncStatus() {
    const pendingSync = getPendingSync();
    const totalPending = 
        pendingSync.memberCreations.length +
        pendingSync.memberUpdates.length +
        pendingSync.memberDeletions.length +
        pendingSync.certificateCreations.length +
        pendingSync.certificateUpdates.length;
    
    // Update sync status in UI if elements exist
    const syncStatusElement = document.getElementById('syncStatus');
    if (syncStatusElement) {
        if (totalPending > 0) {
            syncStatusElement.textContent = `${totalPending} pending changes`;
            syncStatusElement.className = 'sync-status pending';
        } else {
            syncStatusElement.textContent = 'All changes synced';
            syncStatusElement.className = 'sync-status synced';
        }
    }
    
    // Update sync button state
    const syncButton = document.querySelector('[onclick="syncWithBackend()"]');
    if (syncButton) {
        if (totalPending > 0) {
            syncButton.disabled = false;
            syncButton.innerHTML = `<i class="fas fa-sync"></i> Sync (${totalPending})`;
        } else {
            syncButton.disabled = true;
            syncButton.innerHTML = `<i class="fas fa-sync"></i> Synced`;
        }
    }
    
    return totalPending;
}

function showSyncDetails() {
    const pendingSync = getPendingSync();
    const details = [];
    
    if (pendingSync.memberCreations.length > 0) {
        details.push(`${pendingSync.memberCreations.length} new members`);
    }
    if (pendingSync.memberUpdates.length > 0) {
        details.push(`${pendingSync.memberUpdates.length} member updates`);
    }
    if (pendingSync.memberDeletions.length > 0) {
        details.push(`${pendingSync.memberDeletions.length} member deletions`);
    }
    if (pendingSync.certificateCreations.length > 0) {
        details.push(`${pendingSync.certificateCreations.length} new certificates`);
    }
    if (pendingSync.certificateUpdates.length > 0) {
        details.push(`${pendingSync.certificateUpdates.length} certificate updates`);
    }
    
    if (details.length > 0) {
        showMessage(`Pending changes: ${details.join(', ')}`, 'info');
    } else {
        showMessage('No pending changes to sync', 'success');
    }
}

// ==================== INITIALIZATION ====================

// Initialize utility classes
const performanceMonitor = new PerformanceMonitor();
const notificationManager = new NotificationManager();
const dataCache = new DataCache();

// Make functions globally accessible
window.login = login;
window.logout = logout;
window.fillAdminCredentials = fillAdminCredentials;
window.clearLoginForm = clearLoginForm;
window.switchTab = switchTab;
window.toggleSidebar = toggleSidebar;
window.addMember = addMember;
window.loadMembers = loadMembers;
window.loadCertificates = loadCertificates;
window.loadDashboard = loadDashboard;
window.exportMembers = exportMembers;
window.exportCertificates = exportCertificates;
window.exportCertificatesButton = exportCertificatesButton;
window.exportAllData = exportAllData;
window.createBackup = createBackup;
window.clearAllData = clearAllData;
window.clearAllCertificates = clearAllCertificates;
window.syncWithBackend = syncWithBackend;
window.syncPendingChanges = syncPendingChanges;
window.checkPasswordStrength = checkPasswordStrength;
window.testBackendConnection = testBackendConnection;
window.updateBackendUrl = updateBackendUrl;
window.showAddMemberModal = showAddMemberModal;
window.closeAddMemberModal = closeAddMemberModal;
window.showEditMemberModal = showEditMemberModal;
window.closeEditMemberModal = closeEditMemberModal;
window.clearMemberSearch = clearMemberSearch;
window.showImportModal = showImportModal;
window.closeImportModal = closeImportModal;
window.displayMembers = displayMembers;
window.filterMembers = filterMembers;
window.refreshMembers = refreshMembers;
window.deleteMember = deleteMember;
window.editMember = editMember;
window.displayCertificates = displayCertificates;
window.viewCertificate = viewCertificate;
window.downloadCertificate = downloadCertificate;
window.toggleTheme = toggleTheme;
window.showIssueCertificateModal = showIssueCertificateModal;
window.closeIssueCertificateModal = closeIssueCertificateModal;
window.closeViewCertificateModal = closeViewCertificateModal;
window.closeViewIdCardModal = closeViewIdCardModal;
window.refreshCertificates = refreshCertificates;
window.clearCertificateFilters = clearCertificateFilters;
window.generateCertificatePreview = generateCertificatePreview;
window.issueCertificate = issueCertificate;
window.autoFillCertificateFields = autoFillCertificateFields;
window.handleEmailInput = handleEmailInput;
window.printCertificate = printCertificate;
window.generateIdCardPreview = generateIdCardPreview;
window.hideIdCardPreview = hideIdCardPreview;
window.printIdCard = printIdCard;
window.downloadIdCard = downloadIdCard;
window.testServerConnection = testServerConnection;
window.refreshMembersTable = refreshMembersTable;
window.confirmClearAllData = confirmClearAllData;
window.confirmClearCertificates = confirmClearCertificates;
window.closeConfirmModal = closeConfirmModal;
window.showRestoreModal = showRestoreModal;
window.closeRestoreModal = closeRestoreModal;
window.importData = importData;
window.downloadSampleCSV = downloadSampleCSV;
window.restoreBackup = restoreBackup;
        // window.selectAllMembers = selectAllMembers; // Removed - no longer needed
    // window.getSelectedMembers = getSelectedMembers; // Removed - no longer needed
    // window.bulkDeleteMembers = bulkDeleteMembers; // Removed - no longer needed
    // window.bulkExportMembers = bulkExportMembers; // Removed - no longer needed
window.updateMembersCount = updateMembersCount;
window.changeMembersPerPage = changeMembersPerPage;
window.goToMembersPage = goToMembersPage;
window.handleOnline = handleOnline;
window.handleOffline = handleOffline;
window.updateConnectionStatus = updateConnectionStatus;
window.setupAutoSync = setupAutoSync;
window.updateSyncStatus = updateSyncStatus;
window.showSyncDetails = showSyncDetails;
window.loadInitialData = loadInitialData;
window.clearPendingDeletions = clearPendingDeletions;
window.loadDashboard = loadDashboard;
window.loadDashboardStats = loadDashboardStats;
window.loadRecentActivity = loadRecentActivity;
window.loadAnalytics = loadAnalytics;
window.loadSystemPage = loadSystemPage;
window.handleFileUpload = handleFileUpload;
window.handleImageUpload = handleImageUpload;
window.handleCSVUpload = handleCSVUpload;
window.handleJSONUpload = handleJSONUpload;
window.showImagePreview = showImagePreview;
window.clearFileUpload = clearFileUpload;
window.testPassportUpload = testPassportUpload;
window.debugFileUpload = debugFileUpload;
window.getImageUrl = getImageUrl;

// Test function to verify clear buttons are working
function testClearButtons() {
    console.log('🧪 Testing clear buttons...');
    
    // Test if functions are accessible
    console.log('✅ clearAllData function accessible:', typeof clearAllData);
    console.log('✅ clearAllCertificates function accessible:', typeof clearAllCertificates);
    console.log('✅ confirmClearAllData function accessible:', typeof confirmClearAllData);
    console.log('✅ confirmClearCertificates function accessible:', typeof confirmClearCertificates);
    
    // Test if modal elements exist
    const modal = document.getElementById('confirmModal');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');
    const confirmButton = document.getElementById('confirmYes');
    const cancelButton = document.getElementById('confirmNo');
    
    console.log('✅ Modal elements check:', {
        modal: !!modal,
        title: !!title,
        message: !!message,
        confirmButton: !!confirmButton,
        cancelButton: !!cancelButton
    });
    
    // Test if buttons exist in HTML
    const clearAllDataBtn = document.querySelector('button[onclick="confirmClearAllData()"]');
    const clearCertificatesBtn = document.querySelector('button[onclick="confirmClearCertificates()"]');
    
    console.log('✅ HTML buttons check:', {
        clearAllDataBtn: !!clearAllDataBtn,
        clearCertificatesBtn: !!clearCertificatesBtn
    });
    
    // Test modal functionality
    if (modal && title && message && confirmButton && cancelButton) {
        console.log('✅ All modal elements found - testing modal display...');
        showPasswordDialog('Test Action', () => {
            console.log('✅ Modal callback executed successfully');
        });
    } else {
        console.log('❌ Some modal elements missing - check HTML structure');
    }
    
    console.log('🎉 Clear buttons test completed!');
}

// Expose test function
window.testClearButtons = testClearButtons;

// Function to check modal elements on page load
function checkModalElements() {
    console.log('🔍 Checking modal elements on page load...');
    
    const modal = document.getElementById('confirmModal');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');
    const confirmButton = document.getElementById('confirmYes');
    const cancelButton = document.getElementById('confirmNo');
    
    const elements = {
        modal: !!modal,
        title: !!title,
        message: !!message,
        confirmButton: !!confirmButton,
        cancelButton: !!cancelButton
    };
    
    console.log('📋 Modal elements status:', elements);
    
    const allFound = Object.values(elements).every(found => found);
    
    if (allFound) {
        console.log('✅ All modal elements found and ready!');
    } else {
        console.log('❌ Some modal elements missing:', Object.keys(elements).filter(key => !elements[key]));
        console.log('💡 This might cause issues with clear buttons');
    }
    
    return allFound;
}

// Check modal elements when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkModalElements);
} else {
    checkModalElements();
}

// Expose check function
window.checkModalElements = checkModalElements;


// ==================== FILE UPLOAD FUNCTIONS ====================

function handleFileUpload(input, labelId) {
    
    
    const file = input.files[0];
    const label = document.getElementById(labelId);
    
    // Debug information
    debugFileUpload(input, labelId);
    
    if (!file) {
        if (label) {
            label.textContent = 'Choose file';
            label.classList.remove('has-file');
        }
        return;
    }
    
    // Update label with file name
    if (label) {
        label.textContent = file.name;
        label.classList.add('has-file');
    }
    
    // Handle different file types
    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    const isCSV = fileType === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    const isJSON = fileType === 'application/json' || file.name.toLowerCase().endsWith('.json');
    
    if (isImage) {
        // Handle image files (passport photos, signatures)
        handleImageUpload(input, file);
    } else if (isCSV) {
        // Handle CSV files (import)
        handleCSVUpload(input, file);
    } else if (isJSON) {
        // Handle JSON files (backup restore)
        handleJSONUpload(input, file);
    } else {
        showMessage('Unsupported file type. Please select an image, CSV, or JSON file.', 'error');
        input.value = '';
        if (label) {
            label.textContent = 'Choose file';
            label.classList.remove('has-file');
        }
    }
}

function handleImageUpload(input, file) {
    // Validate file size (max 5MB for images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showMessage('Image file is too large. Please select a file smaller than 5MB.', 'error');
        input.value = '';
        return;
    }
    
    // Validate image dimensions
    const img = new Image();
    img.onload = function() {
        const maxWidth = 800;
        const maxHeight = 800;
        
        if (this.width > maxWidth || this.height > maxHeight) {
            showMessage(`Image dimensions are too large. Please select an image smaller than ${maxWidth}x${maxHeight} pixels.`, 'error');
            input.value = '';
            return;
        }
        
        // Show preview for passport photos and signatures
        if (input.id.includes('Passport') || input.id.includes('Signature')) {
            showImagePreview(URL.createObjectURL(file), input.id + 'Preview');
        }
        
        showMessage('Image selected successfully!', 'success');
    };
    
    img.onerror = function() {
        showMessage('Invalid image file. Please select a valid image.', 'error');
        input.value = '';
    };
    
    img.src = URL.createObjectURL(file);
}

function handleCSVUpload(input, file) {
    // Validate file size (max 10MB for CSV)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showMessage('CSV file is too large. Please select a file smaller than 10MB.', 'error');
        input.value = '';
        return;
    }
    
    showMessage('CSV file selected. Click "Import" to process the file.', 'info');
}

function handleJSONUpload(input, file) {
    // Validate file size (max 10MB for JSON)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showMessage('JSON file is too large. Please select a file smaller than 10MB.', 'error');
        input.value = '';
        return;
    }
    
    showMessage('JSON backup file selected. Click "Restore" to process the file.', 'info');
}

function showImagePreview(base64Data, previewId) {
    const previewElement = document.getElementById(previewId);
    if (previewElement) {
        previewElement.src = base64Data;
        previewElement.style.display = 'block';
    }
}

function clearFileUpload(input, labelId) {
    input.value = '';
    const label = document.getElementById(labelId);
    if (label) {
        label.textContent = 'Choose file';
        label.classList.remove('has-file');
    }
    
    // Remove hidden input data
    const hiddenInput = document.querySelector(`input[name="${input.id}Data"]`);
    if (hiddenInput) {
        hiddenInput.remove();
    }
    
    // Clear preview if exists
    const previewId = input.id + 'Preview';
    const previewElement = document.getElementById(previewId);
    if (previewElement) {
        previewElement.style.display = 'none';
        previewElement.src = '';
    }
    
    // Also clear any existing preview images
    const allPreviews = document.querySelectorAll('.passport-preview, .signature-preview');
    allPreviews.forEach(preview => {
        if (preview.id === previewId) {
            preview.style.display = 'none';
            preview.src = '';
        }
    });
}

// ==================== INITIAL DATA LOADING ====================

async function loadInitialData() {
    try {
        
        // Get user's saved pagination preferences
        const savedMembersPerPage = parseInt(localStorage.getItem('narap_members_per_page')) || 10;
        const savedCertificatesPerPage = parseInt(localStorage.getItem('narap_certificates_per_page')) || 10;
        
        // Load members data (this will load from local storage first, then sync with backend)
        if (typeof loadMembers === 'function') {
            await loadMembers(1, savedMembersPerPage);
        }
        
        // Load certificates data
        if (typeof loadCertificates === 'function') {
            await loadCertificates(1, savedCertificatesPerPage);
        }
        
        // Update pagination selectors to reflect saved preferences
        const membersPerPageSelect = document.getElementById('membersPerPage');
        if (membersPerPageSelect) {
            membersPerPageSelect.value = savedMembersPerPage;
        }
        
        const certificatesPerPageSelect = document.getElementById('certificatesPerPage');
        if (certificatesPerPageSelect) {
            certificatesPerPageSelect.value = savedCertificatesPerPage;
        }
        
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        
        // Initialize notification manager container
        if (notificationManager) {
            notificationManager.createContainer();
        }
        
        // Check login state
        const isLoggedIn = localStorage.getItem('narap_logged_in') === 'true';
        const loginSection = document.getElementById('loginSection');
        const adminSection = document.getElementById('adminSection');
        
        if (isLoggedIn) {
            if (loginSection) loginSection.style.display = 'none';
            if (adminSection) adminSection.style.display = 'block';
            
        } else {
            if (loginSection) loginSection.style.display = 'flex';
            if (adminSection) adminSection.style.display = 'none';
            
        }
        
        // Auto-fill admin credentials
        if (typeof fillAdminCredentials === 'function') fillAdminCredentials();
        
        // Initialize theme
        const savedTheme = localStorage.getItem('narap_theme');
        const themeToggle = document.getElementById('themeToggle');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                themeToggle.title = 'Switch to Light Theme';
            }
        }
        
        // Initialize dashboard if logged in
        if (isLoggedIn && typeof loadDashboard === 'function') {
            loadDashboard();
            
            // Load initial data (members and certificates)
            if (typeof loadInitialData === 'function') {
                loadInitialData();
            }
            
            // Switch to dashboard tab by default
            setTimeout(() => {
                switchTab('dashboard');
            }, 100);
        }
        
        // Add event listeners for member selection
        document.addEventListener('change', function(e) {
            if (e.target.name === 'memberSelect') {
                updateMembersCount();
            }
        });

        // Add event listeners for online/offline status
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        updateConnectionStatus(); // Initial check
        
        // Set up auto-sync on page load
        setupAutoSync();
        
        // Update sync status
        updateSyncStatus();
        
        // Set up periodic server status check (every 30 seconds)
        setInterval(async () => {
            if (document.getElementById('serverStatus')) {
                const status = await checkServerStatus();
                updateSystemStat('serverStatus', status);
            }
        }, 30000);
        
        // Initial server status check
        setTimeout(async () => {
            if (document.getElementById('serverStatus')) {
                const status = await checkServerStatus();
                updateSystemStat('serverStatus', status);
            }
        }, 2000);
        
        // Initialize pagination visibility - hide by default
        const membersPaginationContainer = document.getElementById('membersPagination');
        const certificatesPaginationContainer = document.getElementById('certificatesPagination');
        if (membersPaginationContainer) {
            membersPaginationContainer.style.display = 'none';
        }
        if (certificatesPaginationContainer) {
            certificatesPaginationContainer.style.display = 'none';
        }
        
        // Setup pagination event listeners
        setupPaginationEventListeners();
        
        // Load initial data (but don't show pagination yet)
        if (typeof loadInitialData === 'function') loadInitialData();
        
        // Ensure pagination is hidden after initial data load
        setTimeout(() => {
            if (membersPaginationContainer) {
                membersPaginationContainer.style.display = 'none';
            }
            if (certificatesPaginationContainer) {
                certificatesPaginationContainer.style.display = 'none';
            }
        }, 100);
        
        
        
    } catch (error) {
        
    }
}); 

// ==================== UPLOAD TESTING FUNCTIONS ====================

function testPassportUpload() {
    
    
    // Test if file input exists
    const passportInput = document.getElementById('memberPassport');
    if (!passportInput) {
        
        return false;
    }
    
    // Test if label exists
    const passportLabel = document.getElementById('passportLabel');
    if (!passportLabel) {
        
        return false;
    }
    
    // Test if preview element exists
    const passportPreview = document.getElementById('memberPassportPreview');
    if (!passportPreview) {
        
        return false;
    }
    
    
    
    
    
    
    return true;
}

function debugFileUpload(input, labelId) {
    // Debug function for file upload issues
    console.log('Debug file upload:', { input, labelId });
}

// ==================== UTILITY FUNCTIONS ====================

// Enhanced image error handling for member table (similar to verification page)
function handleMemberTableImageError(img, originalUrl, alternativeUrls) {
    console.log('❌ Member table image failed to load:', originalUrl);
    
    if (!alternativeUrls || alternativeUrls.length === 0) {
        console.log('❌ No alternative URLs available, using default avatar');
        img.src = DEFAULT_AVATAR;
        return;
    }
    
    let currentIndex = 0;
    
    function tryNextAlternative() {
        if (currentIndex >= alternativeUrls.length) {
            console.log('❌ All alternative URLs failed, using default avatar');
            img.src = DEFAULT_AVATAR;
            return;
        }
        
        const testUrl = alternativeUrls[currentIndex];
        console.log(`Loading Trying alternative URL ${currentIndex + 1}:`, testUrl);
        
        const testImg = new Image();
        testImg.onload = function() {
            console.log('✅ Alternative URL worked:', testUrl);
            img.src = testUrl;
        };
        testImg.onerror = function() {
            console.log('❌ Alternative URL failed:', testUrl);
            currentIndex++;
            setTimeout(tryNextAlternative, 300); // Faster retry
        };
        testImg.src = testUrl;
    }
    
    // Start trying alternatives immediately
    setTimeout(tryNextAlternative, 100);
}

function getImageUrl(imagePath) {
    console.log('🔍 getImageUrl called with:', imagePath);
    
    if (!imagePath) {
        console.log('❌ No image path provided, using default avatar');
        return DEFAULT_AVATAR;
    }

    // Apply the same robust URL processing logic as verification page
    let validImageUrl = null;
    
    try {
        // Check for full URLs first (including Cloudinary)
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
            validImageUrl = imagePath;
            console.log('✅ Using full URL:', validImageUrl);
        } 
        // Check for relative URLs
        else if (imagePath.startsWith('/')) {
            validImageUrl = `${backendUrl}${imagePath}`;
            console.log('✅ Using relative URL:', validImageUrl);
        } 
        // Check for Cloudinary-style filenames
        else if (imagePath.includes('passportPhoto-') || imagePath.includes('signature-')) {
            const fieldType = imagePath.includes('passportPhoto-') ? 'passportPhoto' : 'signature';
            validImageUrl = `${backendUrl}/api/uploads/${fieldType === 'passportPhoto' ? 'passports' : 'signatures'}/${imagePath}`;
            console.log('✅ Using backend upload endpoint:', validImageUrl);
        } 
        // Check for full paths from Multer upload
        else if (imagePath.includes('uploads/passports/')) {
            const filename = imagePath.split('uploads/passports/').pop();
            validImageUrl = `${backendUrl}/api/uploads/passports/${filename}`;
            console.log('✅ Using extracted passport filename:', validImageUrl);
        }
        else if (imagePath.includes('uploads/signatures/')) {
            const filename = imagePath.split('uploads/signatures/').pop();
            validImageUrl = `${backendUrl}/api/uploads/signatures/${filename}`;
            console.log('✅ Using extracted signature filename:', validImageUrl);
        }
        // Check for absolute paths (Windows or Unix)
        else if (imagePath.includes('\\') || imagePath.includes('/')) {
            const filename = imagePath.split(/[\\/]/).pop();
            validImageUrl = `${backendUrl}/api/uploads/passports/${filename}`;
            console.log('✅ Using extracted filename from absolute path:', validImageUrl);
        }
        // Generic fallback for other filenames
        else {
            validImageUrl = `${backendUrl}/api/uploads/passports/${imagePath}`;
            console.log('✅ Using generic fallback URL:', validImageUrl);
        }
        
        console.log('🎯 Final image URL:', validImageUrl);
        return validImageUrl;
        
    } catch (error) {
        console.log('❌ Error processing image URL:', error);
        return DEFAULT_AVATAR;
    }
}

// Utility function to clean up certificates with null certificate numbers
async function cleanupNullCertificateNumbers() {
    try {
        
        
        const certificates = getLocalCertificates() || [];
        let updated = false;
        
        for (let i = 0; i < certificates.length; i++) {
            const cert = certificates[i];
            if (!cert.number || cert.number.trim() === '' || cert.number === null) {
                
                certificates[i] = {
                    ...cert,
                    number: generateUniqueCertificateNumber(),
                    certificateNumber: cert.certificateNumber || generateUniqueCertificateNumber()
                };
                updated = true;
            }
        }
        
        if (updated) {
            saveLocalCertificates(certificates);
            window.currentCertificates = certificates;
            
            
            // Refresh display if certificates tab is active
            const certificatesPanel = document.getElementById('panel-certificates');
            if (certificatesPanel && certificatesPanel.classList.contains('active')) {
                displayCertificates(certificates);
            }
        }
        
        return updated;
    } catch (error) {
        
        return false;
    }
}

// Call cleanup function on page load
document.addEventListener('DOMContentLoaded', function() {
    // Clean up any existing certificates with null certificate numbers
    setTimeout(() => {
        cleanupNullCertificateNumbers();
    }, 1000);
});

// Function to cleanup database certificates with null certificate numbers
async function cleanupDatabaseCertificates() {
    if (!confirm('This will fix all certificates with null certificate numbers in the database. Continue?')) {
        return;
    }
    
    try {
        showMessage('Cleaning up database certificates...', 'info');
        
        const response = await fetch(`${backendUrl}/api/cleanup-certificates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await tryJson(response);
            showMessage(`✅ ${result.message}`, 'success');
            
            // Refresh certificates display
            await loadCertificates();
            
            // Refresh analytics if on analytics tab
            const analyticsPanel = document.getElementById('panel-analytics');
            if (analyticsPanel && analyticsPanel.classList.contains('active')) {
                loadAnalytics();
            }
        } else {
            const error = await tryJson(response);
            showMessage(`❌ Failed to cleanup certificates: ${error.message}`, 'error');
        }
    } catch (error) {
        
        showMessage('❌ Failed to cleanup certificates: ' + error.message, 'error');
    }
}

// Function to update member passport photo
async function updateMemberPhoto(memberCode) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  
  fileInput.onchange = async function() {
    const file = this.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('passportPhoto', file);
    
    try {
      const response = await fetch(`${backendUrl}/api/updateMemberPhoto/${memberCode}`, {
        method: 'PUT',
        body: formData
      });
      
      const result = await tryJson(response);
      
      if (result.success) {
        showMessage('Member passport photo updated successfully!', 'success');
        // Refresh the members table
        refreshMembers();
      } else {
        showMessage(result.message || 'Failed to update passport photo', 'error');
      }
    } catch (error) {
      console.error('Error updating member photo:', error);
      showMessage('Error updating member photo', 'error');
    }
    
    // Clean up
    document.body.removeChild(fileInput);
  };
  
  document.body.appendChild(fileInput);
  fileInput.click();
}

// Expose functions to window for debugging
window.updateMemberPhoto = updateMemberPhoto;
window.importData = importData;
window.downloadSampleCSV = downloadSampleCSV;
window.updateCsvFormat = updateCsvFormat;
window.generateDefaultPassword = generateDefaultPassword;

// ==================== BULK ACTIONS FUNCTIONALITY ====================

// Global state for bulk selections
window.bulkSelections = {
    members: new Set(),
    certificates: new Set()
};

// Select all functionality
function selectAllMembers() {
    const selectAllCheckbox = document.getElementById('selectAllMembers');
    const memberCheckboxes = document.querySelectorAll('.member-checkbox');
    
    memberCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const memberId = checkbox.value;
        const row = checkbox.closest('tr');
        
        if (selectAllCheckbox.checked) {
            window.bulkSelections.members.add(memberId);
            row.classList.add('selected');
        } else {
            window.bulkSelections.members.delete(memberId);
            row.classList.remove('selected');
        }
    });
    
    updateBulkActionsVisibility('members');
    updateSelectionCount('members');
}

function selectAllCertificates() {
    const selectAllCheckbox = document.getElementById('selectAllCertificates');
    const certificateCheckboxes = document.querySelectorAll('.certificate-checkbox');
    
    certificateCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const certificateId = checkbox.value;
        const row = checkbox.closest('tr');
        
        if (selectAllCheckbox.checked) {
            window.bulkSelections.certificates.add(certificateId);
            row.classList.add('selected');
        } else {
            window.bulkSelections.certificates.delete(certificateId);
            row.classList.remove('selected');
        }
    });
    
    updateBulkActionsVisibility('certificates');
    updateSelectionCount('certificates');
}

// Individual checkbox selection
function toggleMemberSelection(checkbox) {
    const memberId = checkbox.value;
    const row = checkbox.closest('tr');
    const selectAllCheckbox = document.getElementById('selectAllMembers');
    
    if (checkbox.checked) {
        window.bulkSelections.members.add(memberId);
        row.classList.add('selected');
    } else {
        window.bulkSelections.members.delete(memberId);
        row.classList.remove('selected');
    }
    
    // Update select all checkbox state
    const allCheckboxes = document.querySelectorAll('.member-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.member-checkbox:checked');
    selectAllCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
    
    updateBulkActionsVisibility('members');
    updateSelectionCount('members');
}

function toggleCertificateSelection(checkbox) {
    const certificateId = checkbox.value;
    const row = checkbox.closest('tr');
    const selectAllCheckbox = document.getElementById('selectAllCertificates');
    
    if (checkbox.checked) {
        window.bulkSelections.certificates.add(certificateId);
        row.classList.add('selected');
    } else {
        window.bulkSelections.certificates.delete(certificateId);
        row.classList.remove('selected');
    }
    
    // Update select all checkbox state
    const allCheckboxes = document.querySelectorAll('.certificate-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.certificate-checkbox:checked');
    selectAllCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
    
    updateBulkActionsVisibility('certificates');
    updateSelectionCount('certificates');
}

// Update bulk actions visibility
function updateBulkActionsVisibility(type) {
    const bulkActions = document.getElementById(`${type}BulkActions`);
    const selections = window.bulkSelections[type];
    
    if (selections.size > 0) {
        bulkActions.style.display = 'flex';
    } else {
        bulkActions.style.display = 'none';
    }
}

// Update selection count
function updateSelectionCount(type) {
    const selections = window.bulkSelections[type];
    const count = selections.size;
    console.log(`${type} selected: ${count}`);
}

// Bulk delete members
async function bulkDeleteMembers() {
    const selectedMembers = Array.from(window.bulkSelections.members);
    
    if (selectedMembers.length === 0) {
        showMessage('No members selected for deletion.', 'warning');
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${selectedMembers.length} selected member(s)? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showMessage('Deleting selected members...', 'info');
        
        const response = await fetch(`${getBackendUrl()}/api/users/users/bulk-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds: selectedMembers })
        });
        
        if (response.ok) {
            const result = await tryJson(response);
            showMessage(`Successfully deleted ${result.deletedCount} member(s).`, 'success');
            
            // Clear selections and refresh table
            window.bulkSelections.members.clear();
            updateBulkActionsVisibility('members');
            refreshMembers();
        } else {
            const error = await tryJson(response);
            showMessage(`Failed to delete members: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Bulk delete error:', error);
        showMessage('An error occurred while deleting members.', 'error');
    }
}

// Bulk delete certificates
async function bulkDeleteCertificates() {
    const selectedCertificates = Array.from(window.bulkSelections.certificates);
    
    if (selectedCertificates.length === 0) {
        showMessage('No certificates selected for deletion.', 'warning');
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${selectedCertificates.length} selected certificate(s)? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showMessage('Deleting selected certificates...', 'info');
        
        const response = await fetch(`${getBackendUrl()}/api/certificates/bulk-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ certificateIds: selectedCertificates })
        });
        
        if (response.ok) {
            const result = await tryJson(response);
            showMessage(`Successfully deleted ${result.deletedCount} certificate(s).`, 'success');
            
            // Clear selections and refresh table
            window.bulkSelections.certificates.clear();
            updateBulkActionsVisibility('certificates');
            refreshCertificates();
        } else {
            const error = await tryJson(response);
            showMessage(`Failed to delete certificates: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Bulk delete error:', error);
        showMessage('An error occurred while deleting certificates.', 'error');
    }
}

// Bulk export members
async function bulkExportMembers() {
    const selectedMembers = Array.from(window.bulkSelections.members);
    
    if (selectedMembers.length === 0) {
        showMessage('No members selected for export.', 'warning');
        return;
    }
    
    try {
        showMessage('Exporting selected members...', 'info');
        
        // Get selected members data
        const membersData = window.appState.members.filter(member => 
            selectedMembers.includes(member._id || member.id)
        );
        
        if (membersData.length === 0) {
            showMessage('No member data found for selected items.', 'error');
            return;
        }
        
        // Export as CSV
        const csv = convertToCSV(membersData);
        const filename = `selected_members_${new Date().toISOString().split('T')[0]}.csv`;
        downloadFile(csv, filename, 'text/csv');
        
        showMessage(`Successfully exported ${membersData.length} member(s).`, 'success');
    } catch (error) {
        console.error('Bulk export error:', error);
        showMessage('An error occurred while exporting members.', 'error');
    }
}

// Bulk export certificates
async function bulkExportCertificates() {
    const selectedCertificates = Array.from(window.bulkSelections.certificates);
    
    if (selectedCertificates.length === 0) {
        showMessage('No certificates selected for export.', 'warning');
        return;
    }
    
    try {
        showMessage('Exporting selected certificates...', 'info');
        
        // Get selected certificates data
        const certificatesData = window.appState.certificates.filter(certificate => 
            selectedCertificates.includes(certificate._id || certificate.id)
        );
        
        if (certificatesData.length === 0) {
            showMessage('No certificate data found for selected items.', 'error');
            return;
        }
        
        // Export as CSV
        const csv = convertToCSV(certificatesData);
        const filename = `selected_certificates_${new Date().toISOString().split('T')[0]}.csv`;
        downloadFile(csv, filename, 'text/csv');
        
        showMessage(`Successfully exported ${certificatesData.length} certificate(s).`, 'success');
    } catch (error) {
        console.error('Bulk export error:', error);
        showMessage('An error occurred while exporting certificates.', 'error');
    }
}

// Bulk update members
async function bulkUpdateMembers() {
    const selectedMembers = Array.from(window.bulkSelections.members);
    
    if (selectedMembers.length === 0) {
        showMessage('No members selected for update.', 'warning');
        return;
    }
    
    showMessage(`Bulk update functionality for ${selectedMembers.length} members is under development.`, 'info');
}

// Bulk revoke certificates
async function bulkRevokeCertificates() {
    const selectedCertificates = Array.from(window.bulkSelections.certificates);
    
    if (selectedCertificates.length === 0) {
        showMessage('No certificates selected for revocation.', 'warning');
        return;
    }
    
    const confirmMessage = `Are you sure you want to revoke ${selectedCertificates.length} selected certificate(s)? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showMessage('Revoking selected certificates...', 'info');
        
        // Revoke each certificate
        const revokePromises = selectedCertificates.map(async (certificateId) => {
            const response = await fetch(`${getBackendUrl()}/api/certificates/${certificateId}/revoke`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return response.ok;
        });
        
        const results = await Promise.all(revokePromises);
        const successCount = results.filter(result => result).length;
        
        if (successCount > 0) {
            showMessage(`Successfully revoked ${successCount} certificate(s).`, 'success');
            
            // Clear selections and refresh table
            window.bulkSelections.certificates.clear();
            updateBulkActionsVisibility('certificates');
            refreshCertificates();
        } else {
            showMessage('Failed to revoke any certificates.', 'error');
        }
    } catch (error) {
        console.error('Bulk revoke error:', error);
        showMessage('An error occurred while revoking certificates.', 'error');
    }
}

// Clear all selections
function clearAllSelections(type) {
    window.bulkSelections[type].clear();
    
    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll(`.${type.slice(0, -1)}-checkbox`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('tr').classList.remove('selected');
    });
    
    // Reset select all checkbox
    const selectAllCheckbox = document.getElementById(`selectAll${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    
    updateBulkActionsVisibility(type);
    updateSelectionCount(type);
}

// Expose bulk action functions to window
window.selectAllMembers = selectAllMembers;
window.selectAllCertificates = selectAllCertificates;
window.toggleMemberSelection = toggleMemberSelection;
window.toggleCertificateSelection = toggleCertificateSelection;
window.bulkDeleteMembers = bulkDeleteMembers;
window.bulkDeleteCertificates = bulkDeleteCertificates;
window.bulkExportMembers = bulkExportMembers;
window.bulkExportCertificates = bulkExportCertificates;
window.bulkUpdateMembers = bulkUpdateMembers;
window.bulkRevokeCertificates = bulkRevokeCertificates;
window.clearAllSelections = clearAllSelections;

// Test function for member update
window.testMemberUpdate = async function(memberId) {
  console.log('🧪 Testing member update for ID:', memberId);
  
  const member = window.currentMembers?.find(m => m._id === memberId || m.id === memberId);
  if (!member) {
    console.log('❌ Member not found');
    return;
  }
  
  console.log('📋 Member data:', member);
  
  // Create test form data
  const formData = new FormData();
  formData.append('name', member.name + ' (Updated)');
  formData.append('email', member.email || '');
  formData.append('code', member.code);
  formData.append('position', member.position || 'MEMBER');
  formData.append('state', member.state);
  formData.append('zone', member.zone);
  
  try {
    console.log('Loading Sending update request...');
    const response = /* queued update instead of direct PUT during import */ (queueMemberUpdate(row), { ok: true });
    
    if (response.ok) {
      const result = await tryJson(response);
      console.log('✅ Update successful:', result);
      showMessage('Test update successful!', 'success');
      
      // Refresh the members list
      await loadMembers();
    } else {
      const error = await tryJson(response);
      console.log('❌ Update failed:', error);
      showMessage('Test update failed: ' + error.message, 'error');
    }
  } catch (error) {
    console.log('❌ Update error:', error);
    showMessage('Test update error: ' + error.message, 'error');
  }
};

// ---- Reveal member checkbox on row click (safe) ----
(function setupMemberRowCheckboxReveal() {
    if (window.__memberRowRevealBound) return;
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function(e) {
        // Ignore clicks on interactive controls
        if (e.target.closest('button, a, input, select, label, textarea')) return;
        const tr = e.target.closest('tr');
        if (!tr) return;
        const cb = tr.querySelector('.member-checkbox');
        if (!cb) return;
        const cbTd = cb.closest('td');
        if (cbTd && cbTd.style.display === 'none') {
            cbTd.style.display = '';
            cb.checked = true;
        } else {
            cb.checked = !cb.checked;
        }
    }, false);
    window.__memberRowRevealBound = true;
})();


// ---- Reveal certificate checkbox on row click (safe) ----
(function setupCertificateRowCheckboxReveal() {
    if (window.__certRowRevealBound) return;
    // Try a specific tbody id if present, else attach to the table's tbody
    let tbody = document.getElementById('certificatesTableBody');
    if (!tbody) {
        const table = document.getElementById('certificatesTable');
        if (table) tbody = table.querySelector('tbody');
    }
    if (!tbody) return;
    tbody.addEventListener('click', function(e) {
        if (e.target.closest('button, a, input, select, label, textarea')) return;
        const tr = e.target.closest('tr');
        if (!tr) return;
        const cb = tr.querySelector('.certificate-checkbox');
        if (!cb) return;
        const cbTd = cb.closest('td');
        if (cbTd && cbTd.style.display === 'none') {
            cbTd.style.display = '';
            cb.checked = true;
        } else {
            cb.checked = !cb.checked;
        }
    }, false);
    window.__certRowRevealBound = true;
})();


// ---- Enhanced: reveal & toggle checkboxes on row click (members & certificates) ----

(function setupRowCheckboxRevealAndToggle() {
    // Allow rebinding by not using a global guard; remove any previous listeners by relying on unique function reference.
    function bind(tbody, selector) {
        if (!tbody) return;
        tbody.addEventListener('click', function(e) {
            // Ignore clicks on native interactive controls
            if (e.target.closest('button, a, input, select, label, textarea')) return;
            const tr = e.target.closest('tr');
            if (!tr) return;
            const cb = tr.querySelector(selector);
            if (!cb) return;
            const cbTd = cb.closest('td');

            // Reveal checkbox cell if hidden, and select
            if (cbTd && cbTd.style.display === 'none') {
                cbTd.style.display = '';
            }
            if (!cb.checked) {
                cb.checked = true; // select-only on row click
                tr.classList.add('row-selected');
        updateCertificatesSelectionUI();
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                // Already selected; keep it selected on row click (do not uncheck).
                tr.classList.add('row-selected');
        updateCertificatesSelectionUI();
            }
        }, false);
    }

    bind(document.getElementById('membersTableBody'), '.member-checkbox');
    var certTbody = document.getElementById('certificatesTableBody');
    if (!certTbody) {
        var certTable = document.getElementById('certificatesTable');
        if (certTable) certTbody = certTable.querySelector('tbody');
    }
    bind(certTbody, '.certificate-checkbox');
})();


// Keep row highlight in sync with checkbox state
(function setupRowSelectedHighlightSync() {
    if (window.__rowSelectedHighlightBound) return;

    function sync(tbody, selector, updateFn) {
        if (!tbody) return;
        tbody.addEventListener('change', function (e) {
            if (!e.target.matches(selector)) return;

            const cb = e.target;
            const tr = cb.closest('tr');
            if (!tr) return;

            if (cb.checked) {
                tr.classList.add('row-selected');
            } else {
                tr.classList.remove('row-selected');
            }

            // Refresh header visibility + cells based on selection
            if (typeof updateFn === 'function') updateFn();
        });
    }

    // Members
    sync(
        document.getElementById('membersTableBody'),
        '.member-checkbox',
        updateMembersSelectionUI
    );

    // Certificates
    let certTbody = document.getElementById('certificatesTableBody');
    if (!certTbody) {
        const certTable = document.getElementById('certificatesTable');
        if (certTable) certTbody = certTable.querySelector('tbody');
    }
    sync(
        certTbody,
        '.certificate-checkbox',
        updateCertificatesSelectionUI
    );

    window.__rowSelectedHighlightBound = true;
})();


// ---- Robust row click-to-select (document-level delegation) ----
(function enableRowClickSelect() {
  if (window.__docRowClickSelectBound) return;
  document.addEventListener('click', function(e) {
    // Ignore clicks on interactive controls
    if (e.target.closest('button, a, input, select, label, textarea')) return;

    // Handle Members table
    const membersTbody = e.target.closest('#membersTableBody tr');
    if (membersTbody) {
      const tr = membersTbody;
      const cb = tr.querySelector('.member-checkbox');
      if (cb) {
        const cbTd = cb.closest('td');
        if (cbTd && cbTd.style.display === 'none') cbTd.style.display = '';
        if (!cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
        tr.classList.add('row-selected');
        updateCertificatesSelectionUI();
        updateMembersSelectionUI();
        return; // stop here so we don't also handle certs accidentally
      }
    }

    // Handle Certificates table
    const certsTbody = e.target.closest('#certificatesTableBody tr, #certificatesTable tbody tr');
    if (certsTbody) {
      const tr = certsTbody;
      const cb = tr.querySelector('.certificate-checkbox');
      if (cb) {
        const cbTd = cb.closest('td');
        if (cbTd && cbTd.style.display === 'none') cbTd.style.display = '';
        if (!cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
        tr.classList.add('row-selected');
        updateCertificatesSelectionUI();
      }
    }
  }, false);
  window.__docRowClickSelectBound = true;
})();


// ---- Selection UI sync (header visibility + checkbox cells) ----
function updateSelectionUI(tableId, tbodySelector, checkboxSelector, headerCheckboxId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    let tbody = document.querySelector(tbodySelector);
    if (!tbody && table) tbody = table.querySelector('tbody');
    if (!tbody) return;

    const checkboxes = Array.from(tbody.querySelectorAll(checkboxSelector));
    const anyChecked = checkboxes.some(cb => cb.checked);

    // Toggle header <th> that contains the header checkbox
    const headerCb = document.getElementById(headerCheckboxId);
    if (headerCb && headerCb.closest('th')) {
        headerCb.closest('th').style.display = anyChecked ? 'table-cell' : 'none';
    }

    // Toggle table class to allow CSS overrides
    if (anyChecked) {
        table.classList.add('selection-active');
    } else {
        table.classList.remove('selection-active');
    }

    // When none selected, hide all row checkbox cells again; when selected, show only for checked rows
    checkboxes.forEach(cb => {
        const td = cb.closest('td');
        if (!td) return;
        if (anyChecked) {
            // Show the cell for checked rows; keep unchecked rows hidden to reduce clutter
            td.style.display = cb.checked ? '' : 'none';
        } else {
            // Hide all when nothing selected
            td.style.display = 'none';
        }
    });
}

// Convenience wrappers
function updateMembersSelectionUI() {
    updateSelectionUI('membersTable', '#membersTableBody', '.member-checkbox', 'selectAllMembers');
}
function updateCertificatesSelectionUI() {
    updateSelectionUI('certificatesTable', '#certificatesTableBody, #certificatesTable tbody', '.certificate-checkbox', 'selectAllCertificates');
}



// ===== Selection UX v2 (row click toggles select/unselect; header shows/hides) =====
(function setupSelectionV2() {
  if (window.__selectionV2Bound) return;

  function updateSelectionUI(tableId, tbodySelector, checkboxSelector, headerCheckboxId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    let tbody = document.querySelector(tbodySelector);
    if (!tbody && table) tbody = table.querySelector('tbody');
    if (!tbody) return;

    const checkboxes = Array.from(tbody.querySelectorAll(checkboxSelector));
    const anyChecked = checkboxes.some(cb => cb.checked);

    // Toggle header <th> (Select All) visibility
    const headerCb = document.getElementById(headerCheckboxId);
    if (headerCb && headerCb.closest('th')) {
      headerCb.closest('th').style.display = anyChecked ? 'table-cell' : 'none';
    }

    // Mark table state for CSS if needed
    table.classList.toggle('selection-active', anyChecked);

    // Show checkbox cell only for checked rows; hide all if none selected
    checkboxes.forEach(cb => {
      const td = cb.closest('td');
      const tr = cb.closest('tr');
      if (tr) tr.classList.toggle('row-selected', cb.checked);
      if (td) td.style.display = anyChecked ? (cb.checked ? '' : 'none') : 'none';
    });
  }

  // Expose for reuse
  window.updateMembersSelectionUI = function() {
    updateSelectionUI('membersTable', '#membersTableBody', '.member-checkbox', 'selectAllMembers');
  };
  window.updateCertificatesSelectionUI = function() {
    updateSelectionUI('certificatesTable', '#certificatesTableBody, #certificatesTable tbody', '.certificate-checkbox', 'selectAllCertificates');
  };

  // Document-level change: keep highlights/visibility in sync
  document.addEventListener('change', function(e) {
    if (e.target.matches('.member-checkbox')) {
      window.updateMembersSelectionUI();
    } else if (e.target.matches('.certificate-checkbox')) {
      window.updateCertificatesSelectionUI();
    }
  }, false);

  // Document-level click: toggle selection on row click (reveal + check/uncheck)
  document.addEventListener('click', function(e) {
    // Ignore native controls
    if (e.target.closest('button, a, input, select, label, textarea')) return;

    // Members row?
    let tr = e.target.closest('#membersTableBody tr');
    if (tr) {
      const cb = tr.querySelector('.member-checkbox');
      if (cb) {
        const td = cb.closest('td');
        if (td && td.style.display === 'none') td.style.display = '';
        cb.checked = !cb.checked;                 // <-- toggle (select/unselect)
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }

    // Certificates row?
    tr = e.target.closest('#certificatesTableBody tr, #certificatesTable tbody tr');
    if (tr) {
      const cb = tr.querySelector('.certificate-checkbox');
      if (cb) {
        const td = cb.closest('td');
        if (td && td.style.display === 'none') td.style.display = '';
        cb.checked = !cb.checked;                 // <-- toggle (select/unselect)
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, false);

  // Initial sync in case rows exist before scripts run
  document.addEventListener('DOMContentLoaded', function() {
    window.updateMembersSelectionUI();
    window.updateCertificatesSelectionUI();
  });

  window.__selectionV2Bound = true;
})();

// ===== Flexible Selection Patch (merged) =====
(function setupFlexibleSelection() {
  if (window.__flexSelectionBound) return;

  function findHeaderSelectAllCell(table) {
    if (!table) return null;
    const th = table.querySelector('thead th:has(input[type="checkbox"][id*="selectAll" i])');
    return th || null;
  }

  function updateSelectionForTbody(tbody) {
    if (!tbody) return;
    const table = tbody.closest('table');
    const headerCell = findHeaderSelectAllCell(table);
    const rowCbs = Array.from(tbody.querySelectorAll('input[type="checkbox"]'))
      .filter(cb => !(cb.id || '').toLowerCase().includes('selectall'));

    const anyChecked = rowCbs.some(cb => cb.checked);

    if (headerCell) headerCell.style.display = anyChecked ? 'table-cell' : 'none';

    rowCbs.forEach(cb => {
      const tr = cb.closest('tr');
      const td = cb.closest('td');
      if (tr) tr.classList.toggle('row-selected', cb.checked);
      if (td) td.style.display = anyChecked ? (cb.checked ? '' : 'none') : 'none';
    });

    if (table) table.classList.toggle('selection-active', anyChecked);
  }

  // Change handler (bubble) keeps UI in sync for any checkbox in any tbody
  document.addEventListener('change', function(e) {
    if (!e.target.matches('tbody input[type="checkbox"]')) return;
    const tbody = e.target.closest('tbody');
    updateSelectionForTbody(tbody);
  }, false);

  // Row click toggler - use CAPTURE to run before other handlers and avoid double toggling
  document.addEventListener('click', function(e) {
    if (e.target.closest('button, a, input, select, label, textarea')) return;

    const tr = e.target.closest('tbody tr');
    if (!tr) return;

    // Prefer specific classes if present
    let cb = tr.querySelector('input[type="checkbox"].member-checkbox, input[type="checkbox"].certificate-checkbox');
    if (!cb) cb = tr.querySelector('input[type="checkbox"]');
    if (!cb) return;

    const td = cb.closest('td');
    if (td && td.style.display === 'none') td.style.display = '';

    cb.checked = !cb.checked;
    cb.dispatchEvent(new Event('change', { bubbles: true }));

    // Prevent other legacy click listeners from re-toggling
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }, true); // <-- capture phase

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('tbody').forEach(updateSelectionForTbody);
  }, false);

  window.__flexSelectionBound = true;
})();


// ==== NO-FLASH PAGINATION + STATE INITIALS (compact labels + full-name tooltips) ====

// 1) Hide paginations by default; show only when ready
(function setupNoFlashPagination(){
  if (window.__noFlashPagBound) return;

  function hide(el){
    if (!el) return;
    el.style.display = 'none';
  }
  function show(el){
    if (!el) return;
    el.style.display = '';
  }

  // Initial hide on DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    ['certificatesPagination', 'analyticsPagination'].forEach(id => {
      const el = document.getElementById(id);
      if (el) hide(el);
    });
  });

  // Public togglers your renderers can call
  window.setCertificatesPaginationVisible = function(visible){
    const el = document.getElementById('certificatesPagination');
    if (!el) return;
    (visible ? show : hide)(el);
  };
  window.setAnalyticsPaginationVisible = function(visible){
    const el = document.getElementById('analyticsPagination');
    if (!el) return;
    (visible ? show : hide)(el);
  };

  // As a safety net: reveal cert pagination only when it actually has items
  const certPag = document.getElementById('certificatesPagination');
  if (certPag && typeof MutationObserver !== 'undefined'){
    const obs = new MutationObserver(function(){
      const hasItems = certPag.querySelectorAll('li, a, button').length > 0;
      if (hasItems) show(certPag);
    });
    obs.observe(certPag, { childList: true, subtree: true });
  }

  // Same for analytics
  const anaPag = document.getElementById('analyticsPagination');
  if (anaPag && typeof MutationObserver !== 'undefined'){
    const obs2 = new MutationObserver(function(){
      const hasItems = anaPag.querySelectorAll('li, a, button').length > 0;
      if (hasItems) show(anaPag);
    });
    obs2.observe(anaPag, { childList: true, subtree: true });
  }

  window.__noFlashPagBound = true;
})();

// 2) Very small initials on chart axis; full names in tooltips.
(function tightenStateChartLabels(){
  if (window.__tightStateLabelsBound) return;

  // Reuse a robust normalizer
  function _normalizeStateName(raw) {
    let s = (raw || 'Unknown').toString().trim();
    s = s.replace(/\s+/g, ' ');
    s = s.replace(/\s*state\s*$/i, '');
    if (/^(fct|abuja|fct abuja|abuja fct)$/i.test(s)) s = 'FCT Abuja';
    s = s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return s;
  }

  // Build shortest-unique initials map
  function buildShortLabelMap(stateNames){
    const clean = Array.from(new Set((stateNames || []).map(_normalizeStateName)));
    const map = Object.create(null);

    // 1-letter pass
    const b1 = {};
    clean.forEach(s => { const k = s[0]; (b1[k] ||= []).push(s); });
    clean.forEach(s => { if ((b1[s[0]]||[]).length === 1) map[s] = s[0].toUpperCase(); });

    // 2-letter pass for collisions
    const unresolved = clean.filter(s => !map[s]);
    const b2 = {};
    unresolved.forEach(s => { const k = s.slice(0,2); (b2[k] ||= []).push(s); });
    unresolved.forEach(s => { if ((b2[s.slice(0,2)]||[]).length === 1) map[s] = s.slice(0,2).toUpperCase(); });

    // 3-letter fallback
    const unresolved3 = clean.filter(s => !map[s]);
    unresolved3.forEach(s => { map[s] = s.slice(0,3).toUpperCase(); });

    return map;
  }

  // Wrap renderStateChart to adjust labels + options
  (function wrap(){
    if (typeof window.renderStateChart !== 'function') return;

    const original = window.renderStateChart;
    window.renderStateChart = function(data){
      try {
        const arr = Array.isArray(data && data.membersByState) ? data.membersByState.slice() : [];
        const fullNames = arr.map(it => it && (it._id || it.state || it.name));
        const labelMap = buildShortLabelMap(fullNames);

        // Build mapped data, but keep a reverse map for tooltips
        const reverse = Object.create(null);
        fullNames.forEach(fn => { const key = _normalizeStateName(fn); reverse[labelMap[key]] = _normalizeStateName(fn); });

        const patched = Object.assign({}, data, {
          membersByState: arr.map(it => {
            const full = _normalizeStateName(it._id || it.state || it.name);
            const short = labelMap[full] || full;
            return { _id: short, count: Number(it.count || it.total || it.value || 0), __full: full };
          })
        });

        // Call original to create Chart.js instance
        const chart = original(patched);

        // Try to adjust Chart.js options post-creation (v3+ pattern)
        try {
          if (chart && chart.options) {
            // Horizontal bars with tiny y-axis tick font; don't overlap
            chart.options.indexAxis = 'y';
            chart.options.maintainAspectRatio = false;
            chart.options.scales = chart.options.scales || {};
            chart.options.scales.y = chart.options.scales.y || {};
            chart.options.scales.y.ticks = Object.assign({}, chart.options.scales.y.ticks, {
              autoSkip: false,
              maxTicksLimit: 100,
              font: { size: 8 }  // tiny initials
            });
            chart.options.scales.x = Object.assign({ beginAtZero: true }, chart.options.scales.x);

            // Tooltips: show full state name + count
            chart.options.plugins = chart.options.plugins || {};
            chart.options.plugins.tooltip = chart.options.plugins.tooltip || {};
            chart.options.plugins.tooltip.callbacks = chart.options.plugins.tooltip.callbacks || {};
            chart.options.plugins.tooltip.callbacks.title = function(items){
              const label = items && items[0] && items[0].label;
              // label is the short code; map to full
              return reverse[label] || label;
            };
            chart.options.plugins.tooltip.callbacks.label = function(item){
              const v = (item && item.parsed && (item.parsed.x ?? item.parsed.y)) || 0;
              return 'Count: ' + v;
            };

            chart.update('none');
          }
        } catch(e){ /* best effort */ }

        return chart;
      } catch (e) {
        return original(data);
      }
    };

    window.__tightStateLabelsBound = true;
  })();
})();



// === State Chart: Full names + Alphabetical + Small labels (desktop & mobile) ===
(function wrapStateChartAlphaFull(){
  if (window.__stateChartAlphaFullWrapped) return;

  function _normalizeStateName(raw) {
    let s = (raw || 'Unknown').toString().trim().replace(/\s+/g, ' ');
    s = s.replace(/\s*state\s*$/i, '');
    if (/^(fct|abuja|fct abuja|abuja fct)$/i.test(s)) s = 'FCT Abuja';
    return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  function ensureCanvasHeightFor(count){
    var cv = document.getElementById('stateChart');
    if (!cv) return;
    // about 20px per row + padding, capped so page stays usable
    var px = Math.min(20 * Math.max(count, 5) + 80, Math.max(window.innerHeight * 0.85, 360));
    cv.style.height = px + 'px';
  }

  const hook = function(){
    if (typeof window.renderStateChart !== 'function') return false;

    const original = window.renderStateChart;
    window.renderStateChart = function(data){
      try {
        const src = Array.isArray(data && data.membersByState) ? data.membersByState.slice() : [];
        // Convert to full, normalized names + numeric counts
        const full = src.map(it => ({
          _id: _normalizeStateName(it && (it._id || it.state || it.name)),
          count: Number(it && (it.count || it.total || it.value || 0)) || 0
        }));
        // Sort ALPHABETICALLY by state name
        full.sort((a, b) => a._id.localeCompare(b._id));

        // Adjust canvas height for all labels to be readable
        ensureCanvasHeightFor(full.length);

        // Build patched data object
        const patched = Object.assign({}, data, { membersByState: full });

        // Create chart through original
        const chart = original(patched);

        // Enforce tiny label font + no autoskip + horizontal bars
        try {
          if (chart && chart.options) {
            chart.options.indexAxis = 'y';
            chart.options.maintainAspectRatio = false;
            chart.options.scales = chart.options.scales || {};
            chart.options.scales.y = chart.options.scales.y || {};
            chart.options.scales.y.ticks = Object.assign({}, chart.options.scales.y.ticks, {
              autoSkip: false,
              font: { size: 9 }  // small so labels don't overlap
            });
            chart.update('none');
          }
        } catch(e){ /* best effort */ }

        return chart;
      } catch (e) {
        return original(data);
      }
    };
    return true;
  };

  if (!hook()){
    const iv = setInterval(() => { if (hook()) clearInterval(iv); }, 100);
    setTimeout(() => clearInterval(iv), 6000);
  }

  window.__stateChartAlphaFullWrapped = true;
})();




/* ================== NARAP ADMIN FULL FIX (analytics + pagination) ==================
   - Prevents pagination flash on Certificates & Analytics
   - Members by State uses FULL names (alphabetical) with tiny labels to avoid overlap
   - Uses Chart.js if available; otherwise draws a clean fallback on the canvas
   - Safe to keep: this runs LAST and overrides previous wrappers
============================================================================= */

(function(){
  // ---------- Tunables (easy to tweak) ----------
  const STATE_LABEL_FONT_PX = 9;   // y-axis state labels (smaller = less overlap)
  const VALUE_FONT_PX       = 9;   // value text size
  const BAR_THICKNESS_PX    = 6;  // bar thickness for Chart.js and fallback (try 8-12)
  const BAR_CATEGORY_PCT    = 0.60; // squeeze category slot (Chart.js)
  const BAR_PCT             = 0.80; // squeeze bar within slot (Chart.js)
  const PER_ROW_PX          = 20;  // canvas height per state row (raise if labels feel tight)

  // ---------- Utilities ----------
  function $(id){ return document.getElementById(id); }
  function normalizeState(raw){
    let s = (raw || 'Unknown').toString().trim().replace(/\s+/g, ' ');
    s = s.replace(/\s*state\s*$/i, '');
    if (/^(fct|abuja|fct abuja|abuja fct)$/i.test(s)) s = 'FCT Abuja';
    return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  function computeMembersByStateFull(data){
    try {
      let arr = Array.isArray(data && data.membersByState) ? data.membersByState.slice() : null;
      if (!arr || !arr.length){
        const full =
          (typeof getAllMembers === 'function') ? getAllMembers() :
          (typeof allMembers !== 'undefined') ? allMembers :
          (typeof getLocalMembers === 'function') ? getLocalMembers() : [];
        const map = Object.create(null);
        (full || []).forEach(m => {
          const st = normalizeState(m && (m.state || m.State || m.STATE));
          map[st] = (map[st] || 0) + 1;
        });
        arr = Object.entries(map).map(([name, count]) => ({ name, count: Number(count)||0 }));
      } else {
        arr = arr.map(it => ({
          name: normalizeState(it && (it._id || it.state || it.name)),
          count: Number(it && (it.count || it.total || it.value || 0)) || 0
        }));
      }
      arr.sort((a, b) => a.name.localeCompare(b.name));
      return arr;
    } catch(e){ return []; }
  }

  // ---------- 1) No-flash pagination (certificates + analytics) ----------
  (function setupNoFlashPagination(){
    if (window.__noFlashPagBound) return;

    function hide(el){ if (el) el.style.display = 'none'; }
    function show(el){ if (el) el.style.display = ''; }

    // Hide ASAP on DOM ready
    document.addEventListener('DOMContentLoaded', function(){
      hide($('certificatesPagination'));
      hide($('analyticsPagination'));
    });

    // Public togglers for your existing renderers
    window.setCertificatesPaginationVisible = function(visible){
      (visible ? show : hide)($('certificatesPagination'));
    };
    window.setAnalyticsPaginationVisible = function(visible){
      (visible ? show : hide)($('analyticsPagination'));
    };

    // Reveal automatically only after items exist
    const cert = $('certificatesPagination');
    if (cert && typeof MutationObserver !== 'undefined'){
      new MutationObserver(function(){
        const has = cert.querySelectorAll('li, a, button').length > 0;
        if (has) show(cert);
      }).observe(cert, { childList: true, subtree: true });
    }
    const ana = $('analyticsPagination');
    if (ana && typeof MutationObserver !== 'undefined'){
      new MutationObserver(function(){
        const has = ana.querySelectorAll('li, a, button').length > 0;
        if (has) show(ana);
      }).observe(ana, { childList: true, subtree: true });
    }
    window.__noFlashPagBound = true;
  })();

  // ---------- 2) Definitive "Members by State" renderer (full names, A→Z, thin bars) ----------
  (function overrideRenderStateChart(){
    // Replace any previous wrapper with a final renderer
    window.renderStateChart = function(data){
      try {
        var canvas = $('stateChart');
        if (!canvas) return;
        var rows = computeMembersByStateFull(data);
        var labels = rows.map(x => x.name);
        var values = rows.map(x => x.count);

        // Grow canvas height so all labels fit for horizontal bars
        var minH = 240;
        var maxH = Math.floor(window.innerHeight * 0.85);
        var desired = Math.min(Math.max(minH, labels.length * PER_ROW_PX + 80), Math.max(maxH, minH));
        canvas.style.height = desired + 'px';

        if (typeof Chart !== 'undefined' && Chart !== null) {
          // Destroy any old chart instance (Chart.js v3+ API)
          try {
            if (Chart.getChart) {
              var old = Chart.getChart(canvas);
              if (old) old.destroy();
            }
          } catch(e){}

          var ctx = canvas.getContext('2d');
          var chart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: 'Members',
                data: values,
                backgroundColor: '#ffc107',

                // ↓↓↓ make bars thinner ↓↓↓
                barThickness: BAR_THICKNESS_PX,
                maxBarThickness: BAR_THICKNESS_PX,
                categoryPercentage: BAR_CATEGORY_PCT,
                barPercentage: BAR_PCT
              }]
            },
            options: {
              indexAxis: 'y',
              maintainAspectRatio: false,
              scales: {
                x: { beginAtZero: true },
                y: { ticks: { autoSkip: false, font: { size: STATE_LABEL_FONT_PX } } }
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: items => (items && items[0]) ? items[0].label : '',
                    label: item => 'Count: ' + ((item && item.parsed && (item.parsed.x ?? item.parsed.y)) || 0)
                  }
                }
              }
            }
          });
          window.__stateChartInstance = chart;
          return chart;
        } else {
          // Minimal fallback renderer (no Chart.js)
          var ctx2 = canvas.getContext('2d');
          ctx2.clearRect(0, 0, canvas.width, canvas.height);
          const W = canvas.width, H = canvas.height;
          const leftPad = 80, rightPad = 12, topPad = 20, bottomPad = 16;
          const innerW = W - leftPad - rightPad;
          const innerH = H - topPad - bottomPad;
          const maxV = Math.max(1, Math.max.apply(null, values.map(v=>+v||0)));

          // Fixed thin bars with graceful scaling if height is tight
          const GAP_BASE = 4;
          const totalBarsH = labels.length * BAR_THICKNESS_PX + (labels.length - 1) * GAP_BASE;
          const scale = Math.min(1, innerH / Math.max(1, totalBarsH));
          const barH = Math.max(2, Math.floor(BAR_THICKNESS_PX * scale));
          const gap  = Math.max(2, Math.floor(GAP_BASE * scale));

          ctx2.save(); ctx2.translate(leftPad, topPad);

          for (let i=0;i<labels.length;i++){
            const v = +values[i] || 0;
            const w = Math.round((v / maxV) * innerW);
            const y = i * (barH + gap);
            ctx2.fillStyle = '#ffc107';
            ctx2.fillRect(0, y, w, barH);

            ctx2.font = STATE_LABEL_FONT_PX + 'px Arial';
            ctx2.fillStyle = '#333';
            ctx2.textBaseline = 'middle';

            // label (state name) on the left
            ctx2.textAlign = 'right';
            ctx2.fillText(labels[i], -6, y + barH/2);

            // value at end of bar
            ctx2.font = VALUE_FONT_PX + 'px Arial';
            ctx2.textAlign = 'left';
            ctx2.fillText(String(v), w + 6, y + barH/2);
          }
          ctx2.restore();
          return true;
        }
      } catch(e){
        // swallow
      }
    };
  })();
})();


/* ================== NARAP: System Load Normalization (Analytics) ==================
   Converts backend metrics into a correct 0-100% value:
   - UNIX load averages (load1/load5/load15) → percent of total CPU capacity based on core count
   - Summed CPU% across cores (e.g., 730 on 8 cores) → normalized to 0-100%
   The wrapper updates common UI selectors if present and leaves originals intact.
============================================================================= */
(function fixSystemLoadDisplay(){
  if (window.__systemLoadFixBound) return;

  function coreCount() {
    return (Number(navigator.hardwareConcurrency) || 4);
  }

  // Accepts:
  //  - { load1, load5, load15 }    // UNIX load averages
  //  - { cpuPercent }              // may be 0-100 OR 0-(100*cores)
  function normalizeSystemLoad(metrics) {
    const cores = coreCount();

    if (metrics && typeof metrics.load1 === 'number') {
      let pct = (metrics.load1 / Math.max(1, cores)) * 100;
      pct = Math.max(0, Math.min(100, pct));
      return {
        percent: pct,
        label: `Load(1m): ${metrics.load1.toFixed(2)}`,
        detail: `${Math.round(pct)}% of ${cores} cores`
      };
    }

    if (metrics && typeof metrics.cpuPercent === 'number') {
      const raw = Number(metrics.cpuPercent);
      let pct = raw;
      if (raw > 100) pct = raw / Math.max(1, cores); // normalize summed cores
      pct = Math.max(0, Math.min(100, pct));
      return {
        percent: pct,
        label: `CPU: ${pct.toFixed(0)}%`,
        detail: (raw > 100 ? `normalized from ${raw.toFixed(0)}% across ${cores} cores` : `direct`)
      };
    }

    return { percent: 0, label: 'N/A', detail: 'no metrics' };
  }

  // Wrap analytics stats renderer
  const prev = window.renderAnalyticsStats;
  window.renderAnalyticsStats = function(data){
    try {
      // compute normalized load
      const m = (data && data.system) || (data && data.metrics) || data || {};
      const norm = normalizeSystemLoad(m);

      // call original first (so default UI renders)
      if (typeof prev === 'function') prev(data);

      // then adjust UI if targets exist
      const elText = document.querySelector('#systemLoadPercentText, .system-load-percent, [data-metric="system-load"] .value');
      if (elText) elText.textContent = `${Math.round(norm.percent)}%`;

      const elNote = document.querySelector('#systemLoadNote, .system-load-note, [data-metric="system-load"] .note');
      if (elNote) elNote.textContent = norm.label;

      const gauge = document.querySelector('#systemLoadGauge .fill, .system-load .fill');
      if (gauge) gauge.style.width = `${norm.percent}%`;
    } catch (e) {
      if (typeof prev === 'function') prev(data);
    }
  };

  window.__systemLoadFixBound = true;
})();


// Global error logger to pinpoint dynamic syntax issues
window.addEventListener('error', function(e){
  try { console.error('GLOBAL ERROR:', e.message, 'at', e.filename + ':' + e.lineno + ':' + e.colno); } catch (_) {}
});



/* ====== MEMBERS EXPORT BY STATE (DROP-IN) ====== */

function normalizeStateForExport(s) {
  // Robust normalizer: strips 'state', punctuation, accents, dashes/underscores;
  // maps aliases and returns Title Case for Nigerian states; FCT handled specially.
  let t = (s == null ? '' : String(s));

  // Normalize accents where supported
  if (typeof t.normalize === 'function') {
    t = t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  }

  t = t.toLowerCase().trim();

  // Common noise removals
  t = t.replace(/\bstate\b/g, '');      // remove 'state'
  t = t.replace(/[^a-z\s]/g, ' ');      // keep only letters/spaces
  t = t.replace(/\s+/g, ' ').trim();

  const ALIASES = {
    'federal capital territory': 'FCT',
    'abuja fct': 'FCT',
    'fct abuja': 'FCT',
    'abuja': 'FCT',
   'abia': 'Abia',
'adamawa': 'Adamawa',
'akwa ibom': 'Akwa Ibom',
'anambra': 'Anambra',
'bauchi': 'Bauchi',
'bayelsa': 'Bayelsa',
'benue': 'Benue',
'borno': 'Borno',
'cross river': 'Cross River',
'delta': 'Delta',
'ebonyi': 'Ebonyi',
'edo': 'Edo',
'ekiti': 'Ekiti',
'enugu': 'Enugu',
'gombe': 'Gombe',
'immo': 'Imo',
'jigawa': 'Jigawa',
'kaduna': 'Kaduna',
'kano': 'Kano',
'katsina': 'Katsina',
'kebbi': 'Kebbi',
'kogi': 'Kogi',
'kwara': 'Kwara',
'lagos': 'Lagos',
'nasarawa': 'Nasarawa',
'niger': 'Niger',
'ogun': 'Ogun',
'ondo': 'Ondo',
'osun': 'Osun',
'oyo': 'Oyo',
'plateau': 'Plateau',
'rivers': 'Rivers',
'sokoto': 'Sokoto',
'taraba': 'Taraba',
'yobe': 'Yobe',
'zamfara': 'Zamfara' // common misspelling
  };

  if (ALIASES[t]) return ALIASES[t];

  // Canonical Nigeria states + FCT (as lowercase for comparison)
  const CANON = new Set([
    'abia','adamawa','akwa ibom','anambra','bauchi','bayelsa','benue','borno',
    'cross river','delta','ebonyi','edo','ekiti','enugu','gombe','imo','jigawa',
    'kaduna','kano','katsina','kebbi','kogi','kwara','lagos','nasarawa','niger',
    'ogun','ondo','osun','oyo','plateau','rivers','sokoto','taraba','yobe','zamfara','fct'
  ]);

  // Helper: Title Case
  const toTitle = (str) => str.replace(/\b\w/g, c => c.toUpperCase());

  if (!t) return '';

  if (CANON.has(t)) {
    return t === 'fct' ? 'FCT' : toTitle(t);
  }

  // Fallback: Title Case cleaned string
  return toTitle(t);
}

// Optional: handy key form for comparisons (e.g., maps/sets)
function normalizeStateKey(s) {
  const canon = normalizeStateForExport(s);
  return canon.toLowerCase().replace(/\s+/g, '');
}

const NIGERIA_STATES_FOR_EXPORT = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta',
  'Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
  'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara','FCT'
];


if (typeof convertToCSV !== 'function') {
  function convertToCSV(rows) {
    const arr = Array.isArray(rows) ? rows : [];
    const cols = ['name','email','code','position','state','zone'];
    const esc = v => {
      const s = (v == null ? '' : String(v));
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const header = cols.join(',');
    const body = arr.map(m => {
      const row = {
        name: m.name ?? m.Name ?? '',
        email: m.email ?? m.Email ?? '',
        code: m.code ?? m.Code ?? '',
        position: (m.position ?? m.Position ?? '').toString().toUpperCase(),
        state: normalizeStateForExport(m.state ?? m.State ?? ''),
        zone: m.zone ?? m.Zone ?? ''
      };
      return cols.map(k => esc(row[k])).join(',');
    }).join('\n');
    return header + (body ? '\n' + body : '');
  }
}

if (typeof downloadFile !== 'function') {
  function downloadFile(content, filename, contentType) {
    try {
      const blob = new Blob([content], { type: contentType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'download.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('downloadFile failed:', e);
    }
  }
}

async function getAllMembersForExport() {
  try {
    if (typeof backendUrl !== 'undefined') {
      const r = await fetch(`${backendUrl}/api/users/getUsers`);
      if (r.ok) {
        const data = (typeof tryJson === 'function') ? await tryJson(r) : await r.json().catch(() => null);
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && data.success && Array.isArray(data.success.data)) return data.success.data;
      }
    }
  } catch (_) {}
  if (typeof getLocalMembers === 'function') return getLocalMembers() || [];
  return Array.isArray(window.members) ? window.members : [];
}

// Drop-in replacement: guarantees alphabetical export order
// Drop-in replacement: guarantees alphabetical export order and avoids await/blob

// === Robust state-filtered export (sorted & proper CSV/JSON) ===
// Usage stays compatible with your UI: exportMembersFiltered('csv', 'Lagos')
// === Robust state-filtered export (filters correctly, sorted, proper CSV/JSON) ===
// Accepts both styles: exportMembersFiltered('csv','Lagos') OR exportMembersFiltered({format:'csv', state:'Lagos'})
async function exportMembersFiltered(a = 'csv', b = 'ALL') {
  try {
    // ---- Resolve args (format/state), tolerating different call signatures ----
    function isFmt(x){ return typeof x === 'string' && /^(csv|json)$/i.test(x); }
    let format = 'csv';
    let stateFilter = 'ALL';

    if (a && typeof a === 'object') { // legacy object: {format, state}
      if (isFmt(a.format)) format = a.format.toLowerCase();
      if (a.state != null) stateFilter = String(a.state);
    } else {
      if (isFmt(a)) format = a.toLowerCase(); else if (a != null) stateFilter = String(a);
      if (isFmt(b)) format = b.toLowerCase(); else if (b != null) stateFilter = String(b);
    }

    // If still ALL and there is a DOM select, read it
    if ((!stateFilter || String(stateFilter).toUpperCase() === 'ALL') && typeof document !== 'undefined') {
      const sel = document.getElementById('exportStateSelect') || document.getElementById('stateFilter');
      if (sel && sel.value) stateFilter = sel.value;
    }

    // ---- Source data: prefer in-memory, fallback to local storage ----
    const source = (Array.isArray(window.members) && window.members.length)
      ? window.members
      : (typeof getLocalMembers === 'function' ? getLocalMembers() : []);

    if (!Array.isArray(source) || source.length === 0) {
      if (typeof showMessage === 'function') showMessage('No members to export', 'warning');
      return;
    }

    // ---- Normalizer (project"s existing function if available) ----
    const norm = (s) => (typeof normalizeStateForExport === 'function'
      ? normalizeStateForExport(s)
      : String(s ?? '').trim());

    // ---- Filter by state (accept multiple possible field names) ----
    const isAll = !stateFilter || String(stateFilter).toUpperCase() === 'ALL';
    let rows = source.filter(Boolean);
    if (!isAll) {
      const wanted = norm(stateFilter);
      rows = rows.filter(m => {
        const raw = m && (m.state ?? m.State ?? m['State of Residence'] ?? m.residenceState ?? m.memberState);
        return norm(raw || '') === wanted;
      });
    }

    if (!rows.length) {
      const label = isAll ? 'all states' : String(stateFilter);
      if (typeof showMessage === 'function') showMessage(`No members found for ${label}`, 'warning');
      return;
    }

    // ---- Sort: ALL -> by state (normalized) then name; single state -> by name ----
    const byName = (a, b) => {
      const an = String(a?.name ?? a?.fullName ?? a?.Name ?? '').trim();
      const bn = String(b?.name ?? b?.fullName ?? b?.Name ?? '').trim();
      return an.localeCompare(bn, undefined, { sensitivity: 'base' });
    };

    if (isAll) {
      rows.sort((a, b) => {
        const sa = norm(a?.state ?? a?.State ?? '');
        const sb = norm(b?.state ?? b?.State ?? '');
        const sCmp = sa.localeCompare(sb, undefined, { sensitivity: 'base' });
        return sCmp !== 0 ? sCmp : byName(a, b);
      });
    } else {
      rows.sort(byName);
    }

    // ---- Build filename ----
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = isAll ? 'all_states' : norm(stateFilter).replace(/\s+/g, '_').toLowerCase();
    const want = String(format || 'csv').toLowerCase();

    // ---- Serialize (use your convertToCSV if present; add BOM for Excel) ----
    let content, filename, contentType;
    if (want === 'json') {
      contentType = 'application/json;charset=utf-8';
      filename = `members_${slug}_${stamp}.json`;
      content = JSON.stringify(rows, null, 2);
    } else {
      contentType = 'text/csv;charset=utf-8';
      filename = `members_${slug}_${stamp}.csv`;
      const csvText = (typeof convertToCSV === 'function') ? convertToCSV(rows) : (function(arr){
        const cols = ['name','email','code','position','state','zone'];
        const esc = (v) => {
          const s = v == null ? '' : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const header = cols.join(',');
        const lines = arr.map(m => {
          const row = {
            name: m.name ?? m.Name ?? '',
            email: m.email ?? m.Email ?? '',
            code: m.code ?? m.Code ?? '',
            position: String(m.position ?? m.Position ?? '').toUpperCase(),
            state: norm(m.state ?? m.State ?? ''),
            zone: m.zone ?? m.Zone ?? ''
          };
          return cols.map(k => esc(row[k])).join(',');
        });
        return header + (lines.length ? '\n' + lines.join('\n') : '');
      })(rows);
      content = '\uFEFF' + csvText; // BOM
    }

    // ---- Download (use your helper if present) ----
    if (typeof downloadFile === 'function') {
      downloadFile(content, filename, contentType);
    } else {
      const blob = new Blob([content], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }

    if (typeof showMessage === 'function') {
      const label = isAll ? 'all states' : norm(stateFilter);
      showMessage(`Exported ${rows.length} member(s) for ${label}.`, 'success');
    }
  } catch (err) {
    console.error('Export failed:', err);
    if (typeof showMessage === 'function') showMessage('Export failed. See console for details.', 'danger');
  }
}



function exportMembersPrompt() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999';

  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:8px;padding:16px;width:90%;max-width:420px;box-shadow:0 10px 30px rgba(0,0,0,.2);font-family:system-ui,Arial,sans-serif';
  box.innerHTML = ''
    + '<h3 style="margin:0 0 12px;font-size:18px;">Export Members by State</h3>'
    + '<label style="display:block;margin-bottom:8px;font-size:14px;">Choose a state:</label>'
    + '<select id="exportStateSelect" style="width:100%;padding:10px;font-size:14px;border:1px solid #ccc;border-radius:6px;margin-bottom:12px;">'
    + '  <option value="ALL">All States</option>'
    + '</select>'
    + '<div style="display:flex;gap:8px;justify-content:flex-end;">'
    + '  <button id="cancelExportState" style="padding:8px 12px;border:1px solid #ddd;background:#f8f9fa;border-radius:6px;cursor:pointer;">Cancel</button>'
    + '  <button id="exportStateCSV" style="padding:8px 12px;background:#ffc107;color:#000;border:none;border-radius:6px;cursor:pointer;">Export CSV</button>'
    + '  <button id="exportStateJSON" style="padding:8px 12px;background:#17a2b8;color:#fff;border:none;border-radius:6px;cursor:pointer;">Export JSON</button>'
    + '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  (async () => {
    const sel = box.querySelector('#exportStateSelect');
    const seen = new Set(NIGERIA_STATES_FOR_EXPORT.map(s => s.toLowerCase()));
    try {
      const all = await getAllMembersForExport();
      for (const m of all) {
        const s = normalizeStateForExport(m.state || m.State || '');
        if (s && !seen.has(s.toLowerCase())) {
          seen.add(s.toLowerCase());
          NIGERIA_STATES_FOR_EXPORT.push(s);
        }
      }
    } catch (_) {}

    const sorted = [...new Set(NIGERIA_STATES_FOR_EXPORT)].sort((a, b) => a.localeCompare(b));
    for (const st of sorted) {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      sel.appendChild(opt);
    }
  })();

  const close = () => overlay.remove();
  box.querySelector('#cancelExportState').onclick = close;
  box.querySelector('#exportStateCSV').onclick = async () => {
    const val = box.querySelector('#exportStateSelect').value || 'ALL';
    close();
    await exportMembersFiltered({ format: 'csv', state: val });
  };
  box.querySelector('#exportStateJSON').onclick = async () => {
    const val = box.querySelector('#exportStateSelect').value || 'ALL';
    close();
    await exportMembersFiltered({ format: 'json', state: val });
  };
}

function exportMembersButton() { exportMembersPrompt(); }


function sanitizeMemberForFormData(member){
  const m = Object.assign({}, member);
  // Normalize odd email placeholders
  if (m.email && /^(nill|null|n\/a|na)$/i.test(String(m.email).trim())) {
    m.email = '';
  }
  // Trim basics
  ['name','email','code','position','state','zone','password'].forEach(k => {
    if (m[k] != null) m[k] = String(m[k]).trim();
  });
  return m;
}



// Upsert with graceful recovery: prefers PUT (server id), falls back to POST, and recovers from 400/404
async function upsertMemberFormData(member, formData) {
  // Resolve server ID by code/email first
  const pre = await lookupUserExists({ code: member.code, email: member.email });
  const doPut = async (id) => {
    const r = await fetch(`${backendUrl}/api/users/updateUser/${id}`, { method: 'PUT', body: formData });
    return r;
  };
  const doPost = async () => {
    const r = await fetch(`${backendUrl}/api/users/addUser`, { method: 'POST', body: formData });
    return r;
  };
  if (pre.exists && pre.id) {
    let r = await doPut(pre.id);
    if (r.ok) return { ok: true, status: r.status };
    if (r.status === 404) {
      const re = await lookupUserExists({ code: member.code, email: member.email });
      if (re.exists && re.id) {
        r = await doPut(re.id);
        if (r.ok) return { ok: true, status: r.status };
      }
      r = await doPost();
      if (r.ok) return { ok: true, status: r.status };
      if (r.status === 400) {
        const z = await lookupUserExists({ code: member.code, email: member.email });
        if (z.exists && z.id) {
          const r2 = await doPut(z.id);
          if (r2.ok) return { ok: true, status: r2.status };
          return { ok: false, status: r2.status, message: (await _safeJson(r2))?.message || 'PUT after POST-400 failed' };
        }
      }
      return { ok: false, status: r.status, message: (await _safeJson(r))?.message || 'PUT 404 and POST failed' };
    }
    if (!r.ok) {
      return { ok: false, status: r.status, message: (await _safeJson(r))?.message || 'PUT failed' };
    }
    return { ok: true, status: r.status };
  }
  let p = await doPost();
  if (p.ok) return { ok: true, status: p.status };
  if (p.status === 400) {
    const re = await lookupUserExists({ code: member.code, email: member.email });
    if (re.exists && re.id) {
      const r2 = await doPut(re.id);
      if (r2.ok) return { ok: true, status: r2.status };
      return { ok: false, status: r2.status, message: (await _safeJson(r2))?.message || 'PUT after POST-400 failed' };
    }
  }
  return { ok: false, status: p.status, message: (await _safeJson(p))?.message || 'Create failed' };
}

// Loads the System Activity panel
async function loadSystemActivityLogs() {
  try {
    var container = document.getElementById('systemActivityLogs') || document.getElementById('systemActivity');
    if (!container) return;

    var logs = (typeof getActivityLog === 'function') ? (getActivityLog() || []) : [];
    if (!Array.isArray(logs)) logs = [];

    // Keep all 'system' entries + recent critical non-system (deleted/updated), then sort by ts desc
    var sysOnly = logs.filter(function (e) { return e && e.entity === 'system'; });
    var critical = logs.filter(function (e) {
      return e && e.entity !== 'system' && (e.action === 'deleted' || e.action === 'updated');
    }).slice(0, 50);
    var sys = sysOnly.concat(critical).sort(function (a, b) {
      var ta = new Date(a && a.ts || 0).getTime();
      var tb = new Date(b && b.ts || 0).getTime();
      return tb - ta;
    });

    // Build UI
    container.innerHTML = '';
    var list = document.createElement('div');
    list.className = 'system-activity-list';
    list.style.maxHeight = '320px';
    list.style.overflow = 'auto';
    list.style.padding = '6px 0';

    function renderItem(e) {
      var when = (e && e.date && e.time)
        ? (String(e.date) + ' - ' + String(e.time))
        : new Date((e && e.ts) || Date.now()).toLocaleString();

      var title = '[' + String(e && e.entity || '').toLowerCase() + '] ' + String(e && e.action || '').toLowerCase();
      var sub = '';

      if (e && e.entity === 'member') {
        var d = e.data || {};
        sub = String(d.name || d.code || d.email || '');
      } else if (e && e.entity === 'certificate') {
        var c = e.data || {};
        sub = String(c.number || c.certificateNumber || c.member || c.recipient || '');
      } else if (e && e.entity === 'system') {
        var s = e.data || {};
        if (s && s.totalPending != null) sub = String(s.totalPending) + ' change(s) pending';
        else sub = String(s.message || '');
      }

      return '' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid #f6f6f6;">' +
          '<div><strong>' + title + '</strong> ' +
            '<span style="color:#6c757d;">' + sub + '</span></div>' +
          '<div style="color:#6c757d;font-size:12px;">' + when + '</div>' +
        '</div>';
    }

    if (!sys.length) {
      list.innerHTML = '<div style="text-align:center;color:#6c757d;padding:16px;">No system activity</div>';
    } else {
      list.innerHTML = sys.map(renderItem).join('');
    }
    container.appendChild(list);
  } catch (error) {
    try {
      if (typeof showMessage === 'function') {
        showMessage('Failed to load system activity: ' + (error && error.message ? error.message : String(error)), 'error');
      } else {
        console.error('Failed to load system activity:', error);
      }
    } catch (_) {}
  }
}

/* ---------- Ghost popup cleanup (separate, safe IIFE) ---------- */
(function ghostPopupCleanup() {
  // Returns true only if the element has no visible text content and no visual media
  function isTrulyEmpty(el) {
    try {
      if (!el) return true;
      // quick text check
      if ((el.textContent || '').trim()) return false;

      // check text nodes
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      var node;
      while ((node = walker.nextNode())) {
        if ((node.nodeValue || '').trim()) return false;
      }

      // check for basic visible media
      if (el.querySelector && el.querySelector('img, svg, video, canvas')) return false;

      return true;
    } catch (_) {
      return false;
    }
  }

  function removeGhosts() {
    try {
      // Known containers that sometimes get left empty
      var suspects = [
        '#notification-container',
        '.notification',
        '.toast',
        '.snackbar',
        '.alert',
        '.modal.show',
        '.modal'
      ];

      var smallFixed = Array.prototype.slice.call(document.querySelectorAll('*')).filter(function (el) {
        try {
          var cs = window.getComputedStyle(el);
          if (!cs) return false;
          if (!(cs.position && (cs.position === 'fixed' || cs.position === 'absolute' || cs.position === 'sticky'))) return false;
          var w = el.offsetWidth, h = el.offsetHeight;
          if (w === 0 && h === 0) return false;
          var tiny = (w <= 160 && h <= 80);
          return tiny && isTrulyEmpty(el);
        } catch (_) { return false; }
      });

      var found = new Set();
      suspects.forEach(function (sel) {
        var nodes = document.querySelectorAll(sel);
        Array.prototype.forEach.call(nodes, function (el) {
          if (isTrulyEmpty(el)) found.add(el);
        });
      });
      smallFixed.forEach(function (el) { found.add(el); });

      var removed = 0;
      found.forEach(function (el) {
        try {
          var live = el.getAttribute('aria-live') || '';
          if (/polite|assertive/i.test(live)) {
            el.style.display = 'none';
            return;
          }
          if (el.parentNode) {
            el.parentNode.removeChild(el);
            removed++;
          }
        } catch (_) {}
      });

      if (removed > 0) {
        try { console.log('Removed ghost popups:', removed); } catch (_) {}
      }
    } catch (e) {
      try { console.warn('Ghost cleanup failed:', e); } catch (_) {}
    }
  }

  // CSS safeguard (hide empty notification containers)
  try {
    if (!document.getElementById('ghost-popup-styles')) {
      var style = document.createElement('style');
      style.id = 'ghost-popup-styles';
      style.textContent =
        '#notification-container:empty { display: none !important; }' +
        '#notification-container .notification:empty { display: none !important; }' +
        '.toast:empty, .snackbar:empty, .alert:empty { display: none !important; }';
      document.head.appendChild(style);
    }
  } catch (_) {}

  // Run now (if DOM ready) and on next ticks
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeGhosts, { once: true });
  } else {
    removeGhosts();
  }
  setTimeout(removeGhosts, 100);
  setTimeout(removeGhosts, 600);
  setTimeout(removeGhosts, 2000);
})();


// ===== Ghost Popup Watcher (MutationObserver) =====
(function ghostPopupWatcher(){
  function hasMeaningfulText(el){
    if (!el) return false;
    const txt = (el.textContent || '').replace(/\u00A0/g,' ').trim();
    return txt.length > 0;
  }
  function isTiny(el){
    try {
      const rect = el.getBoundingClientRect();
      return rect.width <= 220 && rect.height <= 120;
    } catch { return false; }
  }
  function nearTop(el){
    try {
      const rect = el.getBoundingClientRect();
      return rect.top <= 140; // within top 140px of viewport
    } catch { return false; }
  }
  function killToastish(el){
    try {
      // Remove truly empty Bootstrap toasts
      if (el.matches('.toast')) {
        const body = el.querySelector('.toast-body');
        if (!hasMeaningfulText(body)) {
          el.remove();
          return true;
        }
      }
      // Remove empty containers
      if (el.matches('.toast-container')) {
        const hasAny = Array.from(el.querySelectorAll('.toast')).some(t => {
          const body = t.querySelector('.toast-body');
          return hasMeaningfulText(body);
        });
        if (!hasAny) { el.remove(); return true; }
      }
    } catch {}
    return false;
  }
  function isGhost(el){
    if (!el || !(el instanceof Element)) return false;
    const sel = el.matches.bind(el);
    const isCandidate =
      sel('#notification-container') ||
      sel('.notification') ||
      sel('.toast, .toast-container') ||
      sel('.snackbar, .mdc-snackbar, .alert') ||
      sel('.modal.show, .modal');
    if (!isCandidate) return false;

    if (killToastish(el)) return true;
    const empty = !hasMeaningfulText(el);
    return empty && isTiny(el) && nearTop(el);
  }
  function sweep(nodeList){
    let removed = 0;
    nodeList.forEach(el => {
      try {
        if (isGhost(el)) { removed++; return; }
        el.querySelectorAll && el.querySelectorAll('.toast, .toast-container, #notification-container, .notification, .snackbar, .mdc-snackbar, .alert, .modal').forEach(child => {
          if (isGhost(child)) removed++;
        });
      } catch {}
    });
    if (removed) { try { console.log('🧽 Ghost watcher removed:', removed); } catch {} }
  }
  // Initial sweep
  if (document.body) sweep([document.body]);

  // Observe changes anywhere in the body
  const observer = new MutationObserver((mutations) => {
    const added = [];
    for (const m of mutations) {
      m.addedNodes && m.addedNodes.forEach(n => {
        if (n.nodeType === 1) added.push(n);
      });
    }
    if (added.length) sweep(added);
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Also sweep periodically for slow loaders
  setInterval(() => { try { sweep([document.body]); } catch {} }, 3000);
})();

// Extra CSS: hide empty toast bodies/containers using :has where supported
try {
  if (!document.getElementById('ghost-watcher-styles')) {
    const style = document.createElement('style');
    style.id = 'ghost-watcher-styles';
    style.textContent = `
      .toast:has(.toast-body:empty) { display: none !important; }
      .toast .toast-body:empty { display: none !important; }
      .toast-container:has(.toast:empty), .toast-container:not(:has(.toast)) { display: none !important; }
    `;
    document.head.appendChild(style);
  }
} catch {}



// ===== Activity Overlay Visibility Manager =====
(function activityOverlayVisibility(){
  function canScroll(el){
    if (!el) return false;
    try {
      return (el.scrollHeight - el.clientHeight) > 2;
    } catch { return false; }
  }
  function updateActivityOverlayVisibility(){
    try {
      const overlay = document.getElementById('activityScrollOverlay');
      if (!overlay) return;
      const ra = document.getElementById('recentActivity');
      const sa = document.getElementById('systemActivityLogs') || document.getElementById('systemActivity');
      const show = canScroll(ra) || canScroll(sa);
      overlay.style.display = show ? 'flex' : 'none';
    } catch {}
  }
  // Expose globally for other code to call after rendering
  window.updateActivityOverlayVisibility = updateActivityOverlayVisibility;

  function bind(){
    const ra = document.getElementById('recentActivity');
    const sa = document.getElementById('systemActivityLogs') || document.getElementById('systemActivity');
    [ra, sa].forEach(el => {
      if (!el) return;
      el.addEventListener('scroll', updateActivityOverlayVisibility, { passive: true });
      el.addEventListener('mouseenter', updateActivityOverlayVisibility, { passive: true });
    });
    window.addEventListener('resize', updateActivityOverlayVisibility, { passive: true });

    // Initial checks (for async content too)
    updateActivityOverlayVisibility();
    setTimeout(updateActivityOverlayVisibility, 200);
    setTimeout(updateActivityOverlayVisibility, 800);
    setTimeout(updateActivityOverlayVisibility, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();



// ===== Replaced Scroll Arrows: Top above Recent Activity, Bottom before Footer =====
(function replaceScrollArrows(){
  try {
    // CSS (idempotent)
    if (!document.getElementById('ra-scroll-arrows-css')) {
      const css = document.createElement('style');
      css.id = 'ra-scroll-arrows-css';
      css.textContent = `
        #raArrowTopWrap, #raArrowBottomWrap { display:flex; justify-content:center; pointer-events:none; }
        #raArrowTopWrap { margin: 4px 0 6px; }
        #raArrowBottomWrap { margin: 6px 0 4px; }
        .ra-arrow-btn { pointer-events:auto; border:none; background:#fff; border-radius:9999px; width:28px; height:28px; cursor:pointer; font-size:14px; line-height:1; box-shadow:0 4px 12px rgba(0,0,0,.08); }
        .ra-arrow-btn:disabled { opacity:.35; cursor:default; }
      `;
      document.head.appendChild(css);
    }

    // New behavior for initLogScrollArrows
    window.initLogScrollArrows = function(){
      const ra = document.getElementById('recentActivity');
      if (!ra) return;

      // Remove legacy overlay if it exists
      const old = document.getElementById('activityScrollOverlay');
      if (old) old.remove();

      // Ensure wrappers exist and are placed correctly
      let topWrap = document.getElementById('raArrowTopWrap');
      if (!topWrap) {
        topWrap = document.createElement('div');
        topWrap.id = 'raArrowTopWrap';
        // place directly BEFORE the recentActivity box
        (ra.parentElement || document.body).insertBefore(topWrap, ra);
      }

      let bottomWrap = document.getElementById('raArrowBottomWrap');
      if (!bottomWrap) {
        bottomWrap = document.createElement('div');
        bottomWrap.id = 'raArrowBottomWrap';
        // place directly AFTER the recentActivity box (will visually sit just before the footer)
        if (ra.parentElement) {
          if (ra.nextSibling) ra.parentElement.insertBefore(bottomWrap, ra.nextSibling);
          else ra.parentElement.appendChild(bottomWrap);
        } else {
          document.body.appendChild(bottomWrap);
        }
      }

      // Create/attach buttons (idempotent)
      let upBtn = document.getElementById('raArrowUp');
      if (!upBtn) {
        upBtn = document.createElement('button');
        upBtn.id = 'raArrowUp';
        upBtn.className = 'ra-arrow-btn';
        upBtn.title = 'Scroll up';
        upBtn.textContent = '▲';
        topWrap.innerHTML = ''; // ensure single button
        topWrap.appendChild(upBtn);
      }

      let downBtn = document.getElementById('raArrowDown');
      if (!downBtn) {
        downBtn = document.createElement('button');
        downBtn.id = 'raArrowDown';
        downBtn.className = 'ra-arrow-btn';
        downBtn.title = 'Scroll down';
        downBtn.textContent = '▼';
        bottomWrap.innerHTML = ''; // ensure single button
        bottomWrap.appendChild(downBtn);
      }

      const scrollBy = (dy) => ra.scrollBy({ top: dy, left: 0, behavior: 'smooth' });

      upBtn.onclick = () => scrollBy(-220);
      downBtn.onclick = () => scrollBy(220);

      const update = () => {
        // Show wrappers only when list can scroll
        const canScroll = (ra.scrollHeight - ra.clientHeight) > 2;
        topWrap.style.display = canScroll ? 'flex' : 'none';
        bottomWrap.style.display = canScroll ? 'flex' : 'none';

        if (!canScroll) return;

        // Enable/disable based on position
        upBtn.disabled = ra.scrollTop <= 1;
        downBtn.disabled = (ra.scrollTop + ra.clientHeight) >= (ra.scrollHeight - 1);
      };

      ra.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update, { passive: true });

      // Initial checks
      update();
      setTimeout(update, 100);
      setTimeout(update, 600);
      setTimeout(update, 1500);
    };
  } catch (e) {
    try { console.warn('replaceScrollArrows failed:', e); } catch {}
  }
})();


// ===== Replaced Scroll Arrows: Top above Recent Activity, Bottom before Footer (FIXED) =====
(function setupRecentActivityArrows() {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  onReady(function run() {
    // Helpers re-query DOM so there are no stale/undefined globals
    function getRA() { return document.getElementById('recentActivity'); }
    function getSA() { return document.getElementById('systemActivityLogs') || document.getElementById('systemActivity'); }
    function getList1() {
      var ra = getRA();
      if (!ra) return null;
      return ra.querySelector('.recent-activity-list') || ra;
    }
    function getList2() {
      var sa = getSA();
      if (!sa) return null;
      return sa.querySelector('.system-activity-list') || sa;
    }
    function getFooterEl() {
      return document.getElementById('mainFooter') || document.getElementById('footer') || document.querySelector('footer');
    }

    // Remove any legacy centered overlay if present
    var legacy = document.getElementById('activityScrollOverlay');
    if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);

    // Ensure CSS (idempotent)
    if (!document.getElementById('ra-scroll-arrows-css')) {
      var css = document.createElement('style');
      css.id = 'ra-scroll-arrows-css';
      css.textContent =
        '#raArrowTopWrap, #raArrowBottomWrap { display:flex; justify-content:center; pointer-events:none; }' +
        '#raArrowTopWrap { margin: 6px 0 8px; }' +
        '#raArrowBottomWrap { margin: 8px 0 6px; }' +
        '.ra-arrow-btn { pointer-events:auto; border:none; background:#fff; border-radius:9999px; width:28px; height:28px; cursor:pointer; font-size:14px; line-height:1; box-shadow:0 4px 12px rgba(0,0,0,.08); }' +
        '.ra-arrow-btn:disabled { opacity:.35; cursor:default; }';
      document.head.appendChild(css);
    }

    // Create wrappers relative to RA and Footer
    function ensureTopWrap() {
      var topWrap = document.getElementById('raArrowTopWrap');
      if (!topWrap) {
        topWrap = document.createElement('div');
        topWrap.id = 'raArrowTopWrap';
        var ra = getRA();
        if (ra && ra.parentElement) {
          ra.parentElement.insertBefore(topWrap, ra);
        } else {
          document.body.appendChild(topWrap);
        }
      }
      return topWrap;
    }

    function ensureBottomWrap() {
      var bottomWrap = document.getElementById('raArrowBottomWrap');
      if (!bottomWrap) {
        bottomWrap = document.createElement('div');
        bottomWrap.id = 'raArrowBottomWrap';
        var footer = getFooterEl();
        if (footer && footer.parentElement) {
          footer.parentElement.insertBefore(bottomWrap, footer);
        } else {
          // fallback: after RA
          var ra = getRA();
          if (ra && ra.parentElement) {
            if (ra.nextSibling) ra.parentElement.insertBefore(bottomWrap, ra.nextSibling);
            else ra.parentElement.appendChild(bottomWrap);
          } else {
            document.body.appendChild(bottomWrap);
          }
        }
      }
      return bottomWrap;
    }

    function makeBtn(id, label) {
      var btn = document.getElementById(id);
      if (!btn) {
        btn = document.createElement('button');
        btn.id = id;
        btn.className = 'ra-arrow-btn';
        btn.type = 'button';
        btn.textContent = label;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var el = active || getList1() || getList2();
          if (!el) return;
          var dy = (id === 'activityArrowUp') ? -220 : 220;
          el.scrollBy({ top: dy, left: 0, behavior: 'smooth' });
        });
      }
      return btn;
    }

    var topWrap = ensureTopWrap();
    var bottomWrap = ensureBottomWrap();

    // Clear & mount to avoid duplicates
    topWrap.innerHTML = '';
    bottomWrap.innerHTML = '';
    topWrap.appendChild(makeBtn('activityArrowUp', '▲'));
    bottomWrap.appendChild(makeBtn('activityArrowDown', '▼'));

    var active = null;
    function update() {
      var el = active || getList1() || getList2();
      var upBtn = document.getElementById('activityArrowUp');
      var dnBtn = document.getElementById('activityArrowDown');
      if (!el || !upBtn || !dnBtn) return;
      var atTop = el.scrollTop <= 0;
      var atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
      upBtn.disabled = atTop;
      dnBtn.disabled = atBottom;
    }

    // Bind hover/scroll
    var l1 = getList1();
    var l2 = getList2();
    if (l1) {
      l1.addEventListener('mouseenter', function () { active = l1; update(); }, { passive: true });
      l1.addEventListener('scroll', update, { passive: true });
    }
    if (l2) {
      l2.addEventListener('mouseenter', function () { active = l2; update(); }, { passive: true });
      l2.addEventListener('scroll', update, { passive: true });
    }

    // Keep visibility manager in sync if available
    if (typeof window !== 'undefined' && typeof window.updateActivityOverlayVisibility === 'function') {
      try {
        window.updateActivityOverlayVisibility();
        window.addEventListener('resize', window.updateActivityOverlayVisibility, { passive: true });
      } catch (_) {}
    }

    // Initial state
    update();
    setTimeout(update, 200);
    setTimeout(update, 800);
  });
})();



// === Certificate Dedupe + Normalization Patch (added) ===
(function(){
  if (window.__certificateDedupePatchApplied) return;
  window.__certificateDedupePatchApplied = true;
  const norm = s => String(s||'').toUpperCase().replace(/\s+/g,'').trim();
  const keyNum = c => norm(c && (__extractCertNumber(c) || c.certificateNumber || c.number));
  function mergeCert(a,b){
    if (!a) return b||{};
    if (!b) return a||{};
    const newer = new Date(b.updatedAt||b.revokedAt||b.createdAt||0) > new Date(a.updatedAt||a.revokedAt||a.createdAt||0) ? b : a;
    return Object.assign({}, a, b, newer); // prefer fields from newer
  }
  function dedupeCertificates(list){
    if (!Array.isArray(list)) return [];
    const byId = new Map();
    const byNum = new Map();
    const out = [];
    for (const c0 of list){
      if (!c0) continue;
      const c = Object.assign({}, c0);
      // Normalize numbers
      const n = keyNum(c);
      if (n){ c.certificateNumber = n; c.number = n; } else { const raw = __extractCertNumber(c); if (raw){ const nn = norm(raw); c.certificateNumber = nn; c.number = nn; } }
      const id = c._id || c.id || null;
      // Merge by id first
      if (id){
        if (byId.has(id)){
          const merged = mergeCert(byId.get(id), c);
          byId.set(id, merged);
        } else {
          byId.set(id, c);
        }
      } else if (n){
        if (byNum.has(n)){
          const merged = mergeCert(byNum.get(n), c);
          byNum.set(n, merged);
        } else {
          byNum.set(n, c);
        }
      } else {
        out.push(c);
      }
    }
    // Cross-merge id and number maps when they refer to the same cert
    const usedNums = new Set();
    for (const [id, c] of byId){
      const n = keyNum(c);
      if (n && byNum.has(n)){
        const merged = mergeCert(c, byNum.get(n));
        byId.set(id, merged);
        usedNums.add(n);
      }
    }
    byNum.forEach((c, n) => {
      if (!usedNums.has(n)){
        out.push(c);
      }
    });
    out.push(...byId.values());
    // Final uniqueness by normalized number
    const finalMap = new Map();
    for (const c of out){
      const n = keyNum(c) || ('NO_NUM_'+(c._id||c.id||Math.random().toString(36).slice(2)));
      if (finalMap.has(n)){
        finalMap.set(n, mergeCert(finalMap.get(n), c));
      } else {
        finalMap.set(n, c);
      }
    }
    return Array.from(finalMap.values());
  }
  // Wrap saveLocalCertificates
  const __origSaveLocalCertificates = typeof saveLocalCertificates === 'function' ? saveLocalCertificates : function(x){ try{ localStorage.setItem('narap_certificates', JSON.stringify(x||[])); }catch(e){} };
  window.saveLocalCertificates = function(certs){
    try{
      const cleaned = dedupeCertificates(Array.isArray(certs)?certs:[]);
      return __origSaveLocalCertificates(cleaned);
    }catch(e){
      return __origSaveLocalCertificates(certs);
    }
  };
  // Wrap getLocalCertificates to normalize/dedupe on read
  const __origGetLocalCertificates = typeof getLocalCertificates === 'function' ? getLocalCertificates : function(){ try{ return JSON.parse(localStorage.getItem('narap_certificates')||'[]'); }catch(e){ return []; } };
  window.getLocalCertificates = function(){
    const list = __origGetLocalCertificates() || [];
    return dedupeCertificates(list);
  };
  // One-off cleanup on load
  try{
    const current = __origGetLocalCertificates() || [];
    const cleaned = dedupeCertificates(current);
    __origSaveLocalCertificates(cleaned); // always normalize and save
    if (Array.isArray(window.currentCertificates)) {
      window.currentCertificates = dedupeCertificates(window.currentCertificates);
    }
  }catch(_){}
  // Expose audit helper
  window.auditCertificateDuplicates = function(){
    const list = __origGetLocalCertificates()||[];
    const seen = new Set();
    const duplicates = [];
    for (const c of list){
      const n = norm(c && (c.certificateNumber||c.number));
      if (!n) continue;
      if (seen.has(n)) duplicates.push(c);
      else seen.add(n);
    }
    console.table((duplicates||[]).map(c=>({id:c._id||c.id, number:c.certificateNumber||c.number, recipient:c.recipientName||c.recipient||c.name, title:c.title||c.certificateTitle, type:c.type||c.certificateType, updatedAt:c.updatedAt||c.createdAt})));
    return duplicates;
  };
})();
// === End Certificate Dedupe Patch ===

/* ========== NARAP - State Select Patch (final safe) ========== */
(function(){
  const NIGERIA_STATES = [
    "ABIA","ADAMAWA","AKWA IBOM","ANAMBRA","BAUCHI","BAYELSA","BENUE","BORNO",
    "CROSS RIVER","DELTA","EBONYI","EDO","EKITI","ENUGU","FCT","GOMBE","IMO",
    "JIGAWA","KADUNA","KANO","KATSINA","KEBBI","KOGI","KWARA","LAGOS",
    "NASARAWA","NIGER","OGUN","ONDO","OSUN","OYO","PLATEAU","RIVERS",
    "SOKOTO","TARABA","YOBE","ZAMFARA"
  ];

  function buildStateSelect(currentValue){
    const sel = document.createElement('select');
    sel.id = 'editMemberState';
    sel.required = true;
    sel.innerHTML = '<option value=\"\">SELECT STATE</option>' +
      NIGERIA_STATES.map(s => `<option value="${s}">${s}</option>`).join('');
    if (currentValue) {
      const up = String(currentValue).trim().toUpperCase();
      if (!NIGERIA_STATES.includes(up)) {
        const opt = document.createElement('option');
        opt.value = up;
        opt.textContent = up;
        sel.appendChild(opt);
      }
      sel.value = up;
    }
    return sel;
  }

  function ensureStateSelect(){
    const el = document.getElementById('editMemberState');
    if (!el) return;
    if (el.tagName && el.tagName.toLowerCase() === 'select') return; // already fine
    const value = el.value || el.getAttribute('value') || '';
    const sel = buildStateSelect(value);
    el.replaceWith(sel);
  }

  window.setMemberState = function(stateValue){
    const el = document.getElementById('editMemberState');
    if (!el) return;
    const up = stateValue ? String(stateValue).trim().toUpperCase() : '';
    el.value = up || '';
  };

  // Wrap showEditMemberModal
  (function(){
    const orig = window.showEditMemberModal;
    if (typeof orig !== 'function') return;
    window.showEditMemberModal = function(memberId){
      ensureStateSelect();
      const ret = orig.apply(this, arguments);
      try{
        const coll = (window.currentMembers || window.members || []);
        const m = coll.find(mm => mm && (mm._id === memberId || mm.id === memberId));
        if (m) window.setMemberState(m.state || m.State || '');
      }catch(_){}
      return ret;
    };
  })();

  // State select helper for editMember
  function ensureStateSelectForEdit() {
    try {
      const el = document.getElementById('editMemberState');
      if (el) el.value = (el.value || '').toString().trim().toUpperCase();
    } catch(_) {}
  }

  // Run once on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureStateSelect);
  } else {
    ensureStateSelect();
  }

  console.log('✅ State Select Patch (final safe) active');
})();

/* ===== NARAP - Post-Edit State Reindex Patch =====
   Ensures that after changing a member's state (e.g., ABIA -> KADUNA),
   the member moves to the new state's list in the UI immediately.
   - Non-invasive: wraps existing editMember without altering its internals.
   - Works whether editMember is sync or returns a Promise.
*/
(function(){
  function getEditingMemberId(){
    // Try hidden field first
    const hidden = document.getElementById('editMemberId');
    if (hidden && hidden.value) return hidden.value;
    // Try modal data attribute
    const modal = document.getElementById('editMemberModal');
    if (modal && modal.dataset && modal.dataset.memberId) return modal.dataset.memberId;
    // Fallback: use a last-selected global if your app sets it
    if (window.__editingMemberId) return window.__editingMemberId;
    return null;
  }

  function getNewStateValue(){
    const el = document.getElementById('editMemberState');
    if (!el) return null;
    return (el.value || '').toString().trim().toUpperCase() || null;
  }

  function applyStateToCaches(memberId, newState){
    if (!memberId || !newState) return;

    function applyTo(arr){
      if (!Array.isArray(arr)) return;
      const idx = arr.findIndex(m => m && (m._id === memberId || m.id === memberId));
      if (idx >= 0) {
        if (arr[idx]) {
          arr[idx].state = newState;
          if ('State' in arr[idx]) arr[idx].State = newState;
        }
      }
    }

    // Update likely caches
    applyTo(window.members);
    applyTo(window.currentMembers);
    applyTo(window.filteredMembers);

    // Re-run filters / renderers
    if (typeof window.filterMembers === 'function') {
      window.filterMembers(); // will respect the chosen stateFilter value
    } else if (typeof window.renderMembers === 'function') {
      window.renderMembers(Array.isArray(window.members) ? window.members : []);
    } else {
      // Last resort: refresh pagination controls if present
      if (typeof window.updatePaginationControls === 'function') {
        try { window.updatePaginationControls(); } catch (_){}
      }
    }
  }

  const orig = window.editMember;
  if (typeof orig !== 'function') return;

  window.editMember = function(ev){
    // Capture memberId and previous state BEFORE calling original editMember
    /* memberId captured earlier */
    let prevState = null;
    try {
      const coll = (window.currentMembers || window.members || []);
      const mm = coll.find(m => m && (m._id === memberId || m.id === memberId));
      if (mm) prevState = (mm.state || mm.State || '').toString().trim().toUpperCase() || null;
    } catch(_) {}
    /* memberId captured earlier */
    // Ensure select is uppercase (harmonize with your existing patch)
    try {
      const sel = document.getElementById('editMemberState');
      if (sel) sel.value = (sel.value || '').toString().trim().toUpperCase();
    } catch(_){}

    const ret = orig.apply(this, arguments);

    // When finished (sync or async), update caches and redraw
    const finalize = () => {
      // After original edit completes, compare and log activity
      let newState = null;
      try {
        newState = getNewStateValue();
        applyStateToCaches(memberId, newState);
        try {
          if (prevState && newState && prevState !== newState) {
            // Build a minimal identity for the member
            let meta = { id: memberId, from: prevState, to: newState };
            try {
              const coll2 = (window.currentMembers || window.members || []);
              const mm2 = coll2.find(m => m && (m._id === memberId || m.id === memberId));
              if (mm2) {
                meta.code = mm2.code || undefined;
                meta.name = mm2.name || mm2.fullName || undefined;
              }
            } catch(_){}
            if (typeof window.activityLogger?.member === 'function') {
              window.activityLogger.member('state_moved', meta);
            } else if (typeof window.logMemberUpdate === 'function') {
              // Fallback: still log as an update
              window.logMemberUpdate({ _id: memberId, state: newState });
            }
          }
        } catch (_){ }
        if (typeof window.showMessage === 'function' && newState) {
          window.showMessage(`Member moved to ${newState}` + (prevState?` from ${prevState}`:''), 'success');
        }
      } catch(_){}
    };

    if (ret && typeof ret.then === 'function') {
      // Promise-like
      return ret.then(function(x){ finalize(); return x; })
                .catch(function(e){ finalize(); throw e; });
    } else {
      // Synchronous path
      setTimeout(finalize, 0);
      return ret;
    }
  };
})();

/* ===== NARAP - EditMember Harden (handles 'row is not defined' gracefully) ===== */
(function(){
  const orig = window.editMember;
  if (typeof orig !== 'function') return;

  function getValByIds(ids){
    for (const id of ids){
      const el = document.getElementById(id);
      if (el && typeof el.value !== 'undefined') return el.value;
    }
    // name selector fallback
    for (const id of ids){
      const el = document.querySelector(`[name="${id}"]`);
      if (el && typeof el.value !== 'undefined') return el.value;
    }
    return '';
  }

  async function safeBackendUpdate(memberId, payload){
    const url = `/api/users/${memberId}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const t = await res.text().catch(()=>'');
      throw new Error(`Backend ${res.status}: ${t || res.statusText}`);
    }
    return await res.json();
  }

  function getEditingMemberId(){
    const hidden = document.getElementById('editMemberId');
    if (hidden && hidden.value) return hidden.value;
    const modal = document.getElementById('editMemberModal');
    if (modal && modal.dataset && modal.dataset.memberId) return modal.dataset.memberId;
    if (window.__editingMemberId) return window.__editingMemberId;
    return '';
  }

  function uppercase(s){ return (s||'').toString().trim().toUpperCase(); }

  function afterSuccessApply(updated){
    try{
      // Update caches
      const id = updated._id || updated.id || getEditingMemberId();
      const newState = uppercase(updated.state || updated.State);
      const coll = (window.currentMembers || window.members || []);
      const m = coll.find(mm => mm && (mm._id === id || mm.id === id));
      const prevState = m ? uppercase(m.state || m.State) : null;
      if (m){
        // copy common fields
        if (updated.name) m.name = updated.name;
        if (updated.code) m.code = updated.code;
        if (updated.position) m.position = updated.position;
        if (newState) { m.state = newState; m.State = newState; }
        if (updated.zone) m.zone = updated.zone;
      }
      if (typeof window.filterMembers === 'function') window.filterMembers();
      else if (typeof window.renderMembers === 'function') window.renderMembers(coll);

      // Activity + toast
      if (prevState && newState && prevState !== newState) {
        if (typeof window.activityLogger?.member === 'function') {
          window.activityLogger.member('state_moved', { id, name: m?.name, code: m?.code, from: prevState, to: newState });
        }
        if (typeof window.showMessage === 'function')
          window.showMessage(`Member moved to ${newState} from ${prevState}`, 'success');
      } else {
        if (typeof window.showMessage === 'function')
          window.showMessage('Member updated', 'success');
      }
    }catch(_){}
  }

  function doFallback(ev){
    try{ if (ev && typeof ev.preventDefault==='function') ev.preventDefault(); }catch(_){}

    const id = getEditingMemberId();

    // Gather values from modal fields (IDs or name attributes)
    const name = getValByIds(['editMemberName','name']);
    const code = getValByIds(['editMemberCode','code']);
    const position = getValByIds(['editMemberPosition','position']);
    const state = uppercase(getValByIds(['editMemberState','state']));
    const zone = getValByIds(['editMemberZone','zone']);

    const payload = { name, code, position, state, zone };

    // Submit to backend via JSON (server override handles normalization + cert sync)
    return safeBackendUpdate(id, payload)
      .then(updated => { afterSuccessApply(updated); return updated; })
      .catch(err => {
        console.error('Fallback editMember backend error:', err);
        if (typeof window.showMessage === 'function')
          window.showMessage('Failed to update member: ' + (err.message || err), 'danger');
        throw err;
      });
  }

  window.editMember = function(ev){
    let ret;
    try {
      ret = orig.apply(this, arguments);
    } catch(e){
      if (e && /row is not defined|memberToDelete is not defined/i.test(String(e.message||''))) {
        return doFallback(ev);
      } else {
        throw e;
      }
    }

    if (ret && typeof ret.then === 'function') {
      return ret.catch(e => {
        if (e && /row is not defined|memberToDelete is not defined/i.test(String(e.message||''))) {
          return doFallback(ev);
        }
        throw e;
      });
    }
    return ret;
  };
})();

/* ===================== NARAP - All-in-One Edit + ID + Activity Override (v10) =====================
   Adds POST override fallback for 405 Method Not Allowed responses.
   Order of attempts:
     1) PUT (JSON)
     2) PUT (FormData)
     3) POST + X-HTTP-Method-Override: PUT (JSON)
     4) POST + X-HTTP-Method-Override: PUT (FormData)
==================================================================================================== */
(function(){
  // --- Helpers ---
  const $ = (id) => document.getElementById(id);
  const val = (id) => { const el = $(id); return el && typeof el.value !== 'undefined' ? el.value : ''; };
  const up = (s) => (s||'').toString().trim().toUpperCase();

  function ensureHiddenEditId(memberId){
    let hid = $('editMemberId');
    if (!hid) {
      const form = $('editMemberForm') || document.querySelector('#editMemberModal form');
      hid = document.createElement('input');
      hid.type = 'hidden'; hid.id = 'editMemberId'; hid.name = 'memberId';
      if (form) form.appendChild(hid); else document.body.appendChild(hid);
    }
    if (memberId) hid.value = memberId;
    return hid;
  }

  function setModalDataset(memberId){
    const modal = $('editMemberModal');
    if (modal && memberId) {
      if (!modal.dataset) modal.dataset = {};
      modal.dataset.memberId = memberId;
    }
  }

  // Capture last clicked edit triggers
  document.addEventListener('click', (e) => {
    try{
      const t = e.target && e.target.closest('[data-member-id], [data-id], .edit-member, [data-action="edit"]');
      if (!t) return;
      const id = t.getAttribute('data-member-id') || t.getAttribute('data-id');
      if (id) {
        window.__editingMemberId = id;
        ensureHiddenEditId(id);
        setModalDataset(id);
      }
    }catch(_){}
  }, true);

  // Wrap showEditMemberModal to persist id
  (function(){
    const orig = window.showEditMemberModal;
    if (typeof orig !== 'function') return;
    window.showEditMemberModal = function(memberId){
      try{
        if (memberId) {
          window.__editingMemberId = memberId;
          ensureHiddenEditId(memberId);
          setModalDataset(memberId);
        }
      }catch(_){}
      return orig.apply(this, arguments);
    };
  })();

  function getEditingMemberId(){
    const hid = $('editMemberId');
    const modal = $('editMemberModal');
    const form = $('editMemberForm') || (modal ? modal.querySelector('form') : null);
    return (hid && hid.value)
        || (modal && modal.dataset && modal.dataset.memberId)
        || (form && form.dataset && (form.dataset.memberId || form.dataset.id))
        || window.__editingMemberId
        || '';
  }

  function findMemberIdByCode(code){
    if (!code) return '';
    const coll = (window.currentMembers || window.members || []);
    const m = Array.isArray(coll) ? coll.find(mm => mm && (mm.code === code)) : null;
    return m ? (m._id || m.id || '') : '';
  }

  function getMemberFromCaches(id){
    const coll = (window.currentMembers || window.members || []);
    return Array.isArray(coll) ? coll.find(m => m && (m._id === id || m.id === id)) : null;
  }

  function applyToCaches(updated){
    try{
      const id = updated._id || updated.id || getEditingMemberId();
      const coll = (window.currentMembers || window.members || []);
      const m = coll.find(mm => mm && (mm._id === id || mm.id === id));
      if (m){
        for (const k of ['name','code','position','zone','email','phone','title']) {
          if (typeof updated[k] !== 'undefined') m[k] = updated[k];
        }
        const st = up(updated.state || updated.State);
        if (st){ m.state = st; m.State = st; }
      }
      if (typeof window.filterMembers === 'function') window.filterMembers();
      else if (typeof window.renderMembers === 'function') window.renderMembers(coll);
    }catch(_){}
  }

  async function putJSON(url, payload){
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`PUT JSON ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
    return res.json();
  }

  async function putForm(url, payload){
    const fd = new FormData();
    for (const [k,v] of Object.entries(payload)) fd.append(k, v==null?'':v);
    const res = await fetch(url, { method: 'PUT', body: fd });
    if (!res.ok) throw new Error(`PUT FORM ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
    return res.json();
  }

  async function postOverrideJSON(url, payload){
    const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'method=PUT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HTTP-Method-Override': 'PUT'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`POST(override) JSON ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
    return res.json();
  }

  async function postOverrideForm(url, payload){
    const fd = new FormData();
    for (const [k,v] of Object.entries(payload)) fd.append(k, v==null?'':v);
    const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'method=PUT', {
      method: 'POST',
      headers: { 'X-HTTP-Method-Override': 'PUT' },
      body: fd
    });
    if (!res.ok) throw new Error(`POST(override) FORM ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
    return res.json();
  }

  // --- Final override (last one wins) ---
  window.editMember = async function(ev){
    try{ if (ev && typeof ev.preventDefault==='function') ev.preventDefault(); }catch(_){}

    let id = getEditingMemberId();
    const codeFromForm = (val('editMemberCode') || '').trim();
    if (!id && codeFromForm) {
      id = findMemberIdByCode(codeFromForm);
      if (id) {
        window.__editingMemberId = id;
        ensureHiddenEditId(id);
        setModalDataset(id);
      }
    }
    if (!id){
      console.error('editMember(v10): missing member ID');
      if (typeof window.showMessage === 'function') window.showMessage('Missing member ID', 'danger');
      return false;
    }

    const prev = getMemberFromCaches(id);
    const prevState = prev ? up(prev.state || prev.State) : null;

    const payload = {
      name: val('editMemberName') || prev?.name || '',
      code: codeFromForm || prev?.code || '',
      position: val('editMemberPosition') || prev?.position || '',
      state: up(val('editMemberState') || prev?.state || prev?.State || ''),
      zone: val('editMemberZone') || prev?.zone || ''
    };

    const url = `/api/users/${id}`;
    let updated;
    try {
      updated = await putJSON(url, payload);
    } catch (e1){
      try {
        updated = await putForm(url, payload);
      } catch(e2){
        try {
          updated = await postOverrideJSON(url, payload);
        } catch (e3){
          try {
            updated = await postOverrideForm(url, payload);
          } catch (e4){
            console.error('editMember(v10): backend update failed', e1, e2, e3, e4);
            if (typeof window.showMessage === 'function')
              window.showMessage('Backend update failed: ' + (e4?.message || e3?.message || e2?.message || e1?.message || 'Unknown error'), 'danger');
            return false;
          }
        }
      }
    }

    applyToCaches(updated);

    const newState = up(updated.state || updated.State);
    if (prevState && newState && prevState !== newState) {
      try {
        if (typeof window.activityLogger?.member === 'function') {
          window.activityLogger.member('state_moved', {
            id: updated._id || updated.id || id,
            name: updated.name || prev?.name,
            code: updated.code || prev?.code,
            from: prevState,
            to: newState
          });
        }
      } catch(_){}
      if (typeof window.showMessage === 'function') window.showMessage(`Member moved to ${newState} from ${prevState}`, 'success');
    } else {
      if (typeof window.showMessage === 'function') window.showMessage('Member updated', 'success');
    }

    return false;
  };

  console.log('✅ NARAP v10 override active (method-override fallback)');
})();



/* ===================== NARAP - All-in-One Edit Override (v11 extended fallbacks) =====================
   Adds more fallbacks for strict servers that block PUT and POST override paths.
====================================================================================================== */
(function(){
  function $ (id){ return document.getElementById(id); }
  function val(id){ const el = $(id); return el && typeof el.value !== 'undefined' ? el.value : ''; }
  function up (s){ return (s||'').toString().trim().toUpperCase(); }

  async function postPlainJSON(url, payload){
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`POST JSON ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
    return res.json();
  }
  async function postPlainForm(url, payload){
    const fd = new FormData(); for (const [k,v] of Object.entries(payload)) fd.append(k, v==null?'':v);
    const res = await fetch(url, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`POST FORM ${res.status}: ${await res.text().catch(()=>res.statusText)}`);
    return res.json();
  }

  // Patch the existing v10 override by replacing its window.editMember with extended sequence
  const prevEdit = window.editMember;
  window.editMember = async function(ev){
    try{ if (ev && typeof ev.preventDefault==='function') ev.preventDefault(); }catch(_){}

    // Borrow helpers from v10 already attached in scope
    const getId = (function(){
      const modal = $('editMemberModal');
      const form = $('editMemberForm') || (modal ? modal.querySelector('form') : null);
      return function(){
        return ( $('editMemberId')?.value )
            || ( modal && modal.dataset && modal.dataset.memberId )
            || ( form && form.dataset && (form.dataset.memberId || form.dataset.id) )
            || window.__editingMemberId || '';
      };
    })();

    const codeFromForm = (val('editMemberCode') || '').trim();
    let id = getId();
    if (!id && codeFromForm && Array.isArray(window.currentMembers || window.members)) {
      const coll = (window.currentMembers || window.members || []);
      const m = coll.find(mm => mm && (mm.code === codeFromForm));
      if (m) {
        id = m._id || m.id || '';
        window.__editingMemberId = id;
        const hid = $('editMemberId'); if (hid) hid.value = id;
        if (modal) { if (!modal.dataset) modal.dataset = {}; modal.dataset.memberId = id; }
      }
    }
    if (!id){
      console.error('editMember(v11): missing member ID');
      if (typeof window.showMessage === 'function') window.showMessage('Missing member ID', 'danger');
      return false;
    }

    const coll = (window.currentMembers || window.members || []);
    const prev = Array.isArray(coll) ? coll.find(m => m && (m._id === id || m.id === id)) : null;
    const prevState = prev ? up(prev.state || prev.State) : null;

    const payload = {
      name: val('editMemberName') || prev?.name || '',
      code: codeFromForm || prev?.code || '',
      position: val('editMemberPosition') || prev?.position || '',
      state: up(val('editMemberState') || prev?.state || prev?.State || ''),
      zone: val('editMemberZone') || prev?.zone || ''
    };

    const url = `/api/users/${id}`;

    // Reuse the helper functions defined by v10 patch if present
    const putJSON = async (u,p)=>{
      const r = await fetch(u,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
      if(!r.ok) throw new Error(`PUT JSON ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
    };
    const putForm = async (u,p)=>{
      const fd=new FormData(); for(const [k,v] of Object.entries(p)) fd.append(k,v==null?'':v);
      const r=await fetch(u,{method:'PUT',body:fd});
      if(!r.ok) throw new Error(`PUT FORM ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
    };
    const postOverrideJSON = async (u,p)=>{
      const r = await fetch(u + (u.includes('?')?'&':'?') + 'method=PUT', {
        method:'POST', headers:{'Content-Type':'application/json','X-HTTP-Method-Override':'PUT'}, body: JSON.stringify(p)
      });
      if(!r.ok) throw new Error(`POST(override) JSON ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
    };
    const postOverrideForm = async (u,p)=>{
      const fd=new FormData(); for(const [k,v] of Object.entries(p)) fd.append(k,v==null?'':v);
      const r = await fetch(u + (u.includes('?')?'&':'?') + 'method=PUT', { method:'POST', headers:{'X-HTTP-Method-Override':'PUT'}, body:fd });
      if(!r.ok) throw new Error(`POST(override) FORM ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
    };

    let updated;
    try { updated = await putJSON(url, payload); }
    catch(e1){ try { updated = await putForm(url, payload); }
    catch(e2){ try { updated = await postOverrideJSON(url, payload); }
    catch(e3){ try { updated = await postOverrideForm(url, payload); }
    catch(e4){ try { updated = await postPlainJSON(url, payload); }            // 5) POST JSON /:id
    catch(e5){ try { updated = await postPlainForm(url, payload); }            // 6) POST FORM /:id
    catch(e6){ try { updated = await postPlainJSON('/api/users/update', { id, ...payload }); } // 7) POST JSON /update
    catch(e7){ try { updated = await postPlainForm('/api/users/update', { id, ...payload }); } // 8) POST FORM /update
    catch(e8){ try { updated = await postPlainJSON('/api/users', { id, ...payload }); }        // 9) POST JSON /users
    catch(e9){ try { updated = await postPlainForm('/api/users', { id, ...payload }); }        // 10) POST FORM /users
    catch(e10){ console.error('editMember(v11): all fallbacks failed', e1,e2,e3,e4,e5,e6,e7,e8,e9,e10);
      if (typeof window.showMessage === 'function')
        window.showMessage('Backend update failed (all fallbacks). Check server routes to allow POST /api/users/:id or /api/users/update.', 'danger');
      return false; }}}}}}}}}}

    // Apply to caches and activity log
    try{
      const m = prev || (Array.isArray(coll) ? coll.find(x => x && (x._id === (updated._id||updated.id) || x.id === (updated._id||updated.id))) : null);
      if (m){
        m.name = updated.name ?? m.name;
        m.code = updated.code ?? m.code;
        m.position = updated.position ?? m.position;
        const st = up(updated.state || updated.State); if (st){ m.state = st; m.State = st; }
        m.zone = updated.zone ?? m.zone;
      }
      if (typeof window.filterMembers === 'function') window.filterMembers();
      else if (typeof window.renderMembers === 'function') window.renderMembers(coll);

      const newState = up(updated.state || updated.State);
      if (prevState && newState && prevState !== newState) {
        if (typeof window.activityLogger?.member === 'function') {
          window.activityLogger.member('state_moved', { id: updated._id || updated.id || id, name: updated.name || m?.name, code: updated.code || m?.code, from: prevState, to: newState });
        }
        if (typeof window.showMessage === 'function') window.showMessage(`Member moved to ${newState} from ${prevState}`, 'success');
      } else {
        if (typeof window.showMessage === 'function') window.showMessage('Member updated', 'success');
      }
    }catch(_){}
    return false;
  };

  console.log('✅ NARAP v11 override active (extended POST fallbacks)');
})();



/* ===================== NARAP - All-in-One Edit Override (v12 multi-base) =====================
   Extends v11 by trying multiple API bases:
   - window.API_BASE if set
   - current origin (location.origin)
   - discovered origin from any element with src/href containing "/api/uploads/"
   - https://narap-backend.onrender.com as a known backend
================================================================================================ */
(function(){
  function unique(arr){ return Array.from(new Set(arr.filter(Boolean))); }
  function discoverUploadOrigin(){
    try {
      const el = document.querySelector('[src*="/api/uploads/"], a[href*="/api/uploads/"]');
      if (!el) return '';
      const url = new URL(el.src || el.href, window.location.href);
      return url.origin;
    } catch(_){ return ''; }
  }
  function deriveBases(){
    const bases = [];
    try { if (window.API_BASE) bases.push(String(window.API_BASE)); } catch(_){}
    bases.push(window.location.origin);
    const discovered = discoverUploadOrigin(); if (discovered) bases.push(discovered);
    if (!bases.some(b => /narap-backend\.onrender\.com/i.test(b))) bases.push('https://narap-backend.onrender.com');
    return unique(bases);
  }

  async function reqPUTJSON(u,p){
    const r = await fetch(u,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
    if(!r.ok) throw new Error(`PUT JSON ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
  }
  async function reqPUTFORM(u,p){
    const fd=new FormData(); for(const [k,v] of Object.entries(p)) fd.append(k,v==null?'':v);
    const r=await fetch(u,{method:'PUT',body:fd}); if(!r.ok) throw new Error(`PUT FORM ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
  }
  async function reqPOSTOvJSON(u,p){
    const r = await fetch(u + (u.includes('?')?'&':'?') + 'method=PUT', { method:'POST', headers:{'Content-Type':'application/json','X-HTTP-Method-Override':'PUT'}, body: JSON.stringify(p) });
    if(!r.ok) throw new Error(`POST(override) JSON ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
  }
  async function reqPOSTOvFORM(u,p){
    const fd=new FormData(); for(const [k,v] of Object.entries(p)) fd.append(k,v==null?'':v);
    const r = await fetch(u + (u.includes('?')?'&':'?') + 'method=PUT', { method:'POST', headers:{'X-HTTP-Method-Override':'PUT'}, body:fd });
    if(!r.ok) throw new Error(`POST(override) FORM ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
  }
  async function reqPOSTJSON(u,p){
    const r = await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
    if(!r.ok) throw new Error(`POST JSON ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
  }
  async function reqPOSTFORM(u,p){
    const fd=new FormData(); for(const [k,v] of Object.entries(p)) fd.append(k,v==null?'':v);
    const r=await fetch(u,{method:'POST',body:fd}); if(!r.ok) throw new Error(`POST FORM ${r.status}: ${await r.text().catch(()=>r.statusText)}`); return r.json();
  }

  // Replace the existing editMember with a multi-base version
  const prevEdit = window.editMember;
  window.editMember = async function(ev){
    try{ if (ev && typeof ev.preventDefault==='function') ev.preventDefault(); }catch(_){}
    // Reuse ID + payload resolution from v11
    const $ = (id)=>document.getElementById(id);
    const up=(s)=>(s||'').toString().trim().toUpperCase();
    const val=(id)=>{ const el=$(id); return el && typeof el.value!=='undefined' ? el.value : ''; };

    function getId(){
      const modal=$('editMemberModal'); const form=$('editMemberForm')||(modal?modal.querySelector('form'):null);
      return ($('editMemberId')?.value)
          || (modal && modal.dataset && modal.dataset.memberId)
          || (form && form.dataset && (form.dataset.memberId || form.dataset.id))
          || window.__editingMemberId || '';
    }

    let id = getId();
    const codeFromForm = (val('editMemberCode') || '').trim();
    if (!id && codeFromForm && Array.isArray(window.currentMembers || window.members)) {
      const coll = (window.currentMembers || window.members || []);
      const m = coll.find(mm => mm && (mm.code === codeFromForm));
      if (m) { id = m._id || m.id || ''; window.__editingMemberId = id; const hid=$('editMemberId'); if(hid) hid.value=id; if($('editMemberModal')){ if(!editMemberModal.dataset) editMemberModal.dataset={}; editMemberModal.dataset.memberId=id; } }
    }
    if (!id){ if (typeof window.showMessage==='function') window.showMessage('Missing member ID','danger'); return false; }

    const coll=(window.currentMembers || window.members || []);
    const prev = Array.isArray(coll)?coll.find(m=>m&&(m._id===id||m.id===id)):null;
    const prevState = prev ? up(prev.state || prev.State) : null;

    const payload = {
      name: val('editMemberName') || prev?.name || '',
      code: codeFromForm || prev?.code || '',
      position: val('editMemberPosition') || prev?.position || '',
      state: up(val('editMemberState') || prev?.state || prev?.State || ''),
      zone: val('editMemberZone') || prev?.zone || ''
    };

    const bases = deriveBases();
    const rels = [
      (b)=>`${b}/api/users/${id}`,
      (b)=>`${b}/users/${id}`,
      (b)=>`${b}/api/users/update`,
      (b)=>`${b}/users/update`,
      (b)=>`${b}/api/users`,
      (b)=>`${b}/users`
    ];
    const attempts = [reqPUTJSON, reqPUTFORM, reqPOSTOvJSON, reqPOSTOvFORM, reqPOSTJSON, reqPOSTFORM];

    let updated=null, lastErr=null;
    for (const base of bases){
      for (const rel of rels){
        const url = rel(base);
        for (const fn of attempts){
          try{ updated = await fn(url, fn===reqPOSTJSON||fn===reqPOSTFORM ? ({ id, ...payload }) : payload); break; }
          catch(e){ lastErr=e; continue; }
        }
        if (updated) break;
      }
      if (updated) break;
    }
    if (!updated){
      console.error('editMember(v12): all bases failed', bases, lastErr);
      if (typeof window.showMessage==='function')
        window.showMessage('Backend update failed (no allowed route). Please enable POST /api/users/:id or /api/users/update on the server.', 'danger');
      return false;
    }

    // Apply to caches + activity
    try{
      const m = prev || (Array.isArray(coll) ? coll.find(x => x && (x._id === (updated._id||updated.id) || x.id === (updated._id||updated.id))) : null);
      if (m){
        m.name = updated.name ?? m.name;
        m.code = updated.code ?? m.code;
        m.position = updated.position ?? m.position;
        const st = up(updated.state || updated.State); if (st){ m.state = st; m.State = st; }
        m.zone = updated.zone ?? m.zone;
      }
      if (typeof window.filterMembers === 'function') window.filterMembers();
      else if (typeof window.renderMembers === 'function') window.renderMembers(coll);

      const newState = (updated && up(updated.state || updated.State)) || payload.state;
      if (prevState && newState && prevState !== newState) {
        if (typeof window.activityLogger?.member === 'function') {
          window.activityLogger.member('state_moved', { id: updated?._id || updated?.id || id, name: updated?.name || m?.name, code: updated?.code || m?.code, from: prevState, to: newState });
        }
        if (typeof window.showMessage === 'function') window.showMessage(`Member moved to ${newState} from ${prevState}`, 'success');
      } else {
        if (typeof window.showMessage === 'function') window.showMessage('Member updated', 'success');
      }
    }catch(_){}
    return false;
  };

  console.log('✅ NARAP v12 override active (multi-base + extended fallbacks)');
})();



// Safe global fallback avatar
(function(){
  try {
    var a = (typeof window !== 'undefined' && window.NARAP_FALLBACK_AVATAR) ? window.NARAP_FALLBACK_AVATAR : null;
    if (a && typeof a === 'string') { window.FALLBACK_AVATAR = a; }
    else if (typeof window.FALLBACK_AVATAR === 'undefined') {
      window.FALLBACK_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjQ0NDIi8+CjxwYXRoIGQ9Ik0yMCA3NUMyMCA2NS4wNTc2IDI4LjA1NzYgNTcgMzggNTdINjJDNzEuOTQyNCA1NyA4MCA2NS4wNTc2IDgwIDc1VjgwSDIwVjc1WiIgZmlsbD0iI0NDQyIvPgo8L3N2Zz4K';
    }
  } catch(_) {}
})();


/* === injected: debounce wrapper to reduce API 429s (safe, non-invasive) === */
(function(){try{
  if (window.__debounceInjected) return;
  window.__debounceInjected = true;
  function __debounce(fn, delay){
    var t; 
    return function(){
      var ctx=this, args=arguments;
      clearTimeout(t);
      t=setTimeout(function(){ fn.apply(ctx,args); }, delay);
    };
  }
  var fm = window.filterMembers;
  if (typeof fm === 'function' && !fm.__isDebounced){
    var wrapped = __debounce(fm, 350);
    wrapped.__isDebounced = true;
    window.filterMembers = wrapped;
    // If bound to inputs via oninput attributes, this still works because name stays the same
  }
} catch(e) { /* no-op */ }})(); 
/* === end injected === */


/* === injected: Export-by-State (migrated from HTML inline to bundle) === */
(function () {
  try {
    if (typeof window.exportMembersPrompt === 'function') return; // already present

    function normalizeStateForExport(s) {
      var t = String(s || '').trim();
      t = t.replace(/\s+state$/i, '').trim();
      t = t.replace(/[-_]+/g, ' ').trim();
      var key = t.toLowerCase();
      var ALIASES = {
        'abuja': 'FCT', 'abuja fct': 'FCT', 'fct abuja': 'FCT',
        'federal capital territory': 'FCT',
        'akwa-ibom': 'Akwa Ibom', 'akwa ibom state': 'Akwa Ibom',
        'cross-river': 'Cross River', 'cross river state': 'Cross River',
        'nassarawa': 'Nasarawa'
      };
      if (ALIASES[key]) return ALIASES[key];
      return t.replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
    }

    window.NIGERIA_STATES_FOR_EXPORT = (window.NIGERIA_STATES_FOR_EXPORT || [
      'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta',
      'Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
      'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
      'Yobe','Zamfara','FCT'
    ]);

    if (typeof window.convertToCSV !== 'function') {
      window.convertToCSV = function (rows) {
        var arr = Array.isArray(rows) ? rows : [];
        var cols = ['name','email','code','position','state','zone'];
        function esc(v) {
          var s = (v == null ? '' : String(v));
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }
        var header = cols.join(',');
        var body = arr.map(function (m) {
          return cols.map(function (k) {
            var cap = k.charAt(0).toUpperCase() + k.slice(1);
            return esc(m[k] ?? m[cap] ?? m[k.toUpperCase()] ?? '');
          }).join(',');
        }).join('\n');
        return header + (body ? '\n' + body : '');
      };
    }

    if (typeof window.downloadFile !== 'function') {
      window.downloadFile = function (content, filename, contentType) {
        try {
          var blob = new Blob([content], { type: contentType || 'text/plain' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = filename || 'download.txt';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch (e) { console.error('downloadFile failed:', e); }
      };
    }

    async function getAllMembersForExport() {
      try {
        if (typeof window.backendUrl !== 'undefined') {
          var r = await fetch(window.backendUrl + '/api/users/getUsers');
          if (r.ok) {
            var data = (typeof window.tryJson === 'function') ? await window.tryJson(r) : await r.json().catch(function () { return null; });
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.data)) return data.data;
            if (data && data.success && Array.isArray(data.success.data)) return data.success.data;
          }
        }
      } catch (_) { /* no-op */ }
      if (typeof window.getLocalMembers === 'function') return window.getLocalMembers() || [];
      return Array.isArray(window.members) ? window.members : [];
    }

    async function exportMembersFiltered(format, stateFilter) {
      format = format || 'csv';
      stateFilter = stateFilter || 'ALL';

      var allMembers = await getAllMembersForExport();
      if (!Array.isArray(allMembers) || allMembers.length === 0) {
        if (typeof window.showMessage === 'function') window.showMessage('No members to export', 'warning');
        return;
      }

      var members = allMembers.slice();
      if (stateFilter && stateFilter !== 'ALL') {
        var wanted = normalizeStateForExport(stateFilter);
        members = members.filter(function (m) { return normalizeStateForExport(m.state || m.State) === wanted; });
      }

      if (members.length === 0) {
        var label = (stateFilter === 'ALL') ? 'all states' : stateFilter;
        if (typeof window.showMessage === 'function') window.showMessage('No members found for ' + label, 'warning');
        return;
      }

      var content, filename, contentType;
      var stamp = new Date().toISOString().split('T')[0];
      var slug = (stateFilter === 'ALL' ? 'all' : normalizeStateForExport(stateFilter).replace(/\s+/g, '_').toLowerCase());

      if (format === 'csv') {
        content = window.convertToCSV(members);
        if (!content) { if (typeof window.showMessage === 'function') window.showMessage('Failed to convert members to CSV', 'error'); return; }
        filename = 'members_' + slug + '_' + stamp + '.csv';
        contentType = 'text/csv';
      } else if (format === 'json') {
        content = JSON.stringify(members, null, 2);
        filename = 'members_' + slug + '_' + stamp + '.json';
        contentType = 'application/json';
      } else {
        if (typeof window.showMessage === 'function') window.showMessage('Unsupported export format', 'error');
        return;
      }

      window.downloadFile(content, filename, contentType);
      if (typeof window.showMessage === 'function') {
        window.showMessage('Exported ' + members.length + ' member(s) for ' + (stateFilter === 'ALL' ? 'all states' : normalizeStateForExport(stateFilter)) + '.', 'success');
      }
    }

    window.exportMembersPrompt = function () {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999';

      var box = document.createElement('div');
      box.style.cssText = 'background:#fff;border-radius:8px;padding:16px;width:90%;max-width:420px;box-shadow:0 10px 30px rgba(0,0,0,.2);font-family:system-ui,Arial,sans-serif';
      box.innerHTML = ''
        + '<h3 style="margin:0 0 12px;font-size:18px;">Export Members by State</h3>'
        + '<label style="display:block;margin-bottom:8px;font-size:14px;">Choose a state:</label>'
        + '<select id="exportStateSelect" style="width:100%;padding:10px;font-size:14px;border:1px solid #ccc;border-radius:6px;margin-bottom:12px;">'
        + '  <option value="ALL">All States</option>'
        + '</select>'
        + '<div style="display:flex;gap:8px;justify-content:flex-end;">'
        + '  <button id="cancelExportState" style="padding:8px 12px;border:1px solid #ddd;background:#f8f9fa;border-radius:6px;cursor:pointer;">Cancel</button>'
        + '  <button id="exportStateCSV" style="padding:8px 12px;background:#ffc107;color:#000;border:none;border-radius:6px;cursor:pointer;">Export CSV</button>'
        + '  <button id="exportStateJSON" style="padding:8px 12px;background:#17a2b8;color:#fff;border:none;border-radius:6px;cursor:pointer;">Export JSON</button>'
        + '</div>';

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      (async function () {
        var sel = box.querySelector('#exportStateSelect');
        var seen = new Set(window.NIGERIA_STATES_FOR_EXPORT.map(function (s) { return s.toLowerCase(); }));
        try {
          var all = await getAllMembersForExport();
          for (var i = 0; i < all.length; i++) {
            var s = normalizeStateForExport(all[i].state || all[i].State || '');
            if (s && !seen.has(s.toLowerCase())) {
              seen.add(s.toLowerCase());
              window.NIGERIA_STATES_FOR_EXPORT.push(s);
            }
          }
        } catch (_) { /* no-op */ }

        var sorted = Array.from(new Set(window.NIGERIA_STATES_FOR_EXPORT)).sort(function (a, b) { return a.localeCompare(b); });
        for (var j = 0; j < sorted.length; j++) {
          var st = sorted[j];
          var opt = document.createElement('option');
          opt.value = st; opt.textContent = st;
          sel.appendChild(opt);
        }
      })();

      var close = function () { overlay.remove(); };
      box.querySelector('#cancelExportState').onclick = close;
      box.querySelector('#exportStateCSV').onclick = async function () {
        var val = box.querySelector('#exportStateSelect').value || 'ALL';
        close();
        await exportMembersFiltered('csv', val);
      };
      box.querySelector('#exportStateJSON').onclick = async function () {
        var val = box.querySelector('#exportStateSelect').value || 'ALL';
        close();
        await exportMembersFiltered('json', val);
      };
    };

    window.exportMembersButton = function () { window.exportMembersPrompt(); };
  } catch (e) {
    // no-op
  }
})();
/* === end injected === */


// === [Injected] Recent Activity: backend-first display with offline fallback & sync ===
// Keeps your existing ActivityLogger (localStorage) intact, adds backend-first fetch for display,
// and queues local logs for backend sync when online. All guards prevent double registration.
(function(){
  if (window.__activityBackendFirstBound) return;
  window.__activityBackendFirstBound = true;

  // Local storage queue for unsent activity items
  const QUEUE_KEY = 'narap_activity_pending';

  function readPendingActivity(){
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') || []; } catch { return []; }
  }
  function writePendingActivity(list){
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(Array.isArray(list) ? list : [])); } catch {}
  }
  function queueActivity(entry){
    const list = readPendingActivity();
    list.push({...entry, __attempts: (entry.__attempts||0)});
    writePendingActivity(list);
  }

  // Wrap logger to also queue to backend (without breaking the original behavior)
  try {
    const _origLog = activityLogger && activityLogger.log ? activityLogger.log.bind(activityLogger) : null;
    if (_origLog && !activityLogger.__wrappedForBackend) {
      activityLogger.log = function(entry){
        const e = _origLog(entry);
        try { queueActivity(e); } catch(_){}
        // Fire-and-forget sync if online
        if (navigator.onLine) { try { window.syncActivityPending && window.syncActivityPending(); } catch(_){} }
        return e;
      };
      activityLogger.__wrappedForBackend = true;
    }
  } catch(_){}

  // Backend-first fetch (UI can call this to show Recent Activity)
  if (typeof window.getRecentActivity !== 'function') {
    window.getRecentActivity = async function getRecentActivity(limit = 50) {
      // Try backend first when online
      if (navigator.onLine) {
        try {
          const url = `${backendUrl}/api/activity?limit=${encodeURIComponent(limit)}`;
          const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
          if (resp.ok) {
            const body = await (typeof tryJson === 'function' ? tryJson(resp) : resp.json().catch(()=>null));
            // Accept common shapes: [], {data:[]}, {success:{data:[]}} 
            let items = Array.isArray(body) ? body
                      : (Array.isArray(body?.data) ? body.data
                      : (Array.isArray(body?.success?.data) ? body.success.data : []));
            if (Array.isArray(items) && items.length) {
              return items.slice(0, limit);
            }
          }
        } catch(_) { /* fall back to local */ }
      }
      // Local fallback (uses your ActivityLogger)
      try {
        const local = (typeof getActivityLog === 'function') ? getActivityLog() : [];
        return Array.isArray(local) ? local.slice(0, limit) : [];
      } catch { return []; }
    };
  }

  // Sync pending local activity logs to backend when online
  if (typeof window.syncActivityPending !== 'function') {
    window.syncActivityPending = async function syncActivityPending(){
      if (!navigator.onLine) return;
      let list = readPendingActivity();
      if (!list.length) return;

      const remain = [];
      for (const item of list) {
        try {
          const resp = await fetch(`${backendUrl}/api/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(item)
          });
          if (!resp.ok) {
            // Keep and increment attempts up to 3
            const attempts = (item.__attempts||0) + 1;
            if (attempts < 3) remain.push({...item, __attempts: attempts});
          }
        } catch(_) {
          const attempts = (item.__attempts||0) + 1;
          if (attempts < 3) remain.push({...item, __attempts: attempts});
        }
      }
      writePendingActivity(remain);
    };
  }

  // Helper to refresh any UI that shows activity if present
  if (typeof window.reloadRecentActivity !== 'function') {
    window.reloadRecentActivity = async function reloadRecentActivity(limit=50){
      const items = await window.getRecentActivity(limit);
      // If your UI has a specific renderer, call it here if present.
      if (typeof window.renderRecentActivity === 'function') {
        try { window.renderRecentActivity(items); } catch(_){}
      }
      return items;
    };
  }

  // On page load: try to sync any pending and then show backend-first activity
  document.addEventListener('DOMContentLoaded', async () => {
    try { await window.syncActivityPending(); } catch(_) {}
    try { await window.reloadRecentActivity(50); } catch(_) {}
  });

  // When back online: sync and reload
  window.addEventListener('online', async () => {
    try { await window.syncActivityPending(); } catch(_) {}
    try { await window.reloadRecentActivity(50); } catch(_) {}
  });
})();
// === [/Injected] End ===


// === [Injected] Recent Activity dashboard hooks (minimal) ===
(function(){
  // Wrap switchTab once to refresh activity on dashboard
  if (!window.__switchTabWrapped) {
    if (typeof window.switchTab === 'function') {
      const _origSwitchTab = window.switchTab;
      window.switchTab = function(name){
        const r = _origSwitchTab.apply(this, arguments);
        try {
          if (String(name).toLowerCase() === 'dashboard' && typeof window.reloadRecentActivity === 'function') {
            window.reloadRecentActivity(50);
          }
        } catch(_){}
        return r;
      };
      window.__switchTabWrapped = true;
    }
  }

  // Ensure activity is loaded on first paint if container exists
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (typeof window.reloadRecentActivity === 'function') window.reloadRecentActivity(50);
    } catch(_){}
  });
})();
// === [/Injected] End ===


// === [Injected] Members Tab: Backend Refresh Button Handler ===
(function(){
  if (window.__membersRefreshBound) return;
  window.__membersRefreshBound = true;

  async function performMembersRefresh() {
    try {
      if (typeof showMessage === 'function') showMessage('Refreshing members from server…', 'info');

      // Pull fresh members from backend and re-render
      if (typeof window.reloadMembersBackendFirst === 'function') {
        await window.reloadMembersBackendFirst(true);
      } else if (typeof window.getMembers === 'function') {
        await window.getMembers({ forceRefresh: true });
        if (typeof window.refreshMembersUI === 'function') window.refreshMembersUI();
      }

      // Update counters explicitly (some UIs read from these IDs)
      try {
        const count = Array.isArray(window.members) ? window.members.length : 0;
        const ids = ['totalMembers','membersCount'];
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.textContent = String(count);
        });
      } catch(_){}

      // Reload recent activity (backend-first)
      try {
        if (typeof window.reloadRecentActivity === 'function') await window.reloadRecentActivity(50);
      } catch(_){}

      // Optionally update any sync indicators/status if present
      try {
        if (typeof updateSyncStatus === 'function') updateSyncStatus();
        if (typeof updateSyncIndicators === 'function') {
          const pendingRaw = localStorage.getItem('narap_pending_sync');
          let q = pendingRaw ? JSON.parse(pendingRaw) : {};
          const pending = (q.memberCreations?.length||0) + (q.memberUpdates?.length||0) + (q.memberDeletions?.length||0);
          updateSyncIndicators({ pending, synced: 0 });
        }
      } catch(_){}

      // Log a system activity entry locally (will be queued to backend via wrapper)
      try {
        if (window.activityLogger && typeof activityLogger.system === 'function') {
          const count = Array.isArray(window.members) ? window.members.length : 0;
          activityLogger.system('refresh', { target:'members', count });
        }
      } catch(_){}

      // Attempt syncing pending local changes (non-blocking)
      try { if (typeof syncPendingChanges === 'function') syncPendingChanges(); } catch(_){}

      if (typeof showMessage === 'function') showMessage('Members refreshed from server.', 'success');
    } catch (err) {
      if (typeof showMessage === 'function') showMessage('Failed to refresh members: ' + (err?.message || err), 'error');
    }
  }

  // Bind to common selectors for a "Refresh" button
  function bindMembersRefreshButtons(){
    const selectors = [
      '#refreshMembers',
      '#refreshMembersBtn',
      '[data-action="refresh-members"]',
      'button.refresh-members',
      '.members-toolbar .refresh-btn'
    ];
    for (const sel of selectors) {
      try {
        const btn = document.querySelector(sel);
        if (btn && !btn.__membersRefreshBound) {
          btn.addEventListener('click', (e)=>{ e.preventDefault(); performMembersRefresh(); });
          btn.__membersRefreshBound = true;
        }
      } catch(_){}
    }
  }

  // Event delegation as a fallback (if buttons are rendered later)
  document.addEventListener('click', function(e){
    const t = e.target;
    if (!t) return;
    if (t.matches?.('#refreshMembers, #refreshMembersBtn, [data-action="refresh-members"], button.refresh-members, .members-toolbar .refresh-btn')) {
      e.preventDefault();
      performMembersRefresh();
    }
  }, { capture: true });

  document.addEventListener('DOMContentLoaded', bindMembersRefreshButtons);
  // In case toolbar renders after DOMContentLoaded (SPA-ish), try again shortly
  setTimeout(bindMembersRefreshButtons, 800);
  setTimeout(bindMembersRefreshButtons, 3000);
})();
// === [/Injected] End ===


// === [Merged Injection] Backend-first refresh for Members & Certificates ===
(function(){
  // ----- Members: backend-first refresh -----
  window.refreshMembers = async function refreshMembers(){
    try {
      if (typeof showMessage === 'function') showMessage('Refreshing members from server…', 'info');

      if (typeof window.reloadMembersBackendFirst === 'function') {
        await window.reloadMembersBackendFirst(true);
      } else if (typeof window.getMembers === 'function') {
        await window.getMembers({ forceRefresh: true });
        if (typeof window.refreshMembersUI === 'function') window.refreshMembersUI();
      }

      // Update member counters
      try {
        var count = Array.isArray(window.members) ? window.members.length : 0;
        ['totalMembers','membersCount'].forEach(function(id){
          var el = document.getElementById(id);
          if (el) el.textContent = String(count);
        });
      } catch(e){}

      // Reload recent activity (backend-first)
      try { if (typeof window.reloadRecentActivity === 'function') await window.reloadRecentActivity(50); } catch(e){}

      // Attempt pending sync (non-blocking)
      try { if (typeof window.syncPendingChanges === 'function') window.syncPendingChanges(); } catch(e){}

      if (typeof showMessage === 'function') showMessage('Members refreshed from server.', 'success');
    } catch (err) {
      if (typeof showMessage === 'function') showMessage('Failed to refresh members: ' + (err && err.message || err), 'error');
    }
  };

  // ----- Certificates: backend-first refresh -----
  window.refreshCertificates = async function refreshCertificates(){
    try {
      if (typeof showMessage === 'function') showMessage('Refreshing certificates from server…', 'info');

      if (typeof window.loadCertificates === 'function') {
        var per = Number(window.certificatesPerPage || localStorage.getItem('narap_certificates_per_page') || 10) || 10;
        await window.loadCertificates(1, per);
      } else if (typeof window.getCertificates === 'function') {
        const certs = await window.getCertificates({ forceRefresh: true });
        if (typeof window.refreshCertificatesUI === 'function') window.refreshCertificatesUI();
      }

      // Update certificate counters
      try {
        var total = Array.isArray(window.currentCertificates) ? window.currentCertificates.length
                 : (Array.isArray(window.certificates) ? window.certificates.length : 0);
        var el = document.getElementById('certificatesCount');
        if (el) el.textContent = String(total);
      } catch(e){}

      // Reload recent activity (backend-first)
      try { if (typeof window.reloadRecentActivity === 'function') await window.reloadRecentActivity(50); } catch(e){}

      // Attempt pending sync (non-blocking)
      try { if (typeof window.syncPendingChanges === 'function') window.syncPendingChanges(); } catch(e){}

      if (typeof showMessage === 'function') showMessage('Certificates refreshed from server.', 'success');
    } catch (err) {
      if (typeof showMessage === 'function') showMessage('Failed to refresh certificates: ' + (err && err.message || err), 'error');
    }
  };
})();
// === [/Merged Injection] End ===


// === [Injected] Ensure Recent Activity mirrors System Activity (backend + offline queue) ===
(function(){
  if (window.__activityBridgeApplied) return;
  window.__activityBridgeApplied = true;

  // ---- Queue helpers (idempotent) ----
  const QUEUE_KEY = 'narap_activity_pending';
  function __readPendingActivity(){
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') || []; } catch { return []; }
  }
  function __writePendingActivity(list){
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(Array.isArray(list) ? list : [])); } catch {}
  }
  async function __postActivity(item){
    if (!item) return;
    // Normalize: ensure ts/date/time
    try {
      const now = new Date();
      item.ts = item.ts || now.toISOString();
      item.date = item.date || now.toLocaleDateString();
      item.time = item.time || now.toLocaleTimeString();
    } catch(_){}
    // Try online first
    if (navigator.onLine && typeof backendUrl === 'string' && backendUrl) {
      try {
        const resp = await fetch(`${backendUrl}/api/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(item)
        });
        if (resp.ok) return true;
      } catch(_){/* fall through */}
    }
    // Queue for later
    const list = __readPendingActivity();
    list.push({ ...item, __attempts: (item.__attempts||0) });
    __writePendingActivity(list);
    return false;
  }

  if (typeof window.syncActivityPending !== 'function') {
    window.syncActivityPending = async function syncActivityPending(){
      if (!navigator.onLine) return;
      let list = __readPendingActivity();
      if (!list.length) return;
      const remain = [];
      for (const item of list) {
        try {
          const resp = await fetch(`${backendUrl}/api/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(item)
          });
          if (!resp.ok) {
            const attempts = (item.__attempts||0) + 1;
            if (attempts < 3) remain.push({ ...item, __attempts: attempts });
          }
        } catch(_) {
          const attempts = (item.__attempts||0) + 1;
          if (attempts < 3) remain.push({ ...item, __attempts: attempts });
        }
      }
      __writePendingActivity(remain);
    };
  }

  // ---- Wrap local log helpers so they also post/queue to backend ----
  function wrapAndBridge(fnName, entity, actionKey='action'){
    try {
      const orig = window[fnName];
      if (typeof orig !== 'function' || orig.__bridged) return;
      window[fnName] = async function bridged(item){
        // Call original (keeps local System Activity in sync)
        const res = orig.apply(this, arguments);
        try {
          const e = { entity: entity, [actionKey]: (fnName.toLowerCase().includes('add') ? 'added' : fnName.toLowerCase().includes('update') ? 'updated' : 'deleted') };
          // Build compact data payload
          if (entity === 'member') {
            e.data = {
              id: item?._id || item?.id,
              code: item?.code,
              name: item?.name || item?.fullName,
              state: item?.state || item?.State,
              email: item?.email || null
            };
          } else if (entity === 'certificate') {
            e.data = {
              id: item?._id || item?.id,
              number: item?.certificateNumber || item?.number,
              member: item?.memberName || item?.recipientName || item?.name
            };
          } else {
            e.data = item || {};
          }
          await __postActivity(e);
          if (navigator.onLine && typeof window.reloadRecentActivity === 'function') {
            try { window.reloadRecentActivity(50); } catch(_){}
          }
        } catch(_){}
        return res;
      };
      window[fnName].__bridged = true;
    } catch(_){}
  }

  // Bridge member & certificate helpers
  wrapAndBridge('logMemberAdd', 'member');
  wrapAndBridge('logMemberUpdate', 'member');
  wrapAndBridge('logMemberDelete', 'member');
  wrapAndBridge('logCertificateAdd', 'certificate');
  wrapAndBridge('logCertificateUpdate', 'certificate');
  wrapAndBridge('logCertificateDelete', 'certificate');

  // Also bridge generic ActivityLogger.log if present, to catch any direct logs
  try {
    if (window.activityLogger && typeof activityLogger.log === 'function' && !activityLogger.log.__bridged) {
      const _origLog = activityLogger.log.bind(activityLogger);
      activityLogger.log = async function(entry){
        const e = _origLog(entry);
        try { await __postActivity(e); } catch(_){}
        return e;
      };
      activityLogger.log.__bridged = true;
    }
  } catch(_){}

  // Kick a sync when back online
  window.addEventListener('online', async () => {
    try { await window.syncActivityPending(); } catch(_){}
    try { if (typeof window.reloadRecentActivity === 'function') await window.reloadRecentActivity(50); } catch(_){}
  });
})();
// === [/Injected] End ===


// === [Injected] Recent Activity: filtered renderer (members/certificates only) ===
(function(){
  function passFilter(it){
    if (!it) return false;
    const ent = String(it.entity||'').toLowerCase();
    const act = String(it.action||'').toLowerCase();
    if (!['member','certificate'].includes(ent)) return false;
    if (!['added','updated','deleted'].includes(act)) return false;
    return true;
  }
  function formatRow(it){
    const ent = String(it.entity||'').toLowerCase();
    const act = String(it.action||'').toLowerCase();
    const when = (it.ts && (new Date(it.ts).toLocaleString?.() || it.ts)) || (it.time || '');
    let who = '';
    if (ent === 'member') {
      const d = it.data || {};
      const name = d.name || d.fullName || '';
      const code = d.code ? ` (${d.code})` : '';
      who = `${name}${code}`.trim();
    } else if (ent === 'certificate') {
      const d = it.data || {};
      const number = d.number || '';
      const member = d.member || d.recipient || '';
      who = `${number}${member ? ' • ' + member : ''}`.trim();
    }
    const title = `${act.charAt(0).toUpperCase()+act.slice(1)} ${ent}: ${who}`.trim();
    return `<li class="ra-item"><strong>${title}</strong><span class="ra-meta" style="float:right;opacity:.7;">${when}</span></li>`;
  }

  window.renderRecentActivity = function renderRecentActivity(items){
    try {
      const containers = [
        document.getElementById('recentActivity'),
        document.getElementById('recentActivityList'),
        document.querySelector('.recent-activity'),
        document.querySelector('.activity-log')
      ].filter(Boolean);
      if (!containers.length) return;

      const filtered = (Array.isArray(items) ? items : []).filter(passFilter);
      const html = (filtered.length ? filtered : []).slice(0, 50).map(formatRow).join('');
      const emptyHTML = `<li class="ra-empty" style="color:#6c757d;">No recent member or certificate changes</li>`;
      const listHTML = `<ul class="ra-list" style="list-style:none;padding-left:0;margin:0;">${html || emptyHTML}</ul>`;

      for (const el of containers) el.innerHTML = listHTML;
    } catch(e){ /* no-op */ }
  };

  // Expose filter for other code (optional)
  window.__recentActivityPassFilter = passFilter;
})();
// === [/Injected] End ===


// === [Injected] Recent Activity: Live updates via SSE (fallback to polling) ===
(function(){
  if (window.__activityLiveBound) return;
  window.__activityLiveBound = true;

  function startSSE(){
    if (!window.EventSource || !window.backendUrl) return null;
    try {
      const url = `${backendUrl}/api/activity/stream?entities=member,certificate`;
      const es = new EventSource(url);
      es.onmessage = function(ev){
        try {
          const item = JSON.parse(ev.data);
          if (typeof window.__recentActivityPassFilter === 'function' && !window.__recentActivityPassFilter(item)) return;
          // Keep a local rolling buffer and re-render
          const buf = (window.__recentLiveBuffer = Array.isArray(window.__recentLiveBuffer) ? window.__recentLiveBuffer : []);
          buf.unshift(item);
          window.__recentLiveBuffer = buf.slice(0, 200);
          if (typeof window.renderRecentActivity === 'function') window.renderRecentActivity(window.__recentLiveBuffer);
        } catch(_){}
      };
      es.onerror = function(){
        try { es.close(); } catch(_){}
        setTimeout(startSSE, 5000);
      };
      return es;
    } catch(_){ return null; }
  }

  // Fallback polling (15s) if SSE is unavailable
  function startPolling(){
    if (window.__recentPolling) return;
    window.__recentPolling = setInterval(function(){
      if (typeof window.reloadRecentActivity === 'function') window.reloadRecentActivity(50);
    }, 15000);
  }

  document.addEventListener('DOMContentLoaded', function(){
    const es = startSSE();
    if (!es) startPolling();
  });
})();
// === [/Injected] End ===


// === [Injected Override] Recent Activity: restore scrollbar + normal font weight ===
(function(){
  // keep the same filter if defined
  var passFilter = (typeof window.__recentActivityPassFilter === 'function')
    ? window.__recentActivityPassFilter
    : function(it){
        if (!it) return false;
        var ent = String(it.entity||'').toLowerCase();
        var act = String(it.action||'').toLowerCase();
        return (ent==='member'||ent==='certificate') && (act==='added'||act==='updated'||act==='deleted');
      };

  function formatRow(it){
    var ent = String(it.entity||'').toLowerCase();
    var act = String(it.action||'').toLowerCase();
    var when = (it.ts && (new Date(it.ts).toLocaleString?.() || it.ts)) || (it.time || '');
    var who = '';
    if (ent === 'member') {
      var d = it.data || {};
      var name = d.name || d.fullName || '';
      var code = d.code ? ' ('+d.code+')' : '';
      who = (name+code).trim();
    } else if (ent === 'certificate') {
      var d2 = it.data || {};
      var number = d2.number || '';
      var member = d2.member || d2.recipient || '';
      who = (number + (member ? ' • ' + member : '')).trim();
    }
    var title = (act.charAt(0).toUpperCase()+act.slice(1)) + ' ' + ent + (who ? ': ' + who : '');
    return '<li class="ra-item" style="padding:6px 8px; border-bottom:1px solid rgba(0,0,0,.06);">' +
           '<span class="ra-title" style="font-weight:400;">' + title + '</span>' +
           '<span class="ra-meta" style="float:right; opacity:.7;">' + when + '</span>' +
           '</li>';
  }

  window.renderRecentActivity = function renderRecentActivity(items){
    try {
      var containers = [
        document.getElementById('recentActivity'),
        document.getElementById('recentActivityList'),
        document.querySelector('.recent-activity'),
        document.querySelector('.activity-log')
      ].filter(Boolean);
      if (!containers.length) return;

      var filtered = (Array.isArray(items) ? items : []).filter(passFilter);
      var html = (filtered.length ? filtered : []).slice(0, 50).map(formatRow).join('');
      var emptyHTML = '<li class="ra-empty" style="color:#6c757d;padding:6px 8px;">No recent member or certificate changes</li>';
      var listHTML = '<ul class="ra-list" style="list-style:none;padding-left:0;margin:0;">' + (html || emptyHTML) + '</ul>';

      for (var i=0;i<containers.length;i++){
        var el = containers[i];
        el.innerHTML = listHTML;
        // Ensure scrollbar is present
        try {
          if (!el.style.maxHeight) el.style.maxHeight = '300px';
          el.style.overflowY = 'auto';
          el.style.webkitOverflowScrolling = 'touch';
        } catch(_){}
      }
    } catch(e){ /* no-op */ }
  };
})();
// === [/Injected Override] End ===


// === [Injected Override] Recent Activity: restore previous row style with 'Refresh' badge ===
(function(){
  var passFilter = (typeof window.__recentActivityPassFilter === 'function')
    ? window.__recentActivityPassFilter
    : function(it){
        if (!it) return false;
        var ent = String(it.entity||'').toLowerCase();
        var act = String(it.action||'').toLowerCase();
        return (ent==='member'||ent==='certificate') && (act==='added'||act==='updated'||act==='deleted');
      };

  function actionText(it){
    var ent = String(it.entity||'').toLowerCase();
    var act = String(it.action||'').toLowerCase();
    var d = it.data || {};
    if (ent === 'member') {
      var name = d.name || d.fullName || '';
      var code = d.code ? ' ('+d.code+')' : '';
      return (act.charAt(0).toUpperCase()+act.slice(1)) + ' member: ' + (name+code).trim();
    } else if (ent === 'certificate') {
      var num = d.number || '';
      var mem = d.member || d.recipient || '';
      var who = num + (mem ? ' • ' + mem : '');
      return (act.charAt(0).toUpperCase()+act.slice(1)) + ' certificate: ' + who.trim();
    }
    return (act || '-') + ' ' + ent;
  }

  function whenText(it){
    if (it.ts) { try { return new Date(it.ts).toLocaleString(); } catch(_){} }
    return it.time || '';
  }

  // Click handler for the small refresh pill
  function rowRefresh(e){
    e && e.preventDefault && e.preventDefault();
    if (typeof window.reloadRecentActivity === 'function') window.reloadRecentActivity(50);
  }

  window.renderRecentActivity = function renderRecentActivity(items){
    try {
      var containers = [
        document.getElementById('recentActivity'),
        document.getElementById('recentActivityList'),
        document.querySelector('.recent-activity'),
        document.querySelector('.activity-log')
      ].filter(Boolean);
      if (!containers.length) return;

      var filtered = (Array.isArray(items) ? items : []).filter(passFilter);
      var html = (filtered.length ? filtered : []).slice(0, 50).map(function(it, idx){
        var when = whenText(it);
        var ent = String(it.entity||'').toLowerCase();
        var title = actionText(it);
        return '' +
        '<li class="ra-item" style="display:flex; align-items:center; gap:8px; padding:8px 10px; border-bottom:1px solid rgba(0,0,0,.06);">' +
          '<button class="btn btn-sm btn-light ra-refresh" style="padding:2px 8px; font-size:12px;" onclick="(function(e){ e.preventDefault(); if(window.reloadRecentActivity) window.reloadRecentActivity(50); })(event)">Refresh</button>' +
          '<span class="ra-entity" style="font-weight:600;">' + ent + '</span>' +
          '<span>-</span>' +
          '<span class="ra-text" style="flex:1 1 auto;">' + title + '</span>' +
          '<span class="ra-meta" style="white-space:nowrap; opacity:.7;">' + when + '</span>' +
        '</li>';
      }).join('');

      var emptyHTML = '<li class="ra-empty" style="color:#6c757d; padding:8px 10px;">No recent member or certificate changes</li>';
      var listHTML = '<ul class="ra-list" style="list-style:none; padding-left:0; margin:0;">' + (html || emptyHTML) + '</ul>';

      for (var i=0;i<containers.length;i++){
        var el = containers[i];
        el.innerHTML = listHTML;
        // Ensure scrollbar
        try {
          if (!el.style.maxHeight) el.style.maxHeight = '300px';
          el.style.overflowY = 'auto';
          el.style.webkitOverflowScrolling = 'touch';
        } catch(_){}
      }
    } catch(e){}
  };
})();
// === [/Injected Override] End ===


// === [Injected Override] Recent Activity: preserve/add header and render into body only ===
(function(){
  // Reuse existing filter and text helpers if present
  var passFilter = (typeof window.__recentActivityPassFilter === 'function')
    ? window.__recentActivityPassFilter
    : function(it){
        if (!it) return false;
        var ent = String(it.entity||'').toLowerCase();
        var act = String(it.action||'').toLowerCase();
        return (ent==='member'||ent==='certificate') && (act==='added'||act==='updated'||act==='deleted');
      };

  function actionText(it){
    var ent = String(it.entity||'').toLowerCase();
    var act = String(it.action||'').toLowerCase();
    var d = it.data || {};
    if (ent === 'member') {
      var name = d.name || d.fullName || '';
      var code = d.code ? ' ('+d.code+')' : '';
      return (act.charAt(0).toUpperCase()+act.slice(1)) + ' member: ' + (name+code).trim();
    } else if (ent === 'certificate') {
      var num = d.number || '';
      var mem = d.member || d.recipient || '';
      var who = (num + (mem ? ' • ' + mem : '')).trim();
      return (act.charAt(0).toUpperCase()+act.slice(1)) + ' certificate: ' + who;
    }
    return (act || '-') + ' ' + ent;
  }

  function whenText(it){
    if (it.ts) { try { return new Date(it.ts).toLocaleString(); } catch(_){} }
    return it.time || '';
  }

  function ensureHeader(el){
    // Try to find an existing title
    var header = el.querySelector('[data-role="activity-header"], .ra-header, .card-title, h3, h4, h5');
    // If there is no recognizable header inside this container, add our own
    if (!header) {
      header = document.createElement('div');
      header.className = 'ra-header';
      header.textContent = 'Recent Activity';
      header.style.textAlign = 'center';
      header.style.fontWeight = '600';
      header.style.padding = '8px 10px';
      // insert at top
      el.insertBefore(header, el.firstChild);
    }
  }

  function ensureBody(el){
    var body = el.querySelector('[data-role="activity-body"], .ra-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'ra-body';
      body.setAttribute('data-role', 'activity-body');
      el.appendChild(body);
    }
    // enforce scroll on the body (not the container)
    body.style.maxHeight = body.style.maxHeight || '300px';
    body.style.overflowY = 'auto';
    body.style.webkitOverflowScrolling = 'touch';
    return body;
  }

  window.renderRecentActivity = function renderRecentActivity(items){
    try {
      var containers = [
        document.getElementById('recentActivity'),
        document.getElementById('recentActivityList'),
        document.querySelector('.recent-activity'),
        document.querySelector('.activity-log')
      ].filter(Boolean);
      if (!containers.length) return;

      var filtered = (Array.isArray(items) ? items : []).filter(passFilter);
      var html = (filtered.length ? filtered : []).slice(0, 50).map(function(it){
        var when = whenText(it);
        var ent = String(it.entity||'').toLowerCase();
        var title = actionText(it);
        return '' +
        '<li class="ra-item" style="display:flex; align-items:center; gap:8px; padding:8px 10px; border-bottom:1px solid rgba(0,0,0,.06);">' +
          '<button class="btn btn-sm btn-light ra-refresh" style="padding:2px 8px; font-size:12px;" onclick="(function(e){ e.preventDefault(); if(window.reloadRecentActivity) window.reloadRecentActivity(50); })(event)">Refresh</button>' +
          '<span class="ra-entity" style="font-weight:600;">' + ent + '</span>' +
          '<span>-</span>' +
          '<span class="ra-text" style="flex:1 1 auto;">' + title + '</span>' +
          '<span class="ra-meta" style="white-space:nowrap; opacity:.7;">' + when + '</span>' +
        '</li>';
      }).join('');

      var emptyHTML = '<li class="ra-empty" style="color:#6c757d; padding:8px 10px;">No recent member or certificate changes</li>';
      var listHTML = '<ul class="ra-list" style="list-style:none; padding-left:0; margin:0;">' + (html || emptyHTML) + '</ul>';

      for (var i=0;i<containers.length;i++){
        var el = containers[i];
        ensureHeader(el);               // keep or add the title
        var body = ensureBody(el);      // only update the body
        body.innerHTML = listHTML;
      }
    } catch(e){}
  };
})();
// === [/Injected Override] End ===
