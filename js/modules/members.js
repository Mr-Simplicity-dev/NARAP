class MembersManager {
    constructor() {
        this.currentMembers = [];
        this.currentPage = 1;
        this.membersPerPage = parseInt(localStorage.getItem('narap_members_per_page') || '10', 10);
        this.searchTerm = '';
        this.filters = {};
        this.retryAttempts = 3;
        this.debounceTimeout = null;
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
                this.debounceFilter();
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

    debounceFilter() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.filterMembers();
        }, 300); // Delay to reduce frequent API calls while typing
    }

    async loadInitialData() {
        try {
            const isLoggedIn = localStorage.getItem('narap_logged_in') === 'true';
            if (!isLoggedIn) {
                console.log('User not logged in, skipping initial members data load');
                return;
            }
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
        try {
            const url = `${this.getApiUrl()}/api/users`;
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(this.searchTerm && { search: this.searchTerm }),
                ...this.filters
            });

            const response = await this.retryFetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            return await response.json();
        } catch (error) {
            console.error('fetchMembers error:', error);

            // Attempt to load from localStorage if network fails
            if (error.name === 'AbortError' || error.message.includes('fetch')) {
                console.log('Network error, attempting to load from localStorage...');
                const localMembers = this.getLocalMembers();
                if (localMembers && localMembers.length > 0) {
                    return {
                        members: localMembers,
                        pagination: { currentPage: 1, totalPages: 1, totalItems: localMembers.length }
                    };
                }
            }

            throw error;
        }
    }

    async retryFetch(url, options, retries = this.retryAttempts) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                throw new Error('Failed to fetch');
            } catch (error) {
                if (attempt === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000)); // wait before retry
            }
        }
    }

    getApiUrl() {
        return process.env.API_URL || 'https://narap-backend.onrender.com';
    }

    displayMembers(members) {
        const tbody = document.getElementById('membersTableBody');
        if (!tbody) return;

        tbody.innerHTML = members.map(member => this.createMemberRow(member)).join('');
        if (typeof updateMembersSelectionUI === 'function') {
            updateMembersSelectionUI();
        }
    }

    createMemberRow(member) {
        const avatar = member.passportPhoto ? this.getImageUrl(member.passportPhoto) : 'data:image/svg+xml;base64,...'; // Default avatar

        return `
            <tr data-member-id="${member._id || member.id}">
                <td style="display: none;">
                    <input type="checkbox" class="member-checkbox" value="${member._id || member.id}">
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${avatar}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <div style="font-weight: bold;">${this.sanitizeText(member.name || member.fullName || 'N/A')}</div>
                            <div style="font-size: 12px; color: #666;">${this.sanitizeText(member.code || 'N/A')}</div>
                        </div>
                    </div>
                </td>
                <td>${this.sanitizeText(member.email || 'N/A')}</td>
                <td>${this.sanitizeText(member.position || 'N/A')}</td>
                <td>${this.sanitizeText(member.state || 'N/A')}</td>
                <td>${this.sanitizeText(member.zone || 'N/A')}</td>
                <td>
                    <span class="status-badge ${member.isActive !== false ? 'active' : 'inactive'}" 
                          style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                        ${member.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="showViewMemberModal('${member._id || member.id}')" class="btn btn-primary">
                            View
                        </button>
                        <button onclick="showEditMemberModal('${member._id || member.id}')" class="btn btn-warning">
                            Edit
                        </button>
                        <button onclick="deleteMember('${member._id || member.id}')" class="btn btn-danger">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    sanitizeText(text) {
        const element = document.createElement('div');
        element.innerText = text;
        return element.innerHTML;
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

                this.closeAddMemberModal();
                this.loadMembers(this.currentPage, this.membersPerPage);
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
        const response = await fetch(`${this.getApiUrl()}/api/users`, {
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

                this.closeEditMemberModal();
                this.loadMembers(this.currentPage, this.membersPerPage);
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
        const response = await fetch(`${this.getApiUrl()}/api/users/updateUser/${memberId}`, {
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

                this.loadMembers(this.currentPage, this.membersPerPage);
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
        const response = await fetch(`${this.getApiUrl()}/api/users/${memberId}`, {
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

    // Utility functions
    getImageUrl(imagePath) {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        if (imagePath.includes('cloudinary.com')) {
            return imagePath;
        }
        const baseURL = this.getApiUrl();
        return `${baseURL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    }

    getLocalMembers() {
        try {
            const stored = localStorage.getItem('narap_members');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to get local members:', error);
            return [];
        }
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

// Global function declarations for backward compatibility
window.MembersManager = MembersManager;
window.loadMembers = (page, limit) => { window.membersManager.loadMembers(page, limit); };
window.addMember = (event) => { window.membersManager.addMember(event); };
window.showAddMemberModal = () => { window.membersManager.showAddMemberModal(); };
window.showViewMemberModal = (memberId) => { window.membersManager.showViewMemberModal(memberId); };
window.showEditMemberModal = (memberId) => { window.membersManager.showEditMemberModal(memberId); };
window.closeViewMemberModal = () => { window.membersManager.closeViewMemberModal(); };
window.changeMembersPerPage = (perPage) => { window.membersManager.changeMembersPerPage(perPage); };
window.goToMembersPage = (page) => { window.membersManager.goToMembersPage(page); };
window.filterMembers = () => { window.membersManager.filterMembers(); };
window.deleteMember = (memberId) => { window.membersManager.deleteMember(memberId); };
