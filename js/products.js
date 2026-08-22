'use strict';

// ============================================
// PRODUCTS.JS - Product Cards + Image Placeholder + Skeleton Loading
// ============================================

class ProductsManager {
    constructor() {
        this.allProductsGrid = document.getElementById('allProductsGrid');
        this.skeletonCount = 6;

        // ⭐ हर कैटेगरी का अपना स्टाइल ⭐
        this.categoryStyles = {
            'dal':           { emoji: '🫘', gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' },
            'chawal-atta':   { emoji: '🍚', gradient: 'linear-gradient(135deg, #4ECDC4, #7EDDD6)' },
            'tel-ghee':      { emoji: '🫒', gradient: 'linear-gradient(135deg, #FFD93D, #FFE97F)' },
            'masale':        { emoji: '🌶️', gradient: 'linear-gradient(135deg, #FF8A65, #FFAB91)' },
            'cold-drinks':   { emoji: '🥤', gradient: 'linear-gradient(135deg, #64B5F6, #90CAF9)' },
            'chai-kafi':     { emoji: '☕', gradient: 'linear-gradient(135deg, #A1887F, #BCAAA4)' },
            'dairy':         { emoji: '🥛', gradient: 'linear-gradient(135deg, #90CAF9, #BBDEFB)' },
            'snacks':        { emoji: '🍪', gradient: 'linear-gradient(135deg, #FFCC80, #FFE0B2)' },
            'sabji':         { emoji: '🥬', gradient: 'linear-gradient(135deg, #81C784, #A5D6A7)' },
        
'snacks':        { emoji: '🌯', gradient: 'linear-gradient(135deg, #FFCC80, #FFE0B2)' },
'namak-masale':  { emoji: '🧂', gradient: 'linear-gradient(135deg, #B0BEC5, #CFD8DC)' },
};
        this.defaultStyle = { 
            emoji: '📦', 
            gradient: 'linear-gradient(135deg, #B39DDB, #D1C4E9)' 
        };

        this.init();
    }

    init() {
        this.showSkeletons();

        document.addEventListener('dataLoaded', (e) => {
            this.renderAllProducts(e.detail.allProducts);
        });

        document.addEventListener('languageChanged', () => {
            this.refreshAllProducts();
        });
    }

    // ============================================
    // SKELETON LOADING
    // ============================================
    showSkeletons() {
        if (!this.allProductsGrid) return;
        
        this.allProductsGrid.innerHTML = '';
        
        for (let i = 0; i < this.skeletonCount; i++) {
            const skeleton = this.createSkeletonCard();
            this.allProductsGrid.appendChild(skeleton);
        }
    }

    createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'product-card skeleton';
        
        card.innerHTML = `
            <div class="product-card-image"></div>
            <div class="product-card-info">
                <div class="product-name-row">
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line" style="width: 40%;"></div>
                </div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
                <div class="product-buttons">
                    <div class="skeleton-line" style="height: 32px; width: 100%;"></div>
                </div>
            </div>
        `;
        
        return card;
    }

    // ============================================
    // RENDER ALL PRODUCTS
    // ============================================
    renderAllProducts(products) {
        if (!this.allProductsGrid) return;
        
        this.allProductsGrid.innerHTML = '';

        if (!products || products.length === 0) {
            this.showEmptyState();
            return;
        }

        products.forEach((product, index) => {
            const card = this.createProductCard(product);
            card.style.animationDelay = `${index * 0.05}s`;
            this.allProductsGrid.appendChild(card);
        });
    }

    showEmptyState() {
        if (!this.allProductsGrid) return;
        
        const lang = window.languageManager?.currentLang || 'hi';
        this.allProductsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; grid-column: 1 / -1;">
                <span style="font-size: 48px;">📭</span>
                <p style="color: var(--text-secondary); margin-top: 8px;">
                    ${lang === 'hi' ? 'कोई प्रोडक्ट नहीं मिला' : 'No products found'}
                </p>
            </div>
        `;
    }

    refreshAllProducts() {
        if (window.dataLoader && window.dataLoader.isLoaded) {
            this.renderAllProducts(window.dataLoader.allProducts);
        }
    }

    // ============================================
    // ⭐ CREATE PRODUCT CARD - WITH PLACEHOLDER ⭐
    // ============================================
    createProductCard(product) {
        const lang = window.languageManager?.currentLang || 'hi';
        const name = product.name ? (product.name[lang] || product.name.hi || product.name.en || '') : '';
        const unit = product.unit ? (product.unit[lang] || product.unit.hi || product.unit.en || '') : '';
        const price = product.price || 0;
        const discount = product.discount || 0;
        const image = product.image || '';
        const categoryId = product.categoryId || '';
        
        // ⭐ कैटेगरी स्टाइल लो ⭐
        const style = this.categoryStyles[categoryId] || this.defaultStyle;
        
        // ⭐ प्रोडक्ट का पहला अक्षर ⭐
        const firstLetter = name.trim().charAt(0);

        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.setAttribute('data-product-id', product.id);
        card.setAttribute('data-product-name', JSON.stringify(product.name || {}));
        card.setAttribute('data-product-unit', JSON.stringify(product.unit || {}));

        // ⭐ इमेज सेक्शन — असली इमेज या शानदार प्लेसहोल्डर ⭐
        card.innerHTML = `
            <div class="product-card-image" style="background: ${style.gradient};">
                
                <!-- शाइन इफ़ेक्ट -->
                <div class="image-shine"></div>
                
                <!-- अगर इमेज है तो दिखाओ, नहीं तो प्लेसहोल्डर -->
                ${image ? `
                    <img src="${image}" 
                         alt="${name}" 
                         loading="lazy"
                         onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');">
                    <div class="image-placeholder hidden">
                ` : `
                    <div class="image-placeholder">
                `}
                        <span class="placeholder-emoji">${style.emoji}</span>
                        <div class="placeholder-letter">${firstLetter}</div>
                        <span class="placeholder-name">${name}</span>
                    </div>
                ${image ? '' : ''}
                
                <!-- प्राइस ओवरले -->
                <div class="price-overlay">₹${price}</div>
                
                <!-- डिस्काउंट बैज -->
                ${discount > 0 ? `<div class="discount-badge">${discount}% OFF</div>` : ''}
            </div>
            
            <div class="product-card-info">
                <div class="product-name-row">
                    <span class="product-name">${name}</span>
                </div>
                <div class="product-discount">
                    ${discount > 0 ? `<span class="discount-text">🔥 ${discount}% OFF</span>` : '<span></span>'}
                    <span class="product-unit">${unit}</span>
                </div>
                <div class="product-buttons">
                    <button class="btn-add-cart" data-action="add-to-cart">
                        <i class="fas fa-plus"></i> ${lang === 'hi' ? 'कार्ट' : 'Cart'}
                    </button>
                    <button class="btn-buy-now" data-action="buy-now">
                        <i class="fab fa-whatsapp"></i> ${lang === 'hi' ? 'खरीदें' : 'Buy'}
                    </button>
                </div>
            </div>
        `;

        // Add to Cart
        const addToCartBtn = card.querySelector('[data-action="add-to-cart"]');
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addToCart(product, addToCartBtn);
        });

        // Buy Now
        const buyNowBtn = card.querySelector('[data-action="buy-now"]');
        buyNowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.buyNow(product, buyNowBtn);
        });

        // Click on card
        card.addEventListener('click', () => {
            this.addToRecentlyViewed(product);
        });

        return card;
    }

    // ============================================
    // CART OPERATIONS
    // ============================================
    addToCart(product, button) {
        if (window.cartManager) {
            window.cartManager.addItem(product);
        }

        if (button) {
            button.classList.add('pop-animation');
            setTimeout(() => button.classList.remove('pop-animation'), 300);
        }

        this.showToast(
            (window.languageManager?.currentLang || 'hi') === 'hi' 
                ? '✅ कार्ट में जोड़ा!' 
                : '✅ Added to cart!'
        );
    }

    buyNow(product, button) {
        if (button) {
            button.classList.add('pop-animation');
            setTimeout(() => button.classList.remove('pop-animation'), 300);
        }

        const cartItems = [{
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            unit: product.unit,
            discount: product.discount || 0,
            quantity: 1,
        }];

        const total = product.price || 0;

        if (window.checkoutManager && typeof window.checkoutManager.open === 'function') {
            window.checkoutManager.open(cartItems, total, 1);
        } else {
            this.buyNowDirect(product);
        }
    }

    buyNowDirect(product) {
        const lang = window.languageManager?.currentLang || 'hi';
        const name = product.name ? (product.name[lang] || product.name.hi || '') : '';
        const unit = product.unit ? (product.unit[lang] || product.unit.hi || '') : '';
        const price = product.price || 0;

        const message = `नमस्ते Quick Dukan! 🙏\n\nमुझे ऑर्डर करना है:\n📦 ${name} - ${unit}\n💰 कीमत: ₹${price}\n\nकृपया डिलीवरी की जानकारी दें।`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${window.CONFIG?.whatsappNumber || '919876543210'}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    }

    addToRecentlyViewed(product) {
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.addProduct(product);
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('slide-up');

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.classList.add('hidden');
                toast.classList.remove('fade-out', 'slide-up');
            }, 300);
        }, 2000);
    }

    createHorizontalCard(product) {
        return this.createProductCard(product);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.productsManager = new ProductsManager();
});