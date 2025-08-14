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
class NotificationManager {
    constructor() {
        this.container = null;
    }

    createContainer() {
        if (this.container) return;
        
        if (!document.body) {
            setTimeout(() => this.createContainer(), 100);
            return;
        }
        
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        this.createContainer();
        
        if (!this.container) {
            this.showFallback(message, type, duration);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 18px;
                margin-left: 8px;
            ">&times;</button>
        `;
        
        this.container.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
    }

    showFallback(message, type = 'info', duration = 5000) {
        const style = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 9999;
            max-width: 400px;
            font-family: Arial, sans-serif;
        `;
        
        const notification = document.createElement('div');
        notification.style.cssText = style;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
    }

    getBackgroundColor(type) {
        switch (type) {
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            case 'info': 
            default: return '#17a2b8';
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
            const data = await response.json();
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
                const data = await response.json();
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
        const members = localStorage.getItem('narap_members');
        if (members) {
            return JSON.parse(members);
        }
    } catch (error) {
        
    }
    return [];
}

function saveLocalMembers(members) {
    try {
        localStorage.setItem('narap_members', JSON.stringify(members));
        
    } catch (error) {
        
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

function savePendingSync(pendingSync) {
    try {
        localStorage.setItem('narap_pending_sync', JSON.stringify(pendingSync));
    } catch (error) {
        
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
            const responseData = await response.json();
            
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
            fetch(`${backendUrl}/api/users/getUsers`).then(res => res.json()).catch(() => []),
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

async function syncPendingChanges() {
    try {
        const pendingSync = getPendingSync();
        let syncedCount = 0;
        
        // Sync certificate changes
        for (const cert of pendingSync.certificateCreations) {
            try {
                // Ensure certificate has proper certificate number before syncing
                const certificateToSync = { ...cert };
                if (!certificateToSync.number || certificateToSync.number.trim() === '') {
                    certificateToSync.number = generateUniqueCertificateNumber();
                }
                if (!certificateToSync.certificateNumber || certificateToSync.certificateNumber.trim() === '') {
                    certificateToSync.certificateNumber = certificateToSync.number;
                }
                
                const response = await fetch(`${backendUrl}/api/certificates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(certificateToSync)
                });
                
                if (response.ok) {
                    syncedCount++;
                }
            } catch (error) {
                
            }
        }
        
        for (const cert of pendingSync.certificateUpdates) {
            try {
                const response = await fetch(`${backendUrl}/api/certificates/${cert._id || cert.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cert)
                });
                
                if (response.ok) {
                    syncedCount++;
                }
            } catch (error) {
                
            }
        }
        
        // Check backend URL before starting sync
        console.log('🔍 Backend URL for sync:', backendUrl);
        
        // Validate backend URL
        if (!backendUrl || backendUrl === 'undefined' || backendUrl === 'null') {
            console.error('❌ Invalid backend URL:', backendUrl);
            showMessage('Backend URL not configured. Please check settings.', 'error');
            return;
        }
        
        // Test backend connectivity
        try {
            const connectivityTest = await fetch(`${backendUrl}/api/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (!connectivityTest.ok) {
                console.warn('⚠️ Backend health check failed - sync may fail');
                showMessage('Backend appears to be down. Sync will be retried when available.', 'warning');
            } else {
                console.log('✅ Backend connectivity confirmed');
            }
        } catch (connectivityError) {
            console.warn('⚠️ Backend connectivity test failed:', connectivityError);
            showMessage('Cannot reach backend server. Sync will be retried when connection is restored.', 'warning');
        }
        
        // Sync member changes
        for (const member of pendingSync.memberCreations) {
            try {
                // Create FormData for file upload
                const formData = new FormData();
                
                // Add text fields
                formData.append('name', member.name);
                // Only add email if it has a value
                if (member.email && member.email.trim()) {
                    formData.append('email', member.email.trim());
                }
                formData.append('password', member.password || 'defaultPassword123');
                formData.append('code', member.code);
                formData.append('position', member.position);
                formData.append('state', member.state);
                formData.append('zone', member.zone);
                
                // Handle file data - use stored file references
                if (member.passportFile) {
                    formData.append('passportPhoto', member.passportFile);
                    
                }
                
                if (member.signatureFile) {
                    formData.append('signature', member.signatureFile);
                    
                }
                
                // Check network connectivity first
                if (!navigator.onLine) {
                    console.log('🌐 Offline - skipping backend sync for member:', member.name);
                    continue;
                }
                
                // Test backend connectivity before attempting sync
                try {
                    const healthCheck = await fetch(`${backendUrl}/api/health`, {
                        method: 'GET',
                        timeout: 5000
                    });
                    
                    if (!healthCheck.ok) {
                        console.log('🔴 Backend health check failed - skipping sync for member:', member.name);
                        continue;
                    }
                } catch (healthError) {
                    console.log('🔴 Backend not accessible - skipping sync for member:', member.name);
                    continue;
                }
                
                console.log('🟢 Backend accessible - attempting to sync member:', member.name);
                
                let response;
                try {
                    response = await fetch(`${backendUrl}/api/users/addUser`, {
                        method: 'POST',
                        body: formData, // Don't set Content-Type header for FormData
                        timeout: 10000 // 10 second timeout
                    });
                } catch (fetchError) {
                    console.error('🌐 Network error during fetch:', fetchError);
                    console.log('🔄 Will retry sync for member later:', member.name);
                    continue; // Skip this member for now, will retry in next sync cycle
                }
                
                if (response.ok) {
                    const result = await response.json();
                    // Update local member with backend ID
                    if (result.data && result.data._id) {
                        const currentMembers = window.currentMembers || [];
                        const memberIndex = currentMembers.findIndex(m => m._id === member._id);
                        if (memberIndex !== -1) {
                            currentMembers[memberIndex]._id = result.data._id;
                            currentMembers[memberIndex].isFromBackend = true;
                            currentMembers[memberIndex].pendingSync = false;
                            saveLocalMembers(currentMembers);
                        }
                    }
                    syncedCount++;
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('AddUser sync error:', errorData);
                    
                    // Handle network errors specifically
                    if (errorData.message && errorData.message.includes('Failed to fetch')) {
                        console.log('🌐 Network error - will retry later for member:', member.name);
                        continue; // Skip this member for now, will retry in next sync cycle
                    }
                    
                    // Handle specific error cases
                    if (errorData.message && errorData.message.includes('Email already exists')) {
                        // Remove email from the member data and try again
                        const memberWithoutEmail = { ...member };
                        delete memberWithoutEmail.email;
                        
                        // Update the member in local storage to remove email
                        const currentMembers = window.currentMembers || [];
                        const memberIndex = currentMembers.findIndex(m => m._id === member._id);
                        if (memberIndex !== -1) {
                            currentMembers[memberIndex].email = '';
                            saveLocalMembers(currentMembers);
                        }
                        
                        // Try to sync again without email
                        try {
                            const retryFormData = new FormData();
                            retryFormData.append('name', member.name);
                            // Don't add email field at all for retry
                            retryFormData.append('password', member.password || 'defaultPassword123');
                            retryFormData.append('code', member.code);
                            retryFormData.append('position', member.position);
                            retryFormData.append('state', member.state);
                            retryFormData.append('zone', member.zone);
                            
                            if (member.passportFile) {
                                retryFormData.append('passportPhoto', member.passportFile);
                            }
                            if (member.signatureFile) {
                                retryFormData.append('signature', member.signatureFile);
                            }
                            
                            const retryResponse = await fetch(`${backendUrl}/api/users/addUser`, {
                                method: 'POST',
                                body: retryFormData
                            });
                            
                            if (retryResponse.ok) {
                                const result = await retryResponse.json();
                                if (result.data && result.data._id) {
                                    const currentMembers = window.currentMembers || [];
                                    const memberIndex = currentMembers.findIndex(m => m._id === member._id);
                                    if (memberIndex !== -1) {
                                        currentMembers[memberIndex]._id = result.data._id;
                                        currentMembers[memberIndex].isFromBackend = true;
                                        currentMembers[memberIndex].pendingSync = false;
                                        saveLocalMembers(currentMembers);
                                    }
                                }
                                syncedCount++;
                                console.log('Successfully synced member without email:', member.name);
                            } else {
                                console.error('Retry failed for member:', member.name);
                            }
                        } catch (retryError) {
                            console.error('Retry sync error:', retryError);
                        }
                    } else if (errorData.message && errorData.message.includes('Code already exists')) {
                        // Generate a new unique code and try again
                        const newCode = generateUniqueCode();
                        
                        // Update the member in local storage with new code
                        const currentMembers = window.currentMembers || [];
                        const memberIndex = currentMembers.findIndex(m => m._id === member._id);
                        if (memberIndex !== -1) {
                            currentMembers[memberIndex].code = newCode;
                            saveLocalMembers(currentMembers);
                        }
                        
                        // Try to sync again with new code
                        try {
                            const retryFormData = new FormData();
                            retryFormData.append('name', member.name);
                            // Only add email if it has a value
                            if (member.email && member.email.trim()) {
                                retryFormData.append('email', member.email.trim());
                            }
                            retryFormData.append('password', member.password || 'defaultPassword123');
                            retryFormData.append('code', newCode);
                            retryFormData.append('position', member.position);
                            retryFormData.append('state', member.state);
                            retryFormData.append('zone', member.zone);
                            
                            if (member.passportFile) {
                                retryFormData.append('passportPhoto', member.passportFile);
                            }
                            if (member.signatureFile) {
                                retryFormData.append('signature', member.signatureFile);
                            }
                            
                            const retryResponse = await fetch(`${backendUrl}/api/users/addUser`, {
                                method: 'POST',
                                body: retryFormData
                            });
                            
                            if (retryResponse.ok) {
                                const result = await retryResponse.json();
                                if (result.data && result.data._id) {
                                    const currentMembers = window.currentMembers || [];
                                    const memberIndex = currentMembers.findIndex(m => m._id === member._id);
                                    if (memberIndex !== -1) {
                                        currentMembers[memberIndex]._id = result.data._id;
                                        currentMembers[memberIndex].isFromBackend = true;
                                        currentMembers[memberIndex].pendingSync = false;
                                        saveLocalMembers(currentMembers);
                                    }
                                }
                                syncedCount++;
                                console.log('Successfully synced member with new code:', member.name, 'New code:', newCode);
                            } else {
                                console.error('Retry failed for member:', member.name);
                            }
                        } catch (retryError) {
                            console.error('Retry sync error:', retryError);
                        }
                    } else {
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }
                }
                    } catch (error) {
            console.error('AddUser sync error:', error);
            
            // If it's a network error, mark for retry
            if (error.message && error.message.includes('Failed to fetch')) {
                console.log('🌐 Network error - member will be retried in next sync cycle:', member.name);
                // Keep the member in pending sync for retry
            } else {
                console.error('❌ Non-network error - member sync failed:', member.name, error);
            }
        }
        }
        
        for (const member of pendingSync.memberUpdates) {
            try {
                // Create FormData for file upload
                const formData = new FormData();
                
                // Add text fields
                formData.append('name', member.name);
                // Only add email if it has a value
                if (member.email && member.email.trim()) {
                    formData.append('email', member.email.trim());
                }
                formData.append('code', member.code);
                formData.append('position', member.position);
                formData.append('state', member.state);
                formData.append('zone', member.zone);
                
                // Handle file data - use stored file references
                if (member.passportFile) {
                    formData.append('passportPhoto', member.passportFile);
                    
                }
                
                if (member.signatureFile) {
                    formData.append('signature', member.signatureFile);
                    
                }
                
                const response = await fetch(`${backendUrl}/api/users/updateUser/${member._id || member.id}`, {
                    method: 'PUT',
                    body: formData // Don't set Content-Type header for FormData
                });
                
                if (response.ok) {
                    // Update local member
                    const currentMembers = window.currentMembers || [];
                    const memberIndex = currentMembers.findIndex(m => m._id === member._id);
                    if (memberIndex !== -1) {
                        currentMembers[memberIndex].pendingSync = false;
                        saveLocalMembers(currentMembers);
                    }
                    syncedCount++;
                }
            } catch (error) {
                
            }
        }
        
        for (const member of pendingSync.memberDeletions) {
            try {
                const response = await fetch(`${backendUrl}/api/users/deleteUser/${member._id || member.id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    // Member was successfully deleted from backend
                    syncedCount++;
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.message || `HTTP ${response.status}`;
                    
                    // If the user doesn't exist in the backend, that's actually a successful sync
                    // because the goal (user not in backend) is already achieved
                    if (errorMessage.toLowerCase().includes('not found') || 
                        errorMessage.toLowerCase().includes('user not found') ||
                        response.status === 404) {
                        
                        syncedCount++;
                    } else {
                        
                    }
                }
            } catch (error) {
                
            }
        }
        
        if (syncedCount > 0) {
            // Clear all synced items (since we process them all in one go)
            pendingSync.certificateCreations = [];
            pendingSync.certificateUpdates = [];
            pendingSync.memberCreations = [];
            pendingSync.memberUpdates = [];
            pendingSync.memberDeletions = [];
            savePendingSync(pendingSync);
            
            // Clean up successfully synced items from pending sync
            if (syncedCount > 0) {
                const pendingSync = getPendingSync();
                pendingSync.memberCreations = pendingSync.memberCreations.filter(member => {
                    const currentMembers = window.currentMembers || [];
                    const memberIndex = currentMembers.findIndex(m => m._id === member._id);
                    return memberIndex === -1 || currentMembers[memberIndex].pendingSync;
                });
                savePendingSync(pendingSync);
            }
            
            showMessage(`Synced ${syncedCount} pending changes`, 'success');
            updateSyncStatus();
        } else {
            // Check if there are any pending changes that couldn't be synced
            const totalPending = 
                pendingSync.memberCreations.length +
                pendingSync.memberUpdates.length +
                pendingSync.memberDeletions.length +
                pendingSync.certificateCreations.length +
                pendingSync.certificateUpdates.length;
            
            if (totalPending > 0) {
                
            }
        }
    } catch (error) {
        
        showMessage('Failed to sync pending changes', 'error');
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

async function createBackup() {
    try {
        showMessage('Creating backup...', 'info');
        
        const [members, certificates] = await Promise.all([
            fetch(`${backendUrl}/api/users/getUsers`).then(res => res.json()).catch(() => []),
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
                    const result = await response.json();
                    console.log('✅ Backend database cleared:', result);
                    showMessage(`Backend cleared: ${result.data.totalDeleted} records deleted`, 'success');
                } else {
                    let errorData = {};
                    try {
                        errorData = await response.json();
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
                    const result = await response.json();
                    console.log('✅ Backend certificates cleared:', result);
                    showMessage(`Backend certificates cleared: ${result.data.certificatesDeleted} certificates deleted`, 'success');
                } else {
                    let errorData = {};
                    try {
                        errorData = await response.json();
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
                    const stats = await response.json();
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
        
        
        
    } catch (error) {
        
        showMessage('Failed to load dashboard: ' + error.message, 'error');
    }
}

async function loadRecentActivity() {
    try {
        
        
        const recentActivityEl = document.getElementById('recentActivity');
        if (!recentActivityEl) {
            
            return;
        }
        
        // Get recent activities from local storage and pending sync
        const localMembers = getLocalMembers();
        const localCertificates = getLocalCertificates();
        const pendingSync = getPendingSync();
        
        const activities = [];
        
        // Add recent member activities
        if (localMembers && Array.isArray(localMembers) && localMembers.length > 0) {
            const recentMembers = localMembers
                .sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.dateAdded || a.updatedAt || 0);
                    const dateB = new Date(b.createdAt || b.dateAdded || b.updatedAt || 0);
                    return dateB - dateA;
                })
                .slice(0, 5);
            
            recentMembers.forEach(member => {
                const date = new Date(member.createdAt || member.dateAdded || member.updatedAt);
                activities.push({
                    type: 'member',
                    action: member.createdAt ? 'Added' : 'Updated',
                    name: member.name || member.fullName || 'Unknown Member',
                    date: date,
                    description: `${member.createdAt ? 'Added' : 'Updated'} member: ${member.name || member.fullName}`
                });
            });
        }
        
        // Add recent certificate activities
        if (localCertificates && Array.isArray(localCertificates) && localCertificates.length > 0) {
            const recentCertificates = localCertificates
                .sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.issueDate || a.updatedAt || 0);
                    const dateB = new Date(b.createdAt || b.issueDate || b.updatedAt || 0);
                    return dateB - dateA;
                })
                .slice(0, 3);
            
            recentCertificates.forEach(certificate => {
                const date = new Date(certificate.createdAt || certificate.issueDate || certificate.updatedAt);
                const recipientName = certificate.memberName || certificate.recipientName || certificate.recipient || 'Unknown';
                activities.push({
                    type: 'certificate',
                    action: 'Issued',
                    name: recipientName,
                    date: date,
                    description: `Certificate issued to: ${recipientName}`
                });
            });
        }
        
        // Add pending sync activities
        const pendingCount = 
            (pendingSync.memberCreations?.length || 0) +
            (pendingSync.memberUpdates?.length || 0) +
            (pendingSync.memberDeletions?.length || 0) +
            (pendingSync.certificateCreations?.length || 0) +
            (pendingSync.certificateUpdates?.length || 0);
        
        if (pendingCount > 0) {
            activities.push({
                type: 'sync',
                action: 'Pending',
                name: `${pendingCount} changes`,
                date: new Date(),
                description: `${pendingCount} changes pending sync with backend`
            });
        }
        
        // Sort all activities by date (most recent first)
        activities.sort((a, b) => b.date - a.date);
        
        // Display activities
        if (!activities || activities.length === 0) {
            recentActivityEl.innerHTML = '<p class="text-muted">No recent activity</p>';
        } else {
            const activityHTML = activities.slice(0, 8).map(activity => {
                const timeAgo = getTimeAgo(activity.date);
                const icon = getActivityIcon(activity.type);
                const color = getActivityColor(activity.type);
                
                return `
                    <div class="activity-item" style="margin-bottom: 15px; padding: 10px; border-left: 3px solid ${color}; background: rgba(0,0,0,0.02);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="color: ${color}; font-size: 16px;">${icon}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 500; color: #333;">${activity.description}</div>
                                <div style="font-size: 12px; color: #666;">${timeAgo}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            recentActivityEl.innerHTML = activityHTML;
        }
        
        
        
    } catch (error) {
        
        const recentActivityEl = document.getElementById('recentActivity');
        if (recentActivityEl) {
            recentActivityEl.innerHTML = '<p class="text-muted">Failed to load recent activity</p>';
        }
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
        case 'sync': return '🔄';
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
                const data = await response.json();
                
                
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
                const data = await response.json();
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
        case 'sync': return '🔄';
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
            fetch(`${backendUrl}/api/users/getUsers`).then(res => res.json()).catch(() => []),
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
            fetch(`${backendUrl}/api/users/getUsers`).then(res => res.json()).catch(() => getLocalMembers()),
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
    try {
        
        
        let backendMembers = [];
        let localMembers = getLocalMembers();
        
        // Try to fetch from backend if online
        if (navigator.onLine) {
            try {
                const response = await fetch(`${backendUrl}/api/users/members`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    
                    // Handle different response formats
                    if (Array.isArray(data)) {
                        backendMembers = data;
                        
                    } else if (data && Array.isArray(data.members)) {
                        backendMembers = data.members;
                        
                    } else if (data && Array.isArray(data.data)) {
                        backendMembers = data.data;
                        
                    } else if (data && data.success && Array.isArray(data.data)) {
                        backendMembers = data.data;
                        
                    } else {
                        
                        backendMembers = [];
                    }
                    
                    // Debug photo data from backend
                    console.log('🔍 Backend members received:', backendMembers.length);
                    if (backendMembers.length > 0) {
                        console.log('🔍 Sample member photo data:', {
                            name: backendMembers[0].name,
                            passportPhoto: backendMembers[0].passportPhoto,
                            passport: backendMembers[0].passport,
                            signature: backendMembers[0].signature
                        });
                        
                        // Check all members for photo data
                        backendMembers.forEach((member, index) => {
                            if (member.passportPhoto || member.passport) {
                                console.log(`🔍 Member ${index + 1} (${member.name}):`, {
                                    passportPhoto: member.passportPhoto,
                                    passport: member.passport,
                                    constructedUrl: getImageUrl(member.passportPhoto || member.passport)
                                });
                            }
                        });
                    }
                    
                    // Don't immediately save backend members to local storage
                    // We'll merge them properly below
                }
            } catch (error) {
                
            }
        }
        
        // Merge backend and local members properly
        const mergedMembers = [...backendMembers];
        
        // Get pending deletions to exclude them from local members
        const pendingSync = getPendingSync();
        const pendingDeletions = pendingSync.memberDeletions || [];
        
        // Add local members that don't exist in backend and aren't pending deletion
        localMembers.forEach(localMember => {
            const existsInBackend = backendMembers.find(backendMember => 
                backendMember._id === localMember._id || 
                backendMember.id === localMember.id ||
                backendMember.code === localMember.code
            );
            
            const isPendingDeletion = pendingDeletions.some(deletion => 
                deletion._id === localMember._id || 
                deletion.id === localMember.id ||
                deletion.code === localMember.code
            );
            
            if (!existsInBackend && !isPendingDeletion) {
                mergedMembers.push({ ...localMember, isFromBackend: false });
            }
        });
        
        // Sort by creation date (newest first)
        mergedMembers.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.dateAdded || 0);
            const dateB = new Date(b.createdAt || b.dateAdded || 0);
            return dateB - dateA;
        });
        
        // Store in global state
        if (typeof window !== 'undefined') {
            window.currentMembers = mergedMembers;
        }
        
        // Save merged members to local storage
        saveLocalMembers(mergedMembers);
        
        // Apply all filters
        let filteredMembers = mergedMembers;
filteredMembers = sortMembersAlpha(filteredMembers);
        
        // Apply search filter if provided
        if (searchTerm && searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            console.log('🔍 Searching for:', searchLower);
            
            filteredMembers = filteredMembers.filter(member => {
                const matches = (
                    (member.name && member.name.toLowerCase().includes(searchLower)) ||
                    (member.email && member.email.toLowerCase().includes(searchLower)) ||
                    (member.code && member.code.toLowerCase().includes(searchLower)) ||
                    (member.position && member.position.toLowerCase().includes(searchLower)) ||
                    (member.state && member.state.toLowerCase().includes(searchLower)) ||
                    (member.zone && member.zone.toLowerCase().includes(searchLower))
                );
                
                if (matches) {
                    console.log(`✅ Found search match: ${member.name} (${member.code})`);
                }
                
                return matches;
            });
            
            console.log(`🔍 Search results: ${filteredMembers.length} members found for "${searchTerm}"`);
        }
        
        // Apply position filter if provided
        if (positionFilter && positionFilter.trim()) {
            console.log('🔍 Filtering by position:', positionFilter);
            
            filteredMembers = filteredMembers.filter(member => {
                const matches = member.position && member.position === positionFilter;
                
                if (matches) {
                    console.log(`✅ Found position match: ${member.name} (${member.position})`);
                }
                
                return matches;
            });
            
            console.log(`🔍 Position filter results: ${filteredMembers.length} members found for position "${positionFilter}"`);
        }
        
        // Apply state filter if provided
        if (stateFilter && stateFilter.trim()) {
            console.log('🔍 Filtering by state:', stateFilter);
            
            // Debug: Log all member states before filtering
            console.log('🔍 All member states before filtering:', filteredMembers.map(m => ({ name: m.name, state: m.state, stateType: typeof m.state })));
            
            filteredMembers = filteredMembers.filter(member => {
                // Debug: Log member state data
                console.log(`🔍 Checking member: ${member.name}, state: "${member.state}" (type: ${typeof member.state})`);
                
                // More flexible matching - handle different formats
                let matches = false;
                if (member.state) {
                    // Exact match
                    if (member.state === stateFilter) {
                        matches = true;
                        console.log(`  ✅ Exact match`);
                    }
                    // Case-insensitive match
                    else if (member.state.toLowerCase() === stateFilter.toLowerCase()) {
                        matches = true;
                        console.log(`  ✅ Case-insensitive match`);
                    }
                    // Trimmed match
                    else if (member.state.trim() === stateFilter.trim()) {
                        matches = true;
                        console.log(`  ✅ Trimmed match`);
                    }
                    // Handle potential extra spaces
                    else if (member.state.replace(/\s+/g, ' ').trim() === stateFilter.replace(/\s+/g, ' ').trim()) {
                        matches = true;
                        console.log(`  ✅ Normalized spaces match`);
                    }
                }
                
                if (matches) {
                    console.log(`✅ Found state match: ${member.name} (${member.state})`);
                } else {
                    console.log(`❌ No state match: ${member.name} (${member.state}) vs "${stateFilter}"`);
                }
                
                return matches;
            });
            
            console.log(`🔍 State filter results: ${filteredMembers.length} members found for state "${stateFilter}"`);
        }
        
        // Calculate pagination
        const totalItems = filteredMembers.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedMembers = filteredMembers.slice(startIndex, endIndex);
        
        // Store pagination state
        window.membersPaginationState = {
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            itemsPerPage: limit
        };
        
        if (typeof displayMembers === 'function') {
            displayMembers(paginatedMembers, totalItems, page, totalPages, limit);
        }
        
        // Render pagination
        if (typeof renderPagination === 'function') {
            renderPagination(page, totalPages, totalItems, limit, 'members');
        }
        
        
        return mergedMembers;
        
    } catch (error) {
        
        showMessage('Failed to load members: ' + error.message, 'error');
        
        // Fallback to local storage
        const localMembers = getLocalMembers();
localMembers = sortMembersAlpha(localMembers);
        if (typeof window !== 'undefined') {
            window.currentMembers = localMembers;
        }
        
        if (typeof displayMembers === 'function') {
            displayMembers(localMembers, localMembers.length, 1, 1, limit);
        }
        
        return localMembers;
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
                    backendResponse = await response.json();
                    console.log('✅ Member added successfully to backend:', backendResponse);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('❌ Backend error response:', errorData);
                    throw new Error(errorData.message || `HTTP ${response.status}`);
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

async function getCertificates() {
    try {
        
        
        let backendCertificates = [];
        let localCertificates = getLocalCertificates();
        
        try {
            const res = await fetch(`${backendUrl}/api/certificates`, {
                method: 'GET'
            });
            
            if (res.ok) {
                const responseData = await res.json();
                
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
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="loading">Loading certificates...</td>
        </tr>
      `;
    }

    // Use your existing merger
    const mergedCertificates = await getCertificates();

    if (typeof window !== 'undefined') {
      window.currentCertificates = mergedCertificates;
    }

    // Normalize filters (case-insensitive compare)
    const q = (searchTerm || '').toLowerCase().trim();
    const statusF = (statusFilter || '').toLowerCase().trim();
    const typeFUI = (typeFilterUI || '').toLowerCase().trim();
    const stateF = (stateFilterUI || '').toLowerCase().trim();

    // Map UI type → stored type if needed (adjust if your DB uses 'award' for 'achievement', etc.)
    const typeMap = {
      membership: 'membership',
      achievement: 'achievement',   // change to 'award' if that’s what you store
      training: 'training',
      recognition: 'recognition',
      service: 'service'
    };
    const typeF = typeFUI ? (typeMap[typeFUI] || typeFUI) : '';

    const getCertState = (c) => (c.state || c.userId?.state || '').toString().toLowerCase();

    // Apply filters
    let filtered = mergedCertificates.filter(c => {
      const num = (c.certificateNumber || c.number || '').toLowerCase();
      const recipient = (c.recipientName || c.recipient || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const title = (c.certificateTitle || c.title || '').toLowerCase();
      const type = (c.type || '').toLowerCase();
      const status = (c.status || '').toLowerCase();
      const issuedBy = (c.issuedBy || '').toLowerCase();
      const userName = (c.userId?.name || '').toLowerCase();
      const userEmail = (c.userId?.email || '').toLowerCase();
      const userCode = (c.userId?.code || '').toLowerCase();
      const certState = getCertState(c);

      const haystack = [num, recipient, email, title, type, status, issuedBy, userName, userEmail, userCode].join(' ');
      const matchSearch = !q || haystack.includes(q);
      const matchStatus = !statusF || status === statusF;
      const matchType = !typeF || type === typeF;
      const matchState = !stateF || certState === stateF;

      return matchSearch && matchStatus && matchType && matchState;
    });

    // Pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    // Store pagination state
    window.certificatesPaginationState = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit
    };

    if (typeof displayCertificates === 'function') {
      displayCertificates(paginated, totalItems, page, totalPages, limit);
    }

    if (typeof renderPagination === 'function') {
      renderPagination(page, totalPages, totalItems, limit, 'certificates');
    }
  } catch (error) {
    showMessage('Error loading certificates: ' + error.message, 'error');

    const localCertificates = getLocalCertificates();
localCertificates = sortCertificatesAlpha(localCertificates);
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
    
    
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
        panel.classList.remove('active');
    });
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedPanel = document.getElementById('panel-' + tabName);
    if (selectedPanel) {
        selectedPanel.classList.add('active');
    }
    
    const selectedNavItem = document.getElementById('btn-' + tabName);
    if (selectedNavItem) {
        selectedNavItem.classList.add('active');
    }
    
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) {
        headerTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
    }
    
    // Show/hide pagination controls based on tab
    const membersPaginationContainer = document.getElementById('membersPagination');
    const certificatesPaginationContainer = document.getElementById('certificatesPagination');
    
    if (membersPaginationContainer) {
        if (tabName === 'members') {
            membersPaginationContainer.style.display = 'flex';
        } else {
            membersPaginationContainer.style.display = 'none';
        }
    }
    
    if (certificatesPaginationContainer) {
        if (tabName === 'certificates') {
            certificatesPaginationContainer.style.display = 'flex';
        } else {
            certificatesPaginationContainer.style.display = 'none';
        }
    }
    
    // Auto-load data based on tab
    switch (tabName) {
        case 'members':
            if (!window.currentMembers || window.currentMembers.length === 0) {
                
                // Get user's saved pagination preference
                const savedMembersPerPage = parseInt(localStorage.getItem('narap_members_per_page')) || 10;
                loadMembers(1, savedMembersPerPage);
            } else {
                
                displayMembers(window.currentMembers);
            }
            break;
            
        case 'certificates':
            if (!window.currentCertificates || window.currentCertificates.length === 0) {
                
                loadCertificates(1, 10);
            } else {
                
                displayCertificates(window.currentCertificates);
            }
            break;
            
        case 'dashboard':
            
            loadDashboard();
            break;
            
        case 'analytics':
            
            loadAnalytics();
            break;
            
        case 'system':
            
            loadSystemPage();
            break;
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
                    const errorData = await response.json().catch(() => ({}));
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
    const memberId = form.dataset.memberId;
    
    if (!memberId) {
        showMessage('Member ID not found', 'error');
        return;
    }
    
    console.log('🔄 Starting member update for ID:', memberId);
    
    // Get form elements with error checking
    const nameField = form.querySelector('#editMemberName');
    const emailField = form.querySelector('#editMemberEmail');
    const codeField = form.querySelector('#editMemberCode');
    const positionField = form.querySelector('#editMemberPosition');
    const stateField = form.querySelector('#editMemberState');
    const zoneField = form.querySelector('#editMemberZone');
    
    // Check if all form elements exist
    if (!nameField || !codeField || !positionField || !stateField || !zoneField) {
        console.error('❌ Form elements not found:', {
            nameField: !!nameField,
            codeField: !!codeField,
            positionField: !!positionField,
            stateField: !!stateField,
            zoneField: !!zoneField
        });
        showMessage('Form elements not found. Please refresh the page.', 'error');
        return;
    }
    
    const passwordField = form.querySelector('#editMemberPassword');
    
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
    
    // Create FormData for file upload
    const formDataObj = new FormData();
    
    // Add text fields with validation
    formDataObj.append('name', formData.name);
    
    // Add email (optional)
    if (formData.email && formData.email.trim()) {
        formDataObj.append('email', formData.email.trim());
    }
    
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
    
    // Add password only if provided
    if (formData.password && formData.password.trim()) {
        formDataObj.append('password', formData.password.trim());
        console.log('🔐 Password update included');
    }
    
    // Add files
    const passportInput = document.getElementById('editMemberPassport');
    const signatureInput = document.getElementById('editMemberSignature');
    
    if (passportInput && passportInput.files[0]) {
        formDataObj.append('passportPhoto', passportInput.files[0]);
        console.log('📸 Passport photo added to update:', passportInput.files[0].name);
    }
    if (signatureInput && signatureInput.files[0]) {
        formDataObj.append('signature', signatureInput.files[0]);
        console.log('✍️ Signature added to update:', signatureInput.files[0].name);
    }
    
    // Final validation: Check if all required fields are in FormData
    const requiredFields = ['name', 'code', 'position', 'state', 'zone'];
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
    
    try {
        showMessage('Updating member...', 'info');
        
        const currentMembers = window.currentMembers || [];
        const memberIndex = currentMembers.findIndex(member => 
            member._id === memberId || member.id === memberId
        );
        
        if (memberIndex === -1) {
            showMessage('Member not found', 'error');
            return;
        }
        
        const originalMember = currentMembers[memberIndex];
        let isOnline = navigator.onLine;
        
        console.log('🔍 Original member data:', originalMember);
        
        // Try to update in backend if online and member exists in backend
        let backendResponse = null;
        if (isOnline && originalMember._id && !originalMember._id.startsWith('local_')) {
            try {
                console.log('🔄 Updating member in backend:', memberId);
                console.log('📤 FormData contents:', Array.from(formDataObj.entries()));
                
                const response = await fetch(`${backendUrl}/api/users/updateUser/${memberId}`, {
                    method: 'PUT',
                    body: formDataObj // Don't set Content-Type header for FormData
                });
                
                console.log('📡 Backend response status:', response.status);
                
                if (response.ok) {
                    backendResponse = await response.json();
                    console.log('✅ Backend update successful:', backendResponse);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.log('❌ Backend update failed:', response.status, errorData);
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }
            } catch (error) {
                console.log('❌ Backend update error:', error);
                isOnline = false;
                showMessage(`Backend update failed: ${error.message}. Continuing with local update.`, 'warning');
            }
        } else {
            console.log('ℹ️ Skipping backend update (offline or local member)');
        }
        
        // Update member in current members
        const updatedMember = {
            ...originalMember,
            ...formData,
            updatedAt: new Date().toISOString(),
            pendingSync: !isOnline
        };
        
        // Handle file data
        if (passportInput && passportInput.files[0]) {
            if (isOnline && backendResponse && backendResponse.data && backendResponse.data.passportPhoto) {
                // Use filename from backend response
                updatedMember.passportPhoto = backendResponse.data.passportPhoto;
                console.log('📸 Updated passport photo from backend:', updatedMember.passportPhoto);
            } else {
                // Store file reference for offline sync
                updatedMember.passportFile = passportInput.files[0];
                console.log('📸 Stored passport file for offline sync:', passportInput.files[0].name);
            }
        }
        
        if (signatureInput && signatureInput.files[0]) {
            if (isOnline && backendResponse && backendResponse.data && backendResponse.data.signature) {
                // Use filename from backend response
                updatedMember.signature = backendResponse.data.signature;
                console.log('✍️ Updated signature from backend:', updatedMember.signature);
            } else {
                // Store file reference for offline sync
                updatedMember.signatureFile = signatureInput.files[0];
                console.log('✍️ Stored signature file for offline sync:', signatureInput.files[0].name);
            }
        }
        
        console.log('📝 Updated member data:', updatedMember);
        
        const updatedMembers = [...currentMembers];
        updatedMembers[memberIndex] = updatedMember;
        window.currentMembers = updatedMembers;
        

        
        // Save to local storage
        saveLocalMembers(updatedMembers);
        
        // Add to pending sync if offline
        if (!isOnline) {
            const pendingSync = getPendingSync();
            pendingSync.memberUpdates.push(updatedMember);
            savePendingSync(pendingSync);
            showMessage('Member updated locally. Will sync when online.', 'warning');
        } else {
            showMessage('Member updated successfully!', 'success');
        }
        
        closeEditMemberModal();
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
        
        showMessage('Failed to update member: ' + error.message, 'error');
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
        const certificateNumber = certificate.certificateNumber || certificate.number || 'N/A';
        const recipientName = certificate.recipientName || certificate.recipient || certificate.name || 'N/A';
        const title = certificate.title || certificate.certificateTitle || 'N/A';
        const issueDate = certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : 'N/A';
        const status = certificate.status || 'Active';
        const statusClass = status.toLowerCase();
        const certificateId = certificate._id || certificate.id || '';
        
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
        const certificate = certificates.find(cert => 
            cert._id === certificateId || cert.id === certificateId
        );
        
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
        const certificate = certificates.find(cert => 
            cert._id === certificateId || cert.id === certificateId
        );
        
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
        const certificate = certificates.find(cert => 
            cert._id === certificateId || cert.id === certificateId
        );
        
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
        const certificateId = document.getElementById('issueCertificateForm').dataset.certificateId;
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
                    const result = await response.json();
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
                    const result = await response.json();
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
    const searchInput = document.getElementById('certificateSearch');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    
    loadCertificates(1, 10);
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

async function importData() {
    const fileInput = document.getElementById('importFile');
    const importType = document.getElementById('importType')?.value || 'members';
    
    if (!fileInput || !fileInput.files[0]) {
        showMessage('Please select a file to import', 'warning');
        return;
    }

    const file = fileInput.files[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showMessage('Please select a valid CSV file', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const csvData = e.target.result;
            const parsedData = parseCSV(csvData);

            if (parsedData.length === 0) {
                showMessage('No valid data found in CSV file', 'error');
                return;
            }

            console.log('📊 Parsed CSV data:', parsedData);

            if (importType === 'members') {
                await importMembersData(parsedData);
            } else if (importType === 'certificates') {
                await importCertificateData(parsedData);
            }

            showMessage(`${importType} imported successfully!`, 'success');
            closeImportModal();
        } catch (error) {
            showMessage('Failed to import CSV: ' + error.message, 'error');
            console.error('CSV Import Error:', error);
        }
    };

    reader.readAsText(file);
}

async function importMembersData(parsedData) {
    console.log('🔄 Importing members data...');
    
    const newMembers = [];
    const errors = [];
    
    for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const rowNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed
        
        try {
            // Validate required fields
            if (!row.Name || !row.Code || !row.State || !row.Zone) {
                errors.push(`Row ${rowNumber}: Missing required fields (Name, Code, State, Zone)`);
                continue;
            }
            
            // Check for duplicate codes
            const existingMember = window.members?.find(m => m.code === row.Code.toUpperCase());
            if (existingMember) {
                errors.push(`Row ${rowNumber}: Code '${row.Code}' already exists`);
                continue;
            }
            
            // Create member object
            const member = {
                name: row.Name.trim(),
                email: row.Email ? row.Email.trim() : '',
                code: row.Code.toUpperCase().trim(),
                position: (row.Position || 'MEMBER').toUpperCase(),
                state: row.State.trim(),
                zone: row.Zone.trim(),
                password: row.Password || generateDefaultPassword(),
                dateAdded: new Date().toISOString(),
                cardGenerated: false
            };
            
            // Add to backend
            try {
                const response = await fetch(`${backendUrl}/api/users/addUser`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(member)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    newMembers.push(result.data);
                    console.log(`✅ Member imported: ${member.name} (${member.code})`);
                } else {
                    const errorData = await response.json();
                    errors.push(`Row ${rowNumber}: ${errorData.message || 'Failed to add member'}`);
                }
            } catch (error) {
                errors.push(`Row ${rowNumber}: Network error - ${error.message}`);
            }
            
        } catch (error) {
            errors.push(`Row ${rowNumber}: ${error.message}`);
        }
    }
    
    // Update local members array
    if (newMembers.length > 0) {
        if (!window.members) window.members = [];
        window.members = [...window.members, ...newMembers];
        
        // Refresh the members table
        await loadMembers();
    }
    
    // Show results
    if (errors.length > 0) {
        showMessage(`Import completed with ${errors.length} errors. Check console for details.`, 'warning');
        console.error('❌ Import errors:', errors);
    } else {
        showMessage(`Successfully imported ${newMembers.length} members!`, 'success');
    }
}

// Helper function to parse CSV into an array of objects (assuming first row is headers)
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

async function importCertificateData(parsedData) {
  console.log('🔄 Importing certificate data...');

  const created = [];
  const errors = [];

  for (let i = 0; i < parsedData.length; i++) {
    const row = parsedData[i];
    const rowNumber = i + 2; // header is row 1

    try {
      // Expected headers (case-sensitive to what your parser builds):
      // Certificate Number, Recipient, Email, Title, Type, Status, Issue Date, Issued By

      const number = (row['Certificate Number'] || '').toUpperCase().trim();
      const recipient = (row['Recipient'] || '').trim();
      const email = (row['Email'] || '').trim();
      const title = (row['Title'] || '').trim();
      const type = (row['Type'] || 'membership').trim().toLowerCase();
      const status = (row['Status'] || 'active').trim().toLowerCase();
      const issueDate = row['Issue Date'] ? new Date(row['Issue Date']).toISOString() : '';
      const issuedBy = (row['Issued By'] || '').trim();

      // Basic validation
      if (!number || !recipient || !title) {
        errors.push(`Row ${rowNumber}: Missing required fields (Certificate Number, Recipient, Title)`);
        continue;
      }

      // Build payload for your existing create endpoint
      const payload = {
        number,
        recipient,
        email,
        title,
        type: type || 'membership',
        description: '',           // optional
        issueDate: issueDate || undefined,
        status: status || 'active',
        issuedBy: issuedBy || undefined
      };

      const resp = await fetch(`${backendUrl}/api/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        errors.push(`Row ${rowNumber}: ${err.message || 'Failed to create certificate'}`);
        continue;
      }

      const result = await resp.json();
      created.push(result.certificate || result);
      console.log(`✅ Certificate imported: ${number}`);
    } catch (e) {
      errors.push(`Row ${rowNumber}: ${e.message}`);
    }
  }

  // Optional: refresh certificates list if you have a loader
  if (typeof loadCertificates === 'function') {
    await loadCertificates();
  }

  if (errors.length) {
    console.warn('❌ Certificate import errors:', errors);
    showMessage(`Certificates imported with ${errors.length} errors. Check console.`, 'warning');
  } else {
    showMessage(`Successfully imported ${created.length} certificates!`, 'success');
  }
}


function downloadSampleCSV() {
    const importType = document.getElementById('importType')?.value || 'members';
    
    if (importType === 'members') {
        const sampleData = [
            { Name: 'John Doe', Email: 'john@example.com', Code: 'NARAP001', Position: 'MEMBER', State: 'Lagos', Zone: 'South West', Password: 'password123' },
            { Name: 'Jane Smith', Email: 'jane@example.com', Code: 'NARAP002', Position: 'SECRETARY', State: 'Abuja', Zone: 'North Central', Password: 'password123' },
            { Name: 'Mike Johnson', Email: 'mike@example.com', Code: 'NARAP003', Position: 'TREASURER', State: 'Kano', Zone: 'North West', Password: 'password123' }
        ];
        
        const csvContent = convertToCSV(sampleData);
        downloadFile(csvContent, 'sample_members.csv', 'text/csv');
        showMessage('Sample members CSV downloaded!', 'success');
    } else if (importType === 'certificates') {
        const sampleData = [
            { CertificateID: 'CERT001', MemberID: 'NARAP001', Type: 'Standard', IssueDate: '2024-01-15', ExpiryDate: '2025-01-15', Status: 'Active' },
            { CertificateID: 'CERT002', MemberID: 'NARAP002', Type: 'Premium', IssueDate: '2024-02-20', ExpiryDate: '2025-02-20', Status: 'Active' }
        ];
        
        const csvContent = convertToCSV(sampleData);
        downloadFile(csvContent, 'sample_certificates.csv', 'text/csv');
        showMessage('Sample certificates CSV downloaded!', 'success');
    }
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

function updateCsvFormat() {
    const importType = document.getElementById('importType')?.value || 'members';
    const helpDiv = document.getElementById('csvFormatHelp');
    
    if (!helpDiv) return;
    
    if (importType === 'members') {
        helpDiv.innerHTML = `
            <strong>Required columns:</strong> Name, Code, State, Zone<br/>
            <strong>Optional columns:</strong> Email, Position, Password (auto-generated if missing)<br/>
            <strong>Valid positions:</strong> MEMBER, PRESIDENT, SECRETARY, TREASURER, etc. (must be uppercase)<br/>
            <strong>Example:</strong> Name,Email,Code,Position,State,Zone,Password
        `;
    } else if (importType === 'certificates') {
        helpDiv.innerHTML = `
            <strong>Required columns:</strong> CertificateID, MemberID, Type<br/>
            <strong>Optional columns:</strong> IssueDate, ExpiryDate, Status<br/>
            <strong>Example:</strong> CertificateID,MemberID,Type,IssueDate,ExpiryDate,Status
        `;
    }
}

async function importCertificateData(parsedData) {
  console.log('🔄 Importing certificate data...');

  const created = [];
  const errors = [];

  // Helper: get a field by trying multiple header names (case-sensitive to your parsed keys)
  const pick = (row, ...keys) => {
    for (const k of keys) {
      if (row[k] != null && String(row[k]).trim() !== '') return String(row[k]).trim();
    }
    return '';
  };

  for (let i = 0; i < parsedData.length; i++) {
    const row = parsedData[i];
    const rowNumber = i + 2; // header is row 1

    try {
      // Support BOTH header styles
      const number =
        (pick(row, 'Certificate Number', 'CertificateID') || '').toUpperCase();
      const recipient =
        pick(row, 'Recipient', 'Member Name', 'Name'); // fallback if you include it
      const email =
        pick(row, 'Email', 'Member Email');
      const title =
        pick(row, 'Title', 'Certificate Title') || 'Membership Certificate';
      const type =
        (pick(row, 'Type') || 'membership').toLowerCase();            // membership/award/...
      const status =
        (pick(row, 'Status') || 'active').toLowerCase();              // active/revoked/expired
      const issueDate =
        pick(row, 'Issue Date', 'IssueDate');                         // YYYY-MM-DD preferred
      const validUntil =
        pick(row, 'Valid Until', 'ExpiryDate');                       // may be blank
      const issuedBy =
        pick(row, 'Issued By') || 'NARAP Authority';

      // Basic validation (backend requires number, recipient, title)
      if (!number || !recipient || !title) {
        errors.push(`Row ${rowNumber}: Missing required fields (Certificate Number, Recipient, Title)`);
        continue;
      }

      const payload = {
        number,                           // required
        recipient,                        // required
        email,                            // optional
        title,                            // required
        type: type || 'membership',
        description: '',                  // optional
        issueDate: issueDate || undefined,
        validUntil: validUntil || undefined,
        status: status || 'active',
        issuedBy: issuedBy || undefined
      };

      const resp = await fetch(`${backendUrl}/api/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        // capture server message for clarity
        let msg = `HTTP ${resp.status}`;
        try {
          const errData = await resp.json();
          if (errData?.message) msg = errData.message;
        } catch (_) {}
        errors.push(`Row ${rowNumber}: ${msg}`);
        continue;
      }

      const result = await resp.json();
      created.push(result.certificate || result);
      console.log(`✅ Certificate imported: ${number}`);
    } catch (e) {
      errors.push(`Row ${rowNumber}: ${e.message}`);
    }
  }

  if (typeof loadCertificates === 'function') {
    await loadCertificates();
  }

  if (errors.length) {
    console.warn('❌ Certificate import errors:', errors);
    showMessage(`Certificates imported with ${errors.length} errors. See details below.`, 'warning');
    showImportErrors(errors); // helper below
  } else {
    showMessage(`Successfully imported ${created.length} certificates!`, 'success');
  }
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
    errors.map(e => `<div>• ${e}</div>`).join('');
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
        console.log(`🔄 Trying alternative URL ${currentIndex + 1}:`, testUrl);
        
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
            const result = await response.json();
            showMessage(`✅ ${result.message}`, 'success');
            
            // Refresh certificates display
            await loadCertificates();
            
            // Refresh analytics if on analytics tab
            const analyticsPanel = document.getElementById('panel-analytics');
            if (analyticsPanel && analyticsPanel.classList.contains('active')) {
                loadAnalytics();
            }
        } else {
            const error = await response.json();
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
      
      const result = await response.json();
      
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
            const result = await response.json();
            showMessage(`Successfully deleted ${result.deletedCount} member(s).`, 'success');
            
            // Clear selections and refresh table
            window.bulkSelections.members.clear();
            updateBulkActionsVisibility('members');
            refreshMembers();
        } else {
            const error = await response.json();
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
            const result = await response.json();
            showMessage(`Successfully deleted ${result.deletedCount} certificate(s).`, 'success');
            
            // Clear selections and refresh table
            window.bulkSelections.certificates.clear();
            updateBulkActionsVisibility('certificates');
            refreshCertificates();
        } else {
            const error = await response.json();
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
    console.log('🔄 Sending update request...');
    const response = await fetch(`${backendUrl}/api/users/updateUser/${memberId}`, {
      method: 'PUT',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Update successful:', result);
      showMessage('Test update successful!', 'success');
      
      // Refresh the members list
      await loadMembers();
    } else {
      const error = await response.json();
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

  // Row click toggler — use CAPTURE to run before other handlers and avoid double toggling
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
              font: { size: 30 }  // small so labels don't overlap
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

  // ---------- 2) Definitive "Members by State" renderer (full names, A→Z, tiny labels) ----------
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
        var perRow = 20;
        var minH = 240;
        var maxH = Math.floor(window.innerHeight * 0.85);
        var desired = Math.min(Math.max(minH, labels.length * perRow + 80), Math.max(maxH, minH));
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
              datasets: [{ label: 'Members', data: values, backgroundColor: '#ffc107' }]
            },
            options: {
              indexAxis: 'y',
              maintainAspectRatio: false,
              scales: {
                x: { beginAtZero: true },
                y: { ticks: { autoSkip: false, font: { size: 11 } } }
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
          const gap = 4;
          const barH = Math.max(2, Math.floor((innerH - gap*(labels.length-1)) / Math.max(1, labels.length)));
          ctx2.save(); ctx2.translate(leftPad, topPad);

          for (let i=0;i<labels.length;i++){
            const v = +values[i] || 0;
            const w = Math.round((v / maxV) * innerW);
            const y = i * (barH + gap);
            ctx2.fillStyle = '#ffc107';
            ctx2.fillRect(0, y, w, barH);
            ctx2.font = '9px Arial'; ctx2.fillStyle = '#333'; ctx2.textBaseline = 'middle';
            ctx2.textAlign = 'right'; ctx2.fillText(labels[i], -6, y + barH/2);
            ctx2.textAlign = 'left';  ctx2.fillText(String(v), w + 6, y + barH/2);
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

