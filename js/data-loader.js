// ============================================
// DATA-LOADER.JS - Load JSON Data Files v2
// ============================================

class DataLoader {
    constructor() {
        this.masterData = null;
        this.allProducts = [];
        this.categories = [];
        this.productsByCategory = {};
        this.isLoaded = false;
        this.dataVersion = null;
    }
    
   async loadAllData(forceReload = false) {
    // 🔥 CHECK INTERNET
    if (!navigator.onLine) {
        console.warn('⚠️ Offline - using cached data');
        document.dispatchEvent(new CustomEvent('dataLoaded', {
            detail: { allProducts: this.allProducts, categories: this.categories, offline: true }
        }));
        return true; // cached data se kaam chalao
    }
        if (forceReload) {
            console.log('🔄 Force reload - Clearing old data');
            this.allProducts = [];
            this.productsByCategory = {};
            this.isLoaded = false;
        }
        
        // Agar already loaded hai aur force nahi hai to skip
        if (this.isLoaded && !forceReload) {
            console.log('ℹ️ Data already loaded');
            return true;
        }
        
        try {
            // Step 1: Load master index.json (force network)
            console.log('📥 Loading index.json...');
            const masterResponse = await fetch(`data/index.json?v=${Date.now()}`, {
                cache: 'no-store', // ⬅️ Cache bypass
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!masterResponse.ok) throw new Error('Failed to load index.json');
            this.masterData = await masterResponse.json();
            this.categories = this.masterData.categories || [];
            this.dataVersion = this.masterData.version || null;
            
            console.log(`📋 Found ${this.categories.length} categories`);
            
            // Step 2: Load all category files (parallel + force network)
            const loadPromises = this.categories.map(cat =>
                this.loadCategoryData(cat, forceReload)
            );
            
            await Promise.allSettled(loadPromises); // AllSettled so one fail doesn't stop all
            
            // Check if any category loaded
            const loadedCount = Object.keys(this.productsByCategory).length;
            if (loadedCount === 0) {
                throw new Error('No categories loaded');
            }
            
            this.isLoaded = true;
            
            console.log('✅ All data loaded successfully');
            console.log(`📦 Total Products: ${this.allProducts.length}`);
            console.log(`📂 Categories Loaded: ${loadedCount}/${this.categories.length}`);
            if (this.dataVersion) {
                console.log(`📌 Data Version: ${this.dataVersion}`);
            }
            
            // Dispatch event with force flag
            document.dispatchEvent(new CustomEvent('dataLoaded', {
                detail: {
                    allProducts: this.allProducts,
                    categories: this.categories,
                    forceReload: forceReload,
                    version: this.dataVersion
                }
            }));
            
            return true;
        } catch (error) {
            console.error('❌ Error loading data:', error);
            
            // Agar new data fail ho, to cached data use karo
            if (this.allProducts.length > 0) {
                console.warn('⚠️ Using previously loaded data');
                return true;
            }
            
            return false;
        }
    }
    
    async loadCategoryData(category, forceReload = false) {
        try {
            const cacheBuster = forceReload ? `?v=${Date.now()}` : `?v=${this.dataVersion || Date.now()}`;
            const url = `data/${category.file}${cacheBuster}`;
            
            console.log(`📥 Loading: ${category.name}${forceReload ? ' (force)' : ''}`);
            
            const response = await fetch(url, {
                cache: forceReload ? 'no-store' : 'default', // ⬅️ Force bypass ya normal
                headers: {
                    'Cache-Control': forceReload ? 'no-cache' : 'max-age=3600',
                    'Pragma': forceReload ? 'no-cache' : ''
                }
            });
            
            if (!response.ok) throw new Error(`Failed to load ${category.file} (${response.status})`);
            
            const data = await response.json();
            const products = data.products || data;
            
            // Add category info to each product
            const processedProducts = products.map(product => ({
                ...product,
                categoryId: category.id,
                categoryName: category.name,
                categoryNameHi: category.nameHi || category.name,
            }));
            
            // Replace old category data (don't append)
            this.productsByCategory[category.id] = processedProducts;
            
            // Update allProducts array
            this.rebuildAllProducts();
            
            console.log(`✅ Loaded ${category.name}: ${processedProducts.length} products`);
        } catch (error) {
            console.error(`❌ Failed ${category.name}:`, error.message);
            
            // Keep old data if available
            if (!this.productsByCategory[category.id]) {
                this.productsByCategory[category.id] = [];
            }
        }
    }
    
    rebuildAllProducts() {
        // Rebuild allProducts from productsByCategory
        this.allProducts = [];
        Object.values(this.productsByCategory).forEach(products => {
            this.allProducts = [...this.allProducts, ...products];
        });
        
        // Remove duplicates (by ID)
        const seen = new Set();
        this.allProducts = this.allProducts.filter(product => {
            if (seen.has(product.id)) {
                return false;
            }
            seen.add(product.id);
            return true;
        });
    }
    
    getProductsByCategory(categoryId) {
        if (categoryId === 'all') return this.allProducts;
        return this.productsByCategory[categoryId] || [];
    }
    
    getProductById(productId) {
        return this.allProducts.find(p => p.id === productId) || null;
    }
    
    searchProducts(query) {
        if (!query || query.trim().length === 0) return [];
        
        const q = query.toLowerCase().trim();
        
        return this.allProducts.filter(product => {
            const nameHi = (product.name && product.name.hi) ? product.name.hi.toLowerCase() : '';
            const nameEn = (product.name && product.name.en) ? product.name.en.toLowerCase() : '';
            return nameHi.includes(q) || nameEn.includes(q);
        });
    }
    
    fuzzySearch(query) {
        const q = query.toLowerCase().trim();
        const results = this.searchProducts(query);
        
        if (results.length > 0) return results;
        
        return this.allProducts.filter(product => {
            const nameHi = (product.name && product.name.hi) ? product.name.hi.toLowerCase() : '';
            const nameEn = (product.name && product.name.en) ? product.name.en.toLowerCase() : '';
            
            const words = [...nameHi.split(' '), ...nameEn.split(' ')];
            return words.some(word =>
                word.includes(q) || this.levenshteinDistance(word, q) <= 2
            );
        });
    }
    
    levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
    
    getRandomProducts(count = 4, excludeIds = []) {
        const available = this.allProducts.filter(p => !excludeIds.includes(p.id));
        const shuffled = available.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    getMostOrderedProducts() {
        return this.allProducts.filter(p => p.mostOrdered === true);
    }
    
    // Get data freshness
    getDataInfo() {
        return {
            version: this.dataVersion,
            totalProducts: this.allProducts.length,
            totalCategories: this.categories.length,
            isLoaded: this.isLoaded,
            lastUpdated: this.isLoaded ? new Date().toISOString() : null
        };
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing DataLoader...');
    window.dataLoader = new DataLoader();
    
    // Initial load (normal, not force)
    const success = await window.dataLoader.loadAllData();
    
    if (success) {
        console.log('✅ DataLoader initialized successfully');
    } else {
        console.error('❌ DataLoader initialization failed');
    }
});

// Debug helper
window.getDataInfo = () => {
    if (window.dataLoader) {
        console.table(window.dataLoader.getDataInfo());
    }
};