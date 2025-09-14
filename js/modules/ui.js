// ==================== UI MANAGEMENT MODULE ====================

class UIManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPagination();
        this.setupSelection();
    }

    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            const tabLink = e.target.closest('[data-tab]');
            if (tabLink) {
                e.preventDefault();
                const tabName = tabLink.getAttribute('data-tab');
                this.switchTab(tabName);
            }
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', this.toggleSidebar.bind(this));
        }

        // Pagination
        this.setupPaginationEventListeners();
    }

    switchTab(tabName) {
        try {
            this.currentTab = tabName;
            
            // Show only the active panel
            var ids = ['dashboard', 'members', 'certificates', 'analytics', 'system'];
            for (var i = 0; i < ids.length; i++) {
                var id = ids[i];
                var panel = document.getElementById('panel-' + id);
                var link = document.querySelector('[data-tab="' + id + '"]');
                
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

            // Update sidebar button states
            var navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(function (item) { item.classList.remove('active'); });
            var selectedNavItem = document.getElementById('btn-' + tabName);
            if (selectedNavItem) selectedNavItem.classList.add('active');

            // Update page title
            var headerTitle = document.getElementById('headerTitle');
            if (headerTitle) headerTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);

            // Show/hide pagination controls
            this.updatePaginationVisibility(tabName);

            // Auto-load data for the selected tab
            this.loadTabData(tabName);

            // Ensure the user lands at the top
            try { 
                window.scrollTo({ top: 0, behavior: 'auto' }); 
            } catch (_) { 
                window.scrollTo(0, 0); 
            }
        } catch (e) {
            console.error('Error switching tab:', e);
        }
    }

    updatePaginationVisibility(tabName) {
        var membersPaginationContainer = document.getElementById('membersPagination');
        if (membersPaginationContainer) {
            membersPaginationContainer.style.display = (tabName === 'members') ? 'flex' : 'none';
        }
        
        var certificatesPaginationContainer = document.getElementById('certificatesPagination');
        if (certificatesPaginationContainer) {
            certificatesPaginationContainer.style.display = (tabName === 'certificates') ? 'flex' : 'none';
        }
    }

    loadTabData(tabName) {
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
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    }

    setupPagination() {
        // Initialize pagination visibility - hide by default
        const membersPaginationContainer = document.getElementById('membersPagination');
        const certificatesPaginationContainer = document.getElementById('certificatesPagination');
        
        if (membersPaginationContainer) {
            membersPaginationContainer.style.display = 'none';
        }
        if (certificatesPaginationContainer) {
            certificatesPaginationContainer.style.display = 'none';
        }
    }

    setupPaginationEventListeners() {
        // Members pagination
        const membersPerPageSelect = document.getElementById('membersPerPage');
        if (membersPerPageSelect) {
            membersPerPageSelect.addEventListener('change', (e) => {
                const perPage = parseInt(e.target.value);
                localStorage.setItem('narap_members_per_page', perPage.toString());
                if (typeof changeMembersPerPage === 'function') {
                    changeMembersPerPage(perPage);
                }
            });
        }

        // Certificates pagination
        const certificatesPerPageSelect = document.getElementById('certificatesPerPage');
        if (certificatesPerPageSelect) {
            certificatesPerPageSelect.addEventListener('change', (e) => {
                const perPage = parseInt(e.target.value);
                localStorage.setItem('narap_certificates_per_page', perPage.toString());
                if (typeof changeCertificatesPerPage === 'function') {
                    changeCertificatesPerPage(perPage);
                }
            });
        }
    }

    setupSelection() {
        // Setup selection functionality
        this.setupSelectionV2();
        this.setupFlexibleSelection();
    }

    setupSelectionV2() {
        if (window.__selectionV2Bound) return;

        const updateSelectionUI = (tableId, tbodySelector, checkboxSelector, headerCheckboxId) => {
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
        };

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

        // Document-level click: toggle selection on row click
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
                    cb.checked = !cb.checked;
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
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }, false);

        window.__selectionV2Bound = true;
    }

    setupFlexibleSelection() {
        if (window.__flexSelectionBound) return;

        const findHeaderSelectAllCell = (table) => {
            if (!table) return null;
            const th = table.querySelector('thead th:has(input[type="checkbox"][id*="selectAll" i])');
            return th || null;
        };

        const updateSelectionForTbody = (tbody) => {
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
        };

        // Change handler (bubble) keeps UI in sync for any checkbox in any tbody
        document.addEventListener('change', function(e) {
            if (!e.target.matches('tbody input[type="checkbox"]')) return;
            const tbody = e.target.closest('tbody');
            updateSelectionForTbody(tbody);
        }, false);

        // Row click toggler - use CAPTURE to run before other handlers
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
    }
}

// Global functions for backward compatibility
function switchTab(tabName) {
    if (window.uiManager) {
        window.uiManager.switchTab(tabName);
    }
}

function toggleSidebar() {
    if (window.uiManager) {
        window.uiManager.toggleSidebar();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
    window.switchTab = switchTab;
    window.toggleSidebar = toggleSidebar;
}
