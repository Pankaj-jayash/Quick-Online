'use strict';

// ============================================
// CATEGORY-PRODUCTS.JS - Section 5 (DYNAMIC FAST)
// Category Colors + Smooth Speed + Transparent
// ============================================

class CategoryProductsManager {
    constructor() {
        this.section = document.getElementById('categoryProductsSection');
        this.title = document.getElementById('categoryProductsTitle');
        this.grid = document.getElementById('categoryProductsGrid');
        this.currentCategoryId = null;
        this.savedMainScrollPosition = 0;
        
        this.init();
    }
    
    init() {
        document.addEventListener('categoryChanged', (e) => {
            this.showCategoryProducts(e.detail.categoryId);
        });
        
        document.addEventListener('languageChanged', () => {
            if (this.currentCategoryId && this.currentCategoryId !== 'all') {
                this.showCategoryProducts(this.currentCategoryId, true);
            }
        });
        
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.addEventListener('scroll', () => {
                this.handleScroll();
            }, { passive: true });
        }
    }
    
    handleScroll() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent || !this.section || this.section.classList.contains('hidden')) return;
        
        const sectionTop = this.section.offsetTop;
        const scrollTop = mainContent.scrollTop;
        
        if (scrollTop > sectionTop + 30) {
            this.section.classList.add('scrolled');
        } else {
            this.section.classList.remove('scrolled');
        }
    }
    
    showCategoryProducts(categoryId, silent = false) {
        if (categoryId === 'all') {
            this.hide();
            return;
        }
        
        if (!window.dataLoader || !window.dataLoader.isLoaded) return;
        
        const products = window.dataLoader.getProductsByCategory(categoryId);
        
        if (!products || products.length === 0) {
            this.showEmptyState(categoryId);
            return;
        }
        
        this.currentCategoryId = categoryId;
        
        const category = window.dataLoader.categories.find(c => c.id === categoryId);
        const lang = window.languageManager?.currentLang || 'hi';
        const catName = category ?
            (lang === 'hi' ? (category.nameHi || category.name) : (category.nameEn || category.name)) :
            categoryId;
        const catIcon = category?.icon || '📦';
        
        // 🔥 Category ka original color lo
        const catColor = category?.color || '#2E7D32';
        const lighterColor = this.lightenColor(catColor, 20);
        const darkerColor = this.darkenColor(catColor, 15);
        
        const countLabel = lang === 'hi' ? 'आइटम' : 'items';
        const verifiedText = lang === 'hi' ? 'उपलब्ध' : 'available';
        const backTitle = lang === 'hi' ? 'सभी प्रोडक्ट' : 'All Products';
        
        this.title.innerHTML = `
            <div class="cat-trust-unit">
                <span class="cat-name-box" style="background: linear-gradient(135deg, ${catColor}, ${darkerColor});">
                    <span class="box-icon">${catIcon}</span>
                    <span class="box-name">${catName}</span>
                </span>
                <span class="cat-count-badge">
                    <span class="count-num" style="color: ${catColor};">${products.length}</span>
                    <span class="count-label">${countLabel}</span>
                    <span class="verified-tick" style="background: ${catColor};" title="${verifiedText}">✓</span>
                </span>
            </div>
            <button class="cat-back-btn" title="${backTitle}" aria-label="${backTitle}">✕</button>
        `;
        
        const backBtn = this.title.querySelector('.cat-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goBackToAll();
            });
        }
        
        // ⚡ FAST product rendering
        this.grid.innerHTML = '';
        products.forEach((product, index) => {
            const card = window.productsManager.createProductCard(product);
            card.style.animationDelay = `${index * 0.02}s`;
            this.grid.appendChild(card);
        });
        
        this.section.classList.remove('hidden');
        this.updateOtherSections(true);
        
        if (!silent) {
            // ⚡ FASTER scroll
            setTimeout(() => this.scrollToSection(), 50);
        }
        this.section.classList.remove('scrolled');
    }
    
    showEmptyState(categoryId) {
        this.currentCategoryId = categoryId;
        
        const category = window.dataLoader?.categories?.find(c => c.id === categoryId);
        const lang = window.languageManager?.currentLang || 'hi';
        const catName = category ?
            (lang === 'hi' ? (category.nameHi || category.name) : (category.nameEn || category.name)) :
            categoryId;
        const catIcon = category?.icon || '📦';
        const catColor = category?.color || '#2E7D32';
        const darkerColor = this.darkenColor(catColor, 15);
        
        const countLabel = lang === 'hi' ? 'आइटम' : 'items';
        const backTitle = lang === 'hi' ? 'सभी प्रोडक्ट' : 'All Products';
        
        this.title.innerHTML = `
            <div class="cat-trust-unit">
                <span class="cat-name-box" style="background: linear-gradient(135deg, ${catColor}, ${darkerColor});">
                    <span class="box-icon">${catIcon}</span>
                    <span class="box-name">${catName}</span>
                </span>
                <span class="cat-count-badge">
                    <span class="count-num" style="color: ${catColor};">0</span>
                    <span class="count-label">${countLabel}</span>
                </span>
            </div>
            <button class="cat-back-btn" title="${backTitle}" aria-label="${backTitle}">✕</button>
        `;
        
        const backBtn = this.title.querySelector('.cat-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goBackToAll();
            });
        }
        
        this.grid.innerHTML = `
            <div class="category-products-empty">
                <span class="empty-icon">📭</span>
                <p class="empty-text">${lang === 'hi' ? 'इस कैटेगरी में अभी कोई प्रोडक्ट नहीं है' : 'No products in this category yet'}</p>
            </div>
        `;
        
        this.section.classList.remove('hidden');
        this.updateOtherSections(true);
        setTimeout(() => this.scrollToSection(), 50);
    }
    
    goBackToAll() {
        const allBtn = document.querySelector('[data-category="all"]');
        if (allBtn) allBtn.click();
        else if (window.categoriesManager) window.categoriesManager.deselectAll();
    }
    
    scrollToSection() {
        this.section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    hide() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) this.savedMainScrollPosition = mainContent.scrollTop;
        this.section.classList.add('hidden');
        this.currentCategoryId = null;
        this.grid.innerHTML = '';
        this.updateOtherSections(false);
        if (mainContent) {
            requestAnimationFrame(() => { mainContent.scrollTop = this.savedMainScrollPosition; });
        }
        this.section.classList.remove('scrolled');
    }
    
    updateOtherSections(isCategoryActive) {
        const recentlyViewed = document.getElementById('recentlyViewedSection');
        const allProducts = document.getElementById('allProductsSection');
        if (isCategoryActive) {
            if (recentlyViewed) recentlyViewed.classList.add('hidden');
            if (allProducts) allProducts.classList.add('hidden');
        } else {
            if (allProducts) allProducts.classList.remove('hidden');
            if (window.recentlyViewedManager) window.recentlyViewedManager.checkAndShow();
            if (window.mostOrdersManager) window.mostOrdersManager.checkAndShow();
        }
    }
    
    // 🎨 Color helpers
    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }
    
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.categoryProductsManager = new CategoryProductsManager();
});