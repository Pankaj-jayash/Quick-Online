// ============================================
// PERMISSION.JS - Notification Permission Request
// Quick Dukan - Browser Notification Permission
// ============================================

class PermissionManager {
  constructor() {
    this.permission = 'default';
    this.permissionAsked = false;
    
    this.init();
  }
  
  init() {
    // Check if permission already asked
    this.checkExistingPermission();
    
    console.log('🔔 Permission Manager Ready');
  }
  
  // ============================================
  // CHECK EXISTING PERMISSION
  // ============================================
  checkExistingPermission() {
    if (!('Notification' in window)) {
      console.log('⚠️ Browser notifications supported नहीं हैं');
      this.permission = 'unsupported';
      return;
    }
    
    this.permission = Notification.permission;
    console.log('🔔 Current notification permission:', this.permission);
    
    // Local storage check
    const permissionAsked = localStorage.getItem('notificationPermissionAsked');
    this.permissionAsked = permissionAsked === 'true';
  }
  
  // ============================================
  // REQUEST PERMISSION
  // ============================================
  async requestPermission() {
    // अगर already asked है तो दोबारा नहीं पूछेंगे
    if (this.permissionAsked) {
      console.log('⚠️ Permission already asked before, skipping');
      return this.permission;
    }
    
    // अगर already granted है
    if (this.permission === 'granted') {
      console.log('✅ Permission already granted');
      this.permissionAsked = true;
      localStorage.setItem('notificationPermissionAsked', 'true');
      return this.permission;
    }
    
    // अगर denied है
    if (this.permission === 'denied') {
      console.log('❌ Permission already denied');
      this.permissionAsked = true;
      localStorage.setItem('notificationPermissionAsked', 'true');
      return this.permission;
    }
    
    // अगर unsupported है
    if (this.permission === 'unsupported') {
      console.log('⚠️ Notifications not supported');
      return this.permission;
    }
    
    try {
      console.log('🔔 Requesting notification permission...');
      
      const result = await Notification.requestPermission();
      this.permission = result;
      
      // Save that we asked
      this.permissionAsked = true;
      localStorage.setItem('notificationPermissionAsked', 'true');
      
      console.log('🔔 Permission result:', result);
      
      // अगर granted है तो welcome notification
      if (result === 'granted') {
        this.showWelcomeNotification();
      }
      
      return result;
      
    } catch (error) {
      console.error('⚠️ Permission request error:', error);
      return 'error';
    }
  }
  
  // ============================================
  // SHOW WELCOME NOTIFICATION
  // ============================================
  showWelcomeNotification() {
    try {
      const notification = new Notification('🛒 Quick Dukan', {
        body: '✅ Notifications चालू हो गए! अब आपको ऑर्डर की live जानकारी मिलेगी।',
        icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛒</text></svg>`,
        badge: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛒</text></svg>`,
        vibrate: [200, 100, 200],
        requireInteraction: false
      });
      
      // Click पर site खोलें
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // 5 second बाद auto close
      setTimeout(() => notification.close(), 5000);
      
      console.log('🔔 Welcome notification shown');
      
    } catch (error) {
      console.log('⚠️ Welcome notification error:', error);
    }
  }
  
  // ============================================
  // GET PERMISSION STATUS
  // ============================================
  getPermissionStatus() {
    return this.permission;
  }
  
  // ============================================
  // CHECK IF GRANTED
  // ============================================
  isGranted() {
    return this.permission === 'granted';
  }
  
  // ============================================
  // CHECK IF DENIED
  // ============================================
  isDenied() {
    return this.permission === 'denied';
  }
  
  // ============================================
  // RESET PERMISSION (Manual)
  // ============================================
  resetPermission() {
    this.permissionAsked = false;
    localStorage.removeItem('notificationPermissionAsked');
    console.log('🔄 Permission reset - user को दोबारा पूछा जा सकता है');
  }
}

// ============================================
// AUTO REQUEST PERMISSION (पहली बार site खोलने पर)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Permission Manager initialize करें
  window.permissionManager = new PermissionManager();
  
  // 5 second बाद permission request करें (अगर पहले नहीं पूछा)
  setTimeout(() => {
    if (window.permissionManager && !window.permissionManager.permissionAsked) {
      console.log('🔔 Auto-requesting permission (first time)');
      window.permissionManager.requestPermission();
    }
  }, 5000);
});