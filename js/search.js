'use strict';

// ============================================
// SEARCH.JS - Complete Smart Search (ALL FEATURES)
// ============================================

class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.clearBtn = document.getElementById('clearSearchBtn');
        this.searchIcon = document.getElementById('searchIcon');
        this.voiceBtn = document.getElementById('voiceSearchBtn');
        this.searchResults = document.getElementById('searchResults');
        this.noResults = document.getElementById('noResults');
        this.suggestedProducts = document.getElementById('suggestedProducts');

        this.placeholderIndex = 0;
        this.placeholderInterval = null;
        this.debounceTimer = null;
        this.isDropdownOpen = false;
        this.searchHistory = [];
        this.maxHistory = 8;
        this.isListening = false;
        this.recognition = null;
        this.currentQuery = '';
        this.keepDropdownOpen = false; // ✅ NEW: Dropdown stick karne ke liye flag

        this.init();
    }

    init() {
        this.loadHistory();
        this.startPlaceholderRotation();
        this.initVoiceRecognition();

        // Input events
        this.searchInput.addEventListener('input', () => this.handleInput());
        this.searchInput.addEventListener('focus', () => this.handleFocus());
        this.searchInput.addEventListener('blur', () => this.handleBlur());
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
                this.searchInput.blur();
            }
        });

        // Clear button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearInput());
        }

        // Search icon with ripple
        this.searchIcon.addEventListener('click', (e) => {
            this.addRipple(e);
            this.performSearch();
        });

        // Voice search
        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => this.toggleVoiceSearch());
        }

        // ✅ Close on outside click - but dropdown content pe click ko ignore karo
        document.addEventListener('mousedown', (e) => {
            // Agar search section ke andar click hai toh close mat karo
            if (e.target.closest('.search-section')) {
                return;
            }
            // Agar search results ya no-results dropdown pe click hai toh close mat karo
            if (e.target.closest('.search-results') || e.target.closest('.no-results')) {
                return;
            }
            // Bahar click hai toh close karo
            this.closeDropdown();
            this.startPlaceholderRotation();
            this.updatePlaceholder();
        });

        // Language change
        document.addEventListener('languageChanged', () => this.updatePlaceholder());

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
                this.searchInput.blur();
                this.startPlaceholderRotation();
                this.updatePlaceholder();
            }
        });
    }

    // ============================================
    // CLEAR INPUT - Feature #1
    // ============================================
    clearInput() {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.toggleClearButton();
        this.searchInput.focus();
        this.showIdleState();
        
        // Animate clear button
        if (this.clearBtn) {
            this.clearBtn.style.transform = 'scale(1.3) rotate(90deg)';
            setTimeout(() => {
                this.clearBtn.style.transform = 'scale(0)';
                this.clearBtn.classList.add('hidden');
            }, 150);
            setTimeout(() => {
                this.clearBtn.style.transform = '';
            }, 300);
        }
    }

    toggleClearButton() {
        if (!this.clearBtn) return;
        if (this.searchInput.value.length > 0) {
            this.clearBtn.classList.remove('hidden');
            this.clearBtn.style.transform = 'scale(1)';
        } else {
            this.clearBtn.classList.add('hidden');
        }
    }

    // ============================================
    // PLACEHOLDER ROTATION
    // ============================================
    startPlaceholderRotation() {
        if (this.placeholderInterval) clearInterval(this.placeholderInterval);
        const texts = this.getPlaceholderTexts();
        this.placeholderIndex = 0;
        this.searchInput.placeholder = texts[0];

        this.placeholderInterval = setInterval(() => {
            if (document.activeElement !== this.searchInput) {
                this.placeholderIndex = (this.placeholderIndex + 1) % texts.length;
                this.searchInput.placeholder = texts[this.placeholderIndex];
            }
        }, 3000);
    }

    getPlaceholderTexts() {
        const lang = window.languageManager?.currentLang || 'hi';
        if (window.CONFIG?.searchPlaceholderTexts?.[lang]) {
            return window.CONFIG.searchPlaceholderTexts[lang];
        }
        return lang === 'hi' 
            ? ['आज क्या चाहिए? 😋', 'चावल, आटा, तेल...', 'नाम लिखो और पाओ! 🔍', 'कुछ भी ढूंढो...']
            : ['What do you need? 😋', 'Rice, flour, oil...', 'Type and find! 🔍', 'Search anything...'];
    }

    stopPlaceholderRotation() {
        if (this.placeholderInterval) {
            clearInterval(this.placeholderInterval);
            this.placeholderInterval = null;
        }
    }

    updatePlaceholder() {
        const texts = this.getPlaceholderTexts();
        this.searchInput.placeholder = texts[this.placeholderIndex % texts.length];
    }

    // ============================================
    // FOCUS / BLUR
    // ============================================
    handleFocus() {
        this.stopPlaceholderRotation();
        this.searchInput.placeholder = '';
        this.toggleClearButton();

        if (this.searchInput.value.trim() === '') {
            this.showIdleState();
        } else {
            // Agar pehle se kuch likha hai toh live search dikhao
            this.performLiveSearch(this.searchInput.value.trim());
        }
    }

    // ✅ FIXED: Blur handler - keepOpen flag check karega
    handleBlur() {
        setTimeout(() => {
            // ✅ Agar dropdown ko stick rakhna hai toh close mat karo
            if (this.keepDropdownOpen) {
                this.keepDropdownOpen = false;
                // Wapas input pe focus karo
                this.searchInput.focus();
                return;
            }

            // Check if mouse is over dropdown
            const resultsHovered = this.searchResults.matches(':hover') || 
                                   this.noResults.matches(':hover');
            
            if (resultsHovered) {
                return; // Dropdown open rakhna hai
            }

            if (!document.activeElement?.closest('.search-section')) {
                this.closeDropdown();
                this.startPlaceholderRotation();
                this.updatePlaceholder();
            }
        }, 250);
    }

    closeDropdown() {
        this.isDropdownOpen = false;
        this.keepDropdownOpen = false;
        this.searchResults.innerHTML = '';
        this.searchResults.classList.add('hidden');
        this.noResults.classList.add('hidden');
    }

    // ============================================
    // IDLE STATE - Horizontal Scroll History (Feature #2)
    // ============================================
    showIdleState() {
        this.isDropdownOpen = true;
        let html = '';

        // Location suggestion
        const locationSuggestion = this.getLocationSuggestion();
        if (locationSuggestion) {
            html += `<div class="trending-section">
                <div class="search-history-header">
                    <span class="search-history-title">📍 आपके आस-पास</span>
                </div>
                <div class="trending-tags">
                    <span class="trending-tag popular" data-tag="${this.escapeHtml(locationSuggestion)}">${this.escapeHtml(locationSuggestion)}</span>
                </div>
            </div>`;
        }

        // Search History - HORIZONTAL SCROLL VERSION
        if (this.searchHistory.length > 0) {
            const now = Date.now();
            html += '<div class="search-history">';
            html += '<div class="search-history-header">';
            html += '<span class="search-history-title">🕐 हाल की खोज</span>';
            html += '<button class="search-history-clear">साफ करें</button>';
            html += '</div>';
            
            // Horizontal scroll container
            html += '<div class="search-history-scroll">';

            this.searchHistory.forEach((item, i) => {
                const timeAgo = this.getTimeAgo(item.time || now);
                html += `<div class="search-history-item" data-index="${i}" data-query="${this.escapeHtml(item.text)}">
                    <span class="history-icon">🕐</span>
                    <span class="history-text">${this.escapeHtml(item.text)}</span>
                    <span class="history-time">${timeAgo}</span>
                    <button class="history-delete" title="हटाएं">✕</button>
                </div>`;
            });
            html += '</div></div>';
        }

        // Trending
        html += '<div class="trending-section">';
        html += '<div class="search-history-header">';
        html += '<span class="search-history-title">🔥 ट्रेंडिंग</span>';
        html += '</div>';
        html += '<div class="trending-tags">';

        const trending = this.getTrendingSearches();
        trending.forEach((tag, i) => {
            const isPopular = i < 2;
            html += `<span class="trending-tag${isPopular ? ' popular' : ''}" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`;
        });
        html += '</div></div>';

        this.searchResults.innerHTML = html;
        this.searchResults.classList.remove('hidden');
        this.noResults.classList.add('hidden');
        this.attachIdleEvents();
    }

    // ============================================
    // ✅ FIXED: IDLE EVENTS - mousedown se blur rokta hai
    // ============================================
    attachIdleEvents() {
        // Clear history
        const clearBtn = this.searchResults.querySelector('.search-history-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearHistory();
                this.showIdleState();
            });
        }

        // ✅ History item - MOUSEDOWN (blur se pehle fire hoga)
        this.searchResults.querySelectorAll('.search-history-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                if (e.target.closest('.history-delete')) return;
                
                // 🔥 Blur ko rokne ke liye flag set karo
                this.keepDropdownOpen = true;
                e.preventDefault();
                
                const query = item.getAttribute('data-query') || item.querySelector('.history-text').textContent;
                
                // Input mein value set karo
                this.searchInput.value = query;
                this.toggleClearButton();
                this.stopPlaceholderRotation();
                this.searchInput.placeholder = '';
                
                // History mein add karo
                this.addToHistory(query);
                
                // 🔥 Live search result dikhao
                this.performLiveSearch(query);
            });
        });

        // Delete button in history items
        this.searchResults.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.closest('.search-history-item').getAttribute('data-index'));
                this.removeHistoryItem(index);
                this.showIdleState();
            });
        });

        // ✅ Trending tags - MOUSEDOWN (blur se pehle fire hoga)
        this.searchResults.querySelectorAll('.trending-tag').forEach(tag => {
            tag.addEventListener('mousedown', (e) => {
                // 🔥 Blur ko rokne ke liye flag set karo
                this.keepDropdownOpen = true;
                e.preventDefault();
                e.stopPropagation();
                
                const query = tag.getAttribute('data-tag') || tag.textContent.replace('🔥', '').trim();
                
                // Input mein value set karo
                this.searchInput.value = query;
                this.toggleClearButton();
                this.stopPlaceholderRotation();
                this.searchInput.placeholder = '';
                
                // History mein add karo
                this.addToHistory(query);
                
                // 🔥 Live search result dikhao
                this.performLiveSearch(query);
            });
        });
    }

    getLocationSuggestion() {
        try {
            const saved = localStorage.getItem('quick-dukan-location');
            if (saved) {
                const loc = JSON.parse(saved);
                return loc.villageCity || '';
            }
        } catch (e) {}
        return '';
    }

    getTrendingSearches() {
        const lang = window.languageManager?.currentLang || 'hi';
        if (window.dataLoader?.mostOrderedProducts) {
            return window.dataLoader.mostOrderedProducts
                .slice(0, 6)
                .map(p => lang === 'hi' ? (p.name?.hi || '') : (p.name?.en || ''))
                .filter(Boolean);
        }
        return lang === 'hi' 
            ? ['चावल', 'आटा', 'चीनी', 'दूध', 'तेल', 'दाल']
            : ['Rice', 'Flour', 'Sugar', 'Milk', 'Oil', 'Dal'];
    }

    // ============================================
    // HANDLE INPUT
    // ============================================
    handleInput() {
        const query = this.searchInput.value.trim();
        this.currentQuery = query;
        
        // Toggle clear button
        this.toggleClearButton();

        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        if (query.length === 0) {
            this.showIdleState();
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.performLiveSearch(query);
        }, 200);
    }

    performLiveSearch(query) {
        if (!window.dataLoader?.isLoaded) return;

        let results = window.dataLoader.searchProducts(query);

        if (results.length === 0 && window.CONFIG?.features?.spellCorrection) {
            results = window.dataLoader.fuzzySearch?.(query) || [];
        }

        if (results.length > 0) {
            this.showResults(results, query);
            this.noResults.classList.add('hidden');
            this.searchResults.classList.remove('hidden');
        } else {
            this.showNoResults(query);
        }
    }

    performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        this.addToHistory(query);
        this.performLiveSearch(query);
    }

    // ============================================
    // SHOW RESULTS - With Add to Cart & Buy Buttons (Feature #3)
    // ============================================
    showResults(results, query = '') {
        let html = '';

        results.slice(0, 10).forEach((product, i) => {
            const lang = window.languageManager?.currentLang || 'hi';
            const name = product.name?.[lang] || product.name?.hi || product.name?.en || '';
            const unit = product.unit?.[lang] || product.unit?.hi || product.unit?.en || '';
            const price = product.price || 0;
            const image = product.image || 'https://via.placeholder.com/60';
            const category = product.category || '';
            const isPopular = (window.dataLoader?.mostOrderedProducts || [])
                .slice(0, 3).some(p => p.id === product.id);

            html += `
                <div class="search-result-item" data-product-id="${product.id}" data-product='${this.escapeHtml(JSON.stringify(product))}'>
                    <img src="${image}" alt="${this.escapeHtml(name)}" 
                         onerror="this.src='https://via.placeholder.com/60?text=No+Image'" loading="lazy">
                    <div class="search-result-info">
                        <div class="search-result-name">${this.highlightMatch(name, query)}</div>
                        <div class="search-result-meta">
                            ${category ? `<span class="search-result-category">${this.escapeHtml(category)}</span>` : ''}
                            ${unit ? `<span class="search-result-unit">${this.escapeHtml(unit)}</span>` : ''}
                        </div>
                        <!-- Add to Cart & Buy Buttons -->
                        <div class="search-result-actions">
                            <button class="search-result-btn cart-btn" data-action="cart">🛒 Add to Cart</button>
                            <button class="search-result-btn buy-btn" data-action="buy">⚡ Buy Now</button>
                        </div>
                    </div>
                    <div class="search-result-right">
                        <div class="search-result-price">₹${price}</div>
                        ${isPopular ? '<div class="search-result-badge">🔥 लोकप्रिय</div>' : ''}
                    </div>
                </div>`;
        });

        this.searchResults.innerHTML = html;

        // Click events for results
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            // Product name/area click -> Recently Viewed with animation
            item.addEventListener('click', (e) => {
                // Don't trigger if button clicked
                if (e.target.closest('button')) return;
                
                const productId = item.getAttribute('data-product-id');
                const productData = item.getAttribute('data-product');
                let product = null;
                
                try {
                    product = JSON.parse(productData);
                } catch(e) {
                    product = window.dataLoader?.allProducts?.find(p => p.id === productId);
                }
                
                if (product) {
                    this.selectResult(productId, product);
                }
            });

            // Add to Cart button
            const cartBtn = item.querySelector('.cart-btn');
            if (cartBtn) {
                cartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const productData = item.getAttribute('data-product');
                    let product = null;
                    try {
                        product = JSON.parse(productData);
                    } catch(e) {}
                    
                    if (product) {
                        this.addToCart(product, cartBtn);
                    }
                });
            }

            // Buy Now button
            const buyBtn = item.querySelector('.buy-btn');
            if (buyBtn) {
                buyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const productData = item.getAttribute('data-product');
                    let product = null;
                    try {
                        product = JSON.parse(productData);
                    } catch(e) {}
                    
                    if (product) {
                        this.buyNow(product);
                    }
                });
            }
        });
    }

    // Add to Cart function
    addToCart(product, buttonElement) {
        // Use existing cart manager if available
        if (window.cartManager) {
            window.cartManager.addItem(product, 1);
        } else {
            // Fallback: dispatch custom event
            document.dispatchEvent(new CustomEvent('addToCart', { 
                detail: { product: product, quantity: 1 } 
            }));
        }

        // Button animation
        if (buttonElement) {
            buttonElement.classList.add('added');
            buttonElement.textContent = '✅ Added!';
            setTimeout(() => {
                buttonElement.classList.remove('added');
                buttonElement.textContent = '🛒 Add to Cart';
            }, 1500);
        }

        this.showToast('🛒 कार्ट में जोड़ा!');
    }

    // Buy Now function
    buyNow(product) {
        // Add to cart first
        if (window.cartManager) {
            window.cartManager.addItem(product, 1);
        }
        
        // Redirect to checkout or open cart
        if (window.cartManager?.openCart) {
            window.cartManager.openCart();
        } else {
            // Fallback: navigate to cart/checkout page
            document.dispatchEvent(new CustomEvent('buyNow', { 
                detail: { product: product } 
            }));
            // Scroll to cart section if exists
            const cartSection = document.getElementById('cartSection');
            if (cartSection) {
                cartSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        this.showToast('⚡ खरीदारी शुरू!');
    }

    selectResult(productId, product) {
        const lang = window.languageManager?.currentLang || 'hi';
        const name = product.name?.[lang] || product.name?.hi || '';
        this.searchInput.value = name;
        this.toggleClearButton();
        
        // ✅ Add to recently viewed with SHINING + SPARKLE animation
        this.addToRecentlyViewedWithAnimation(product);
        
        this.closeDropdown();
        this.searchInput.blur();
        this.startPlaceholderRotation();
        this.updatePlaceholder();
    }

    // ============================================
    // ✅ FEATURE: Recently Viewed with SHINING + SPARKLE Effect
    // ============================================
    addToRecentlyViewedWithAnimation(product) {
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.addProduct(product);
            
            // Find the recently added element and add shining + sparkle animation
            setTimeout(() => {
                const recentContainer = document.getElementById('recentlyViewedContainer');
                if (recentContainer) {
                    const items = recentContainer.querySelectorAll('.recent-item, .product-card, [class*="recent"]');
                    if (items.length > 0) {
                        const latestItem = items[0];
                        
                        // Add shining class
                        latestItem.classList.add('recent-item-shine');
                        
                        // ✨ Create sparkle particles
                        this.createSparkles(latestItem);
                        
                        // Scroll to recently viewed section smoothly
                        recentContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        
                        // Remove animation class after it completes
                        setTimeout(() => {
                            latestItem.classList.remove('recent-item-shine');
                            // Remove sparkle elements
                            latestItem.querySelectorAll('.sparkle').forEach(s => s.remove());
                        }, 1600);
                    }
                }
            }, 150);
        } else {
            // Fallback: store in localStorage
            this.addToRecentlyViewedFallback(product);
        }
    }

    // ✨ Create sparkle particles around the product
    createSparkles(element) {
        const sparkleCount = 12;
        const colors = ['#FFD700', '#FFA500', '#FFF', '#FFE44D', '#FFC107'];
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('span');
            sparkle.className = 'sparkle';
            
            const size = Math.random() * 8 + 3; // 3-11px
            const angle = (i / sparkleCount) * 360;
            const distance = Math.random() * 40 + 20; // 20-60px
            const sx = Math.cos(angle * Math.PI / 180) * distance;
            const sy = Math.sin(angle * Math.PI / 180) * distance - 10;
            
            sparkle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: 50%;
                left: 50%;
                --sx: ${sx}px;
                --sy: ${sy}px;
                animation-delay: ${Math.random() * 0.3}s;
                animation-duration: ${Math.random() * 0.5 + 0.6}s;
            `;
            
            element.appendChild(sparkle);
        }
    }

    addToRecentlyViewedFallback(product) {
        try {
            let recent = JSON.parse(localStorage.getItem('quick-dukan-recent') || '[]');
            recent = recent.filter(p => p.id !== product.id);
            recent.unshift({ id: product.id, time: Date.now() });
            recent = recent.slice(0, 10);
            localStorage.setItem('quick-dukan-recent', JSON.stringify(recent));
        } catch(e) {}
    }

    highlightMatch(text, query) {
        if (!query) return this.escapeHtml(text);
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return this.escapeHtml(text).replace(regex, '<span class="highlight">$1</span>');
    }

    // ============================================
    // NO RESULTS
    // ============================================
    showNoResults(query) {
        this.searchResults.classList.add('hidden');
        this.noResults.classList.remove('hidden');

        const msgEl = this.noResults.querySelector('.no-results-msg');
        if (msgEl) {
            const lang = window.languageManager?.currentLang || 'hi';
            msgEl.textContent = lang === 'hi' 
                ? `"${query}" के लिए कुछ नहीं मिला 😕` 
                : `Nothing found for "${query}" 😕`;
        }

        const suggested = window.dataLoader?.getRandomProducts?.(5) || [];
        this.suggestedProducts.innerHTML = '';

        suggested.forEach(product => {
            const lang = window.languageManager?.currentLang || 'hi';
            const name = product.name?.[lang] || product.name?.hi || '';
            const price = product.price || 0;
            const image = product.image || 'https://via.placeholder.com/60';

            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.cssText = 'width:110px;flex-shrink:0;';
            card.innerHTML = `
                <div class="product-card-image">
                    <img src="${image}" alt="${this.escapeHtml(name)}" 
                         onerror="this.src='https://via.placeholder.com/60?text=No+Image'" loading="lazy">
                    <div class="price-overlay" style="font-size:11px;">₹${price}</div>
                </div>
                <div class="product-card-info" style="padding:6px 8px;">
                    <div class="product-name" style="font-size:10px;">${name}</div>
                </div>`;

            card.addEventListener('click', () => {
                this.addToRecentlyViewedWithAnimation(product);
                this.noResults.classList.add('hidden');
                this.searchInput.value = name;
                this.toggleClearButton();
            });

            this.suggestedProducts.appendChild(card);
        });
    }

    // ============================================
    // VOICE SEARCH
    // ============================================
    initVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            if (this.voiceBtn) this.voiceBtn.style.display = 'none';
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'hi-IN';
        this.recognition.interimResults = false;

        this.recognition.addEventListener('result', (e) => {
            const transcript = e.results[0][0].transcript;
            this.searchInput.value = transcript;
            this.toggleClearButton();
            this.performSearch();
            this.stopListening();
        });

        this.recognition.addEventListener('error', () => this.stopListening());
        this.recognition.addEventListener('end', () => this.stopListening());
    }

    toggleVoiceSearch() {
        this.isListening ? this.stopListening() : this.startListening();
    }

    startListening() {
        if (!this.recognition) return;
        try {
            this.recognition.start();
            this.isListening = true;
            if (this.voiceBtn) {
                this.voiceBtn.classList.add('listening');
                this.voiceBtn.querySelector('span').textContent = '🎙️';
            }
            this.showToast('🎤 सुन रहा हूँ... बोलो!');
        } catch (e) {}
    }

    stopListening() {
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }
        this.isListening = false;
        if (this.voiceBtn) {
            this.voiceBtn.classList.remove('listening');
            this.voiceBtn.querySelector('span').textContent = '🎤';
        }
    }

    // ============================================
    // HISTORY MANAGEMENT
    // ============================================
    loadHistory() {
        try {
            const saved = localStorage.getItem('quick-dukan-search-history');
            this.searchHistory = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.searchHistory = [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('quick-dukan-search-history', JSON.stringify(this.searchHistory));
        } catch (e) {}
    }

    addToHistory(query) {
        if (!query) return;
        this.searchHistory = this.searchHistory.filter(h => h.text.toLowerCase() !== query.toLowerCase());
        this.searchHistory.unshift({ text: query, time: Date.now() });
        if (this.searchHistory.length > this.maxHistory) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistory);
        }
        this.saveHistory();
    }

    removeHistoryItem(index) {
        this.searchHistory.splice(index, 1);
        this.saveHistory();
    }

    clearHistory() {
        this.searchHistory = [];
        this.saveHistory();
    }

    // ============================================
    // HELPERS
    // ============================================
    addRipple(event) {
        const btn = event.currentTarget;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
            width:${size}px;height:${size}px;
            left:${event.clientX - rect.left - size/2}px;
            top:${event.clientY - rect.top - size/2}px;
        `;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'अभी';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}मि`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}घं`;
        return `${Math.floor(seconds / 86400)}दि`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});