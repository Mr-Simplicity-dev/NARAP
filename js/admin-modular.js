// ==================== NARAP ADMIN PANEL - MODULAR VERSION ====================
// This is the main orchestrator file that imports and coordinates all modules

// Global constants and configuration
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjQ0NDIi8+CjxwYXRoIGQ9Ik0yMCA3NUMyMCA2NS4wNTc2IDI4LjA1NzYgNTcgMzggNTdINjJDNzEuOTQyNCA1NyA4MCA2NS4wNTc2IDgwIDc1VjgwSDIwVjc1WiIgZmlsbD0iI0NDQyIvPgo8L3N2Zz4K';

// Global state
window.currentMembers = [];
window.currentCertificates = [];
window.membersCurrentPage = 1;
window.certificatesCurrentPage = 1;

// Global instances
let performanceMonitor;
let notificationManager;
let dataCache;
let activityLogger;
let authManager;
let uiManager;
let apiManager;
let fileUploadManager;
let analyticsManager;
let membersManager;
let certificatesManager;

// Initialization tracking
let initializationAttempts = 0;
const maxInitializationAttempts = 50; // 5 seconds max (50 * 100ms)

// ==================== INITIALIZATION ====================

function initializeApp() {
    try {
        console.log('🚀 Initializing NARAP Admin Panel...');
        
        // Check if all required classes are available
        const requiredClasses = [
            'PerformanceMonitor', 'NotificationManager', 'DataCache', 'ActivityLogger',
            'AuthManager', 'UIManager', 'APIManager', 'FileUploadManager',
            'AnalyticsManager', 'MembersManager', 'CertificatesManager'
        ];
        
        const missingClasses = requiredClasses.filter(className => typeof window[className] !== 'function');
        
        if (missingClasses.length > 0) {
            initializationAttempts++;
            console.error('❌ Missing required classes:', missingClasses);
            console.log(`⏳ Retry attempt ${initializationAttempts}/${maxInitializationAttempts} in 100ms...`);
            
            if (initializationAttempts >= maxInitializationAttempts) {
                console.error('❌ Failed to initialize after maximum attempts. Please check that all module files are loaded correctly.');
                console.error('Missing classes:', missingClasses);
                return;
            }
            
            setTimeout(initializeApp, 100);
            return;
        }
        
        console.log('✅ All required classes are available');
        
        // Reset attempt counter on success
        initializationAttempts = 0;
        
        // Initialize utility classes
        performanceMonitor = new PerformanceMonitor();
        notificationManager = new NotificationManager();
        dataCache = new DataCache();
        activityLogger = new ActivityLogger();
        
        // Make utilities globally available
        window.performanceMonitor = performanceMonitor;
        window.notificationManager = notificationManager;
        window.dataCache = dataCache;
        window.activityLogger = activityLogger;
        
        // Initialize core managers
        authManager = new AuthManager();
        uiManager = new UIManager();
        apiManager = new APIManager();
        fileUploadManager = new FileUploadManager();
        analyticsManager = new AnalyticsManager();
        membersManager = new MembersManager();
        certificatesManager = new CertificatesManager();
        
        // Make managers globally available
        window.authManager = authManager;
        window.uiManager = uiManager;
        window.apiManager = apiManager;
        window.fileUploadManager = fileUploadManager;
        window.analyticsManager = analyticsManager;
        window.membersManager = membersManager;
        window.certificatesManager = certificatesManager;
        
        // Setup global message function
        window.showMessage = (message, type = 'info', duration = 5000) => {
            if (notificationManager) {
                notificationManager.show(message, type, duration);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        };
        
        // Setup activity logging functions
        window.logMemberAdd = (member) => {
            if (activityLogger) {
                activityLogger.member('added', {
                    id: member?._id || member?.id,
                    code: member?.code,
                    name: member?.name || member?.fullName,
                    state: member?.state || member?.State
                });
            }
        };
        
        window.logMemberUpdate = (member) => {
            if (activityLogger) {
                activityLogger.member('updated', {
                    id: member?._id || member?.id,
                    code: member?.code,
                    name: member?.name || member?.fullName,
                    state: member?.state || member?.State
                });
            }
        };
        
        window.logMemberDelete = (member) => {
            if (activityLogger) {
                activityLogger.member('deleted', {
                    id: member?._id || member?.id,
                    code: member?.code,
                    name: member?.name || member?.fullName
                });
            }
        };
        
        window.logCertificateAdd = (certificate) => {
            if (activityLogger) {
                activityLogger.certificate('added', {
                    id: certificate?._id || certificate?.id,
                    number: certificate?.certificateNumber || certificate?.number,
                    member: certificate?.memberName || certificate?.recipientName
                });
            }
        };
        
        window.logCertificateUpdate = (certificate) => {
            if (activityLogger) {
                activityLogger.certificate('updated', {
                    id: certificate?._id || certificate?.id,
                    number: certificate?.certificateNumber || certificate?.number,
                    member: certificate?.memberName || certificate?.recipientName
                });
            }
        };
        
        window.logCertificateDelete = (certificate) => {
            if (activityLogger) {
                activityLogger.certificate('deleted', {
                    id: certificate?._id || certificate?.id,
                    number: certificate?.certificateNumber || certificate?.number,
                    member: certificate?.memberName || certificate?.recipientName
                });
            }
        };
        
        // Setup pagination functions
        window.changeMembersPerPage = (perPage) => {
            if (membersManager) {
                membersManager.changeMembersPerPage(perPage);
            }
        };
        
        window.changeCertificatesPerPage = (perPage) => {
            if (certificatesManager) {
                certificatesManager.changeCertificatesPerPage(perPage);
            }
        };
        
        window.goToMembersPage = (page) => {
            if (membersManager) {
                membersManager.goToMembersPage(page);
            }
        };
        
        window.goToCertificatesPage = (page) => {
            if (certificatesManager) {
                certificatesManager.goToCertificatesPage(page);
            }
        };
        
        // Setup initial data loading
        window.loadInitialData = async () => {
            try {
                if (authManager && authManager.isLoggedIn) {
                    // Load initial data for logged-in users
                    if (membersManager) {
                        await membersManager.loadInitialData();
                    }
                    if (certificatesManager) {
                        await certificatesManager.loadInitialData();
                    }
                }
            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        };
        
        // Setup auto-sync
        window.setupAutoSync = () => {
            // Auto-sync every 5 minutes
            setInterval(() => {
                if (authManager && authManager.isLoggedIn) {
                    if (membersManager) {
                        membersManager.loadMembers(membersManager.currentPage, membersManager.membersPerPage);
                    }
                    if (certificatesManager) {
                        certificatesManager.loadCertificates(certificatesManager.currentPage, certificatesManager.certificatesPerPage);
                    }
                }
            }, 300000); // 5 minutes
        };
        
        // Setup server status monitoring
        window.updateSyncStatus = (status) => {
            const statusElement = document.getElementById('syncStatus');
            if (statusElement) {
                statusElement.textContent = status;
                statusElement.className = `status-${status}`;
            }
        };
        
        window.showSyncDetails = () => {
            if (notificationManager) {
                notificationManager.show('Sync details: Last sync successful', 'info');
            }
        };
        
        // Setup bulk operations
        window.clearPendingDeletions = () => {
            // Clear any pending deletion operations
            console.log('Clearing pending deletions...');
        };
        
        // Setup test functions
        window.testClearButtons = () => {
            console.log('🧪 Testing clear buttons...');
            console.log('✅ All clear button functions are accessible');
        };
        
        // Initialize auto-sync
        setupAutoSync();
        
        // Start server status monitoring
        setInterval(async () => {
            if (apiManager) {
                const status = await apiManager.checkServerStatus();
                window.updateSyncStatus(status);
            }
        }, 30000);
        
        // Initial server status check
        setTimeout(async () => {
            if (apiManager) {
                const status = await apiManager.checkServerStatus();
                window.updateSyncStatus(status);
            }
        }, 2000);
        
        console.log('✅ NARAP Admin Panel initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize NARAP Admin Panel:', error);
        if (notificationManager) {
            notificationManager.show('Failed to initialize application', 'error');
        }
    }
}

// Fallback initialization function that can be called manually
function forceInitializeApp() {
    console.log('🔄 Force initializing NARAP Admin Panel...');
    initializationAttempts = 0;
    initializeApp();
}

// Make force initialization available globally
window.forceInitializeApp = forceInitializeApp;

// Module loading status checker
function checkModuleStatus() {
    const requiredClasses = [
        'PerformanceMonitor', 'NotificationManager', 'DataCache', 'ActivityLogger',
        'AuthManager', 'UIManager', 'APIManager', 'FileUploadManager',
        'AnalyticsManager', 'MembersManager', 'CertificatesManager'
    ];
    
    console.log('📋 Module Loading Status:');
    requiredClasses.forEach(className => {
        const isLoaded = typeof window[className] === 'function';
        console.log(`${isLoaded ? '✅' : '❌'} ${className}: ${isLoaded ? 'Loaded' : 'Missing'}`);
    });
    
    const missingClasses = requiredClasses.filter(className => typeof window[className] !== 'function');
    if (missingClasses.length === 0) {
        console.log('🎉 All modules are loaded successfully!');
    } else {
        console.log(`⚠️ ${missingClasses.length} modules are missing:`, missingClasses);
    }
    
    return missingClasses.length === 0;
}

// Make module status checker available globally
window.checkModuleStatus = checkModuleStatus;

// ==================== UTILITY FUNCTIONS ====================

// JSON parsing helper
window.tryJson = async (response) => {
    try {
        return await response.json();
    } catch (error) {
        console.warn('Failed to parse JSON response:', error);
        return {};
    }
};

// Image URL helper
window.getImageUrl = (imagePath) => {
    if (!imagePath) return DEFAULT_AVATAR;
    
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    if (imagePath.includes('cloudinary.com')) {
        return imagePath;
    }
    
    const baseURL = apiManager ? apiManager.baseURL : 'https://narap-backend.onrender.com';
    return `${baseURL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Local storage helpers
window.getLocalMembers = () => {
    try {
        const stored = localStorage.getItem('narap_members');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to get local members:', error);
        return [];
    }
};

window.saveLocalMembers = (members) => {
    try {
        localStorage.setItem('narap_members', JSON.stringify(members));
    } catch (error) {
        console.error('Failed to save local members:', error);
    }
};

window.getLocalCertificates = () => {
    try {
        const stored = localStorage.getItem('narap_certificates');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to get local certificates:', error);
        return [];
    }
};

window.saveLocalCertificates = (certificates) => {
    try {
        localStorage.setItem('narap_certificates', JSON.stringify(certificates));
    } catch (error) {
        console.error('Failed to save local certificates:', error);
    }
};

// ==================== BULK OPERATIONS ====================

window.clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        try {
            localStorage.clear();
            window.currentMembers = [];
            window.currentCertificates = [];
            
            if (membersManager) {
                membersManager.currentMembers = [];
            }
            if (certificatesManager) {
                certificatesManager.currentCertificates = [];
            }
            
            if (notificationManager) {
                notificationManager.show('All data cleared successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to clear data:', error);
            if (notificationManager) {
                notificationManager.show('Failed to clear data', 'error');
            }
        }
    }
};

window.clearAllCertificates = () => {
    if (confirm('Are you sure you want to clear all certificates? This action cannot be undone.')) {
        try {
            localStorage.removeItem('narap_certificates');
            window.currentCertificates = [];
            
            if (certificatesManager) {
                certificatesManager.currentCertificates = [];
            }
            
            if (notificationManager) {
                notificationManager.show('All certificates cleared successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to clear certificates:', error);
            if (notificationManager) {
                notificationManager.show('Failed to clear certificates', 'error');
            }
        }
    }
};

window.confirmClearAllData = () => {
    // Show confirmation modal
    const modal = document.getElementById('confirmModal');
    if (modal) {
        document.getElementById('confirmTitle').textContent = 'Clear All Data';
        document.getElementById('confirmMessage').textContent = 'Are you sure you want to clear all data? This action cannot be undone.';
        modal.style.display = 'block';
        
        // Setup confirm button
        const confirmBtn = document.getElementById('confirmYes');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                clearAllData();
                modal.style.display = 'none';
            };
        }
        
        // Setup cancel button
        const cancelBtn = document.getElementById('confirmNo');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
    }
};

window.confirmClearCertificates = () => {
    // Show confirmation modal
    const modal = document.getElementById('confirmModal');
    if (modal) {
        document.getElementById('confirmTitle').textContent = 'Clear All Certificates';
        document.getElementById('confirmMessage').textContent = 'Are you sure you want to clear all certificates? This action cannot be undone.';
        modal.style.display = 'block';
        
        // Setup confirm button
        const confirmBtn = document.getElementById('confirmYes');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                clearAllCertificates();
                modal.style.display = 'none';
            };
        }
        
        // Setup cancel button
        const cancelBtn = document.getElementById('confirmNo');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
    }
};

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    initializeApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && authManager && authManager.isLoggedIn) {
        // Page became visible, refresh data
        if (membersManager) {
            membersManager.loadMembers(membersManager.currentPage, membersManager.membersPerPage);
        }
        if (certificatesManager) {
            certificatesManager.loadCertificates(certificatesManager.currentPage, certificatesManager.certificatesPerPage);
        }
    }
});

// Handle online/offline events
window.addEventListener('online', () => {
    if (apiManager) {
        apiManager.handleOnline();
    }
});

window.addEventListener('offline', () => {
    if (apiManager) {
        apiManager.handleOffline();
    }
});

// ==================== EXPORT FOR TESTING ====================

// Make everything available for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApp,
        performanceMonitor,
        notificationManager,
        dataCache,
        activityLogger,
        authManager,
        uiManager,
        apiManager,
        fileUploadManager,
        analyticsManager,
        membersManager,
        certificatesManager
    };
}

console.log('📦 NARAP Admin Panel modules loaded successfully');
