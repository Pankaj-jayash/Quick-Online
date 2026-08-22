// ============================================
// FLOATING-CART-BUBBLE.JS
// Compact Cart Preview - Transparent Blur
// ============================================

class FloatingCartBubble {
    constructor() {
        this.bubble = null;
        this.bubbleBtn = null;
        this.bubbleStack = null;
        this.bubbleCount = null;
        this.bubblePrice = null;
        this.isVisible = false;
        this.isNavHidden = false;
        this.cartItems = [];
        this._pollInterval = null;
        this._changeTimer = null;
        this._lastCount = -1;
        this._lastAddedId = null;  // Track latest added product
        
        this.init();
    }
    
    init() {
        this.createBubble();
        this.watchCart();
        this.watchNavbar();
        
        setTimeout(() => {
            this.updateBubble();
            this.checkVisibility();
        }, 1000);
        
        console.log('🫧 Compact Cart Bubble ready');
    }
    
    // ============================================
    // CREATE BUBBLE DOM
    // ============================================
    createBubble() {
        const existing = document.getElementById('floatingCartBubble');
        if (existing) existing.remove();
        
        this.bubble = document.createElement('div');
        this.bubble.id = 'floatingCartBubble';
        this.bubble.className = 'floating-cart-bubble hidden';
        this.bubble.setAttribute('role', 'button');
        this.bubble.setAttribute('aria-label', 'कार्ट देखें');
        this.bubble.innerHTML = `
            <button class="cart-bubble-btn">
                <div class="cart-bubble-stack single">
                    <span class="cart-bubble-thumb">🛒</span>
                    <span class="cart-bubble-thumb"></span>
                    <span class="cart-bubble-thumb"></span>
                </div>
                <div class="cart-bubble-info">
                    <span class="cart-bubble-label">कार्ट</span>
                    <span class="cart-bubble-price">₹0</span>
                </div>
                <span class="cart-bubble-arrow">›</span>
                <span class="cart-bubble-count">0</span>
            </button>
        `;
        
        document.body.appendChild(this.bubble);
        
        this.bubbleBtn = this.bubble.querySelector('.cart-bubble-btn');
        this.bubbleStack = this.bubble.querySelector('.cart-bubble-stack');
        this.bubbleCount = this.bubble.querySelector('.cart-bubble-count');
        this.bubblePrice = this.bubble.querySelector('.cart-bubble-price');
        
        this.bubbleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.bubbleBtn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.bubbleBtn.style.transform = '';
                this.openCart();
            }, 100);
        });
    }
    
    // ============================================
    // WATCH CART
    // ============================================
    watchCart() {
        const checkInterval = setInterval(() => {
            if (window.cartManager) {
                clearInterval(checkInterval);
                this.bindCartEvents();
                this.startPolling();
                this.updateBubble();
                this.checkVisibility();
            }
        }, 200);
        
        setTimeout(() => clearInterval(checkInterval), 8000);
    }
    
    bindCartEvents() {
        const cart = window.cartManager;
        if (!cart) return;
        
        // Wrap addItem to track latest added product
        const originalAdd = cart.addItem;
        if (typeof originalAdd === 'function') {
            cart.addItem = (product, quantity) => {
                this._lastAddedId = product?.id || null;
                const result = originalAdd.call(cart, product, quantity);
                this.onCartChanged();
                return result;
            };
        }
        
        ['removeItem', 'clearCart', 'updateQuantity'].forEach(method => {
            const original = cart[method];
            if (typeof original === 'function') {
                cart[method] = (...args) => {
                    const result = original.apply(cart, args);
                    this.onCartChanged();
                    return result;
                };
            }
        });
    }
    
    startPolling() {
        this._pollInterval = setInterval(() => {
            const cart = window.cartManager;
            if (!cart?.cart) return;
            
            const count = cart.cart.length;
            if (count !== this._lastCount) {
                // Detect which product was added
                if (count > this._lastCount && cart.cart.length > 0) {
                    this._lastAddedId = cart.cart[cart.cart.length - 1]?.id || null;
                }
                this._lastCount = count;
                this.onCartChanged();
            }
        }, 500);
    }
    
    onCartChanged() {
        if (this._changeTimer) clearTimeout(this._changeTimer);
        this._changeTimer = setTimeout(() => {
            this.updateBubble();
            this.checkVisibility();
        }, 80);
    }
    
    // ============================================
    // WATCH NAVBAR
    // ============================================
    watchNavbar() {
        const bottomNav = document.getElementById('bottomNav');
        if (!bottomNav) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const wasHidden = this.isNavHidden;
                    this.isNavHidden = bottomNav.classList.contains('nav-hidden');
                    
                    // Update position class
                    if (this.isNavHidden) {
                        this.bubble.classList.add('navbar-hidden');
                    } else {
                        this.bubble.classList.remove('navbar-hidden');
                    }
                    
                    if (wasHidden !== this.isNavHidden) {
                        this.checkVisibility();
                    }
                }
            });
        });
        
        observer.observe(bottomNav, { attributes: true, attributeFilter: ['class'] });
        this.isNavHidden = bottomNav.classList.contains('nav-hidden');
        if (this.isNavHidden) {
            this.bubble.classList.add('navbar-hidden');
        }
    }
    
    // ============================================
    // UPDATE CONTENT
    // ============================================
    updateBubble() {
        const cart = window.cartManager;
        if (!cart?.cart) return;
        
        this.cartItems = [...cart.cart];
        const itemCount = this.cartItems.length;
        
        // Calculate total
        const total = this.cartItems.reduce((sum, item) => {
            return sum + ((item.price || 0) * (item.quantity || 1));
        }, 0);
        
        // Update count badge
        if (this.bubbleCount) {
            const prevCount = parseInt(this.bubbleCount.textContent) || 0;
            this.bubbleCount.textContent = itemCount;
            
            if (itemCount === 0) {
                this.bubbleCount.style.display = 'none';
            } else {
                this.bubbleCount.style.display = 'flex';
                if (itemCount !== prevCount && prevCount !== 0) {
                    this.bubbleCount.classList.add('pop');
                    setTimeout(() => this.bubbleCount.classList.remove('pop'), 400);
                }
            }
        }
        
        // Update price
        if (this.bubblePrice) {
            this.bubblePrice.textContent = '₹' + total;
        }
        
        // Update product stack (ALWAYS show latest 3)
        this.updateProductStack();
        
        // Empty state
        if (itemCount === 0) {
            this.bubble.classList.add('empty');
        } else {
            this.bubble.classList.remove('empty');
        }
        
        // Reset last added tracker after update
        this._lastAddedId = null;
    }
    
    // ============================================
    // PRODUCT STACK - Always latest 3, newest on top
    // ============================================
    updateProductStack() {
        if (!this.bubbleStack) return;
        
        const thumbs = this.bubbleStack.querySelectorAll('.cart-bubble-thumb');
        const itemCount = this.cartItems.length;
        
        // Clear all thumbs
        thumbs.forEach(t => {
            t.textContent = '';
            t.style.backgroundImage = '';
        });
        
        if (itemCount === 0) {
            thumbs[0].textContent = '🛒';
            this.bubbleStack.classList.add('single');
        } else if (itemCount === 1) {
            this.setThumb(thumbs[0], this.cartItems[0]);
            this.bubbleStack.classList.add('single');
        } else {
            this.bubbleStack.classList.remove('single');
            // ✅ ALWAYS show LAST 3 items, newest first (left side)
            const latestItems = this.cartItems.slice(-3).reverse();
            latestItems.forEach((item, i) => {
                if (thumbs[i]) this.setThumb(thumbs[i], item);
            });
        }
    }
    
    setThumb(el, item) {
        if (!el || !item) return;
        
        const image = item.image || '';
        const nameHi = item.name?.hi || '';
        const nameEn = item.name?.en || '';
        const emoji = item.emoji || this.getEmoji(item.id || '', nameHi + nameEn) || '📦';
        
        if (image && (image.startsWith('http') || image.startsWith('data:'))) {
            el.style.backgroundImage = `url(${image})`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            el.textContent = '';
        } else {
            el.textContent = emoji;
            el.style.backgroundImage = '';
        }
    }
    
    getEmoji(id, name) {
        const n = name.toLowerCase();
        if (/दूध|milk/i.test(n)) return '🥛';
        if (/ब्रेड|bread/i.test(n)) return '🍞';
        if (/चावल|rice/i.test(n)) return '🍚';
        if (/तेल|oil/i.test(n)) return '🫗';
        if (/चीनी|sugar/i.test(n)) return '🍬';
        if (/पेप्सी|pepsi|cold|coke/i.test(n)) return '🥤';
        if (/नमकीन|snack|haldiram/i.test(n)) return '🍿';
        if (/बिस्कुट|biscuit/i.test(n)) return '🍪';
        if (/साबुन|soap/i.test(n)) return '🧼';
        if (/पेस्ट|toothpaste/i.test(n)) return '🪥';
        if (/अंडा|egg/i.test(n)) return '🥚';
        if (/आटा|flour|atta/i.test(n)) return '🌾';
        if (/दाल|dal/i.test(n)) return '🫘';
        if (/मसाला|spice/i.test(n)) return '🌶️';
        if (/चाय|tea/i.test(n)) return '🍵';
        if (/कॉफी|coffee/i.test(n)) return '☕';
        if (/शैंपू|shampoo/i.test(n)) return '🧴';
        return '📦';
    }
    
    // ============================================
    // VISIBILITY
    // ============================================
    checkVisibility() {
        const itemCount = this.cartItems.length;
        const shouldShow = this.isNavHidden && itemCount > 0;
        
        if (shouldShow && !this.isVisible) {
            this.show();
        } else if (!shouldShow && this.isVisible) {
            this.hide();
        }
    }
    
    show() {
        if (!this.bubble || this.isVisible) return;
        
        this.bubble.classList.remove('hidden', 'empty');
        void this.bubble.offsetWidth;
        this.bubble.classList.add('visible');
        this.isVisible = true;
        
        if (navigator.vibrate) navigator.vibrate(8);
    }
    
    hide() {
        if (!this.bubble || !this.isVisible) return;
        
        this.bubble.classList.remove('visible');
        this.bubble.classList.add('hidden');
        this.isVisible = false;
    }
    
    // ============================================
    // OPEN CART
    // ============================================
    openCart() {
        if (window.bottomNavManager?.openCart) {
            window.bottomNavManager.openCart();
        } else if (window.cartManager?.openCart) {
            window.cartManager.openCart();
        } else {
            const modal = document.getElementById('cartModal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }
    }
    
    // ============================================
    // PUBLIC
    // ============================================
    refresh() {
        this.updateBubble();
        this.checkVisibility();
    }
    
    destroy() {
        if (this._pollInterval) clearInterval(this._pollInterval);
        if (this._changeTimer) clearTimeout(this._changeTimer);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.floatingCartBubble = new FloatingCartBubble();
    }, 800);
});