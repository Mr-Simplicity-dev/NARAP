// ==================== AUTHENTICATION MODULE ====================

class AuthManager {
    constructor() {
        this.isLoggedIn = localStorage.getItem('narap_logged_in') === 'true';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.login.bind(this));
        }

        // Auto-fill credentials button
        const fillCredentialsBtn = document.getElementById('fillCredentials');
        if (fillCredentialsBtn) {
            fillCredentialsBtn.addEventListener('click', this.fillAdminCredentials.bind(this));
        }
    }

    checkLoginStatus() {
        if (this.isLoggedIn) {
            this.showAdminPanel();
        } else {
            this.showLoginPanel();
        }
    }

    login(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username && password) {
            this.showAdminPanel();
            localStorage.setItem('narap_logged_in', 'true');
            this.isLoggedIn = true;
            
            // Show dashboard
            try {
                ['panel-members','panel-certificates','panel-analytics','panel-system'].forEach(function(id){
                    var el=document.getElementById(id); 
                    if(el) el.style.display='none';
                });
                var dash=document.getElementById('panel-dashboard');
                if(dash) dash.style.display='block';
                if (typeof switchTab==='function') switchTab('dashboard');
            } catch(_){}
            
            Promise.resolve().then(function(){ 
                if (typeof loadDashboard==='function') loadDashboard(); 
            });
            
            if (typeof showMessage === 'function') {
                showMessage('Login successful! Welcome to NARAP Admin Panel.', 'success');
            }
            
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

    fillAdminCredentials() {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        if (usernameField) usernameField.value = 'admin';
        if (passwordField) passwordField.value = 'admin123';
    }

    showAdminPanel() {
        const loginSection = document.getElementById('loginSection');
        const adminSection = document.getElementById('adminSection');
        
        if (loginSection) loginSection.style.display = 'none';
        if (adminSection) adminSection.style.display = 'block';
    }

    showLoginPanel() {
        const loginSection = document.getElementById('loginSection');
        const adminSection = document.getElementById('adminSection');
        
        if (loginSection) loginSection.style.display = 'block';
        if (adminSection) adminSection.style.display = 'none';
    }

    logout() {
        localStorage.removeItem('narap_logged_in');
        this.isLoggedIn = false;
        this.showLoginPanel();
        
        if (typeof showMessage === 'function') {
            showMessage('Logged out successfully', 'info');
        }
    }
}

// Global functions for backward compatibility
function login(event) {
    if (window.authManager) {
        window.authManager.login(event);
    }
}

function fillAdminCredentials() {
    if (window.authManager) {
        window.authManager.fillAdminCredentials();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} else {
    window.AuthManager = AuthManager;
    window.login = login;
    window.fillAdminCredentials = fillAdminCredentials;
}
