// ============================================
// BOTTOM-NAV.JS - Bottom Navigation Logic
// With Smart Scroll Behavior + Floating Cart Bubble
// ============================================

class BottomNavManager {
    constructor() {
        this.navButtons = document.querySelectorAll('#bottomNav .nav-btn');
        this.bottomNav = document.getElementById('bottomNav');
        this.backToTopBtn = document.getElementById('backToTopBtn');
        this.mainContent = document.getElementById('mainContent');
        this.activeNav = 'home';
        
        // Scroll tracking
        this.lastScrollTop = 0;
        this.scrollThreshold = 60;
        this.hideThreshold = 100;
        this.isNavHidden = false;
        this.isBackToTopVisible = false;
        this.scrollTimer = null;
        this.isScrollingToTop = false;
        this.scrollEndTimer = null;
        
        this.init();
    }
    
    init() {
        // Nav button clicks
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const navTarget = btn.getAttribute('data-nav');
                this.handleNavClick(navTarget, btn);
            });
        });
        
        this.setActiveByTarget('home');
        
        // Back to top click
        if (this.backToTopBtn) {
            this.backToTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.scrollToTop();
            });
        }
        
        // Scroll tracking
        if (this.mainContent) {
            this.mainContent.addEventListener('scroll', () => {
                if (!this.isScrollingToTop) {
                    this.handleScroll();
                }
            }, { passive: true });
        }
        
        // Initial state
        this.ensureCorrectInitialState();
        
        // Start watching for cart changes to sync with floating bubble
        this.watchCartForBubble();
    }
    
    ensureCorrectInitialState() {
        if (this.backToTopBtn) {
            this.backToTopBtn.classList.add('hidden');
            this.backToTopBtn.classList.remove('visible', 'navbar-hidden');
            this.isBackToTopVisible = false;
        }
        
        if (this.bottomNav) {
            this.bottomNav.classList.remove('nav-hidden');
            this.isNavHidden = false;
        }
        
        if (this.mainContent) {
            this.mainContent.style.bottom = 'var(--bottom-nav-height)';
        }
        
        this.lastScrollTop = 0;
        
        // Sync floating bubble
        this.notifyFloatingBubble();
    }
    
    handleNavClick(target, btn) {
        if (!target) return;
        this.setActive(btn);
        this.activeNav = target;
        
        switch (target) {
            case 'home': this.goHome(); break;
            case 'search': this.focusSearch(); break;
            case 'cart': this.openCart(); break;
            case 'orders': this.openOrders(); break;
        }
        
        if (btn) {
            btn.classList.add('pop-animation');
            setTimeout(() => btn.classList.remove('pop-animation'), 300);
        }
    }
    
    setActive(activeBtn) {
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    }
    
    setActiveByTarget(target) {
        const btn = document.querySelector(`[data-nav="${target}"]`);
        if (btn) {
            this.setActive(btn);
            this.activeNav = target;
        }
    }
    
    // ============================================
    // SCROLL HANDLER
    // ============================================
    handleScroll() {
        if (!this.mainContent || this.isScrollingToTop) return;
        
        const scrollTop = this.mainContent.scrollTop;
        const maxScroll = this.mainContent.scrollHeight - this.mainContent.clientHeight;
        const isAtTop = scrollTop <= this.scrollThreshold;
        
        // Content too short
        if (maxScroll <= this.scrollThreshold * 2) {
            this.showNavbar();
            this.hideBackToTop();
            this.lastScrollTop = scrollTop;
            return;
        }
        
        const scrollDifference = scrollTop - this.lastScrollTop;
        this.lastScrollTop = scrollTop;
        
        const isScrollingDown = scrollDifference > 8;
        const isScrollingUp = scrollDifference < -5;
        
        if (isAtTop) {
            this.showNavbar();
            this.hideBackToTop();
        } else if (isScrollingDown && scrollTop > this.hideThreshold) {
            this.hideNavbar();
            this.showBackToTop();
        } else if (isScrollingUp) {
            this.showNavbar();
            if (!isAtTop) this.showBackToTop();
        }
        
        // Debounce check after scroll stops
        if (this.scrollTimer) clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
            if (this.isScrollingToTop) return;
            const finalScroll = this.mainContent.scrollTop;
            if (finalScroll <= this.scrollThreshold) {
                this.showNavbar();
                this.hideBackToTop();
            }
        }, 300);
    }
    
    // ============================================
    // NAVBAR - with Floating Bubble Integration
    // ============================================
    showNavbar() {
        if (this.isNavHidden && this.bottomNav) {
            this.bottomNav.classList.remove('nav-hidden');
            this.isNavHidden = false;
            if (this.mainContent) {
                this.mainContent.style.bottom = 'var(--bottom-nav-height)';
            }
            if (this.backToTopBtn && this.isBackToTopVisible) {
                this.backToTopBtn.classList.remove('navbar-hidden');
            }
            // 🫧 Navbar aaya - Floating Bubble ko hide karo
            // Items navbar ke cart mein "guss" gaye
            this.notifyFloatingBubble();
        }
    }
    
    hideNavbar() {
        if (!this.isNavHidden && this.bottomNav) {
            this.bottomNav.classList.add('nav-hidden');
            this.isNavHidden = true;
            if (this.mainContent) {
                this.mainContent.style.bottom = '0px';
            }
            if (this.backToTopBtn && this.isBackToTopVisible) {
                this.backToTopBtn.classList.add('navbar-hidden');
            }
            // 🫧 Navbar gaya - Floating Bubble ko show karo (agar cart mein items hain)
            this.notifyFloatingBubble();
        }
    }
    
    // ============================================
    // FLOATING CART BUBBLE INTEGRATION
    // ============================================
    
    /**
     * Cart changes ko watch karo - jab bhi cart update ho,
     * floating bubble ko refresh karo
     */
    watchCartForBubble() {
        // Poll for cartManager availability
        const checkInterval = setInterval(() => {
            if (window.cartManager) {
                clearInterval(checkInterval);
                this.bindCartEvents();
            }
        }, 300);
        
        // Timeout after 8 seconds
        setTimeout(() => clearInterval(checkInterval), 8000);
    }
    
    /**
     * Cart manager ke methods ko wrap karo taaki
     * har add/remove/clear pe bubble update ho
     */
    bindCartEvents() {
        const cart = window.cartManager;
        if (!cart) return;
        
        // Store original methods
        const originalAddItem = cart.addItem;
        const originalRemoveItem = cart.removeItem;
        const originalClearCart = cart.clearCart;
        const originalUpdateQuantity = cart.updateQuantity;
        
        // Wrap addItem
        if (typeof originalAddItem === 'function') {
            cart.addItem = (...args) => {
                const result = originalAddItem.apply(cart, args);
                this.onCartChanged();
                return result;
            };
        }
        
        // Wrap removeItem
        if (typeof originalRemoveItem === 'function') {
            cart.removeItem = (...args) => {
                const result = originalRemoveItem.apply(cart, args);
                this.onCartChanged();
                return result;
            };
        }
        
        // Wrap clearCart
        if (typeof originalClearCart === 'function') {
            cart.clearCart = (...args) => {
                const result = originalClearCart.apply(cart, args);
                this.onCartChanged();
                return result;
            };
        }
        
        // Wrap updateQuantity
        if (typeof originalUpdateQuantity === 'function') {
            cart.updateQuantity = (...args) => {
                const result = originalUpdateQuantity.apply(cart, args);
                this.onCartChanged();
                return result;
            };
        }
        
        // Also start polling as backup
        this.startCartPolling();
        
        console.log('🫧 Floating Bubble - Cart events bound');
    }
    
    /**
     * Backup polling for cart changes
     */
    startCartPolling() {
        let lastItemCount = -1;
        let lastTotal = -1;
        
        this.cartPollInterval = setInterval(() => {
            const cart = window.cartManager;
            if (!cart) return;
            
            let currentItems = 0;
            let currentTotal = 0;
            
            // Different cart managers might have different structures
            if (Array.isArray(cart.items)) {
                currentItems = cart.items.length;
                currentTotal = cart.items.reduce((sum, item) => {
                    const price = item.product?.price || item.price || 0;
                    const qty = item.quantity || 1;
                    return sum + (price * qty);
                }, 0);
            } else if (typeof cart.getItems === 'function') {
                const items = cart.getItems();
                currentItems = items.length;
                currentTotal = cart.getTotal?.() || 0;
            } else if (typeof cart.getTotalItems === 'function') {
                currentItems = cart.getTotalItems();
                currentTotal = cart.getTotal?.() || 0;
            }
            
            if (currentItems !== lastItemCount || currentTotal !== lastTotal) {
                lastItemCount = currentItems;
                lastTotal = currentTotal;
                this.onCartChanged();
            }
        }, 600);
    }
    
    /**
     * Called whenever cart changes
     */
    onCartChanged() {
        // Thoda delay do taaki cart manager update ho jaye
        if (this.cartChangeTimer) clearTimeout(this.cartChangeTimer);
        this.cartChangeTimer = setTimeout(() => {
            this.notifyFloatingBubble();
        }, 150);
    }
    
    /**
     * Floating bubble ko current state ke hisaab se update karo
     */
    notifyFloatingBubble() {
        if (!window.floatingCartBubble) return;
        
        const bubble = window.floatingCartBubble;
        
        // Update navbar hidden state
        bubble.isNavHidden = this.isNavHidden;
        
        // Refresh bubble content and visibility
        bubble.updateBubble();
        bubble.checkVisibility();
    }
    
    // ============================================
    // BACK TO TOP
    // ============================================
    showBackToTop() {
        if (!this.isBackToTopVisible && this.backToTopBtn) {
            this.backToTopBtn.classList.remove('hidden');
            void this.backToTopBtn.offsetWidth;
            this.backToTopBtn.classList.add('visible');
            this.isBackToTopVisible = true;
            
            if (this.isNavHidden) {
                this.backToTopBtn.classList.add('navbar-hidden');
            } else {
                this.backToTopBtn.classList.remove('navbar-hidden');
            }
        }
    }
    
    hideBackToTop() {
        if (this.isBackToTopVisible && this.backToTopBtn) {
            this.backToTopBtn.classList.remove('visible', 'navbar-hidden');
            this.backToTopBtn.classList.add('hidden');
            this.isBackToTopVisible = false;
        }
    }
    
    // ============================================
    // SCROLL TO TOP
    // ============================================
    scrollToTop() {
        this.hideBackToTop();
        this.isScrollingToTop = true;
        this.showNavbar();
        this.setActiveByTarget('home');
        
        if (this.mainContent) {
            this.mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            this.mainContent.style.bottom = 'var(--bottom-nav-height)';
        }
        
        if (this.scrollTimer) clearTimeout(this.scrollTimer);
        if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
        
        this.scrollEndTimer = setTimeout(() => {
            this.isScrollingToTop = false;
            this.lastScrollTop = 0;
            this.showNavbar();
            this.hideBackToTop();
            
            if (this.mainContent) {
                this.mainContent.style.bottom = 'var(--bottom-nav-height)';
            }
            
            // 🫧 Navbar wapas aa gaya - bubble hide karo
            this.notifyFloatingBubble();
            
            const allBtn = document.querySelector('[data-category="all"]');
            if (allBtn && !allBtn.classList.contains('active')) {
                allBtn.click();
            }
        }, 600);
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    updateUIState(showNav, showBackToTop = null) {
        if (showNav) this.showNavbar();
        else this.hideNavbar();
        
        if (showBackToTop === true) this.showBackToTop();
        else if (showBackToTop === false) this.hideBackToTop();
        
        // Sync bubble after state change
        this.notifyFloatingBubble();
    }
    
    goHome() {
        this.scrollToTop();
    }
    
    focusSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            searchInput.classList.add('shake-animation');
            setTimeout(() => searchInput.classList.remove('shake-animation'), 400);
        }
    }
    
    openCart() {
        if (window.cartManager?.openCart) {
            window.cartManager.openCart();
            return;
        }
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            window.cartManager?.renderCart?.();
        }
    }
    
    openOrders() {
        if (window.ordersManager?.open) {
            window.ordersManager.open();
            return;
        }
        const ordersModal = document.getElementById('ordersModal');
        if (ordersModal) {
            ordersModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            window.ordersManager?.render?.();
        } else {
            const lang = window.languageManager?.currentLang || 'hi';
            alert(lang === 'hi' ? '📋 ऑर्डर हिस्ट्री जल्द ही उपलब्ध होगी!' : '📋 Order history coming soon!');
        }
    }
    
    // ============================================
    // CLEANUP
    // ============================================
    destroy() {
        if (this.scrollTimer) clearTimeout(this.scrollTimer);
        if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
        if (this.cartChangeTimer) clearTimeout(this.cartChangeTimer);
        if (this.cartPollInterval) clearInterval(this.cartPollInterval);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.bottomNavManager = new BottomNavManager();
});