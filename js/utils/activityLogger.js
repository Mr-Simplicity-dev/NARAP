// ==================== ACTIVITY LOGGER ====================

class ActivityLogger {
    constructor(key='narap_activity_log', max=5000){
        this.key = key;
        this.max = max;
    }
    
    _read(){
        try {
            const raw = localStorage.getItem(this.key);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch(_) { return []; }
    }
    
    _write(list){
        try {
            const arr = Array.isArray(list) ? list.slice(-this.max) : [];
            localStorage.setItem(this.key, JSON.stringify(arr));
        } catch(e){ console.warn('ActivityLogger write failed:', e); }
    }
    
    all(){ 
        return this._read().slice().sort((a,b)=>new Date(b.ts)-new Date(a.ts)); 
    }
    
    clear(){ 
        localStorage.removeItem(this.key); 
    }
    
    log(entry){
        try {
            const now = new Date();
            const e = Object.assign({
                ts: now.toISOString(),
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString(),
            }, entry || {});
            const list = this._read();
            list.push(e);
            this._write(list);
            return e;
        } catch (err){
            console.warn('ActivityLogger.log failed:', err);
            return null;
        }
    }
    
    // Convenience API
    member(action, data){ 
        return this.log({entity:'member', action, data}); 
    }
    
    certificate(action, data){ 
        return this.log({entity:'certificate', action, data}); 
    }
    
    system(action, data){ 
        return this.log({entity:'system', action, data}); 
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityLogger;
} else {
    window.ActivityLogger = ActivityLogger;
}
