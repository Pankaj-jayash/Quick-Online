// ============================================
// CART.JS - Premium Cart Logic (Final v4.0)
// Quick Dukan - 40 Features | Hindi + English
// Animated Subtitle | Live Item Count | All Labels Dynamic
// ============================================

class CartManager {
    constructor() {
        // Cart data
        this.cart = [];
        this.savedItems = [];
        this.appliedCoupon = null;
        this.couponDiscount = 0;
        this.undoStack = [];
        this.undoTimer = null;
        this._toastTimer = null;
        this.subtitleInterval = null;
        
        // DOM Elements
        this.cartModal = document.getElementById('cartModal');
        this.cartItems = document.getElementById('cartItems');
        this.emptyCart = document.getElementById('emptyCart');
        this.cartSummary = document.getElementById('cartSummary');
        this.cartBadge = document.getElementById('cartBadge');
        this.progressFill = document.getElementById('progressFill');
        this.progressMessage = document.getElementById('progressMessage');
        this.milestoneReward = document.getElementById('milestoneReward');
        this.couponInput = document.getElementById('couponInput');
        this.couponChips = document.getElementById('couponChips');
        this.activeCouponTag = document.getElementById('activeCouponTag');
        this.savedItemsSection = document.getElementById('savedItemsSection');
        this.savedItemsList = document.getElementById('savedItemsList');
        this.savedBadge = document.getElementById('savedBadge');
        this.undoNotification = document.getElementById('undoNotification');
        this.sendOrderBtn = document.getElementById('sendOrderBtn');
        this.confettiContainer = document.getElementById('cartConfetti');
        
        // Config & Messages
        this.config = null;
        this.messages = null;
        this.storageKey = 'quick-dukan-cart';
        this.savedStorageKey = 'quick-dukan-saved';
        this.couponStorageKey = 'quick-dukan-coupon';
        this.freeDeliveryThreshold = 500;
        this.currentLang = 'hi';
        
        // Animated subtitle texts
        this.subtitleTexts = {
            hi: [
                'सब कुछ सही है? 😊',
                'अच्छा चुनाव! 👍',
                'बढ़िया सामान! 🎉',
                'और क्या चाहिए? 🤔',
                'शानदार ऑफर! 💰'
            ],
            en: [
                'Everything good? 😊',
                'Great choices! 👍',
                'Awesome items! 🎉',
                'Need anything else? 🤔',
                'Amazing deals! 💰'
            ]
        };
        this.subtitleIndex = 0;
        
        // State
        this.isDragging = false;
        this.dragStartY = 0;
        this.dragCurrentY = 0;
        this.reachedMilestones = [];
        
        this.init();
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    async init() {
        if (!this.cartModal) {
            console.error('❌ Cart Modal not found!');
            return;
        }
        
        await this.loadConfig();
        await this.loadMessages();
        
        this.loadCart();
        this.loadSavedItems();
        this.loadCoupon();
        this.detectLanguage();
        this.bindEvents();
        this.updateBadge();
        
        console.log('✅ Cart Manager Initialized (v4.0 | All Labels Dynamic)');
    }
    
    async loadConfig() {
        try {
            const response = await fetch('config/cart-config.json');
            this.config = await response.json();
            if (this.config.progressBar) {
                this.freeDeliveryThreshold = this.config.progressBar.freeDeliveryThreshold || 500;
            }
            console.log('📋 Cart config loaded');
        } catch (e) {
            console.warn('⚠️ Using default config');
            this.config = this.getDefaultConfig();
        }
    }
    
    async loadMessages() {
        try {
            const response = await fetch('config/cart-messages.json');
            this.messages = await response.json();
            console.log('💬 Cart messages loaded');
        } catch (e) {
            console.warn('⚠️ Using default messages');
            this.messages = this.getDefaultMessages();
        }
    }
    
    getDefaultConfig() {
        return {
            progressBar: {
                freeDeliveryThreshold: 500,
                milestones: [
                    { amount: 150, icon: '🥉', reward: '5% छूट अनलॉक!', autoApplyCoupon: 'QUICK5' },
                    { amount: 300, icon: '🥈', reward: '₹50 की छूट!', autoApplyCoupon: 'QUICK50' },
                    { amount: 500, icon: '🥇', reward: 'फ्री डिलीवरी + ₹100 छूट!', autoApplyCoupon: 'QUICK100' }
                ]
            },
            coupons: { enabled: true, autoApplyOnMilestone: true, maxOneCoupon: true, codes: [] },
            delivery: { charge: 40, freeAbove: 500, estimatedTime: '30-45 मिनट' },
            features: { saveForLater: true, undoDelete: true, stockWarning: true, copyOrder: true, confetti: true, dragToClose: true, haptic: true },
            undoDelete: { timeoutSeconds: 5 },
            quantityLimits: { min: 1, max: 10 },
            whatsapp: { number: '919719312956' },
            emptyCart: { suggestedProducts: ['atta', 'chawal', 'chai-patti', 'doodh', 'bread'] },
            stockWarning: { enabled: true, threshold: 5 }
        };
    }
    
    getDefaultMessages() {
        return {
            header: { 
                hi: { title: 'आपका कार्ट', savedBadge: '{count} सेव', itemsInCart: '({count} आइटम)' }, 
                en: { title: 'Your Cart', savedBadge: '{count} saved', itemsInCart: '({count} items)' } 
            },
            progressBar: { 
                hi: { freeDelivery: '🚚 फ्री डिलीवरी के लिए सिर्फ ₹{amount} और जोड़ें!', congrats: '🎉 बधाई! आपकी डिलीवरी फ्री है!' }, 
                en: { freeDelivery: '🚚 Add just ₹{amount} more for FREE delivery!', congrats: '🎉 Congrats! You got FREE delivery!' } 
            },
            coupon: { 
                hi: { placeholder: 'कूपन कोड', apply: 'लगाएं', applied: '✅ {code} -₹{amount}', invalid: '❌ अमान्य कूपन', expired: '⏰ एक्सपायर', minOrder: '⚠️ न्यूनतम ₹{amount}', autoApplied: '🎉 {code} ऑटो! -₹{amount}', alreadyApplied: '⚠️ पहले मौजूदा कूपन हटाएं' }, 
                en: { placeholder: 'Coupon code', apply: 'Apply', applied: '✅ {code} -₹{amount}', invalid: '❌ Invalid coupon', expired: '⏰ Expired', minOrder: '⚠️ Min order ₹{amount}', autoApplied: '🎉 {code} auto! -₹{amount}', alreadyApplied: '⚠️ Remove existing coupon first' } 
            },
            undoDelete: { 
                hi: { removed: '🗑️ हटा दिया गया', undo: 'पूर्ववत करें' }, 
                en: { removed: '🗑️ Item removed', undo: 'Undo' } 
            },
            cartItem: { 
                hi: { stockWarning: '⚠️ सिर्फ {count} बचे!', saveForLater: 'सेव करें', saved: 'सेव हो गया', remove: 'हटाएं', alreadySaved: '✓ पहले से सेव है!' }, 
                en: { stockWarning: '⚠️ Only {count} left!', saveForLater: 'Save for Later', saved: 'Saved', remove: 'Remove', alreadySaved: '✓ Already saved!' } 
            },
            savedItems: { 
                hi: { title: '📦 सेव', count: '({count})', moveToCart: '→कार्ट', remove: '✕', emptyDesc: '♡ टैप करें' }, 
                en: { title: '📦 Saved', count: '({count})', moveToCart: '→Cart', remove: '✕', emptyDesc: 'Tap ♡ to save' } 
            },
            orderSummary: { 
                hi: { title: '📋 समरी', itemCount: '({count} आइटम)', subtotal: 'सबटोटल', couponDiscount: 'कूपन', delivery: 'डिलीवरी', free: '🎉 फ्री!', total: 'कुल', savings: '🎉 बचाए: ₹{amount}!', estimatedDelivery: '⏱️ {time}' }, 
                en: { title: '📋 Summary', itemCount: '({count} items)', subtotal: 'Subtotal', couponDiscount: 'Coupon', delivery: 'Delivery', free: '🎉 FREE!', total: 'Total', savings: '🎉 Saved: ₹{amount}!', estimatedDelivery: '⏱️ {time}' } 
            },
            footer: { 
                hi: { whatsapp: '💬 WhatsApp पर भेजें', copyOrder: '📋 कॉपी करें', copySuccess: '✅ कॉपी हो गया!', clearCart: '🗑️ खाली करें', clearConfirm: 'पूरा कार्ट खाली करें?' }, 
                en: { whatsapp: '💬 Send on WhatsApp', copyOrder: '📋 Copy Order', copySuccess: '✅ Copied!', clearCart: '🗑️ Clear Cart', clearConfirm: 'Clear entire cart?' } 
            },
            toast: { 
                hi: { added: '🎉 कार्ट में जोड़ा!', quantityUp: '✅ मात्रा बढ़ाई!', quantityMax: '⚠️ अधिकतम मात्रा!', removed: '🗑️ हटा दिया', cartCleared: '🗑️ कार्ट खाली', saved: '♡ सेव कर लिया', movedToCart: '→ कार्ट में डाला', couponApplied: '🎫 कूपन लगा!', couponRemoved: '🎫 कूपन हटा', orderSent: '✅ भेज दिया!', copied: '📋 कॉपी हुआ!', restored: '✅ वापस जोड़ दिया!' }, 
                en: { added: '🎉 Added to cart!', quantityUp: '✅ Quantity updated!', quantityMax: '⚠️ Maximum quantity!', removed: '🗑️ Removed', cartCleared: '🗑️ Cart cleared', saved: '♡ Saved for later', movedToCart: '→ Moved to cart', couponApplied: '🎫 Coupon applied!', couponRemoved: '🎫 Coupon removed', orderSent: '✅ Sent!', copied: '📋 Copied!', restored: '✅ Restored!' } 
            },
            emptyCart: { 
                hi: { title: 'आपका कार्ट खाली है 🛒', subtitle: 'कुछ सामान जोड़ो! 🛍️', buttonText: '🏪 प्रोडक्ट देखें', suggestedTitle: '⭐ सुझाव' }, 
                en: { title: 'Your cart is empty 🛒', subtitle: 'Add items & enjoy! 🛍️', buttonText: '🏪 Browse Products', suggestedTitle: '⭐ Suggestions' } 
            }
        };
    }
    
    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }
    
    // ============================================
    // ANIMATED SUBTITLE
    // ============================================
    startSubtitleAnimation() {
        this.stopSubtitleAnimation();
        this.updateSubtitle();
        this.subtitleInterval = setInterval(() => {
            this.subtitleIndex = (this.subtitleIndex + 1) % this.subtitleTexts[this.currentLang].length;
            this.updateSubtitle();
        }, 3000);
    }
    
    stopSubtitleAnimation() {
        if (this.subtitleInterval) {
            clearInterval(this.subtitleInterval);
            this.subtitleInterval = null;
        }
    }
    
    updateSubtitle() {
        const subtitle = document.querySelector('.cart-subtitle');
        if (subtitle) {
            const texts = this.subtitleTexts[this.currentLang] || this.subtitleTexts.hi;
            subtitle.textContent = texts[this.subtitleIndex];
            subtitle.style.animation = 'none';
            subtitle.offsetHeight;
            subtitle.style.animation = 'fadeInUp 0.4s ease';
        }
    }
    
    // ============================================
    // EVENT BINDING
    // ============================================
    bindEvents() {
        document.getElementById('closeCart')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeCart();
        });
        
        this.cartModal?.querySelector('.cart-overlay')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeCart();
        });
        
        if (this.config?.features?.dragToClose) {
            this.bindDragToClose();
        }
        
        this.sendOrderBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.cart.length === 0) return;
            this.sendOrder();
        });
        
        document.getElementById('clearCartBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.confirmClearCart();
        });
        
        document.getElementById('copyOrderBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.copyOrder();
        });
        
        this.couponInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.applyCoupon(this.couponInput.value.trim().toUpperCase());
            }
        });
        
        document.getElementById('couponApplyBtn')?.addEventListener('click', () => {
            const code = this.couponInput?.value.trim().toUpperCase();
            if (code) this.applyCoupon(code);
        });
        
        document.getElementById('savedItemsHeader')?.addEventListener('click', () => {
            this.savedItemsSection?.classList.toggle('expanded');
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-nav="cart"]')) {
                e.preventDefault();
                this.openCart();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('.browse-products-btn')) {
                e.preventDefault();
                this.closeCart();
                document.getElementById('allProductsSection')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.cartModal.classList.contains('hidden')) {
                this.closeCart();
            }
        });
        
        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
            this.subtitleIndex = 0;
            this.renderCart();
        });
    }
    
    // ============================================
    // DRAG TO CLOSE
    // ============================================
    bindDragToClose() {
        const dragHandle = document.getElementById('cartDragHandle');
        const cartContent = this.cartModal?.querySelector('.cart-content');
        if (!dragHandle || !cartContent) return;
        
        dragHandle.addEventListener('pointerdown', (e) => {
            this.isDragging = true;
            this.dragStartY = e.clientY;
            this.dragCurrentY = e.clientY;
            cartContent.style.transition = 'none';
        });
        
        document.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            this.dragCurrentY = e.clientY;
            const deltaY = Math.max(0, this.dragCurrentY - this.dragStartY);
            cartContent.style.transform = `translateY(${deltaY}px)`;
        });
        
        document.addEventListener('pointerup', () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            const deltaY = this.dragCurrentY - this.dragStartY;
            cartContent.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            
            if (deltaY > 100) {
                cartContent.style.transform = 'translateY(100%)';
                setTimeout(() => this.closeCart(), 300);
            } else {
                cartContent.style.transform = 'translateY(0)';
            }
        });
    }
    
    // ============================================
    // DATA PERSISTENCE
    // ============================================
    loadCart() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.cart = saved ? JSON.parse(saved) : [];
        } catch (e) { this.cart = []; }
    }
    
    saveCart() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.cart)); } catch (e) {}
    }
    
    loadSavedItems() {
        try {
            const saved = localStorage.getItem(this.savedStorageKey);
            this.savedItems = saved ? JSON.parse(saved) : [];
        } catch (e) { this.savedItems = []; }
    }
    
    saveSavedItems() {
        try { localStorage.setItem(this.savedStorageKey, JSON.stringify(this.savedItems)); } catch (e) {}
    }
    
    loadCoupon() {
        try {
            const saved = localStorage.getItem(this.couponStorageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.appliedCoupon = data;
                this.couponDiscount = data.discount || 0;
            }
        } catch (e) {
            this.appliedCoupon = null;
            this.couponDiscount = 0;
        }
    }
    
    saveCoupon() {
        try {
            if (this.appliedCoupon) {
                localStorage.setItem(this.couponStorageKey, JSON.stringify(this.appliedCoupon));
            } else {
                localStorage.removeItem(this.couponStorageKey);
            }
        } catch (e) {}
    }
    
    // ============================================
    // CART OPERATIONS
    // ============================================
    addItem(product) {
        const existing = this.cart.find(item => item.id === product.id);
        
        if (existing) {
            const maxQty = this.config?.quantityLimits?.max || 10;
            if (existing.quantity < maxQty) {
                existing.quantity = (existing.quantity || 1) + 1;
                this.showToastKey('toast', 'quantityUp');
            } else {
                this.showToastKey('toast', 'quantityMax');
            }
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                unit: product.unit,
                discount: product.discount || 0,
                stock: product.stock || null,
                quantity: 1,
            });
            this.showToastKey('toast', 'added');
        }
        
        this.saveCart();
        this.updateBadge();
        this.animateCartIcon();
        
        if (!this.cartModal.classList.contains('hidden')) {
            this.renderCart();
        }
        
        if (this.config?.features?.haptic && navigator.vibrate) {
            navigator.vibrate(15);
        }
    }
    
    removeItem(productId) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;
        
        if (this.config?.features?.undoDelete) {
            this.undoStack.push({ ...item });
            this.showUndoNotification(productId);
        }
        
        const cartItemEl = document.querySelector(`[data-cart-item="${productId}"]`);
        if (cartItemEl) {
            cartItemEl.classList.add('removing');
            setTimeout(() => {
                this.cart = this.cart.filter(item => item.id !== productId);
                this.saveCart();
                this.updateBadge();
                this.renderCart();
            }, 280);
        } else {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.saveCart();
            this.updateBadge();
            this.renderCart();
        }
    }
    
    undoRemove() {
        if (this.undoStack.length === 0) return;
        const item = this.undoStack.pop();
        this.cart.push(item);
        this.saveCart();
        this.updateBadge();
        this.renderCart();
        this.hideUndoNotification();
        this.showToastKey('toast', 'restored');
    }
    
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;
        
        const minQty = this.config?.quantityLimits?.min || 1;
        const maxQty = this.config?.quantityLimits?.max || 10;
        item.quantity = Math.max(minQty, Math.min(maxQty, quantity));
        this.saveCart();
        this.updateBadge();
        this.renderCart();
    }
    
    clearCart() {
        if (this.cart.length === 0) return;
        
        const items = document.querySelectorAll('.cart-item');
        if (items.length > 0) {
            items.forEach((item, i) => {
                setTimeout(() => item.classList.add('removing'), i * 40);
            });
            setTimeout(() => {
                this.cart = [];
                this.appliedCoupon = null;
                this.couponDiscount = 0;
                this.reachedMilestones = [];
                this.saveCart();
                this.saveCoupon();
                this.updateBadge();
                this.renderCart();
                this.showToastKey('toast', 'cartCleared');
            }, items.length * 40 + 300);
        } else {
            this.cart = [];
            this.appliedCoupon = null;
            this.couponDiscount = 0;
            this.reachedMilestones = [];
            this.saveCart();
            this.saveCoupon();
            this.updateBadge();
            this.renderCart();
        }
    }
    
    confirmClearCart() {
        if (this.cart.length === 0) return;
        
        const confirmMsg = this.getMsg('footer', 'clearConfirm');
        if (confirm(confirmMsg)) {
            this.clearCart();
        }
    }
    
    // ============================================
    // SAVED ITEMS
    // ============================================
    saveForLater(productId) {
        if (!this.config?.features?.saveForLater) return;
        
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        if (itemIndex === -1) return;
        
        const item = this.cart[itemIndex];
        
        if (this.savedItems.find(s => s.id === productId)) {
            this.showToastKey('cartItem', 'alreadySaved');
            return;
        }
        
        this.savedItems.push({ ...item, savedAt: Date.now() });
        this.cart.splice(itemIndex, 1);
        
        this.saveCart();
        this.saveSavedItems();
        this.updateBadge();
        this.renderCart();
        this.showToastKey('toast', 'saved');
    }
    
    moveToCart(productId) {
        const itemIndex = this.savedItems.findIndex(item => item.id === productId);
        if (itemIndex === -1) return;
        
        const item = this.savedItems[itemIndex];
        this.savedItems.splice(itemIndex, 1);
        
        const existing = this.cart.find(c => c.id === productId);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.cart.push({ ...item, quantity: 1 });
        }
        
        this.saveCart();
        this.saveSavedItems();
        this.updateBadge();
        this.renderCart();
        this.showToastKey('toast', 'movedToCart');
    }
    
    removeFromSaved(productId) {
        this.savedItems = this.savedItems.filter(item => item.id !== productId);
        this.saveSavedItems();
        this.renderCart();
    }
    
    // ============================================
    // COUPON SYSTEM
    // ============================================
    applyCoupon(code) {
        if (!this.config?.coupons?.enabled) return;
        if (!code) return;
        
        if (this.config.coupons.maxOneCoupon && this.appliedCoupon) {
            this.showToastKey('coupon', 'alreadyApplied');
            return;
        }
        
        const couponCodes = this.config.coupons.codes || [];
        const coupon = couponCodes.find(c => c.code === code);
        
        if (!coupon) {
            this.showToastKey('coupon', 'invalid');
            this.shakeElement(this.couponInput);
            return;
        }
        
        if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
            this.showToastKey('coupon', 'expired');
            return;
        }
        
        const subtotal = this.getTotalPrice();
        if (subtotal < (coupon.minOrder || 0)) {
            const msg = this.getMsg('coupon', 'minOrder').replace('{amount}', coupon.minOrder);
            this.showToast(msg);
            return;
        }
        
        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = Math.round(subtotal * coupon.value / 100);
        } else if (coupon.type === 'fixed') {
            discount = coupon.value;
        } else if (coupon.type === 'freeDelivery') {
            discount = this.config.delivery?.charge || 40;
        }
        
        this.appliedCoupon = { code, discount, type: coupon.type };
        this.couponDiscount = discount;
        this.saveCoupon();
        
        if (this.couponInput) this.couponInput.value = '';
        
        this.renderCart();
        
        const msg = this.getMsg('coupon', 'applied').replace('{code}', code).replace('{amount}', discount);
        this.showToast(msg);
        
        if (this.config?.features?.confetti) {
            this.triggerConfetti();
        }
    }
    
    removeCoupon() {
        this.appliedCoupon = null;
        this.couponDiscount = 0;
        this.saveCoupon();
        this.renderCart();
        this.showToastKey('toast', 'couponRemoved');
    }
    
    autoApplyMilestoneCoupon(total) {
        if (!this.config?.coupons?.autoApplyOnMilestone) return;
        if (this.appliedCoupon) return;
        
        const milestones = this.config.progressBar?.milestones || [];
        
        for (let i = milestones.length - 1; i >= 0; i--) {
            const milestone = milestones[i];
            if (total >= milestone.amount && milestone.autoApplyCoupon && !this.reachedMilestones.includes(i)) {
                this.reachedMilestones.push(i);
                this.applyCoupon(milestone.autoApplyCoupon);
                break;
            }
        }
    }
    
    // ============================================
    // CALCULATIONS
    // ============================================
    getTotalItems() {
        return this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
    
    getTotalPrice() {
        return this.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    }
    
    getOriginalPrice(item) {
        if (!item.discount) return item.price;
        return Math.round(item.price / (1 - item.discount / 100));
    }
    
    getDeliveryCharge() {
        const subtotal = this.getTotalPrice();
        const freeAbove = this.config?.delivery?.freeAbove || 500;
        if (this.appliedCoupon?.type === 'freeDelivery') return 0;
        return subtotal >= freeAbove ? 0 : (this.config?.delivery?.charge || 40);
    }
    
    getGrandTotal() {
        return this.getTotalPrice() - this.couponDiscount + this.getDeliveryCharge();
    }
    
    getTotalSavings() {
        let savings = 0;
        this.cart.forEach(item => {
            if (item.discount) {
                const original = this.getOriginalPrice(item);
                savings += (original - item.price) * (item.quantity || 1);
            }
        });
        savings += this.couponDiscount;
        if (this.getDeliveryCharge() === 0 && this.getTotalPrice() > 0) {
            savings += (this.config?.delivery?.charge || 40);
        }
        return savings;
    }
    
    // ============================================
    // RENDER CART
    // ============================================
    renderCart() {
        if (!this.cartItems) return;
        this.cartItems.innerHTML = '';
        
        if (this.cart.length === 0) {
            this.renderEmptyCart();
            return;
        }
        
        if (this.emptyCart) this.emptyCart.style.display = 'none';
        
        this.cart.forEach(item => {
            const name = this.getLocalizedName(item.name);
            const unit = this.getLocalizedName(item.unit);
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            const originalPrice = this.getOriginalPrice(item);
            const stock = item.stock;
            
            const saveText = this.getMsg('cartItem', 'saveForLater');
            const savedText = this.getMsg('cartItem', 'saved');
            const removeTitle = this.getMsg('cartItem', 'remove');
            const stockWarningText = this.getMsg('cartItem', 'stockWarning');
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.setAttribute('data-cart-item', item.id);
            
            const imageHtml = item.image 
                ? `<img src="${item.image}" alt="${name}" class="cart-item-image" onerror="this.parentElement.innerHTML='<div class=\\'cart-item-image-fallback\\'>${this.getProductEmoji(item.id)}</div>'">`
                : `<div class="cart-item-image-fallback">${this.getProductEmoji(item.id)}</div>`;
            
            const isSaved = this.savedItems.find(s => s.id === item.id);
            const stockWarningHtml = this.shouldShowStockWarning(stock) 
                ? `<span class="cart-item-stock-warning">${stockWarningText.replace('{count}', stock)}</span>` 
                : '';
            
            cartItem.innerHTML = `
                <div class="cart-item-image-wrap">
                    ${imageHtml}
                    ${item.discount > 0 ? `<span class="cart-item-discount-badge">-${item.discount}%</span>` : ''}
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${name}</div>
                    <div class="cart-item-unit">${unit}</div>
                    <div class="cart-item-price-row">
                        <span class="cart-item-price">₹${price * quantity}</span>
                        ${item.discount > 0 ? `<span class="cart-item-original-price">₹${originalPrice * quantity}</span>` : ''}
                        ${stockWarningHtml}
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-stepper">
                        <button class="qty-btn qty-minus" data-id="${item.id}" ${quantity <= 1 ? 'disabled' : ''}>−</button>
                        <span class="qty-display">${quantity}</span>
                        <button class="qty-btn qty-plus" data-id="${item.id}" ${quantity >= 10 ? 'disabled' : ''}>+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}" title="${removeTitle}">
                        <span class="remove-icon">🗑️</span>
                    </button>
                    ${this.config?.features?.saveForLater ? `
                        <button class="save-later-btn ${isSaved ? 'saved' : ''}" data-id="${item.id}" title="${isSaved ? savedText : saveText}">♡</button>
                    ` : ''}
                </div>
            `;
            
            cartItem.querySelector('.qty-plus')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.updateQuantity(item.id, quantity + 1);
            });
            
            cartItem.querySelector('.qty-minus')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (quantity <= 1) {
                    this.removeItem(item.id);
                } else {
                    this.updateQuantity(item.id, quantity - 1);
                }
            });
            
            cartItem.querySelector('.remove-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeItem(item.id);
            });
            
            cartItem.querySelector('.save-later-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.savedItems.find(s => s.id === item.id)) {
                    this.showToastKey('cartItem', 'alreadySaved');
                } else {
                    this.saveForLater(item.id);
                }
            });
            
            this.cartItems.appendChild(cartItem);
        });
        
        this.renderProgressBar();
        this.renderCouponSection();
        this.renderSummary();
        this.renderSavedItems();
        this.showFooter();
        this.updateSendButton();
        this.updateCartLabels();
        
        this.startSubtitleAnimation();
    }
    
    renderEmptyCart() {
        if (this.emptyCart) this.emptyCart.style.display = 'flex';
        this.hideFooter();
        this.stopSubtitleAnimation();
        
        if (this.progressFill) this.progressFill.style.width = '0%';
        if (this.progressMessage) {
            const msg = this.getMsg('progressBar', 'freeDelivery').replace('{amount}', this.freeDeliveryThreshold);
            this.progressMessage.textContent = msg;
        }
        
        this.renderSuggestedProducts();
        this.updateCartLabels();
    }
    
    renderSuggestedProducts() {
        const suggestionsContainer = document.getElementById('emptyCartSuggestions');
        if (!suggestionsContainer) return;
        
        const suggestedIds = this.config?.emptyCart?.suggestedProducts || [];
        const products = this.getSuggestedProducts(suggestedIds);
        
        if (products.length === 0) {
            suggestionsContainer.innerHTML = '';
            return;
        }
        
        const suggestedTitle = this.getMsg('emptyCart', 'suggestedTitle');
        
        suggestionsContainer.innerHTML = `
            <p style="font-size:12px; color:#999; margin:8px 0;">${suggestedTitle}</p>
            <div class="empty-cart-suggestions">
                ${products.map(p => `
                    <span class="suggestion-chip" data-product-id="${p.id}">
                        ${p.emoji || '🛒'} ${this.getLocalizedName(p.name)}
                    </span>
                `).join('')}
            </div>
        `;
        
        suggestionsContainer.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const productId = chip.dataset.productId;
                const product = products.find(p => p.id === productId);
                if (product) {
                    this.addItem(product);
                }
            });
        });
    }
    
    getSuggestedProducts(ids) {
        const allProducts = window.allProducts || [];
        if (allProducts.length > 0) {
            return ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
        }
        
        const emojiMap = {
            'atta': '🌾', 'chawal': '🍚', 'chai-patti': '🍵',
            'doodh': '🥛', 'bread': '🍞', 'cheeni': '🍬',
            'namak': '🧂', 'tel': '🫗', 'masala': '🌶️',
            'dal': '🫘', 'biscuit': '🍪'
        };
        
        return ids.map(id => ({
            id,
            name: { hi: id.replace(/-/g, ' '), en: id.replace(/-/g, ' ') },
            emoji: emojiMap[id] || '🛒',
            price: 0,
            unit: { hi: '', en: '' },
            discount: 0,
            image: null
        }));
    }
    
    renderProgressBar() {
        if (!this.progressFill || !this.progressMessage) return;
        
        const total = this.getTotalPrice();
        const threshold = this.freeDeliveryThreshold;
        const percentage = Math.min((total / threshold) * 100, 100);
        
        this.progressFill.style.width = `${percentage}%`;
        
        if (total >= threshold) {
            this.progressFill.classList.add('complete');
            this.progressMessage.classList.add('complete');
            this.progressMessage.textContent = this.getMsg('progressBar', 'congrats');
        } else {
            this.progressFill.classList.remove('complete');
            this.progressMessage.classList.remove('complete');
            const remaining = threshold - total;
            this.progressMessage.textContent = this.getMsg('progressBar', 'freeDelivery').replace('{amount}', remaining);
        }
        
        this.updateMilestones(total);
        this.autoApplyMilestoneCoupon(total);
    }
    
    updateMilestones(total) {
        const milestones = this.config?.progressBar?.milestones || [];
        const milestoneIcons = document.querySelectorAll('.milestone-icon');
        
        milestoneIcons.forEach((icon, index) => {
            if (milestones[index] && total >= milestones[index].amount) {
                if (!icon.classList.contains('reached')) {
                    icon.classList.add('reached');
                    icon.style.animation = 'none';
                    icon.offsetHeight;
                    icon.style.animation = 'milestonePop 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
                    
                    if (this.milestoneReward) {
                        const rewardText = milestones[index].reward;
                        this.milestoneReward.textContent = `${milestones[index].icon} ${rewardText}`;
                        this.milestoneReward.classList.remove('hidden');
                        setTimeout(() => this.milestoneReward?.classList.add('hidden'), 3000);
                    }
                }
            } else {
                icon.classList.remove('reached');
            }
        });
    }
    
    renderCouponSection() {
        if (!this.config?.coupons?.enabled) {
            const section = document.querySelector('.cart-coupon');
            if (section) section.style.display = 'none';
            return;
        }
        
        if (this.couponChips) {
            const codes = this.config.coupons.codes || [];
            this.couponChips.innerHTML = codes.map(c => 
                `<span class="coupon-chip ${this.appliedCoupon?.code === c.code ? 'applied' : ''}" 
                      data-code="${c.code}" 
                      title="${c.description || ''}">${c.code}</span>`
            ).join('');
            
            this.couponChips.querySelectorAll('.coupon-chip:not(.applied)').forEach(chip => {
                chip.addEventListener('click', () => this.applyCoupon(chip.dataset.code));
            });
        }
        
        if (this.activeCouponTag) {
            if (this.appliedCoupon) {
                this.activeCouponTag.innerHTML = `
                    ✅ ${this.appliedCoupon.code} -₹${this.couponDiscount}
                    <span class="coupon-remove">✕</span>
                `;
                this.activeCouponTag.style.display = 'inline-flex';
                this.activeCouponTag.querySelector('.coupon-remove')?.addEventListener('click', () => this.removeCoupon());
            } else {
                this.activeCouponTag.style.display = 'none';
            }
        }
        
        if (this.couponInput) {
            this.couponInput.placeholder = this.getMsg('coupon', 'placeholder');
        }
    }
    
    // ============================================
    // RENDER SUMMARY
    // ============================================
    renderSummary() {
        const subtotal = this.getTotalPrice();
        const delivery = this.getDeliveryCharge();
        const grandTotal = this.getGrandTotal();
        const totalSavings = this.getTotalSavings();
        const itemCount = this.getTotalItems();
        
        const subtotalEl = document.getElementById('summarySubtotal');
        const couponDiscountEl = document.getElementById('summaryCouponDiscount');
        const couponRowEl = document.getElementById('couponDiscountRow');
        const deliveryEl = document.getElementById('summaryDelivery');
        const totalEl = document.getElementById('summaryTotal');
        const savingsEl = document.getElementById('summarySavings');
        const deliveryEstimateEl = document.getElementById('deliveryEstimate');
        const itemCountEl = document.getElementById('summaryItemCount');
        
        if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
        if (itemCountEl) itemCountEl.textContent = this.getMsg('orderSummary', 'itemCount').replace('{count}', itemCount);
        
        if (couponRowEl) {
            if (this.appliedCoupon) {
                couponRowEl.style.display = 'flex';
                if (couponDiscountEl) couponDiscountEl.textContent = `-₹${this.couponDiscount}`;
            } else {
                couponRowEl.style.display = 'none';
            }
        }
        
        if (deliveryEl) {
            deliveryEl.textContent = delivery === 0 ? this.getMsg('orderSummary', 'free') : `₹${delivery}`;
            if (delivery === 0) deliveryEl.classList.add('free-text');
            else deliveryEl.classList.remove('free-text');
        }
        
        if (totalEl) totalEl.textContent = `₹${grandTotal}`;
        
        if (savingsEl) {
            if (totalSavings > 0) {
                savingsEl.textContent = this.getMsg('orderSummary', 'savings').replace('{amount}', totalSavings);
                savingsEl.style.display = 'block';
            } else {
                savingsEl.style.display = 'none';
            }
        }
        
        if (deliveryEstimateEl) {
            const time = this.config?.delivery?.estimatedTime || '30-45 मिनट';
            deliveryEstimateEl.textContent = this.getMsg('orderSummary', 'estimatedDelivery').replace('{time}', time);
        }
        
        // Update summary row labels dynamically
        this.updateSummaryRowLabels();
    }
    
    // ============================================
    // RENDER SAVED ITEMS
    // ============================================
    renderSavedItems() {
        if (!this.config?.features?.saveForLater) {
            if (this.savedItemsSection) this.savedItemsSection.style.display = 'none';
            return;
        }
        
        if (this.savedItemsSection) {
            this.savedItemsSection.style.display = 'block';
            const countEl = this.savedItemsSection.querySelector('.saved-items-count');
            if (countEl) {
                countEl.textContent = this.getMsg('savedItems', 'count').replace('{count}', this.savedItems.length);
            }
        }
        
        if (this.savedBadge) {
            if (this.savedItems.length > 0) {
                this.savedBadge.textContent = this.getMsg('header', 'savedBadge').replace('{count}', this.savedItems.length);
                this.savedBadge.classList.remove('hidden');
            } else {
                this.savedBadge.classList.add('hidden');
            }
        }
        
        if (this.savedItemsList) {
            if (this.savedItems.length === 0) {
                this.savedItemsList.innerHTML = '';
            } else {
                this.savedItemsList.innerHTML = this.savedItems.map(item => `
                    <div class="saved-item">
                        <span>🛒</span>
                        <span class="saved-item-name">${this.getLocalizedName(item.name)}</span>
                        <button class="move-to-cart-btn" data-id="${item.id}">${this.getMsg('savedItems', 'moveToCart')}</button>
                        <button class="remove-saved-btn" data-id="${item.id}">${this.getMsg('savedItems', 'remove')}</button>
                    </div>
                `).join('');
                
                this.savedItemsList.querySelectorAll('.move-to-cart-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.moveToCart(btn.dataset.id));
                });
                
                this.savedItemsList.querySelectorAll('.remove-saved-btn').forEach(btn => {
                    btn.addEventListener('click', () => this.removeFromSaved(btn.dataset.id));
                });
            }
        }
    }
    
    showFooter() {
        const footer = document.querySelector('.cart-footer');
        const summary = this.cartSummary;
        const savedSection = this.savedItemsSection;
        
        if (footer) footer.style.display = 'flex';
        if (summary) summary.style.display = 'block';
        if (savedSection && this.config?.features?.saveForLater) {
            savedSection.style.display = 'block';
        }
    }
    
    hideFooter() {
        const footer = document.querySelector('.cart-footer');
        const summary = this.cartSummary;
        if (footer) footer.style.display = 'none';
        if (summary) summary.style.display = 'none';
    }
    
    updateSendButton() {
        if (!this.sendOrderBtn) return;
        this.sendOrderBtn.disabled = this.cart.length === 0;
    }
    
    // ============================================
    // UPDATE SUMMARY ROW LABELS DYNAMICALLY
    // ============================================
    updateSummaryRowLabels() {
        const summaryRows = document.querySelectorAll('.summary-detail .summary-row');
        
        summaryRows.forEach(row => {
            const firstSpan = row.querySelector('span:first-child');
            if (!firstSpan) return;
            
            if (row.classList.contains('total-row')) {
                firstSpan.textContent = this.getMsg('orderSummary', 'total');
            } else if (row.classList.contains('coupon-discount-row')) {
                firstSpan.textContent = this.getMsg('orderSummary', 'couponDiscount');
            } else if (row.classList.contains('delivery-row')) {
                firstSpan.textContent = this.getMsg('orderSummary', 'delivery');
            } else {
                firstSpan.textContent = this.getMsg('orderSummary', 'subtotal');
            }
        });
    }
    
    // ============================================
    // UPDATE ALL CART LABELS (MULTILINGUAL)
    // ============================================
    updateCartLabels() {
        const lang = this.currentLang;
        const itemCount = this.getTotalItems();
        
        // Header title
        const cartTitle = document.getElementById('cartTitle');
        if (cartTitle) cartTitle.textContent = this.getMsg('header', 'title');
        
        // Header subtitle with item count
        const subtitle = document.querySelector('.cart-subtitle');
        if (subtitle && this.cart.length > 0) {
            const texts = this.subtitleTexts[lang] || this.subtitleTexts.hi;
            const baseText = texts[this.subtitleIndex];
            const itemsInCart = this.getMsg('header', 'itemsInCart').replace('{count}', itemCount);
            subtitle.innerHTML = `${baseText} <span style="font-size:10px;opacity:0.8;">${itemsInCart}</span>`;
        } else if (subtitle && this.cart.length === 0) {
            subtitle.textContent = this.getMsg('emptyCart', 'subtitle');
        }
        
        // Coupon input placeholder
        if (this.couponInput) {
            this.couponInput.placeholder = this.getMsg('coupon', 'placeholder');
        }
        
        // Coupon apply button
        const couponApplyBtn = document.getElementById('couponApplyBtn');
        if (couponApplyBtn) couponApplyBtn.textContent = this.getMsg('coupon', 'apply');
        
        // Summary header
        const summaryHeaderLeft = document.querySelector('.summary-header-left');
        if (summaryHeaderLeft) {
            const title = this.getMsg('orderSummary', 'title');
            const count = this.getMsg('orderSummary', 'itemCount').replace('{count}', itemCount);
            summaryHeaderLeft.innerHTML = `${title} <span class="summary-item-count" id="summaryItemCount">${count}</span>`;
        }
        
        // Summary row labels
        this.updateSummaryRowLabels();
        
        // Savings label
        const savingsEl = document.getElementById('summarySavings');
        if (savingsEl && savingsEl.style.display !== 'none') {
            const totalSavings = this.getTotalSavings();
            if (totalSavings > 0) {
                savingsEl.textContent = this.getMsg('orderSummary', 'savings').replace('{amount}', totalSavings);
            }
        }
        
        // Delivery estimate
        const deliveryEstimateEl = document.getElementById('deliveryEstimate');
        if (deliveryEstimateEl) {
            const time = this.config?.delivery?.estimatedTime || '30-45 मिनट';
            deliveryEstimateEl.textContent = this.getMsg('orderSummary', 'estimatedDelivery').replace('{time}', time);
        }
        
        // Saved items header
        const savedTitle = document.querySelector('.saved-items-title');
        if (savedTitle) {
            const title = this.getMsg('savedItems', 'title');
            const count = this.getMsg('savedItems', 'count').replace('{count}', this.savedItems.length);
            savedTitle.innerHTML = `${title} <span class="saved-items-count">${count}</span>`;
        }
        
        // Saved items buttons
        document.querySelectorAll('.move-to-cart-btn').forEach(btn => {
            btn.textContent = this.getMsg('savedItems', 'moveToCart');
        });
        
        document.querySelectorAll('.remove-saved-btn').forEach(btn => {
            btn.textContent = this.getMsg('savedItems', 'remove');
        });
        
        // Footer buttons
        const sendBtn = document.getElementById('sendOrderBtn');
        if (sendBtn) {
            const sendText = this.getMsg('footer', 'whatsapp');
            sendBtn.innerHTML = `
                <span class="whatsapp-icon" aria-hidden="true">💬</span>
                <span>${sendText}</span>
                <span class="send-arrow" aria-hidden="true">→</span>
            `;
        }
        
        const copyBtn = document.getElementById('copyOrderBtn');
        if (copyBtn) {
            const copyText = this.getMsg('footer', 'copyOrder');
            copyBtn.innerHTML = `📋 ${copyText}`;
        }
        
        const clearBtn = document.getElementById('clearCartBtn');
        if (clearBtn) {
            const clearText = this.getMsg('footer', 'clearCart');
            clearBtn.innerHTML = `🗑️ ${clearText}`;
        }
        
        // Cart item tooltips
        document.querySelectorAll('.save-later-btn').forEach(btn => {
            const productId = btn.dataset.id;
            const isSaved = this.savedItems.find(s => s.id === productId);
            btn.title = isSaved ? this.getMsg('cartItem', 'saved') : this.getMsg('cartItem', 'saveForLater');
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.title = this.getMsg('cartItem', 'remove');
        });
        
        // Empty cart labels
        if (this.cart.length === 0) {
            const emptyTitle = document.querySelector('#emptyCart h3');
            const emptySubtitle = document.querySelector('#emptyCart p');
            const browseBtn = document.querySelector('.browse-products-btn');
            
            if (emptyTitle) emptyTitle.textContent = this.getMsg('emptyCart', 'title');
            if (emptySubtitle) emptySubtitle.textContent = this.getMsg('emptyCart', 'subtitle');
            if (browseBtn) browseBtn.textContent = this.getMsg('emptyCart', 'buttonText');
        }
    }
    
    // ============================================
    // UNDO
    // ============================================
    showUndoNotification(productId) {
        if (!this.undoNotification) return;
        
        this.undoNotification.innerHTML = `
            ${this.getMsg('undoDelete', 'removed')}
            <button class="undo-btn" id="undoBtn">${this.getMsg('undoDelete', 'undo')}</button>
        `;
        this.undoNotification.style.display = 'flex';
        
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undoRemove());
        
        const timeout = (this.config?.undoDelete?.timeoutSeconds || 5) * 1000;
        clearTimeout(this.undoTimer);
        this.undoTimer = setTimeout(() => this.hideUndoNotification(), timeout);
    }
    
    hideUndoNotification() {
        if (this.undoNotification) this.undoNotification.style.display = 'none';
        clearTimeout(this.undoTimer);
    }
    
    // ============================================
    // SEND ORDER
    // ============================================
    sendOrder() {
        if (this.cart.length === 0) return;
        
        this.closeCart();
        
        setTimeout(() => {
            if (window.checkoutManager?.open) {
                window.checkoutManager.open(this.cart, this.getGrandTotal(), this.getTotalItems());
            } else {
                this.sendDirectWhatsApp();
            }
        }, 300);
    }
    
    sendDirectWhatsApp() {
        if (this.cart.length === 0) return;
        
        const lang = this.currentLang;
        const isHindi = lang === 'hi';
        
        let message = isHindi 
            ? '🛒 *Quick Dukan - नया ऑर्डर*\n\n━━━━━━━━━━━━━━━━\n\n'
            : '🛒 *Quick Dukan - New Order*\n\n━━━━━━━━━━━━━━━━\n\n';
        
        this.cart.forEach((item, index) => {
            const name = this.getLocalizedName(item.name);
            const unit = this.getLocalizedName(item.unit);
            const price = item.price * (item.quantity || 1);
            message += `${index + 1}. *${name}*\n   ${unit} × ${item.quantity || 1} = ₹${price}\n`;
        });
        
        message += '\n━━━━━━━━━━━━━━━━\n';
        message += isHindi 
            ? `📦 कुल आइटम: ${this.getTotalItems()}\n💰 कुल राशि: ₹${this.getGrandTotal()}\n`
            : `📦 Total Items: ${this.getTotalItems()}\n💰 Total: ₹${this.getGrandTotal()}\n`;
        
        if (this.appliedCoupon) {
            message += isHindi
                ? `🎫 कूपन: ${this.appliedCoupon.code} (-₹${this.couponDiscount})\n`
                : `🎫 Coupon: ${this.appliedCoupon.code} (-₹${this.couponDiscount})\n`;
        }
        
        message += isHindi ? '\n🙏 कृपया ऑर्डर कन्फर्म करें।' : '\n🙏 Please confirm the order.';
        
        const whatsappNumber = this.config?.whatsapp?.number || '919719312956';
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        if (window.ordersManager?.saveOrder) {
            window.ordersManager.saveOrder({
                items: [...this.cart],
                total: this.getGrandTotal(),
                itemCount: this.getTotalItems(),
                coupon: this.appliedCoupon,
            });
        }
        
        setTimeout(() => {
            this.cart = [];
            this.appliedCoupon = null;
            this.couponDiscount = 0;
            this.reachedMilestones = [];
            this.saveCart();
            this.saveCoupon();
            this.updateBadge();
        }, 500);
        
        this.showToastKey('toast', 'orderSent');
    }
    
    copyOrder() {
        if (this.cart.length === 0) return;
        
        const lang = this.currentLang;
        const isHindi = lang === 'hi';
        
        let text = isHindi
            ? '🛒 Quick Dukan - ऑर्डर\n\n━━━━━━━━━━━━━━━━\n\n'
            : '🛒 Quick Dukan - Order\n\n━━━━━━━━━━━━━━━━\n\n';
        
        this.cart.forEach((item, index) => {
            const name = this.getLocalizedName(item.name);
            const unit = this.getLocalizedName(item.unit);
            const price = item.price * (item.quantity || 1);
            text += `${index + 1}. ${name} (${unit}) × ${item.quantity || 1} = ₹${price}\n`;
        });
        
        text += '\n━━━━━━━━━━━━━━━━\n';
        text += isHindi
            ? `📦 कुल: ${this.getTotalItems()} आइटम\n💰 कुल राशि: ₹${this.getGrandTotal()}\n`
            : `📦 Total: ${this.getTotalItems()} items\n💰 Grand Total: ₹${this.getGrandTotal()}\n`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => this.showToastKey('toast', 'copied'));
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToastKey('toast', 'copied');
        }
    }
    
    // ============================================
    // MODAL
    // ============================================
    openCart() {
        if (!this.cartModal) return;
        this.subtitleIndex = 0;
        this.renderCart();
        this.cartModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        const cartContent = this.cartModal.querySelector('.cart-content');
        if (cartContent) cartContent.style.transform = 'translateY(0)';
    }
    
    closeCart() {
        if (!this.cartModal) return;
        this.stopSubtitleAnimation();
        this.cartModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    // ============================================
    // BADGE
    // ============================================
    updateBadge() {
        if (!this.cartBadge) return;
        const total = this.getTotalItems();
        if (total > 0) {
            this.cartBadge.textContent = total > 99 ? '99+' : total;
            this.cartBadge.classList.remove('hidden');
            this.cartBadge.style.animation = 'none';
            this.cartBadge.offsetHeight;
            this.cartBadge.style.animation = 'pop 0.3s ease';
        } else {
            this.cartBadge.classList.add('hidden');
        }
    }
    
    animateCartIcon() {
        const cartBtn = document.querySelector('[data-nav="cart"]');
        if (cartBtn) {
            cartBtn.classList.add('pop-animation');
            setTimeout(() => cartBtn.classList.remove('pop-animation'), 300);
        }
    }
    
    // ============================================
    // EFFECTS
    // ============================================
    triggerConfetti() {
        if (!this.config?.features?.confetti) return;
        if (!this.confettiContainer) return;
        
        const colors = ['#FF9933', '#138808', '#FFD700', '#FF4444', '#25D366', '#FF6D00'];
        
        for (let i = 0; i < 30; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            piece.style.animationDuration = (Math.random() * 1 + 1) + 's';
            this.confettiContainer.appendChild(piece);
            setTimeout(() => piece.remove(), 2000);
        }
    }
    
    shakeElement(element) {
        if (!element) return;
        element.style.animation = 'none';
        element.offsetHeight;
        element.style.animation = 'shake 0.5s ease';
    }
    
    // ============================================
    // HELPERS
    // ============================================
    getLocalizedName(nameObj) {
        if (!nameObj) return '';
        if (typeof nameObj === 'string') return nameObj;
        return nameObj[this.currentLang] || nameObj.hi || nameObj.en || '';
    }
    
    getMsg(section, key) {
        if (!this.messages) return `[${key}]`;
        const lang = this.currentLang;
        return this.messages[section]?.[lang]?.[key] || 
               this.messages[section]?.en?.[key] || 
               `[${key}]`;
    }
    
    showToastKey(section, key, replacements = {}) {
        let message = this.getMsg(section, key);
        Object.keys(replacements).forEach(k => {
            message = message.replace(`{${k}}`, replacements[k]);
        });
        this.showToast(message);
    }
    
    getProductEmoji(productId) {
        const map = {
            'atta': '🌾', 'chawal': '🍚', 'chai-patti': '🍵',
            'doodh': '🥛', 'bread': '🍞', 'cheeni': '🍬',
            'namak': '🧂', 'tel': '🫗', 'masala': '🌶️',
            'dal': '🫘', 'biscuit': '🍪', 'sabji': '🥬'
        };
        return map[productId] || '🛒';
    }
    
    shouldShowStockWarning(stock) {
        if (!this.config?.features?.stockWarning) return false;
        if (stock === null || stock === undefined) return false;
        const threshold = this.config?.stockWarning?.threshold || 5;
        return stock > 0 && stock <= threshold;
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';
        
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2000);
    }
    
    destroy() {
        this.stopSubtitleAnimation();
        clearTimeout(this.undoTimer);
        clearTimeout(this._toastTimer);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.cartManager = new CartManager();
    }, 150);
});