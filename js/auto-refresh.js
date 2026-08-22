// ============================================
// AUTO-REFRESH.JS - Auto Refresh System v2
// Synced with Service Worker for instant updates
// ============================================

class AutoRefreshManager {
    constructor() {
        this.version = '3.0.0'; // ⬅️ Service Worker version se match karo
        this.versionKey = 'quick-dukan-version';
        this.lastRefreshKey = 'quick-dukan-last-refresh';
        this.refreshInterval = 30 * 60 * 1000; // 30 minutes
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
        this.isRefreshing = false;
        this.swRegistration = null;
        this.updateAvailable = false;

        this.init();
    }

    async init() {
        console.log('🔄 Auto Refresh Manager v2 Initialized');
        console.log('📌 App Version:', this.version);

        // Check version on load
        await this.checkVersion();

        // Register service worker
        await this.registerServiceWorker();

        // Listen for SW messages
        this.listenForSWMessages();

        // Set up periodic refresh
        this.startPeriodicCheck();

        // Refresh data periodically
        this.startDataRefresh();

        // Listen for online event
        window.addEventListener('online', () => {
            console.log('🌐 Back online - Checking for updates...');
            this.checkForUpdates();
        });

        // Refresh on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('👁️ App visible - Checking updates...');
                this.checkIfRefreshNeeded();
                this.checkForSWUpdate();
            }
        });

        console.log('✅ Auto Refresh System Ready');
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Worker not supported');
            return;
        }

        try {
            // Unregister old SW first (clean slate)
            const oldRegs = await navigator.serviceWorker.getRegistrations();
            for (let reg of oldRegs) {
                if (reg.scope.includes('Quick-Dukan')) {
                    console.log('🔄 Unregistering old SW:', reg.scope);
                    await reg.unregister();
                }
            }

            // Register new SW
            this.swRegistration = await navigator.serviceWorker.register(
                '/Quick-Dukan/js/service-worker.js?' + Date.now() // Cache bust
            );
            
            console.log('📦 Service Worker Registered:', this.swRegistration.scope);

            // Check for waiting SW
            if (this.swRegistration.waiting) {
                console.log('🔄 Waiting SW found, activating...');
                this.swRegistration.waiting.postMessage('SKIP_WAITING');
                this.updateAvailable = true;
                this.showUpdatePrompt();
            }

            // Listen for new SW
            this.swRegistration.addEventListener('updatefound', () => {
                const newWorker = this.swRegistration.installing;
                console.log('🔄 New Service Worker found!');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('✅ New SW installed, update available!');
                        this.updateAvailable = true;
                        this.showUpdatePrompt();
                    }
                });
            });

        } catch (error) {
            console.error('❌ SW Registration failed:', error);
        }
    }

    listenForSWMessages() {
        if (!navigator.serviceWorker) return;
        
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('📨 Message from SW:', event.data);
            
            if (event.data.type === 'UPDATE_CHECK') {
                console.log('📌 SW Version:', event.data.version);
            }
        });
    }

    async checkForSWUpdate() {
        if (!this.swRegistration) return;
        
        try {
            await this.swRegistration.update();
            
            if (this.swRegistration.waiting) {
                console.log('🔄 Update ready, skipping waiting...');
                this.swRegistration.waiting.postMessage('SKIP_WAITING');
                this.updateAvailable = true;
                this.showUpdatePrompt();
            }
        } catch (error) {
            console.log('SW update check failed:', error);
        }
    }

    async checkVersion() {
        const savedVersion = localStorage.getItem(this.versionKey);

        if (!savedVersion || savedVersion !== this.version) {
            console.log(`🔄 Version change: ${savedVersion} → ${this.version}`);
            await this.clearCache();
            localStorage.setItem(this.versionKey, this.version);
            
            // Force SW update
            await this.checkForUpdates();
        }
    }

    async clearCache() {
        console.log('🧹 Clearing caches...');

        // Keep important data
        const keepKeys = [
            'quick-dukan-user-info',
            'quick-dukan-location',
            'quick-dukan-cart',
            'quick-dukan-orders',
            'quick-dukan-theme',
            'quick-dukan-lang',
            this.versionKey,
        ];

        // Backup important data
        const keepData = {};
        keepKeys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                if (value) keepData[key] = value;
            } catch (e) {}
        });

        // Clear all storages
        localStorage.clear();
        sessionStorage.clear();

        // Restore important data
        Object.entries(keepData).forEach(([key, value]) => {
            try {
                localStorage.setItem(key, value);
            } catch (e) {}
        });

        // Clear all caches
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(name => {
                        console.log('🗑️ Deleting cache:', name);
                        return caches.delete(name);
                    })
                );
                console.log('✅ All caches cleared');
            } catch (e) {
                console.warn('Cache clear error:', e);
            }
        }

        console.log('✅ Storage cleared (user data preserved)');
    }

    async checkForUpdates() {
        if (this.updateAvailable) {
            this.showUpdatePrompt();
            return;
        }

        // Check SW update
        await this.checkForSWUpdate();

        // Check data update
        this.refreshData();
    }

    startPeriodicCheck() {
        setInterval(() => {
            this.checkIfRefreshNeeded();
        }, this.checkInterval);
    }

    checkIfRefreshNeeded() {
        const lastRefresh = localStorage.getItem(this.lastRefreshKey);
        const now = Date.now();

        if (!lastRefresh || (now - parseInt(lastRefresh)) >= this.refreshInterval) {
            console.log('⏰ Time for periodic refresh');
            this.refreshData();
        }
    }

    startDataRefresh() {
        setInterval(() => {
            console.log('🔄 Scheduled data refresh');
            this.refreshData();
        }, this.refreshInterval);
    }

    async refreshData() {
        if (this.isRefreshing) {
            console.log('⚠️ Refresh already in progress');
            return;
        }

        this.isRefreshing = true;
        console.log('🔄 Starting data refresh...');

        try {
            // Reload data loader
            if (window.dataLoader) {
                // Clear cached data
                window.dataLoader.allProducts = [];
                window.dataLoader.productsByCategory = {};
                window.dataLoader.isLoaded = false;

                // Force network reload
                await window.dataLoader.loadAllData(true); // forceReload parameter
                
                // Refresh UI components
                this.refreshUI();
                
                // Update timestamp
                localStorage.setItem(this.lastRefreshKey, Date.now().toString());
                
                console.log('✅ Data refreshed successfully');
            }
        } catch (error) {
            console.error('❌ Data refresh failed:', error);
        } finally {
            this.isRefreshing = false;
        }
    }

    refreshUI() {
        console.log('🎨 Refreshing UI components...');

        // Refresh products
        if (window.productsManager && typeof window.productsManager.refreshAllProducts === 'function') {
            window.productsManager.refreshAllProducts();
        }

        // Refresh categories
        if (window.categoriesManager && window.dataLoader?.categories?.length > 0) {
            window.categoriesManager.renderCategories(window.dataLoader.categories);
        }

        // Refresh most orders
        if (window.mostOrdersManager) {
            window.mostOrdersManager.checkAndShow();
        }

        // Refresh recently viewed
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.checkAndShow();
        }

        // Update cart if open
        const cartModal = document.getElementById('cartModal');
        if (cartModal && !cartModal.classList.contains('hidden') && window.cartManager) {
            window.cartManager.renderCart();
        }

        // Update orders if open
        const ordersModal = document.getElementById('ordersModal');
        if (ordersModal && !ordersModal.classList.contains('hidden') && window.ordersManager) {
            window.ordersManager.render();
        }

        console.log('✅ UI refresh complete');
    }

    showUpdatePrompt() {
        console.log('🔔 Showing update prompt');
        
        // Create update banner
        let banner = document.getElementById('update-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'update-banner';
            banner.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: var(--primary, #16A34A);
                color: white;
                text-align: center;
                padding: 12px;
                z-index: 99999;
                cursor: pointer;
                font-family: var(--font-heading, sans-serif);
                font-weight: 600;
                animation: slideDown 0.3s ease;
            `;
            document.body.prepend(banner);
        }
        
        banner.textContent = '🔄 New Update Available! Tap to Refresh';
        banner.onclick = () => {
            this.forceRefresh();
        };

        // Auto-refresh after 10 seconds
        setTimeout(() => {
            if (document.getElementById('update-banner')) {
                console.log('⏰ Auto-refreshing...');
                this.forceRefresh();
            }
        }, 10000);
    }

    showUpdateNotification() {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = '🔄 Update installed! Refreshing...';
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight; // Reflow
        toast.style.animation = 'slideUp 0.3s ease';

        setTimeout(() => {
            this.forceRefresh();
        }, 2000);
    }

    forceRefresh() {
        console.log('🔄 Force refresh initiated');
        
        // Clear cache and reload
        this.clearCache().then(() => {
            // Remove update banner
            const banner = document.getElementById('update-banner');
            if (banner) banner.remove();
            
            // Hard reload
            window.location.reload(true);
        });
    }

    updateVersion(newVersion) {
        console.log(`📌 Version update: ${this.version} → ${newVersion}`);
        this.version = newVersion;
        localStorage.setItem(this.versionKey, newVersion);
        this.forceRefresh();
    }
}

// Initialize
let autoRefreshInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    autoRefreshInstance = new AutoRefreshManager();
    window.autoRefreshManager = autoRefreshInstance;
});

// Global helpers
window.forceRefresh = () => {
    if (window.autoRefreshManager) {
        window.autoRefreshManager.forceRefresh();
    }
};

window.updateAppVersion = (version) => {
    if (window.autoRefreshManager) {
        window.autoRefreshManager.updateVersion(version);
    }
};

window.checkForUpdates = () => {
    if (window.autoRefreshManager) {
        window.autoRefreshManager.checkForUpdates();
    }
};