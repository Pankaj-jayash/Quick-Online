'use strict';

// ============================================
// APP.JS - Main Application File
// With Scroll-Based Section Title Effects
// ============================================

class App {
    constructor() {
        this.ready = false;
        this.scrollObservers = [];
        this.init();
    }
    
    async init() {
        console.log('🚀 Quick Dukan Starting...');
        console.log('🛒 आपकी विश्वसनीय किराना दुकान');
        
        // Wait for all managers to initialize
        await this.waitForDataLoader();
        
        // Setup global event listeners
        this.setupGlobalListeners();
        
        // Setup scroll-based title effects
        this.setupScrollTitleEffects();
        
        // Initial UI setup
        this.initialUISetup();
        
        this.ready = true;
        console.log('✅ Quick Dukan Ready!');
    }
    
    async waitForDataLoader() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.dataLoader && window.dataLoader.isLoaded) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('⚠️ Data loading timeout');
                resolve();
            }, 10000);
        });
    }
    
    setupGlobalListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or / to focus search
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.ctrlKey && !e.metaKey)) {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Escape to close cart
            if (e.key === 'Escape') {
                if (window.cartManager) {
                    window.cartManager.closeCart();
                }
            }
        });
        
        // Handle offline/online
        window.addEventListener('online', () => {
            this.showNetworkStatus('✅ आप ऑनलाइन हैं!', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNetworkStatus('⚠️ आप ऑफलाइन हैं। कुछ सुविधाएँ काम नहीं करेंगी।', 'warning');
        });
        
        // Service worker registration (for PWA later)
        if ('serviceWorker' in navigator) {
            console.log('📱 PWA ready for future implementation');
        }

        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateAllScrollStates();
            }, 150);
        });
    }
    
    // ============================================
    // SCROLL-BASED TITLE EFFECTS
    // ============================================
    setupScrollTitleEffects() {
        // Wait for DOM to be fully rendered
        setTimeout(() => {
            this.initHorizontalScrollEffects();
            this.initCategoriesScrollEffect();
        }, 500);
    }

    initHorizontalScrollEffects() {
        // Recently Viewed Section
        const recentlyViewedScroll = document.querySelector('#recentlyViewedScroll');
        const recentlyViewedSection = document.getElementById('recentlyViewedSection');
        
        if (recentlyViewedScroll && recentlyViewedSection) {
            this.addScrollEffect(recentlyViewedScroll, recentlyViewedSection);
        }

        // Most Orders Section
        const mostOrdersScroll = document.querySelector('#mostOrdersScroll');
        const mostOrdersSection = document.getElementById('mostOrdersSection');
        
        if (mostOrdersScroll && mostOrdersSection) {
            this.addScrollEffect(mostOrdersScroll, mostOrdersSection);
        }

        // Any other horizontal scroll sections
        document.querySelectorAll('.horizontal-scroll').forEach(scroll => {
            const section = scroll.closest('section');
            if (section && !section.classList.contains('scroll-effect-added')) {
                this.addScrollEffect(scroll, section);
            }
        });
    }

    addScrollEffect(scrollElement, sectionElement) {
        // Mark section to avoid duplicate listeners
        sectionElement.classList.add('scroll-effect-added');

        // Scroll event listener
        const handleScroll = () => {
            const scrollLeft = scrollElement.scrollLeft;
            
            if (scrollLeft > 15) {
                sectionElement.classList.add('scrolled');
            } else {
                sectionElement.classList.remove('scrolled');
            }

            // Update scroll buttons if they exist
            this.updateScrollArrows(sectionElement, scrollElement);
        };

        scrollElement.addEventListener('scroll', handleScroll, { passive: true });
        
        // Touch events for mobile
        scrollElement.addEventListener('touchstart', () => {
            sectionElement.classList.add('scrolling');
        }, { passive: true });
        
        scrollElement.addEventListener('touchend', () => {
            setTimeout(() => {
                sectionElement.classList.remove('scrolling');
                handleScroll();
            }, 100);
        });

        // Store for cleanup
        this.scrollObservers.push({
            element: scrollElement,
            handler: handleScroll,
            section: sectionElement
        });

        // Initial check
        handleScroll();
    }

    initCategoriesScrollEffect() {
        const categoriesScroll = document.getElementById('categoriesScroll');
        const categoriesSection = document.getElementById('categoriesSection');

        if (!categoriesScroll || !categoriesSection) return;

        const handleCategoriesScroll = () => {
            const scrollLeft = categoriesScroll.scrollLeft;
            const maxScroll = categoriesScroll.scrollWidth - categoriesScroll.clientWidth;
            
            // Add scrolled class for title effect
            if (scrollLeft > 10) {
                categoriesSection.classList.add('categories-scrolled');
            } else {
                categoriesSection.classList.remove('categories-scrolled');
            }

            // Adjust button sizes based on scroll position
            this.updateCategoryButtonSizes(categoriesScroll, scrollLeft, maxScroll);
        };

        categoriesScroll.addEventListener('scroll', handleCategoriesScroll, { passive: true });

        this.scrollObservers.push({
            element: categoriesScroll,
            handler: handleCategoriesScroll,
            section: categoriesSection
        });
    }

    updateCategoryButtonSizes(scrollElement, scrollLeft, maxScroll) {
        const buttons = scrollElement.querySelectorAll('.category-btn:not(.active)');
        
        buttons.forEach((btn, index) => {
            const rect = btn.getBoundingClientRect();
            const containerRect = scrollElement.getBoundingClientRect();
            
            // Button center relative to container
            const btnCenter = rect.left + rect.width / 2 - containerRect.left;
            const containerCenter = containerRect.width / 2;
            
            // Distance from center (0 to 1)
            const distanceFromCenter = Math.abs(btnCenter - containerCenter) / containerCenter;
            
            // Scale: center buttons bigger, edge buttons smaller
            const scale = 1 - (distanceFromCenter * 0.15);
            const finalScale = Math.max(0.8, Math.min(1, scale));
            
            // Apply smooth transform
            btn.style.transform = `scale(${finalScale})`;
            btn.style.opacity = 1 - (distanceFromCenter * 0.3);
        });
    }

    updateScrollArrows(section, scrollElement) {
        const scrollLeft = section.querySelector('.scroll-left');
        const scrollRight = section.querySelector('.scroll-right');
        
        if (!scrollLeft && !scrollRight) return;
        
        const { scrollLeft: sl, scrollWidth, clientWidth } = scrollElement;
        
        if (scrollLeft) {
            if (sl <= 3) {
                scrollLeft.classList.add('disabled');
            } else {
                scrollLeft.classList.remove('disabled');
            }
        }
        
        if (scrollRight) {
            if (sl + clientWidth >= scrollWidth - 3) {
                scrollRight.classList.add('disabled');
            } else {
                scrollRight.classList.remove('disabled');
            }
        }
    }

    updateAllScrollStates() {
        this.scrollObservers.forEach(({ handler }) => {
            if (typeof handler === 'function') {
                handler();
            }
        });
    }
    
    initialUISetup() {
        // Ensure sections are in correct initial state
        const categoryProductsSection = document.getElementById('categoryProductsSection');
        if (categoryProductsSection) {
            categoryProductsSection.classList.add('hidden');
        }
        
        // Recently viewed - check if there are items
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.checkAndShow();
        }
        
        // Most orders - always visible initially
        if (window.mostOrdersManager) {
            window.mostOrdersManager.checkAndShow();
        }
        
        // Set initial language
        if (window.languageManager) {
            window.languageManager.applyLanguage();
        }
    }
    
    showNetworkStatus(message, type) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.style.background = type === 'success' ? '#2E7D32' : '#F57F17';
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.style.background = '#333';
        }, 3000);
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Handle errors globally
window.addEventListener('error', (e) => {
    console.error('❌ Global Error:', e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Unhandled Promise Rejection:', e.reason);
});

// ============================================
// ALTERNATING BADGE - Free Delivery (9s) ↔ Trust (3s)
// ============================================
(function() {
    const deliveryContent = document.getElementById('deliveryContent');
    const trustContent = document.getElementById('trustContent');
    const deliveryText = deliveryContent?.querySelector('.badge-text');
    const trustText = trustContent?.querySelector('.badge-text');
    
    if (!deliveryContent || !trustContent) return;
    
    let showingDelivery = true;
    let switchTimeout;
    const DELIVERY_DURATION = 9000;  // 9 seconds
    const TRUST_DURATION = 3000;      // 3 seconds
    
    function switchToTrust() {
        deliveryContent.classList.remove('visible');
        deliveryContent.classList.add('hidden');
        trustContent.classList.remove('hidden');
        trustContent.classList.add('visible');
        showingDelivery = false;
        
        // Schedule switch back to delivery after 3s
        switchTimeout = setTimeout(switchToDelivery, TRUST_DURATION);
    }
    
    function switchToDelivery() {
        trustContent.classList.remove('visible');
        trustContent.classList.add('hidden');
        deliveryContent.classList.remove('hidden');
        deliveryContent.classList.add('visible');
        showingDelivery = true;
        
        // Schedule switch to trust after 9s
        switchTimeout = setTimeout(switchToTrust, DELIVERY_DURATION);
    }
    
    function startSwitching() {
        stopSwitching();
        // Reset to delivery
        trustContent.classList.add('hidden');
        trustContent.classList.remove('visible');
        deliveryContent.classList.add('visible');
        deliveryContent.classList.remove('hidden');
        showingDelivery = true;
        switchTimeout = setTimeout(switchToTrust, DELIVERY_DURATION);
    }
    
    function stopSwitching() {
        if (switchTimeout) {
            clearTimeout(switchTimeout);
            switchTimeout = null;
        }
    }
    
    // Start
    startSwitching();
    
    // Language change handler
    document.addEventListener('languageChanged', function(e) {
        const lang = e.detail?.language || 'hi';
        
        if (deliveryText && trustText) {
            if (lang === 'en') {
                deliveryText.textContent = 'Free Delivery';
                trustText.textContent = 'Verified';
            } else {
                deliveryText.textContent = 'फ्री डिलीवरी';
                trustText.textContent = 'Verified';
            }
        }
        
        startSwitching();
    });
    
    // Pause when tab not visible
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopSwitching();
        } else {
            startSwitching();
        }
    });
})();
