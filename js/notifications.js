// ============================================
// PUSH NOTIFICATIONS - Browser Notifications
// ============================================

class NotificationSystem {
  constructor() {
    this.permission = 'default';
    this.init();
  }
  
  init() {
    console.log('🔔 Notification System Ready');
  }
  
  // Permission request करें
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('⚠️ Browser notifications supported नहीं हैं');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      console.log('🔔 Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.log('⚠️ Permission error:', error);
      return false;
    }
  }
  
  // Notification show करें
  show(title, message, icon = '🛒') {
    if (this.permission !== 'granted') {
      console.log('⚠️ Notification permission not granted');
      return;
    }
    
    try {
      const notification = new Notification(title, {
        body: message,
        icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>`,
        badge: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>`,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false
      });
      
      // Click पर site खोलें
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // 5 second बाद auto close
      setTimeout(() => notification.close(), 5000);
      
      console.log('🔔 Notification shown:', title);
      
    } catch (error) {
      console.log('⚠️ Notification error:', error);
    }
  }
  
  // Order status notification
  notifyOrderStatus(status, orderId) {
    const messages = {
      confirmed: {
        title: '✅ ऑर्डर कन्फर्म हो गया!',
        message: `आपका ऑर्डर ${orderId} कन्फर्म हो गया है। जल्द ही डिलीवर किया जाएगा।`,
        icon: '✅'
      },
      cancelled: {
        title: '❌ ऑर्डर कैंसिल हो गया',
        message: `माफ़ कीजिए, आपका ऑर्डर ${orderId} कैंसिल कर दिया गया है।`,
        icon: '❌'
      },
      delivered: {
        title: '🚚 ऑर्डर डिलीवर हो गया!',
        message: `धन्यवाद! आपका ऑर्डर ${orderId} सफलतापूर्वक डिलीवर हो गया।`,
        icon: '🚚'
      }
    };
    
    const notification = messages[status];
    if (notification) {
      this.show(notification.title, notification.message, notification.icon);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.notificationSystem = new NotificationSystem();
});