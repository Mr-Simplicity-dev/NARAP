// ==================== ANALYTICS MODULE ====================

class AnalyticsManager {
    constructor() {
        this.stats = {};
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auto-refresh analytics every 5 minutes
        setInterval(() => {
            if (document.getElementById('panel-analytics')?.style.display !== 'none') {
                this.loadAnalytics();
            }
        }, 300000);
    }

    async loadAnalytics() {
        try {
            if (typeof showMessage === 'function') {
                showMessage('Loading analytics...', 'info');
            }

            const data = await this.fetchAnalyticsData();
            this.displayAnalytics(data);
            
            if (typeof showMessage === 'function') {
                showMessage('Analytics loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Analytics loading error:', error);
            if (typeof showMessage === 'function') {
                showMessage('Failed to load analytics', 'error');
            }
        }
    }

    async fetchAnalyticsData() {
        if (window.apiManager) {
            return await window.apiManager.getAnalytics();
        }
        
        // Fallback to direct fetch
        const response = await fetch('https://narap-backend.onrender.com/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        return await response.json();
    }

    displayAnalytics(data) {
        this.updateStatsCards(data);
        this.updateCharts(data);
        this.updateRecentActivity(data.recentActivity || []);
    }

    updateStatsCards(data) {
        const stats = data.stats || {};
        
        // Update member stats
        this.updateStatCard('totalMembers', stats.totalMembers || 0);
        this.updateStatCard('activeMembers', stats.activeMembers || 0);
        this.updateStatCard('newMembersThisMonth', stats.newMembersThisMonth || 0);
        
        // Update certificate stats
        this.updateStatCard('totalCertificates', stats.totalCertificates || 0);
        this.updateStatCard('certificatesThisMonth', stats.certificatesThisMonth || 0);
        
        // Update system stats
        this.updateStatCard('serverUptime', stats.serverUptime || 'N/A');
        this.updateStatCard('lastBackup', stats.lastBackup || 'N/A');
    }

    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateCharts(data) {
        // Member growth chart
        if (data.memberGrowth) {
            this.createMemberGrowthChart(data.memberGrowth);
        }
        
        // Certificate distribution chart
        if (data.certificateDistribution) {
            this.createCertificateDistributionChart(data.certificateDistribution);
        }
        
        // State-wise member distribution
        if (data.stateDistribution) {
            this.createStateDistributionChart(data.stateDistribution);
        }
    }

    createMemberGrowthChart(data) {
        const canvas = document.getElementById('memberGrowthChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Simple chart implementation (you might want to use Chart.js)
        this.drawSimpleLineChart(ctx, data, 'Member Growth Over Time');
    }

    createCertificateDistributionChart(data) {
        const canvas = document.getElementById('certificateDistributionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Simple chart implementation
        this.drawSimplePieChart(ctx, data, 'Certificate Distribution');
    }

    createStateDistributionChart(data) {
        const canvas = document.getElementById('stateDistributionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Simple chart implementation
        this.drawSimpleBarChart(ctx, data, 'Members by State');
    }

    drawSimpleLineChart(ctx, data, title) {
        // Simple line chart implementation
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, ctx.canvas.width / 2, 20);
        
        // Draw simple line
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const points = Object.values(data);
        const maxValue = Math.max(...points);
        const stepX = ctx.canvas.width / (points.length - 1);
        
        points.forEach((value, index) => {
            const x = index * stepX;
            const y = ctx.canvas.height - 40 - (value / maxValue) * (ctx.canvas.height - 80);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }

    drawSimplePieChart(ctx, data, title) {
        // Simple pie chart implementation
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, ctx.canvas.width / 2, 20);
        
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2 + 10;
        const radius = Math.min(centerX, centerY) - 20;
        
        const total = Object.values(data).reduce((sum, value) => sum + value, 0);
        let currentAngle = 0;
        
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];
        let colorIndex = 0;
        
        Object.entries(data).forEach(([label, value]) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.fillStyle = colors[colorIndex % colors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${label}: ${value}`, labelX, labelY);
            
            currentAngle += sliceAngle;
            colorIndex++;
        });
    }

    drawSimpleBarChart(ctx, data, title) {
        // Simple bar chart implementation
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, ctx.canvas.width / 2, 20);
        
        const entries = Object.entries(data);
        const maxValue = Math.max(...Object.values(data));
        const barWidth = ctx.canvas.width / entries.length - 10;
        const barHeight = ctx.canvas.height - 80;
        
        entries.forEach(([label, value], index) => {
            const x = index * (barWidth + 10) + 5;
            const height = (value / maxValue) * barHeight;
            const y = ctx.canvas.height - 40 - height;
            
            // Draw bar
            ctx.fillStyle = '#007bff';
            ctx.fillRect(x, y, barWidth, height);
            
            // Draw label
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + barWidth / 2, ctx.canvas.height - 25);
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            'member': 'user-plus',
            'certificate': 'certificate',
            'system': 'cog',
            'error': 'exclamation-triangle',
            'success': 'check-circle'
        };
        return icons[type] || 'info-circle';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        return date.toLocaleDateString();
    }

    // Dashboard functions
    async loadDashboard() {
        try {
            const data = await this.fetchDashboardData();
            this.displayDashboard(data);
        } catch (error) {
            console.error('Dashboard loading error:', error);
        }
    }

    async fetchDashboardData() {
        if (window.apiManager) {
            return await window.apiManager.getDashboardStats();
        }
        
        // Fallback
        const response = await fetch('https://narap-backend.onrender.com/api/analytics/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        return await response.json();
    }

    displayDashboard(data) {
        this.updateDashboardStats(data);
        this.updateDashboardCharts(data);
    }

    updateDashboardStats(data) {
        const stats = data.stats || {};
        
        // Update dashboard stat cards
        this.updateStatCard('dashboardTotalMembers', stats.totalMembers || 0);
        this.updateStatCard('dashboardActiveMembers', stats.activeMembers || 0);
        this.updateStatCard('dashboardTotalCertificates', stats.totalCertificates || 0);
        this.updateStatCard('dashboardPendingCertificates', stats.pendingCertificates || 0);
    }

    updateDashboardCharts(data) {
        // Update dashboard-specific charts
        if (data.monthlyGrowth) {
            this.createMonthlyGrowthChart(data.monthlyGrowth);
        }
    }

    createMonthlyGrowthChart(data) {
        const canvas = document.getElementById('monthlyGrowthChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.drawSimpleLineChart(ctx, data, 'Monthly Growth');
    }

    // System page functions
    async loadSystemPage() {
        try {
            const data = await this.fetchSystemData();
            this.displaySystemInfo(data);
        } catch (error) {
            console.error('System page loading error:', error);
        }
    }

    async fetchSystemData() {
        // Fetch system information
        const systemInfo = {
            serverStatus: await this.checkServerStatus(),
            uptime: this.getUptime(),
            version: '1.0.0',
            lastBackup: localStorage.getItem('narap_last_backup') || 'Never'
        };
        
        return systemInfo;
    }

    displaySystemInfo(data) {
        this.updateSystemStat('serverStatus', data.serverStatus);
        this.updateSystemStat('systemUptime', data.uptime);
        this.updateSystemStat('systemVersion', data.version);
        this.updateSystemStat('lastBackup', data.lastBackup);
    }

    updateSystemStat(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    async checkServerStatus() {
        if (window.apiManager) {
            return await window.apiManager.checkServerStatus();
        }
        
        try {
            const response = await fetch('https://narap-backend.onrender.com/api/health', {
                method: 'GET',
                timeout: 5000
            });
            return response.ok ? 'Online' : 'Offline';
        } catch (error) {
            return 'Offline';
        }
    }

    getUptime() {
        const startTime = localStorage.getItem('narap_session_start');
        if (!startTime) {
            localStorage.setItem('narap_session_start', Date.now().toString());
            return 'Just started';
        }
        
        const uptime = Date.now() - parseInt(startTime);
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        
        return `${hours}h ${minutes}m`;
    }
}

// Global functions for backward compatibility
function loadAnalytics() {
    if (window.analyticsManager) {
        window.analyticsManager.loadAnalytics();
    }
}

function loadDashboard() {
    if (window.analyticsManager) {
        window.analyticsManager.loadDashboard();
    }
}

function loadDashboardStats() {
    if (window.analyticsManager) {
        window.analyticsManager.loadDashboard();
    }
}

function loadRecentActivity() {
    if (window.analyticsManager) {
        window.analyticsManager.loadAnalytics();
    }
}

function loadSystemPage() {
    if (window.analyticsManager) {
        window.analyticsManager.loadSystemPage();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
} else {
    window.AnalyticsManager = AnalyticsManager;
    window.loadAnalytics = loadAnalytics;
    window.loadDashboard = loadDashboard;
    window.loadDashboardStats = loadDashboardStats;
    window.loadRecentActivity = loadRecentActivity;
    window.loadSystemPage = loadSystemPage;
}
