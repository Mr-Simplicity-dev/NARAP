// ==================== PERFORMANCE MONITOR ====================

class PerformanceMonitor {
    constructor() {
        this.startTime = Date.now();
        this.metrics = {};
    }
    
    start(label = 'default') {
        this.metrics[label] = Date.now();
        return this;
    }
    
    end(label = 'default') {
        if (this.metrics[label]) {
            return Date.now() - this.metrics[label];
        }
        return 0;
    }
    
    log(message, label = 'default') {
        const duration = this.end(label);
        return duration;
    }
    
    reset() {
        this.metrics = {};
        this.startTime = Date.now();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
} else {
    window.PerformanceMonitor = PerformanceMonitor;
}
