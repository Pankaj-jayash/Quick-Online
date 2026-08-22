// ============================================
// BACK-TO-TOP.JS - Back to Top Button Handler
// ============================================

class BackToTopManager {
    constructor() {
        this.backToTopBtn = document.getElementById('backToTopBtn');
        
        if (!this.backToTopBtn) {
            console.warn('⚠️ Back to top button not found');
            return;
        }
        
        this.init();
    }
    
    init() {
        // Delegate everything to BottomNavManager
        this.backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.bottomNavManager) {
                window.bottomNavManager.scrollToTop();
            } else {
                // Fallback
                const mainContent = document.getElementById('mainContent');
                if (mainContent) {
                    mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        
        console.log('✅ Back to Top button initialized');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.backToTopManager = new BackToTopManager();
});