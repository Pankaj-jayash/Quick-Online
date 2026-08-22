'use strict';

// ============================================
// THEME.JS - Day/Night Mode Toggle (Fixed)
// ============================================

class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggle?.querySelector('.theme-icon');
        this.body = document.body;
        this.isDarkMode = false;
        this.storageKey = 'quick-dukan-theme';
        this.transitionClass = 'theme-transitioning';
        
        if (!this.themeToggle || !this.themeIcon) {
            console.warn('ThemeManager: Required elements not found');
            return;
        }
        
        this.init();
    }
    
    init() {
        // Load saved preference with error handling
        this.loadSavedTheme();
        
        // Toggle on click
        this.themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTheme();
        });
        
        // Listen for system preference changes
        this.setupSystemThemeListener();
    }
    
    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem(this.storageKey);
            
            if (savedTheme === 'dark') {
                this.enableDarkMode(false); // Don't animate on load
            } else if (savedTheme === 'light') {
                this.disableDarkMode(false);
            } else if (savedTheme === null) {
                // First visit: check system preference
                this.applySystemPreference(false);
            }
        } catch (e) {
            // localStorage not available (incognito, Safari ITP, etc.)
            console.warn('ThemeManager: localStorage not available, using system preference');
            this.applySystemPreference(false);
        }
    }
    
    setupSystemThemeListener() {
        // Listen for OS theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = (e) => {
                // Only apply if user hasn't manually set a preference
                try {
                    const saved = localStorage.getItem(this.storageKey);
                    if (saved === null) {
                        if (e.matches) {
                            this.enableDarkMode(true);
                        } else {
                            this.disableDarkMode(true);
                        }
                    }
                } catch (err) {
                    if (e.matches) {
                        this.enableDarkMode(true);
                    } else {
                        this.disableDarkMode(true);
                    }
                }
            };
            
            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
            }
            // Older browsers (Safari < 13)
            else if (mediaQuery.addListener) {
                mediaQuery.addListener(handleChange);
            }
        }
    }
    
    applySystemPreference(animate = true) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.enableDarkMode(animate);
        } else {
            this.disableDarkMode(animate);
        }
    }
    
    toggleTheme() {
        if (this.isDarkMode) {
            this.disableDarkMode(true);
        } else {
            this.enableDarkMode(true);
        }
        this.animateToggle();
    }
    
    enableDarkMode(animate = true) {
        // Add transition class for smooth animation
        if (animate) {
            this.body.classList.add(this.transitionClass);
        }
        
        this.body.classList.add('dark-mode');
        this.themeIcon.textContent = '☀️';
        this.isDarkMode = true;
        
        // Update ARIA label
        this.themeToggle.setAttribute('aria-label', 'लाइट मोड में बदलें');
        
        // Save preference
        this.savePreference('dark');
        
        // Remove transition class after animation
        if (animate) {
            setTimeout(() => {
                this.body.classList.remove(this.transitionClass);
            }, 300);
        }
    }
    
    disableDarkMode(animate = true) {
        if (animate) {
            this.body.classList.add(this.transitionClass);
        }
        
        this.body.classList.remove('dark-mode');
        this.themeIcon.textContent = '🌙';
        this.isDarkMode = false;
        
        // Update ARIA label
        this.themeToggle.setAttribute('aria-label', 'डार्क मोड में बदलें');
        
        // Save preference
        this.savePreference('light');
        
        if (animate) {
            setTimeout(() => {
                this.body.classList.remove(this.transitionClass);
            }, 300);
        }
    }
    
    savePreference(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (e) {
            // Silently fail - theme still works for current session
        }
    }
    
    animateToggle() {
        // Fixed: Now spin animation exists in CSS
        this.themeIcon.style.animation = 'none';
        
        // Force reflow
        void this.themeIcon.offsetWidth;
        
        this.themeIcon.style.animation = 'spin 0.5s ease';
        
        setTimeout(() => {
            this.themeIcon.style.animation = '';
        }, 500);
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.themeManager = new ThemeManager();
        console.log('ThemeManager initialized successfully');
    } catch (e) {
        console.error('ThemeManager initialization failed:', e);
    }
});

// ============================================
// SAFE LOCAL STORAGE HELPER (Global Utility)
// ============================================
window.safeLocalStorage = {
    getItem(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },
    
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    isAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, '1');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }
}; 