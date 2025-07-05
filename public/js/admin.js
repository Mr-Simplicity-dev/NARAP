        loadDashboard().catch(error => {
            console.error('Failed to load dashboard with existing token:', error);
            // Token might be expired, clear it and show login
            localStorage.removeItem('authToken');
            const loginSection = document.getElementById('loginSection');
            const adminSection = document.getElementById('adminSection');
            
            if (loginSection) loginSection.style.display = 'block';
            if (adminSection) adminSection.style.display = 'none';
        });
    }
    
    // Add event listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
    
    const addMemberForm = document.getElementById('addMemberForm');
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', addMember);
    }
    
    // Add test connection button if it doesn't exist
    addTestConnectionButton();
});

// ✅ Add test connection button function
function addTestConnectionButton() {
    // Check if button already exists
    if (document.getElementById('testConnectionBtn')) return;
    
    // Create debug section
    const debugSection = document.createElement('div');
    debugSection.id = 'debugSection';
    debugSection.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
    `;
    
    debugSection.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #495057;">Debug Tools</h4>
        <button id="testConnectionBtn" style="
            margin: 5px;
            padding: 8px 12px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        ">Test Connection</button>
        <button id="showBackendUrlBtn" style="
            margin: 5px;
            padding: 8px 12px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        ">Show Backend URL</button>
        <button id="clearTokenBtn" style="
            margin: 5px;
            padding: 8px 12px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        ">Clear Token</button>
        <button id="hideDebugBtn" style="
            margin: 5px;
            padding: 8px 12px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        ">Hide</button>
    `;
    
    document.body.appendChild(debugSection);
    
    // Add event listeners
    document.getElementById('testConnectionBtn').addEventListener('click', testConnection);
    
    document.getElementById('showBackendUrlBtn').addEventListener('click', () => {
        alert(`Backend URL: ${backendUrl}\nCurrent Origin: ${window.location.origin}`);
        console.log('Backend URL:', backendUrl);
        console.log('Current Origin:', window.location.origin);
    });
    
    document.getElementById('clearTokenBtn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        showMessage('Token cleared', 'info');
        
        // Show login section
        const loginSection = document.getElementById('loginSection');
        const adminSection = document.getElementById('adminSection');
        
        if (loginSection) loginSection.style.display = 'block';
        if (adminSection) adminSection.style.display = 'none';
    });
    
    document.getElementById('hideDebugBtn').addEventListener('click', () => {
        debugSection.style.display = 'none';
    });
}

// ==================== ADDITIONAL UTILITY FUNCTIONS ====================

// ✅ Edit member function (placeholder)
function editMember(id) {
    console.log('Edit member:', id);
    showMessage('Edit functionality not implemented yet', 'warning');
    // TODO: Implement edit functionality
}

// ✅ Logout function
function logout() {
    localStorage.removeItem('authToken');
    
    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');
    
    if (loginSection) loginSection.style.display = 'block';
    if (adminSection) adminSection.style.display = 'none';
    
    showMessage('Logged out successfully', 'info');
}

// ✅ Delete all members function
async function deleteAllMembers() {
    if (!confirm('Are you sure you want to delete ALL members? This action cannot be undone!')) return;
    if (!confirm('This will permanently delete all member data. Are you absolutely sure?')) return;
    
    try {
        showMessage('Deleting all members...', 'info');
        
        const res = await fetchWithTimeout(`${backendUrl}/api/deleteAllUsers`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include'
        }, 20000); // 20 second timeout for bulk operation
        
        const data = await res.json();
        
        if (res.ok) {
            showMessage(`All members deleted successfully! ${data.deletedCount || 0} members removed.`, 'success');
            await loadDashboard(); // Refresh the dashboard
        } else {
            showMessage(data.message || 'Failed to delete all members', 'error');
        }
        
    } catch (error) {
        console.error('Delete all members error:', error);
        
        let errorMessage = 'Failed to delete all members: ' + error.message;
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out while deleting all members. Please try again.';
        }
        
        showMessage(errorMessage, 'error');
    }
}

// ==================== CERTIFICATE FUNCTIONS (if needed) ====================

// ✅ Get certificates function
async function getCertificates() {
    try {
        console.log('Fetching certificates from:', `${backendUrl}/api/certificates`);
        
        const res = await fetchWithTimeout(`${backendUrl}/api/certificates`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders()
        }, 15000);
        
        if (res.status === 401) {
            console.log('🔐 Token expired, redirecting to login');
            localStorage.removeItem('authToken');
            
            const loginSection = document.getElementById('loginSection');
            const adminSection = document.getElementById('adminSection');
            
            if (loginSection) loginSection.style.display = 'block';
            if (adminSection) adminSection.style.display = 'none';
            
            showMessage('Session expired. Please login again.', 'warning');
            return [];
        }
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const certificates = await res.json();
        currentCertificates = Array.isArray(certificates) ? certificates : [];
        console.log('✅ Certificates loaded successfully:', currentCertificates.length, 'certificates');
        return currentCertificates;
        
    } catch (error) {
        console.error('❌ Get certificates error:', error);
        
        let errorMessage = 'Failed to load certificates: ' + error.message;
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out while loading certificates. Please try again.';
        }
        
        showMessage(errorMessage, 'error');
        currentCertificates = [];
        return [];
    }
}

// ==================== ERROR HANDLING ====================

// ✅ Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showMessage('An unexpected error occurred: ' + event.error.message, 'error');
});

// ✅ Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showMessage('An unexpected error occurred: ' + event.reason, 'error');
});

// ==================== EXPORT FUNCTIONS (if using modules) ====================

// If you're using this as a module, uncomment the lines below:
// export { login, getMembers, addMember, deleteMember, testConnection, loadDashboard };

console.log('✅ Admin.js loaded successfully');
console.log('Available functions:', {
    login: typeof login,
    getMembers: typeof getMembers,
    addMember: typeof addMember,
    deleteMember: typeof deleteMember,
    testConnection: typeof testConnection,
    loadDashboard: typeof loadDashboard,
    fetchWithTimeout: typeof fetchWithTimeout
});
