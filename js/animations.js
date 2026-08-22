
// ============================================
// ANIMATIONS.JS - Global Animation Triggers
// ============================================

class AnimationsManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add ripple effect to all buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (btn && !btn.classList.contains('ripple-effect')) {
                this.addRipple(btn, e);
            }
        });
        
        // Add fade-in to elements as they come into view
        this.setupIntersectionObserver();
        
        // Add hover animations
        this.setupHoverEffects();
    }
    
    addRipple(button, event) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            border-radius: 50%;
            background: rgba(255,255,255,0.4);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
        });
        
        // Observe product cards
        const observeCards = () => {
            document.querySelectorAll('.product-card:not(.fade-in)').forEach(card => {
                observer.observe(card);
            });
        };
        
        // Observe new cards when data loads
        document.addEventListener('dataLoaded', observeCards);
        
        // Mutation observer for dynamically added cards
        const mutationObserver = new MutationObserver(observeCards);
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
    
    setupHoverEffects() {
        document.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.product-card');
            if (card) {
                card.style.transition = 'all 0.3s ease';
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.animationsManager = new AnimationsManager();
});
