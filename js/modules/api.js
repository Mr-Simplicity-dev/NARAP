// ==================== API COMMUNICATION MODULE ====================

class APIManager {
    constructor() {
        this.baseURL = this.getBackendURL();
        console.log('APIManager baseURL:', this.baseURL); // Debug log
        this.cache = new Map();
        this.init();
    }

    init() {
        this.setupConnectionHandlers();
    }

    getBackendURL() {
        // Try multiple backend URLs in order of preference
        const urls = [
            'https://narap-backend.onrender.com',
            (typeof API_BASE !== 'undefined' && API_BASE) ? API_BASE : '',
            (typeof window !== 'undefined' && window.__narapApiBase) ? window.__narapApiBase : ''
        ].filter(url => !!url);

        const selectedURL = urls[0] || 'https://narap-backend.onrender.com';
        console.log('APIManager.getBackendURL selected:', selectedURL);
        console.log('Available URLs:', urls);
        return selectedURL;
    }

    async makeRequest(endpoint, options = {}) {
        // Debug URL construction
        console.log('APIManager.makeRequest called with:');
        console.log('- this.baseURL:', this.baseURL);
        console.log('- endpoint:', endpoint);
        
        // Ensure proper URL construction
        const baseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${baseURL}${cleanEndpoint}`;
        
        console.log('- final URL:', url);
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            console.log('Making API request to:', url); // Debug log
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            
            // Check if it's a CORS error
            if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
                console.warn('CORS error detected. This might be due to cross-origin restrictions.');
                throw new Error('CORS Error: Unable to access the API from this domain. Please check CORS configuration.');
            }
            
            // Check if it's a network error
            if (error.message.includes('Failed to fetch') || error.message.includes('net::ERR_')) {
                console.warn('Network error detected. The server might be down or unreachable.');
                throw new Error('Network Error: Unable to reach the server. Please check your internet connection.');
            }
            
            throw error;
        }
    }

    // Members API
    async getMembers(page = 1, limit = 10, search = '', filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && { search }),
            ...filters
        });

        return this.makeRequest(`/api/users?${params}`);
    }

    async getMember(id) {
        return this.makeRequest(`/api/users/${id}`);
    }

    async createMember(memberData) {
        const formData = new FormData();
        
        // Add all member fields
        Object.keys(memberData).forEach(key => {
            if (memberData[key] !== null && memberData[key] !== undefined) {
                formData.append(key, memberData[key]);
            }
        });

        return this.makeRequest('/api/users', {
            method: 'POST',
            body: formData,
            headers: {} // Remove Content-Type header for FormData
        });
    }

    async updateMember(id, memberData) {
        const formData = new FormData();
        
        // Add all member fields
        Object.keys(memberData).forEach(key => {
            if (memberData[key] !== null && memberData[key] !== undefined) {
                formData.append(key, memberData[key]);
            }
        });

        return this.makeRequest(`/api/users/updateUser/${id}`, {
            method: 'PUT',
            body: formData,
            headers: {} // Remove Content-Type header for FormData
        });
    }

    async deleteMember(id) {
        return this.makeRequest(`/api/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Certificates API
    async getCertificates(page = 1, limit = 10, search = '', filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && { search }),
            ...filters
        });

        return this.makeRequest(`/api/certificates?${params}`);
    }

    async getCertificate(id) {
        return this.makeRequest(`/api/certificates/${id}`);
    }

    async createCertificate(certificateData) {
        return this.makeRequest('/api/certificates', {
            method: 'POST',
            body: JSON.stringify(certificateData)
        });
    }

    async updateCertificate(id, certificateData) {
        return this.makeRequest(`/api/certificates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(certificateData)
        });
    }

    async deleteCertificate(id) {
        return this.makeRequest(`/api/certificates/${id}`, {
            method: 'DELETE'
        });
    }

    // Analytics API
    async getAnalytics() {
        return this.makeRequest('/api/analytics');
    }

    async getDashboardStats() {
        return this.makeRequest('/api/analytics/dashboard');
    }

    // Health check
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.baseURL}/api/health`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok ? 'Online' : 'Offline';
        } catch (error) {
            return 'Offline';
        }
    }

    // File upload
    async uploadFile(file, type = 'passport') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        return this.makeRequest('/api/upload', {
            method: 'POST',
            body: formData,
            headers: {} // Remove Content-Type header for FormData
        });
    }

    // Bulk operations
    async bulkDeleteMembers(ids) {
        return this.makeRequest('/api/users/bulk-delete', {
            method: 'DELETE',
            body: JSON.stringify({ ids })
        });
    }

    async bulkDeleteCertificates(ids) {
        return this.makeRequest('/api/certificates/bulk-delete', {
            method: 'DELETE',
            body: JSON.stringify({ ids })
        });
    }

    // CSV Import
    async importCSV(file, type = 'members') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        return this.makeRequest('/api/import/csv', {
            method: 'POST',
            body: formData,
            headers: {} // Remove Content-Type header for FormData
        });
    }

    setupConnectionHandlers() {
        // Online/offline handlers
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    handleOnline() {
        if (typeof showMessage === 'function') {
            showMessage('Connection restored', 'success');
        }
        this.updateConnectionStatus('online');
    }

    handleOffline() {
        if (typeof showMessage === 'function') {
            showMessage('Connection lost', 'warning');
        }
        this.updateConnectionStatus('offline');
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `status-${status}`;
        }
    }

    // Retry mechanism for failed requests
    async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }

    // Cache management
    setCache(key, data, ttl = 300000) { // 5 minutes default
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl
        });
    }

    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    clearCache() {
        this.cache.clear();
    }
}

// Global functions for backward compatibility
function handleOnline() {
    if (window.apiManager) {
        window.apiManager.handleOnline();
    }
}

function handleOffline() {
    if (window.apiManager) {
        window.apiManager.handleOffline();
    }
}

function updateConnectionStatus(status) {
    if (window.apiManager) {
        window.apiManager.updateConnectionStatus(status);
    }
}

// Debug function for testing URL construction
function testAPIManagerURLs() {
    if (!window.apiManager) {
        console.error('APIManager not initialized');
        return;
    }
    
    console.log('🧪 Testing APIManager URL Construction:');
    console.log('Base URL:', window.apiManager.baseURL);
    
    // Test different endpoints
    const testEndpoints = [
        '/api/users',
        '/api/users?page=1&limit=10',
        '/api/certificates',
        '/api/health'
    ];
    
    testEndpoints.forEach(endpoint => {
        const baseURL = window.apiManager.baseURL.endsWith('/') ? 
            window.apiManager.baseURL.slice(0, -1) : 
            window.apiManager.baseURL;
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const finalURL = `${baseURL}${cleanEndpoint}`;
        
        console.log(`Endpoint: ${endpoint} → URL: ${finalURL}`);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIManager;
} else {
    window.APIManager = APIManager;
    window.handleOnline = handleOnline;
    window.handleOffline = handleOffline;
    window.updateConnectionStatus = updateConnectionStatus;
    window.testAPIManagerURLs = testAPIManagerURLs;
}
