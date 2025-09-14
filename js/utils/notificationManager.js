// ==================== NOTIFICATION MANAGER ====================

class NotificationManager {
  constructor() {
    this.container = null;
    this._ensureStyles();
  }

  _ensureStyles() {
    try {
      if (document.getElementById('notification-styles')) return;
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        #notification-container { position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px; }
        #notification-container:empty { display: none !important; }
        .notification { border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; color: #fff; }
        .notification-info    { background: #17a2b8; }
        .notification-success { background: #28a745; }
        .notification-error   { background: #dc3545; }
        .notification-warning { background: #ffc107; color: #222; }
        .notification button { background: none; border: none; cursor: pointer; font-size: 18px; margin-left: 8px; color: inherit; }
      `;
      document.head.appendChild(style);
    } catch (_) {}
  }

  _getContainer() {
    if (this.container && document.body.contains(this.container)) return this.container;
    const div = document.createElement('div');
    div.id = 'notification-container';
    document.body.appendChild(div);
    this.container = div;
    return div;
  }

  _destroyIfEmpty() {
    try {
      if (this.container && this.container.childElementCount === 0) {
        this.container.remove();
        this.container = null;
      }
    } catch (_) {}
  }

  show(message, type = 'info', duration = 5000) {
    // Ignore empty/whitespace messages to avoid ghost pill
    if (message == null || String(message).trim() === '') {
      this._destroyIfEmpty();
      return;
    }

    this._ensureStyles();
    const container = this._getContainer();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${String(message)}</span>
      <button aria-label="Close notification" title="Close">&times;</button>
    `;

    notification.querySelector('button').addEventListener('click', () => {
      if (notification.parentNode) notification.remove();
      this._destroyIfEmpty();
    });

    container.appendChild(notification);

    if (duration > 0 && Number.isFinite(duration)) {
      setTimeout(() => {
        if (notification.parentNode) notification.remove();
        this._destroyIfEmpty();
      }, duration);
    }
  }

  // Back-compat: keep this alias
  showFallback(message, type = 'info', duration = 5000) {
    this.show(message, type, duration);
  }

  // Back-compat helper (not used when CSS classes apply)
  getBackgroundColor(type) {
    switch (type) {
      case 'success': return '#28a745';
      case 'error':   return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info':
      default:        return '#17a2b8';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
} else {
    window.NotificationManager = NotificationManager;
}
