// ============================================
// SECURITY.JS - Complete Security Module
// ============================================

(function() {
    'use strict';
    
    console.log('🛡️ Security Module Initializing...');
    
    // ============================================
    // 1. IMAGE PROTECTION
    // ============================================
    function protectImages() {
        // Disable right-click on images
        document.addEventListener('contextmenu', function(e) {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                showSecureToast('🛡️ Images download nahi kar sakte!');
                return false;
            }
        });
        
        // Disable drag
        document.addEventListener('dragstart', function(e) {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                return false;
            }
        });
        
        // Disable long press (mobile)
        document.addEventListener('touchstart', function(e) {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                return false;
            }
        }, { passive: false });
        
        // Add CSS protection to all images
        document.querySelectorAll('img').forEach(img => {
            img.setAttribute('draggable', 'false');
            img.style.webkitUserDrag = 'none';
            img.style.userDrag = 'none';
            img.style.webkitTouchCallout = 'none';
        });
        
        console.log('✅ Image protection active');
    }
    
    // ============================================
    // 2. INPUT SANITIZATION (XSS Protection)
    // ============================================
    function sanitizeInput(input) {
        if (!input) return '';
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
    
    function protectInputs() {
        document.querySelectorAll('input, textarea, [contenteditable]').forEach(input => {
            // On blur - sanitize
            input.addEventListener('blur', function() {
                if (this.value && this.value !== sanitizeInput(this.value)) {
                    this.value = sanitizeInput(this.value);
                }
            });
            
            // Prevent script injection
            input.addEventListener('input', function() {
                const dangerous = ['<script', 'onerror', 'onload', 'javascript:', 'onclick', 'onmouse'];
                const value = this.value.toLowerCase();
                for (const word of dangerous) {
                    if (value.includes(word)) {
                        this.value = sanitizeInput(this.value);
                        showSecureToast('⚠️ Invalid characters removed!');
                        break;
                    }
                }
            });
        });
        
        console.log('✅ Input sanitization active');
    }
    
    // ============================================
    // 3. CSRF PROTECTION
    // ============================================
    function setupCSRF() {
        const token = generateCSRFToken();
        const csrfField = document.getElementById('csrfToken');
        if (csrfField) {
            csrfField.value = token;
        }
        // Store in session
        try {
            sessionStorage.setItem('csrfToken', token);
        } catch(e) {
            // Session storage not available
        }
        
        console.log('✅ CSRF protection active');
    }
    
    function generateCSRFToken() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15) +
               Date.now().toString(36);
    }
    
    function verifyCSRFToken() {
        const csrfField = document.getElementById('csrfToken');
        if (!csrfField) return true;
        const storedToken = sessionStorage.getItem('csrfToken');
        return csrfField.value === storedToken;
    }
    
    // ============================================
    // 4. RATE LIMITING (Spam Protection)
    // ============================================
    class RateLimiter {
        constructor(limit = 10, windowMs = 60000) {
            this.limit = limit;
            this.windowMs = windowMs;
            this.requests = {};
            this.storageKey = 'rateLimiter';
            this.loadFromStorage();
        }
        
        loadFromStorage() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    this.requests = JSON.parse(saved);
                }
            } catch(e) {}
        }
        
        saveToStorage() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.requests));
            } catch(e) {}
        }
        
        check(key) {
            const now = Date.now();
            if (!this.requests[key]) {
                this.requests[key] = [];
            }
            
            // Clean old requests
            this.requests[key] = this.requests[key].filter(
                time => now - time < this.windowMs
            );
            
            if (this.requests[key].length >= this.limit) {
                return false;
            }
            
            this.requests[key].push(now);
            this.saveToStorage();
            return true;
        }
        
        reset(key) {
            delete this.requests[key];
            this.saveToStorage();
        }
    }
    
    // ============================================
    // 5. CONSOLE PROTECTION
    // ============================================
    function protectConsole() {
        // Check if production
        const isProduction = window.location.hostname !== 'localhost' && 
                            window.location.hostname !== '127.0.0.1' &&
                            !window.location.hostname.includes('.local');
        
        if (isProduction) {
            // Disable console in production
            const methods = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
            methods.forEach(method => {
                const original = console[method];
                console[method] = function() {
                    // Silent in production
                };
                // Keep error for critical issues
                if (method === 'error') {
                    console[method] = function() {
                        // Only show critical errors
                        original.apply(console, arguments);
                    };
                }
            });
            
            // Disable debugger
            setInterval(function() {
                // debugger;
            }, 10000);
            
            console.log('✅ Console protection active');
        }
    }
    
    // ============================================
    // 6. URL PARAMETER PROTECTION (XSS)
    // ============================================
    function protectURLParams() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            let hasMalicious = false;
            
            urlParams.forEach((value, key) => {
                const sanitized = sanitizeInput(value);
                if (value !== sanitized) {
                    urlParams.set(key, sanitized);
                    hasMalicious = true;
                }
            });
            
            if (hasMalicious) {
                const newUrl = window.location.pathname + '?' + urlParams.toString();
                window.history.replaceState({}, '', newUrl);
                showSecureToast('🔒 Suspicious URL parameters removed');
            }
        } catch(e) {
            // Ignore
        }
        
        console.log('✅ URL parameter protection active');
    }
    
    // ============================================
    // 7. SESSION PROTECTION
    // ============================================
    function protectSession() {
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        let lastActivity = Date.now();
        
        // Reset timer on activity
        const resetTimer = () => {
            lastActivity = Date.now();
            try {
                sessionStorage.setItem('lastActivity', lastActivity.toString());
            } catch(e) {}
        };
        
        document.addEventListener('click', resetTimer);
        document.addEventListener('scroll', resetTimer);
        document.addEventListener('keypress', resetTimer);
        document.addEventListener('touchstart', resetTimer);
        
        // Check session on load
        try {
            const saved = sessionStorage.getItem('lastActivity');
            if (saved) {
                const diff = Date.now() - parseInt(saved);
                if (diff > SESSION_TIMEOUT) {
                    // Session expired - clear sensitive data
                    localStorage.removeItem('cart');
                    localStorage.removeItem('savedItems');
                    sessionStorage.clear();
                    showSecureToast('⏳ Session expired! Please refresh.');
                }
            }
        } catch(e) {}
        
        console.log('✅ Session protection active');
    }
    
    // ============================================
    // 8. FORM PROTECTION
    // ============================================
    function protectForms() {
        // Prevent double submission
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                if (this.dataset.submitted === 'true') {
                    e.preventDefault();
                    showSecureToast('⏳ Please wait... Form already submitted');
                    return false;
                }
                this.dataset.submitted = 'true';
                setTimeout(() => {
                    this.dataset.submitted = 'false';
                }, 5000);
            });
        });
        
        console.log('✅ Form protection active');
    }
    
    // ============================================
    // 9. CLICKJACKING PROTECTION
    // ============================================
    function protectClickjacking() {
        if (window.top !== window.self) {
            // Page is in an iframe - redirect to top
            window.top.location = window.self.location;
        }
        console.log('✅ Clickjacking protection active');
    }
    
    // ============================================
    // 10. TOAST NOTIFICATION (Helper)
    // ============================================
    function showSecureToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.remove('hidden');
            clearTimeout(toast._timeout);
            toast._timeout = setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        } else {
            // Fallback - alert if no toast
            console.warn('🔔', message);
        }
    }
    
    // ============================================
    // 11. AUTOMATIC SECURITY SCAN
    // ============================================
    function scanForSecurityIssues() {
        // Check for mixed content (HTTP on HTTPS)
        if (window.location.protocol === 'https:') {
            document.querySelectorAll('img, script, link[rel="stylesheet"]').forEach(el => {
                if (el.src && el.src.startsWith('http://')) {
                    console.warn('⚠️ Mixed content found:', el.src);
                    // Auto fix - upgrade to HTTPS
                    el.src = el.src.replace('http://', 'https://');
                }
                if (el.href && el.href.startsWith('http://')) {
                    console.warn('⚠️ Mixed content found:', el.href);
                    el.href = el.href.replace('http://', 'https://');
                }
            });
        }
        
        // Check for insecure forms
        document.querySelectorAll('form').forEach(form => {
            if (form.action && form.action.startsWith('http://')) {
                console.warn('⚠️ Insecure form action:', form.action);
                form.action = form.action.replace('http://', 'https://');
            }
        });
        
        console.log('✅ Security scan complete');
    }
    
    // ============================================
    // 12. INITIALIZE ALL SECURITY FEATURES
    // ============================================
    function initSecurity() {
        console.log('🛡️ Starting security initialization...');
        
        // Run all protections
        protectImages();
        protectInputs();
        setupCSRF();
        protectConsole();
        protectURLParams();
        protectSession();
        protectForms();
        protectClickjacking();
        
        // Scan for issues
        setTimeout(scanForSecurityIssues, 1000);
        
        // Export rate limiter for use in other modules
        window._rateLimiter = new RateLimiter(5, 60000); // 5 orders per minute
        
        // Make verifyCSRF available globally
        window.verifyCSRFToken = verifyCSRFToken;
        window.sanitizeInput = sanitizeInput;
        window.showSecureToast = showSecureToast;
        
        console.log('✅ All security features active!');
    }
    
    // ============================================
    // 13. OBSERVER FOR DYNAMIC CONTENT
    // ============================================
    function setupDynamicProtection() {
        // Watch for new images added dynamically
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            // Check for new images
                            if (node.tagName === 'IMG') {
                                node.setAttribute('draggable', 'false');
                                node.style.webkitUserDrag = 'none';
                                node.style.userDrag = 'none';
                            }
                            // Check for new inputs
                            if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
                                node.addEventListener('blur', function() {
                                    if (this.value && this.value !== sanitizeInput(this.value)) {
                                        this.value = sanitizeInput(this.value);
                                    }
                                });
                            }
                            // Check for new forms
                            if (node.tagName === 'FORM') {
                                node.addEventListener('submit', function(e) {
                                    if (this.dataset.submitted === 'true') {
                                        e.preventDefault();
                                        return false;
                                    }
                                    this.dataset.submitted = 'true';
                                    setTimeout(() => {
                                        this.dataset.submitted = 'false';
                                    }, 5000);
                                });
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Dynamic content protection active');
    }
    
    // ============================================
    // 14. START SECURITY
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initSecurity();
            setupDynamicProtection();
        });
    } else {
        initSecurity();
        setupDynamicProtection();
    }
    
    // ============================================
    // 15. EXPOSE SECURITY API
    // ============================================
    window.security = {
        sanitizeInput: sanitizeInput,
        generateCSRFToken: generateCSRFToken,
        verifyCSRFToken: verifyCSRFToken,
        RateLimiter: RateLimiter,
        showToast: showSecureToast,
        isSecure: function() {
            return {
                csrf: !!document.getElementById('csrfToken'),
                console: window.location.hostname !== 'localhost',
                session: !!sessionStorage.getItem('csrfToken')
            };
        }
    };
    
    console.log('🔐 Security module ready!');
    
})();