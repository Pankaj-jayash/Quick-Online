// ============================================
// PWA-INSTALL.JS - Dual Popup Install System
// ============================================

class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.fullPopup = null;
        this.miniPopup = null;
        this.miniTimer = null;
        this.installCompleted = false;
        
        this.init();
    }
    
    init() {
        // Already installed? Do nothing
        if (this.isAppInstalled()) {
            console.log('📱 App already installed');
            return;
        }
        
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('📥 Install prompt captured');
        });
        
        // App installed successfully
        window.addEventListener('appinstalled', () => {
            console.log('✅ App installed!');
            this.installCompleted = true;
            this.hideAllPopups();
            this.deferredPrompt = null;
            this.showToast('🎉 App install हो गई! अब ऐप खोलें!');
        });
        
        // Show popups after page load
        if (document.readyState === 'complete') {
            this.schedulePopups();
        } else {
            window.addEventListener('load', () => {
                this.schedulePopups();
            });
        }
        
        console.log('📲 PWA Install Manager Ready');
    }
    
    schedulePopups() {
        // Wait 3 seconds after splash, then show full popup
        setTimeout(() => {
            if (!this.installCompleted && !this.isAppInstalled()) {
                this.showFullPopup();
            }
        }, 3500);
        
        // Schedule mini popup after 1 minute
        this.miniTimer = setTimeout(() => {
            if (!this.installCompleted && !this.isAppInstalled()) {
                this.showMiniPopup();
            }
        }, 60000);
    }
    
    isAppInstalled() {
        if (window.matchMedia('(display-mode: standalone)').matches) return true;
        if (window.navigator.standalone === true) return true;
        return false;
    }
    
    // ==========================================
    // FULL SCREEN POPUP
    // ==========================================
    showFullPopup() {
        if (this.fullPopup) return;
        
        this.fullPopup = document.createElement('div');
        this.fullPopup.className = 'pwa-full-install';
        this.fullPopup.innerHTML = `
            <div class="pwa-full-overlay"></div>
            <div class="pwa-full-card">
                <button class="pwa-full-close" id="pwaFullClose">✕</button>
                <div class="pwa-full-icon">🛒</div>
                <h3 class="pwa-full-title">Quick Dukan ऐप इंस्टॉल करें</h3>
                <p class="pwa-full-desc">बेहतरीन शॉपिंग अनुभव के लिए</p>
                <div class="pwa-full-features">
                    <div class="pwa-full-feature">
                        <span>⚡</span>
                        <span>तेज़</span>
                    </div>
                    <div class="pwa-full-feature">
                        <span>📱</span>
                        <span>ऐप जैसा</span>
                    </div>
                    <div class="pwa-full-feature">
                        <span>🚀</span>
                        <span>ऑफलाइन</span>
                    </div>
                    <div class="pwa-full-feature">
                        <span>🔔</span>
                        <span>अपडेट</span>
                    </div>
                </div>
                <button class="pwa-full-install-btn" id="pwaFullInstallBtn">
                    📲 अभी इंस्टॉल करें
                </button>
                <button class="pwa-full-later" id="pwaFullLater">बाद में</button>
            </div>
        `;
        
        document.body.appendChild(this.fullPopup);
        
        // Animate in
        requestAnimationFrame(() => {
            this.fullPopup.classList.add('show');
        });
        
        // Events
        document.getElementById('pwaFullInstallBtn').addEventListener('click', () => this.installApp());
        document.getElementById('pwaFullClose').addEventListener('click', () => this.hideFullPopup());
        document.getElementById('pwaFullLater').addEventListener('click', () => this.hideFullPopup());
        this.fullPopup.querySelector('.pwa-full-overlay').addEventListener('click', () => this.hideFullPopup());
    }
    
    hideFullPopup() {
        if (!this.fullPopup) return;
        this.fullPopup.classList.remove('show');
        setTimeout(() => {
            if (this.fullPopup) {
                this.fullPopup.remove();
                this.fullPopup = null;
            }
        }, 400);
    }
    
    // ==========================================
    // MINI BOTTOM POPUP
    // ==========================================
    showMiniPopup() {
        if (this.miniPopup) return;
        
        this.miniPopup = document.createElement('div');
        this.miniPopup.className = 'pwa-mini-install';
        this.miniPopup.innerHTML = `
            <div class="pwa-mini-icon">🛒</div>
            <div class="pwa-mini-info">
                <div class="pwa-mini-title">Quick Dukan ऐप इंस्टॉल करें</div>
                <div class="pwa-mini-desc">तेज़ और आसान खरीदारी</div>
            </div>
            <button class="pwa-mini-btn" id="pwaMiniInstallBtn">इंस्टॉल करें</button>
            <button class="pwa-mini-close" id="pwaMiniClose">✕</button>
        `;
        
        document.body.appendChild(this.miniPopup);
        
        // Animate in
        requestAnimationFrame(() => {
            this.miniPopup.classList.add('show');
        });
        
        // Events
        document.getElementById('pwaMiniInstallBtn').addEventListener('click', () => this.installApp());
        document.getElementById('pwaMiniClose').addEventListener('click', () => this.hideMiniPopup());
    }
    
   hideMiniPopup() {
    if (!this.miniPopup) return;
    this.miniPopup.classList.remove('show');
    setTimeout(() => {
        if (this.miniPopup) {
            this.miniPopup.remove();
            this.miniPopup = null;
        }
    }, 400);
    
    // 🔁 REPEAT: Mini bar 2 minute baad firse dikhega
    if (!this.installCompleted && !this.isAppInstalled()) {
        clearTimeout(this.miniTimer);
        this.miniTimer = setTimeout(() => {
            if (!this.installCompleted && !this.isAppInstalled()) {
                this.showMiniPopup();
            }
        }, 120000); // ⬅️ 2 minute baad repeat (change as needed)
    }
}
    
    hideAllPopups() {
        this.hideFullPopup();
        this.hideMiniPopup();
        if (this.miniTimer) clearTimeout(this.miniTimer);
    }
    
    // ==========================================
    // INSTALL APP
    // ==========================================
    async installApp() {
        if (!this.deferredPrompt) {
            this.showManualInstructions();
            return;
        }
        
        try {
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            if (result.outcome === 'accepted') {
                console.log('✅ User accepted install');
                const btn = document.getElementById('pwaFullInstallBtn') || document.getElementById('pwaMiniInstallBtn');
                if (btn) {
                    btn.textContent = '✅ इंस्टॉल हो रहा है...';
                    btn.disabled = true;
                }
            } else {
                console.log('❌ User declined');
            }
            
            this.deferredPrompt = null;
        } catch (error) {
            console.error('Install failed:', error);
            this.showManualInstructions();
        }
    }
    
    showManualInstructions() {
        alert('📱 मैन्युअली इंस्टॉल करें:\n\n1. ब्राउज़र मेनू (⋮) खोलें\n2. "Add to Home Screen" चुनें\n3. "Add" पर टैप करें');
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3500);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.pwaInstallManager = new PWAInstallManager();
});