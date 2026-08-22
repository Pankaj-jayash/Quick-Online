// ============================================
// LANGUAGE.JS - English/Hindi Toggle (FIXED)
// ============================================

class LanguageManager {
    constructor() {
        this.langToggle = document.getElementById('langToggle');
        this.currentLang = CONFIG.defaultLanguage || 'hi';
        
        if (!this.langToggle) {
            console.error('❌ Language toggle button #langToggle not found!');
            return;
        }
        
        this.langText = this.langToggle.querySelector('.lang-text');
        
        this.init();
        console.log('✅ Language Manager Initialized');
    }
    
    init() {
        // Load saved preference
        const savedLang = localStorage.getItem('quick-dukan-lang');
        if (savedLang && (savedLang === 'hi' || savedLang === 'en')) {
            this.currentLang = savedLang;
        }
        
        // Initial UI update
        this.updateToggleButton();
        this.applyLanguage();
        
        // CLICK EVENT - Remove old and add fresh
        const newToggle = this.langToggle.cloneNode(true);
        this.langToggle.parentNode.replaceChild(newToggle, this.langToggle);
        this.langToggle = newToggle;
        this.langText = this.langToggle.querySelector('.lang-text');
        
        this.langToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🌐 Language toggle clicked!');
            this.toggleLanguage();
        });
    }
    
    toggleLanguage() {
        // Switch language
        this.currentLang = this.currentLang === 'hi' ? 'en' : 'hi';
        
        // Save
        localStorage.setItem('quick-dukan-lang', this.currentLang);
        
        // Update button text
        this.updateToggleButton();
        
        // Apply to whole site
        this.applyLanguage();
        
        // Animate
        this.animateToggle();
        
        console.log('🌐 Language changed to:', this.currentLang);
    }
    
    updateToggleButton() {
        if (this.langText) {
            this.langText.textContent = this.currentLang === 'hi' ? 'Eng' : 'हिं';
        }
    }
    
    applyLanguage() {
        console.log('🌐 Applying language:', this.currentLang);
        
        // 1. Update all elements with data-lang-key attribute
        const langElements = document.querySelectorAll('[data-lang-key]');
        console.log(`📝 Found ${langElements.length} elements with data-lang-key`);
        
        langElements.forEach(el => {
            const key = el.getAttribute('data-lang-key');
            
            // Check in sectionTitles
            if (CONFIG.sectionTitles && CONFIG.sectionTitles[this.currentLang] && CONFIG.sectionTitles[this.currentLang][key]) {
                el.textContent = CONFIG.sectionTitles[this.currentLang][key];
            }
            // Check in noProductMessages
            else if (key === 'noProductMsg' && CONFIG.noProductMessages && CONFIG.noProductMessages[this.currentLang]) {
                el.textContent = CONFIG.noProductMessages[this.currentLang];
            }
        });
        
        // 2. Update placeholder attributes
        const placeholders = document.querySelectorAll('[data-lang-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-lang-placeholder');
            if (CONFIG.sectionTitles && CONFIG.sectionTitles[this.currentLang] && CONFIG.sectionTitles[this.currentLang][key]) {
                el.setAttribute('placeholder', CONFIG.sectionTitles[this.currentLang][key]);
            }
        });
        
        // 3. Update search placeholder with rotating texts
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const texts = CONFIG.searchPlaceholderTexts[this.currentLang];
            if (texts && texts.length > 0) {
                searchInput.setAttribute('placeholder', texts[0]);
            }
        }
        
        // 4. Update categories
        if (window.categoriesManager && typeof window.categoriesManager.updateLanguage === 'function') {
            window.categoriesManager.updateLanguage(this.currentLang);
        }
        
        // 5. Update product cards if rendered
        this.updateProductCards();
        
        // 6. Update cart if open
        if (window.cartManager && !document.getElementById('cartModal').classList.contains('hidden')) {
            window.cartManager.renderCart();
        }
        
        // 7. Update orders if open
        if (window.ordersManager && !document.getElementById('ordersModal').classList.contains('hidden')) {
            window.ordersManager.render();
        }
        
        // 8. Dispatch event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: this.currentLang } 
        }));
    }
    
    updateProductCards() {
        // Update product names in cards
        document.querySelectorAll('[data-product-name]').forEach(el => {
            try {
                const names = JSON.parse(el.getAttribute('data-product-name'));
                if (names && names[this.currentLang]) {
                    el.textContent = names[this.currentLang];
                }
            } catch (e) {
                // Not JSON, skip
            }
        });
        
        // Update product units
        document.querySelectorAll('[data-product-unit]').forEach(el => {
            try {
                const units = JSON.parse(el.getAttribute('data-product-unit'));
                if (units && units[this.currentLang]) {
                    el.textContent = units[this.currentLang];
                }
            } catch (e) {
                // Not JSON, skip
            }
        });
        
        // Update cart/add buttons in product cards
        const lang = this.currentLang;
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.innerHTML = `<i class="fas fa-plus"></i> ${lang === 'hi' ? 'कार्ट' : 'Cart'}`;
        });
        document.querySelectorAll('.btn-buy-now').forEach(btn => {
            btn.innerHTML = `<i class="fab fa-whatsapp"></i> ${lang === 'hi' ? 'खरीदें' : 'Buy'}`;
        });
    }
    
    animateToggle() {
        if (this.langToggle) {
            this.langToggle.classList.add('flip-animation');
            setTimeout(() => {
                this.langToggle.classList.remove('flip-animation');
            }, 400);
        }
    }
    
    getText(key) {
        if (CONFIG.sectionTitles && CONFIG.sectionTitles[this.currentLang] && CONFIG.sectionTitles[this.currentLang][key]) {
            return CONFIG.sectionTitles[this.currentLang][key];
        }
        return key;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.languageManager = new LanguageManager();
    }, 100);
});