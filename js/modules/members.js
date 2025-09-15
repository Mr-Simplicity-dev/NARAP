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

            this.displayMembers(this.currentMembers, data.pagination.totalItems, page, data.pagination.totalPages, limit);

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
        return 'https://narap-backend.onrender.com'; // Replace with your actual API URL
    }

    displayMembers(members, totalItems = 0, currentPage = 1, totalPages = 1, itemsPerPage = 10) {
        const tableBody = document.getElementById('membersTableBody');
        if (!tableBody) return;

        // Validate the members array
        if (!Array.isArray(members)) members = [];

        // Update pagination variables
        const per = Math.max(1, Number(itemsPerPage) || 10);
        const page = Math.max(1, Number(currentPage) || 1);
        const pageOffset = (page - 1) * per;

        // If no members are found, display a "No members found" message
        if (members.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td class="loading" colspan="10" style="text-align:center; padding:24px;">
                        No members found
                    </td>
                </tr>
            `;
            return;
        }

        // Create table rows using a DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        members.forEach((member, idx) => {
            if (!member || typeof member !== 'object') return;

            const memberIdRaw = member._id || member.id || '';
            const memberId    = String(memberIdRaw).replace(/'/g, "\\'");
            const name        = this.sanitizeText(member.name || member.fullName || 'N/A');
            const email       = this.sanitizeText(member.email || 'N/A');
            const code        = this.sanitizeText(member.code || 'N/A');
            const position    = this.sanitizeText(member.position || 'N/A');
            const state       = this.sanitizeText(member.state || member.State || 'N/A');
            const zone        = this.sanitizeText(member.zone || 'N/A');

            // Create the row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pageOffset + idx + 1}</td>  <!-- S/N -->
                <td class="checkbox-cell">
                    <input type="checkbox" class="member-checkbox" value="${memberIdRaw}" onchange="toggleMemberSelection(this)">
                </td> <!-- Select (hidden by CSS until active) -->
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewPassport('${memberId}')" title="View Passport">View</button>
                </td> <!-- Photo (View) -->
                <td>${name}</td> <!-- Name -->
                <td>${email}</td> <!-- Email -->
                <td>${code}</td> <!-- Code -->
                <td>${position}</td> <!-- Position -->
                <td>${state}</td> <!-- State -->
                <td>${zone}</td> <!-- Zone -->
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-info" onclick="viewMember('${memberId}')" title="View Member">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="showEditMemberModal('${memberId}')" title="Edit Member">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteMember('${memberId}')" title="Delete Member">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td> <!-- Actions -->
            `;
            
            fragment.appendChild(row);
        });

        // Update the table body with the new rows
        tableBody.innerHTML = '';  // Clear the existing content
        tableBody.appendChild(fragment); // Append the new rows

        // Update pagination UI (optional, if required)
        this.updatePaginationUI(totalItems, currentPage, totalPages, itemsPerPage);
    }

    sanitizeText(text) {
        const element = document.createElement('div');
        element.innerText = text;
        return element.innerHTML;
    }

    updatePaginationUI(totalItems, currentPage, totalPages, itemsPerPage) {
        const paginationContainer = document.getElementById('paginationControls');
        if (!paginationContainer) return;

        const prevDisabled = currentPage <= 1 ? 'disabled' : '';
        const nextDisabled = currentPage >= totalPages ? 'disabled' : '';

        paginationContainer.innerHTML = `
            <button class="btn btn-sm btn-secondary" ${prevDisabled} onclick="goToPage(${currentPage - 1})">Previous</button>
            <span>Page ${currentPage} of ${totalPages}</span>
            <button class="btn btn-sm btn-secondary" ${nextDisabled} onclick="goToPage(${currentPage + 1})">Next</button>
        `;
    }

    goToPage(pageNumber) {
        if (pageNumber < 1) return;
        this.loadMembers(pageNumber, this.membersPerPage);
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
