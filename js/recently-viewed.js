
// ============================================
// RECENTLY-VIEWED.JS - Section 6: Recently Viewed
// ============================================

class RecentlyViewedManager {
    constructor() {
        this.section = document.getElementById('recentlyViewedSection');
        this.scroll = document.getElementById('recentlyViewedScroll');
        this.maxItems = 10;
        this.storageKey = 'quick-dukan-recently-viewed';
        
        this.init();
    }
    
    init() {
        // Check and show on load
        document.addEventListener('dataLoaded', () => {
            this.checkAndShow();
        });
        
        document.addEventListener('categoryChanged', (e) => {
            if (e.detail.categoryId !== 'all') {
                this.hide();
            } else {
                this.checkAndShow();
            }
        });
        
        document.addEventListener('languageChanged', () => {
            if (!this.section.classList.contains('hidden')) {
                this.render();
            }
        });
    }
    
    getRecentProducts() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveRecentProducts(products) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(products.slice(0, this.maxItems)));
        } catch (e) {
            console.warn('Could not save recently viewed products');
        }
    }
    
    addProduct(product) {
        let recent = this.getRecentProducts();
        
        // Remove if already exists
        recent = recent.filter(p => p.id !== product.id);
        
        // Add to beginning
        recent.unshift({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            unit: product.unit,
            discount: product.discount,
            categoryId: product.categoryId,
        });
        
        // Keep only max items
        recent = recent.slice(0, this.maxItems);
        
        this.saveRecentProducts(recent);
        this.render();
    }
    
    render() {
        if (!this.scroll) return;
        
        const recent = this.getRecentProducts();
        
        if (recent.length === 0) {
            this.hide();
            return;
        }
        
        this.scroll.innerHTML = '';
        
        recent.forEach(product => {
            const card = window.productsManager.createProductCard(product);
            this.scroll.appendChild(card);
        });
        
        this.show();
    }
    
    show() {
        this.section.classList.remove('hidden');
        this.section.classList.add('fade-in');
        setTimeout(() => this.section.classList.remove('fade-in'), 400);
    }
    
    hide() {
        this.section.classList.add('hidden');
    }
    
    checkAndShow() {
        const recent = this.getRecentProducts();
        const isCategoryActive = document.getElementById('categoryProductsSection') && 
                                  !document.getElementById('categoryProductsSection').classList.contains('hidden');
        
        if (recent.length > 0 && !isCategoryActive) {
            this.render();
        } else {
            this.hide();
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.recentlyViewedManager = new RecentlyViewedManager();
});
