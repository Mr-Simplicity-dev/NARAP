// ==================== MEMBERS MODULE ====================

class MembersManager {
    constructor() {
        this.currentMembers = [];
        this.currentPage = 1;
        this.membersPerPage = parseInt(localStorage.getItem('narap_members_per_page') || '10', 10);
        this.searchTerm = '';
        this.filters = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Member form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'addMemberForm') {
                e.preventDefault();
                this.addMember(e);
            } else if (e.target.id === 'editMemberForm') {
                e.preventDefault();
                this.editMember(e);
            }
        });

        // Member search
        const searchInput = document.getElementById('memberSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.filterMembers();
            });
        }

        // Member filters
        const stateFilter = document.getElementById('memberStateFilter');
        if (stateFilter) {
            stateFilter.addEventListener('change', (e) => {
                this.filters.state = e.target.value;
                this.filterMembers();
            });
        }

        const positionFilter = document.getElementById('memberPositionFilter');
        if (positionFilter) {
            positionFilter.addEventListener('change', (e) => {
                this.filters.position = e.target.value;
                this.filterMembers();
            });
        }
    }

    async loadInitialData() {
        try {
            await this.loadMembers(1, this.membersPerPage);
        } catch (error) {
            console.error('Failed to load initial members data:', error);
        }
    }

    async loadMembers(page = 1, limit = 10) {
        try {
            if (typeof showMessage === 'function') {
                showMessage('Loading members...', 'info');
            }

            const data = await this.fetchMembers(page, limit);
            this.currentMembers = data.members || data.data || [];
            this.currentPage = page;
            
            this.displayMembers(this.currentMembers);
            this.updatePagination(data.pagination || {});
            
            if (typeof showMessage === 'function') {
                showMessage('Members loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Members loading error:', error);
            if (typeof showMessage === 'function') {
                showMessage('Failed to load members', 'error');
            }
        }
    }

    async fetchMembers(page, limit) {
        if (window.apiManager) {
            return await window.apiManager.getMembers(page, limit, this.searchTerm, this.filters);
        }
        
        // Fallback to direct fetch
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(this.searchTerm && { search: this.searchTerm }),
            ...this.filters
        });

        const response = await fetch(`https://narap-backend.onrender.com/api/users?${params}`);
        if (!response.ok) throw new Error('Failed to fetch members');
        return await response.json();
    }

    displayMembers(members) {
        const tbody = document.getElementById('membersTableBody');
        if (!tbody) return;

        tbody.innerHTML = members.map(member => this.createMemberRow(member)).join('');
        
        // Update selection UI
        if (typeof updateMembersSelectionUI === 'function') {
            updateMembersSelectionUI();
        }
    }

    createMemberRow(member) {
        const avatar = member.passportPhoto ? 
            this.getImageUrl(member.passportPhoto) : 
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjQ0NDIi8+CjxwYXRoIGQ9Ik0yMCA3NUMyMCA2NS4wNTc2IDI4LjA1NzYgNTcgMzggNTdINjJDNzEuOTQyNCA1NyA4MCA2NS4wNTc2IDgwIDc1VjgwSDIwVjc1WiIgZmlsbD0iI0NDQyIvPgo8L3N2Zz4K';

        return `
            <tr data-member-id="${member._id || member.id}">
                <td style="display: none;">
                    <input type="checkbox" class="member-checkbox" value="${member._id || member.id}">
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${avatar}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <div style="font-weight: bold;">${member.name || member.fullName || 'N/A'}</div>
                            <div style="font-size: 12px; color: #666;">${member.code || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td>${member.email || 'N/A'}</td>
                <td>${member.position || 'N/A'}</td>
                <td>${member.state || member.State || 'N/A'}</td>
                <td>${member.zone || 'N/A'}</td>
                <td>
                    <span class="status-badge ${member.isActive !== false ? 'active' : 'inactive'}" 
                          style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                                 ${member.isActive !== false ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
                        ${member.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="showViewMemberModal('${member._id || member.id}')" 
                                style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                            View
                        </button>
                        <button onclick="showEditMemberModal('${member._id || member.id}')" 
                                style="padding: 4px 8px; background: #ffc107; color: black; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                            Edit
                        </button>
                        <button onclick="deleteMember('${member._id || member.id}')" 
                                style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    updatePagination(pagination) {
        const container = document.getElementById('membersPagination');
        if (!container) return;

        const { currentPage, totalPages, totalItems } = pagination;
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>Page ${currentPage} of ${totalPages} (${totalItems} total)</span>
                <button onclick="goToMembersPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>
                <button onclick="goToMembersPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
            </div>
        `;
    }

    filterMembers() {
        // This would typically filter the current members array
        // For now, we'll reload from server with filters
        this.loadMembers(this.currentPage, this.membersPerPage);
    }

    // Member CRUD operations
    async addMember(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        try {
            if (typeof showMessage === 'function') {
                showMessage('Adding member...', 'info');
            }

            const result = await this.createMember(formData);
            
            if (result.success) {
                if (typeof showMessage === 'function') {
                    showMessage('Member added successfully!', 'success');
                }
                
                // Close modal and refresh list
                this.closeAddMemberModal();
                this.loadMembers(this.currentPage, this.membersPerPage);
                
                // Log activity
                if (typeof logMemberAdd === 'function') {
                    logMemberAdd(result.member);
                }
            } else {
                throw new Error(result.message || 'Failed to add member');
            }
        } catch (error) {
            console.error('Add member error:', error);
            if (typeof showMessage === 'function') {
                showMessage(error.message || 'Failed to add member', 'error');
            }
        }
    }

    async createMember(formData) {
        if (window.apiManager) {
            return await window.apiManager.createMember(formData);
        }
        
        // Fallback
        const response = await fetch('https://narap-backend.onrender.com/api/users', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to create member');
        return await response.json();
    }

    async editMember(event) {
        const form = event.target;
        const memberId = form.dataset.memberId;
        
        if (!memberId) {
            if (typeof showMessage === 'function') {
                showMessage('Member ID not found', 'error');
            }
            return;
        }

        const formData = new FormData(form);
        
        try {
            if (typeof showMessage === 'function') {
                showMessage('Updating member...', 'info');
            }

            const result = await this.updateMember(memberId, formData);
            
            if (result.success) {
                if (typeof showMessage === 'function') {
                    showMessage('Member updated successfully!', 'success');
                }
                
                // Close modal and refresh list
                this.closeEditMemberModal();
                this.loadMembers(this.currentPage, this.membersPerPage);
                
                // Log activity
                if (typeof logMemberUpdate === 'function') {
                    logMemberUpdate(result.member);
                }
            } else {
                throw new Error(result.message || 'Failed to update member');
            }
        } catch (error) {
            console.error('Edit member error:', error);
            if (typeof showMessage === 'function') {
                showMessage(error.message || 'Failed to update member', 'error');
            }
        }
    }

    async updateMember(memberId, formData) {
        if (window.apiManager) {
            return await window.apiManager.updateMember(memberId, formData);
        }
        
        // Fallback
        const response = await fetch(`https://narap-backend.onrender.com/api/users/updateUser/${memberId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to update member');
        return await response.json();
    }

    async deleteMember(memberId) {
        if (!confirm('Are you sure you want to delete this member?')) {
            return;
        }

        try {
            if (typeof showMessage === 'function') {
                showMessage('Deleting member...', 'info');
            }

            const result = await this.removeMember(memberId);
            
            if (result.success) {
                if (typeof showMessage === 'function') {
                    showMessage('Member deleted successfully!', 'success');
                }
                
                // Refresh list
                this.loadMembers(this.currentPage, this.membersPerPage);
                
                // Log activity
                if (typeof logMemberDelete === 'function') {
                    logMemberDelete({ _id: memberId });
                }
            } else {
                throw new Error(result.message || 'Failed to delete member');
            }
        } catch (error) {
            console.error('Delete member error:', error);
            if (typeof showMessage === 'function') {
                showMessage(error.message || 'Failed to delete member', 'error');
            }
        }
    }

    async removeMember(memberId) {
        if (window.apiManager) {
            return await window.apiManager.deleteMember(memberId);
        }
        
        // Fallback
        const response = await fetch(`https://narap-backend.onrender.com/api/users/${memberId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete member');
        return await response.json();
    }

    // Modal management
    showAddMemberModal() {
        const modal = document.getElementById('addMemberModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeAddMemberModal() {
        const modal = document.getElementById('addMemberModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    showEditMemberModal(memberId) {
        const member = this.currentMembers.find(m => (m._id || m.id) === memberId);
        if (!member) {
            if (typeof showMessage === 'function') {
                showMessage('Member not found', 'error');
            }
            return;
        }

        this.populateEditForm(member);
        const modal = document.getElementById('editMemberModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    populateEditForm(member) {
        // Populate form fields
        const fields = {
            'editMemberName': member.name || member.fullName || '',
            'editMemberEmail': member.email || '',
            'editMemberCode': member.code || '',
            'editMemberPosition': member.position || '',
            'editMemberState': member.state || member.State || '',
            'editMemberZone': member.zone || '',
            'editMemberPassword': ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const field = document.getElementById(id);
            if (field) {
                field.value = value;
            }
        });

        // Set member ID on form
        const form = document.getElementById('editMemberForm');
        if (form) {
            form.dataset.memberId = member._id || member.id;
        }
    }

    closeEditMemberModal() {
        const modal = document.getElementById('editMemberModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    showViewMemberModal(memberId) {
        const member = this.currentMembers.find(m => (m._id || m.id) === memberId);
        if (!member) {
            if (typeof showMessage === 'function') {
                showMessage('Member not found', 'error');
            }
            return;
        }

        this.displayMemberDetails(member);
    }

    displayMemberDetails(member) {
        const avatar = member.passportPhoto ? 
            this.getImageUrl(member.passportPhoto) : 
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjQ0NDIi8+CjxwYXRoIGQ9Ik0yMCA3NUMyMCA2NS4wNTc2IDI4LjA1NzYgNTcgMzggNTdINjJDNzEuOTQyNCA1NyA4MCA2NS4wNTc2IDgwIDc1VjgwSDIwVjc1WiIgZmlsbD0iI0NDQyIvPgo8L3N2Zz4K';

        const modalHTML = `
            <div id="viewMemberModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: #333;">Member Details</h3>
                        <button onclick="closeViewMemberModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                            <img src="${avatar}" alt="Member Photo" style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 10px 0; color: #333;">${member.name || member.fullName || 'N/A'}</h4>
                                <p style="margin: 0; color: #666; font-size: 14px;">Member Code: ${member.code || 'N/A'}</p>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Email:</label>
                                <span style="color: #666;">${member.email || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">Position:</label>
                                <span style="color: #666;">${member.position || 'N/A'}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                                <label style="font-weight: bold; color: #333;">State:</label>
                                <span style="color: #666;">${member.state || member.State || 'N/A'}</span>
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
    }

    closeViewMemberModal() {
        const modal = document.getElementById('viewMemberModal');
        if (modal) {
            modal.remove();
        }
    }

    // Utility functions
    getImageUrl(imagePath) {
        if (!imagePath) return '';
        
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        if (imagePath.includes('cloudinary.com')) {
            return imagePath;
        }
        
        const baseURL = window.apiManager ? window.apiManager.baseURL : 'https://narap-backend.onrender.com';
        return `${baseURL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    }

    // Pagination functions
    changeMembersPerPage(perPage) {
        this.membersPerPage = perPage;
        localStorage.setItem('narap_members_per_page', perPage.toString());
        this.loadMembers(1, perPage);
    }

    goToMembersPage(page) {
        if (page < 1) return;
        this.loadMembers(page, this.membersPerPage);
    }
}

// Global functions for backward compatibility
function loadMembers(page = 1, limit = 10) {
    if (window.membersManager) {
        window.membersManager.loadMembers(page, limit);
    }
}

function displayMembers(members) {
    if (window.membersManager) {
        window.membersManager.displayMembers(members);
    }
}

function addMember(event) {
    if (window.membersManager) {
        window.membersManager.addMember(event);
    }
}

function editMember(event) {
    if (window.membersManager) {
        window.membersManager.editMember(event);
    }
}

function deleteMember(memberId) {
    if (window.membersManager) {
        window.membersManager.deleteMember(memberId);
    }
}

function showAddMemberModal() {
    if (window.membersManager) {
        window.membersManager.showAddMemberModal();
    }
}

function showEditMemberModal(memberId) {
    if (window.membersManager) {
        window.membersManager.showEditMemberModal(memberId);
    }
}

function showViewMemberModal(memberId) {
    if (window.membersManager) {
        window.membersManager.showViewMemberModal(memberId);
    }
}

function closeViewMemberModal() {
    if (window.membersManager) {
        window.membersManager.closeViewMemberModal();
    }
}

function changeMembersPerPage(perPage) {
    if (window.membersManager) {
        window.membersManager.changeMembersPerPage(perPage);
    }
}

function goToMembersPage(page) {
    if (window.membersManager) {
        window.membersManager.goToMembersPage(page);
    }
}

function filterMembers() {
    if (window.membersManager) {
        window.membersManager.filterMembers();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MembersManager;
} else {
    window.MembersManager = MembersManager;
    window.loadMembers = loadMembers;
    window.displayMembers = displayMembers;
    window.addMember = addMember;
    window.editMember = editMember;
    window.deleteMember = deleteMember;
    window.showAddMemberModal = showAddMemberModal;
    window.showEditMemberModal = showEditMemberModal;
    window.showViewMemberModal = showViewMemberModal;
    window.closeViewMemberModal = closeViewMemberModal;
    window.changeMembersPerPage = changeMembersPerPage;
    window.goToMembersPage = goToMembersPage;
    window.filterMembers = filterMembers;
}
