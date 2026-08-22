// ============================================
// MOST-ORDERS.JS - Section 7: Most Ordered
// ============================================

class MostOrdersManager {
    constructor() {
        this.section = document.getElementById('mostOrdersSection');
        this.scroll = document.getElementById('mostOrdersScroll');
        
        this.init();
    }
    
    init() {
        document.addEventListener('dataLoaded', () => {
            this.checkAndShow();
        });
        
        document.addEventListener('categoryChanged', (e) => {
            // Always show most orders (except when category products are showing, 
            // but we show below them)
            this.checkAndShow();
        });
        
        document.addEventListener('languageChanged', () => {
            if (!this.section.classList.contains('hidden')) {
                this.render();
            }
        });
    }
    
    render() {
        if (!window.dataLoader || !this.scroll) return;
        
        const products = window.dataLoader.getMostOrderedProducts();
        
        if (products.length === 0) {
            // If no products marked as most ordered, show random popular ones
            const randomProducts = window.dataLoader.getRandomProducts(6);
            this.renderProducts(randomProducts);
            return;
        }
        
        this.renderProducts(products);
    }
    
    renderProducts(products) {
        if (!this.scroll) return;
        this.scroll.innerHTML = '';
        
        products.forEach(product => {
            const card = window.productsManager.createProductCard(product);
            this.scroll.appendChild(card);
        });
        
        this.show();
    }
    
    show() {
        this.section.classList.remove('hidden');
    }
    
    hide() {
        this.section.classList.add('hidden');
    }
    
    checkAndShow() {
        if (!window.dataLoader || !window.dataLoader.isLoaded) return;
        
        // Most orders should always be visible
        this.render();
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.mostOrdersManager = new MostOrdersManager();
});

