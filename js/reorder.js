// ============================================
// REORDER SYSTEM - पुराना Order दोबारा करें
// ============================================

class ReorderSystem {
  constructor() {
    this.init();
  }
  
  init() {
    console.log('🔄 Reorder System Ready');
  }
  
  // Reorder करें
  reorder(orderItems) {
    if (!window.cartManager) {
      console.log('⚠️ Cart Manager not found');
      return;
    }
    
    console.log('🔄 Reordering items:', orderItems);
    
    // Cart में items add करें
    orderItems.forEach(item => {
      window.cartManager.addItem(item);
    });
    
    // Cart open करें
    window.cartManager.openCart();
    
    // Toast show करें
    if (window.checkoutManager) {
      window.checkoutManager.showToast('✅ पुराना ऑर्डर कार्ट में add हो गया!');
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.reorderSystem = new ReorderSystem();
});