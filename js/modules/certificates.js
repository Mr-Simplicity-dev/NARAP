// ==================== CERTIFICATES MODULE ====================

class CertificatesManager {
    constructor() {
        this.currentCertificates = [];
        this.currentPage = 1;
        this.certificatesPerPage = parseInt(localStorage.getItem('narap_certificates_per_page') || '10', 10);
        this.searchTerm = '';
        this.filters = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Certificate form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'addCertificateForm') {
                e.preventDefault();
                this.addCertificate(e);
            } else if (e.target.id === 'editCertificateForm') {
                e.preventDefault();
                this.editCertificate(e);
            }
        });

        // Certificate search
        const searchInput = document.getElementById('certificateSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.filterCertificates();
            });
        }

        // Certificate filters
        const statusFilter = document.getElementById('certificateStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.filterCertificates();
            });
        }

        const typeFilter = document.getElementById('certificateTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.filterCertificates();
            });
        }

        const stateFilter = document.getElementById('certificateStateFilter');
        if (stateFilter) {
            stateFilter.addEventListener('change', (e) => {
                this.filters.state = e.target.value;
                this.filterCertificates();
            });
        }
    }

    async loadInitialData() {
        try {
            // Only load data if user is logged in
            const isLoggedIn = localStorage.getItem('narap_logged_in') === 'true';
            if (!isLoggedIn) {
                console.log('User not logged in, skipping initial certificates data load');
                return;
            }
            
            await this.loadCertificates(1, this.certificatesPerPage);
        } catch (error) {
            console.error('Failed to load initial certificates data:', error);
            // Don't show error message for initial load failures
            // The user might not be logged in yet
        }
    }

    async loadCertificates(page = 1, limit = 10) {
        try {
            if (typeof showMessage === 'function') {
                showMessage('Loading certificates...', 'info');
            }

            const data = await this.fetchCertificates(page, limit);
            this.currentCertificates = data.certificates || data.data || [];
            this.currentPage = page;
            
            this.displayCertificates(this.currentCertificates);
            this.updatePagination(data.pagination || {});
            
            if (typeof showMessage === 'function') {
                showMessage('Certificates loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Certificates loading error:', error);
            if (typeof showMessage === 'function') {
                showMessage('Failed to load certificates', 'error');
            }
        }
    }

    async fetchCertificates(page, limit) {
        try {
            if (window.apiManager) {
                return await window.apiManager.getCertificates(page, limit, this.searchTerm, this.filters);
            }
            
            // Fallback to direct fetch
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(this.searchTerm && { search: this.searchTerm }),
                ...this.filters
            });

            const url = `https://narap-backend.onrender.com/api/certificates?${params}`;
            console.log('Certificates fallback fetch URL:', url); // Debug log
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add timeout
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('fetchCertificates error:', error);
            
            // If it's a network error, try to load from localStorage as fallback
            if (error.name === 'AbortError' || error.message.includes('fetch')) {
                console.log('Network error, attempting to load certificates from localStorage...');
                const localCertificates = this.getLocalCertificates();
                if (localCertificates && localCertificates.length > 0) {
                    return {
                        certificates: localCertificates,
                        pagination: {
                            currentPage: 1,
                            totalPages: 1,
                            totalItems: localCertificates.length
                        }
                    };
                }
            }
            
            throw error;
        }
    }

    displayCertificates(certificates) {
        const tbody = document.getElementById('certificatesTableBody');
        if (!tbody) return;

        tbody.innerHTML = certificates.map(certificate => this.createCertificateRow(certificate)).join('');
        
        // Update selection UI
        if (typeof updateCertificatesSelectionUI === 'function') {
            updateCertificatesSelectionUI();
        }
    }

    createCertificateRow(certificate) {
        const statusClass = certificate.status === 'active' ? 'active' : 'inactive';
        const statusText = certificate.status === 'active' ? 'Active' : 'Inactive';
        
        return `
            <tr data-certificate-id="${certificate._id || certificate.id}">
                <td style="display: none;">
                    <input type="checkbox" class="certificate-checkbox" value="${certificate._id || certificate.id}">
                </td>
                <td>
                    <div style="font-weight: bold;">${certificate.certificateNumber || certificate.number || 'N/A'}</div>
                </td>
                <td>${certificate.memberName || certificate.recipientName || 'N/A'}</td>
                <td>${certificate.memberCode || certificate.recipientCode || 'N/A'}</td>
                <td>${certificate.certificateType || certificate.type || 'N/A'}</td>
                <td>${certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : 'N/A'}</td>
                <td>${certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <span class="status-badge ${statusClass}" 
                          style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                                 ${statusClass === 'active' ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="showViewCertificateModal('${certificate._id || certificate.id}')" 
                                style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                            View
                        </button>
                        <button onclick="showEditCertificateModal('${certificate._id || certificate.id}')" 
                                style="padding: 4px 8px; background: #ffc107; color: black; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                            Edit
                        </button>
                        <button onclick="deleteCertificate('${certificate._id || certificate.id}')" 
                                style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    updatePagination(pagination) {
        const container = document.getElementById('certificatesPagination');
        if (!container) return;

        const { currentPage, totalPages, totalItems } = pagination;
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>Page ${currentPage} of ${totalPages} (${totalItems} total)</span>
                <button onclick="goToCertificatesPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>
                <button onclick="goToCertificatesPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
            </div>
        `;
    }

    filterCertificates() {
        // This would typically filter the current certificates array
        // For now, we'll reload from server with filters
        this.loadCertificates(this.currentPage, this.certificatesPerPage);
    }

    // Certificate CRUD operations
    async addCertificate(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        try {
            if (typeof showMessage === 'function') {
                showMessage('Adding certificate...', 'info');
            }

            const result = await this.createCertificate(formData);
            
            if (result.success) {
                if (typeof showMessage === 'function') {
                    showMessage('Certificate added successfully!', 'success');
                }
                
                // Close modal and refresh list
                this.closeAddCertificateModal();
                this.loadCertificates(this.currentPage, this.certificatesPerPage);
                
                // Log activity
                if (typeof logCertificateAdd === 'function') {
                    logCertificateAdd(result.certificate);
                }
            } else {
                throw new Error(result.message || 'Failed to add certificate');
            }
        } catch (error) {
            console.error('Add certificate error:', error);
            if (typeof showMessage === 'function') {
                showMessage(error.message || 'Failed to add certificate', 'error');
            }
        }
    }

    async createCertificate(formData) {
        if (window.apiManager) {
            return await window.apiManager.createCertificate(formData);
        }
        
        // Fallback
        const response = await fetch('https://narap-backend.onrender.com/api/certificates', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to create certificate');
        return await response.json();
    }

    async editCertificate(event) {
        const form = event.target;
        const certificateId = form.dataset.certificateId;
        
        if (!certificateId) {
            if (typeof showMessage === 'function') {
                showMessage('Certificate ID not found', 'error');
            }
            return;
        }

        const formData = new FormData(form);
        
        try {
            if (typeof showMessage === 'function') {
                showMessage('Updating certificate...', 'info');
            }

            const result = await this.updateCertificate(certificateId, formData);
            
            if (result.success) {
                if (typeof showMessage === 'function') {
                    showMessage('Certificate updated successfully!', 'success');
                }
                
                // Close modal and refresh list
                this.closeEditCertificateModal();
                this.loadCertificates(this.currentPage, this.certificatesPerPage);
                
                // Log activity
                if (typeof logCertificateUpdate === 'function') {
                    logCertificateUpdate(result.certificate);
                }
            } else {
                throw new Error(result.message || 'Failed to update certificate');
            }
        } catch (error) {
            console.error('Edit certificate error:', error);
            if (typeof showMessage === 'function') {
                showMessage(error.message || 'Failed to update certificate', 'error');
            }
        }
    }

    async updateCertificate(certificateId, formData) {
        if (window.apiManager) {
            return await window.apiManager.updateCertificate(certificateId, formData);
        }
        
        // Fallback
        const response = await fetch(`https://narap-backend.onrender.com/api/certificates/${certificateId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to update certificate');
        return await response.json();
    }

    async deleteCertificate(certificateId) {
        if (!confirm('Are you sure you want to delete this certificate?')) {
            return;
        }

        try {
            if (typeof showMessage === 'function') {
                showMessage('Deleting certificate...', 'info');
            }

            const result = await this.removeCertificate(certificateId);
            
            if (result.success) {
                if (typeof showMessage === 'function') {
                    showMessage('Certificate deleted successfully!', 'success');
                }
                
                // Refresh list
                this.loadCertificates(this.currentPage, this.certificatesPerPage);
                
                // Log activity
                if (typeof logCertificateDelete === 'function') {
                    logCertificateDelete({ _id: certificateId });
                }
            } else {
                throw new Error(result.message || 'Failed to delete certificate');
            }
        } catch (error) {
            console.error('Delete certificate error:', error);
            if (typeof showMessage === 'function') {
                showMessage(error.message || 'Failed to delete certificate', 'error');
            }
        }
    }

    async removeCertificate(certificateId) {
        if (window.apiManager) {
            return await window.apiManager.deleteCertificate(certificateId);
        }
        
        // Fallback
        const response = await fetch(`https://narap-backend.onrender.com/api/certificates/${certificateId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete certificate');
        return await response.json();
    }

    // Modal management
    showAddCertificateModal() {
        const modal = document.getElementById('addCertificateModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeAddCertificateModal() {
        const modal = document.getElementById('addCertificateModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    showEditCertificateModal(certificateId) {
        const certificate = this.currentCertificates.find(c => (c._id || c.id) === certificateId);
        if (!certificate) {
            if (typeof showMessage === 'function') {
                showMessage('Certificate not found', 'error');
            }
            return;
        }

        this.populateEditForm(certificate);
        const modal = document.getElementById('editCertificateModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    populateEditForm(certificate) {
        // Populate form fields
        const fields = {
            'editCertificateNumber': certificate.certificateNumber || certificate.number || '',
            'editMemberName': certificate.memberName || certificate.recipientName || '',
            'editMemberCode': certificate.memberCode || certificate.recipientCode || '',
            'editCertificateType': certificate.certificateType || certificate.type || '',
            'editIssueDate': certificate.issueDate ? new Date(certificate.issueDate).toISOString().split('T')[0] : '',
            'editExpiryDate': certificate.expiryDate ? new Date(certificate.expiryDate).toISOString().split('T')[0] : '',
            'editStatus': certificate.status || 'active'
        };

        Object.entries(fields).forEach(([id, value]) => {
            const field = document.getElementById(id);
            if (field) {
                field.value = value;
            }
        });

        // Set certificate ID on form
        const form = document.getElementById('editCertificateForm');
        if (form) {
            form.dataset.certificateId = certificate._id || certificate.id;
        }
    }

    closeEditCertificateModal() {
        const modal = document.getElementById('editCertificateModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    showViewCertificateModal(certificateId) {
        const certificate = this.currentCertificates.find(c => (c._id || c.id) === certificateId);
        if (!certificate) {
            if (typeof showMessage === 'function') {
                showMessage('Certificate not found', 'error');
            }
            return;
        }

        this.displayCertificateDetails(certificate);
    }

    displayCertificateDetails(certificate) {
        const modalHTML = `
            <div id="viewCertificateModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: #333;">Certificate Details</h3>
                        <button onclick="closeViewCertificateModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 10px 0; color: #333;">Certificate #${certificate.certificateNumber || certificate.number || 'N/A'}</h4>
                            <p style="margin: 0; color: #666; font-size: 14px;">Type: ${certificate.certificateType || certificate.type || 'N/A'}</p>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Member Name:</label>
                                <span style="color: #666;">${certificate.memberName || certificate.recipientName || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Member Code:</label>
                                <span style="color: #666;">${certificate.memberCode || certificate.recipientCode || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Issue Date:</label>
                                <span style="color: #666;">${certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Expiry Date:</label>
                                <span style="color: #666;">${certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Status:</label>
                                <span class="status-badge ${certificate.status === 'active' ? 'active' : 'inactive'}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; ${certificate.status === 'active' ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
                                    ${certificate.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Created:</label>
                                <span style="color: #666;">${certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="closeViewCertificateModal()" style="padding: 10px 20px; border: 1px solid #ddd; background: #f8f9fa; color: #333; border-radius: 4px; cursor: pointer;">Close</button>
                        <button class="btn btn-warning" onclick="showEditCertificateModal('${certificate._id || certificate.id}')" style="padding: 10px 20px; border: 1px solid #ffc107; background: #ffc107; color: #000; border-radius: 4px; cursor: pointer;">Edit Certificate</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modal first
        const existingModal = document.getElementById('viewCertificateModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeViewCertificateModal() {
        const modal = document.getElementById('viewCertificateModal');
        if (modal) {
            modal.remove();
        }
    }

    // Pagination functions
    changeCertificatesPerPage(perPage) {
        this.certificatesPerPage = perPage;
        localStorage.setItem('narap_certificates_per_page', perPage.toString());
        this.loadCertificates(1, perPage);
    }

    goToCertificatesPage(page) {
        if (page < 1) return;
        this.loadCertificates(page, this.certificatesPerPage);
    }

    // Utility functions
    getLocalCertificates() {
        try {
            const stored = localStorage.getItem('narap_certificates');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to get local certificates:', error);
            return [];
        }
    }
}

// Global functions for backward compatibility
function loadCertificates(page = 1, limit = 10) {
    if (window.certificatesManager) {
        window.certificatesManager.loadCertificates(page, limit);
    }
}

function displayCertificates(certificates) {
    if (window.certificatesManager) {
        window.certificatesManager.displayCertificates(certificates);
    }
}

function addCertificate(event) {
    if (window.certificatesManager) {
        window.certificatesManager.addCertificate(event);
    }
}

function editCertificate(event) {
    if (window.certificatesManager) {
        window.certificatesManager.editCertificate(event);
    }
}

function deleteCertificate(certificateId) {
    if (window.certificatesManager) {
        window.certificatesManager.deleteCertificate(certificateId);
    }
}

function showAddCertificateModal() {
    if (window.certificatesManager) {
        window.certificatesManager.showAddCertificateModal();
    }
}

function showEditCertificateModal(certificateId) {
    if (window.certificatesManager) {
        window.certificatesManager.showEditCertificateModal(certificateId);
    }
}

function showViewCertificateModal(certificateId) {
    if (window.certificatesManager) {
        window.certificatesManager.showViewCertificateModal(certificateId);
    }
}

function closeViewCertificateModal() {
    if (window.certificatesManager) {
        window.certificatesManager.closeViewCertificateModal();
    }
}

function changeCertificatesPerPage(perPage) {
    if (window.certificatesManager) {
        window.certificatesManager.changeCertificatesPerPage(perPage);
    }
}

function goToCertificatesPage(page) {
    if (window.certificatesManager) {
        window.certificatesManager.goToCertificatesPage(page);
    }
}

function filterCertificates() {
    if (window.certificatesManager) {
        window.certificatesManager.filterCertificates();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CertificatesManager;
} else {
    window.CertificatesManager = CertificatesManager;
    window.loadCertificates = loadCertificates;
    window.displayCertificates = displayCertificates;
    window.addCertificate = addCertificate;
    window.editCertificate = editCertificate;
    window.deleteCertificate = deleteCertificate;
    window.showAddCertificateModal = showAddCertificateModal;
    window.showEditCertificateModal = showEditCertificateModal;
    window.showViewCertificateModal = showViewCertificateModal;
    window.closeViewCertificateModal = closeViewCertificateModal;
    window.changeCertificatesPerPage = changeCertificatesPerPage;
    window.goToCertificatesPage = goToCertificatesPage;
    window.filterCertificates = filterCertificates;
}
