// ============================================
// ORDER STATUS POPUP - Real-time Tracking
// With Browser Notifications + Rating System
// ============================================

class OrderStatusPopup {
  constructor() {
    this.popup = null;
    this.currentOrderId = null;
    this.trackingInterval = null;
    this.currentStatus = null;
    this.notificationShown = false;
    this.ratingShown = false;
    
    this.init();
  }
  
  init() {
    this.createPopup();
    this.bindEvents();
    console.log('✅ Order Status Popup Initialized');
  }
  
  createPopup() {
    if (document.getElementById('orderStatusPopup')) {
      this.popup = document.getElementById('orderStatusPopup');
      return;
    }
    
    const popupHTML = `
            <div id="orderStatusPopup" class="order-status-popup hidden">
                <div class="order-status-overlay"></div>
                <div class="order-status-content">
                    <div class="order-status-icon" id="orderStatusIcon">⏳</div>
                    <h3 class="order-status-title" id="orderStatusTitle">ऑर्डर पेंडिंग है...</h3>
                    <p class="order-status-message" id="orderStatusMessage">
                        कृपया थोड़ा इंतज़ार करें
                    </p>
                    <div class="order-status-loader" id="orderStatusLoader">
                        <div class="status-spinner"></div>
                    </div>
                    <button class="order-status-close-btn" id="orderStatusCloseBtn">
                        ठीक है
                    </button>
                </div>
            </div>
        `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    this.popup = document.getElementById('orderStatusPopup');
  }
  
  bindEvents() {
    document.getElementById('orderStatusCloseBtn')?.addEventListener('click', () => {
      this.hide();
    });
    
    document.querySelector('.order-status-overlay')?.addEventListener('click', () => {
      this.hide();
    });
  }
  
  getMsg(status) {
    const lang = window.languageManager?.currentLang || 'hi';
    
    const messages = {
      hi: {
        pending: {
          icon: '⏳',
          title: 'ऑर्डर पेंडिंग है...',
          message: 'हमारी टीम जल्द ही आपके ऑर्डर को कन्फर्म करेगी'
        },
        confirmed: {
          icon: '✅',
          title: 'ऑर्डर कन्फर्म हो गया!',
          message: 'आपका ऑर्डर कन्फर्म हो गया है! जल्द ही डिलीवर किया जाएगा'
        },
        cancelled: {
          icon: '❌',
          title: 'ऑर्डर कैंसिल हो गया',
          message: 'माफ़ कीजिए, आपका ऑर्डर कैंसिल कर दिया गया है'
        },
        delivered: {
          icon: '🚚',
          title: 'ऑर्डर डिलीवर हो गया!',
          message: 'धन्यवाद! आपका ऑर्डर सफलतापूर्वक डिलीवर हो गया'
        },
        closeBtn: 'ठीक है'
      },
      en: {
        pending: {
          icon: '⏳',
          title: 'Order is Pending...',
          message: 'Our team will confirm your order soon'
        },
        confirmed: {
          icon: '✅',
          title: 'Order Confirmed!',
          message: 'Your order has been confirmed! Will be delivered soon'
        },
        cancelled: {
          icon: '❌',
          title: 'Order Cancelled',
          message: 'Sorry, your order has been cancelled'
        },
        delivered: {
          icon: '🚚',
          title: 'Order Delivered!',
          message: 'Thank you! Your order has been delivered successfully'
        },
        closeBtn: 'OK'
      }
    };
    
    const statusMessages = messages[lang] || messages.hi;
    return statusMessages[status] || statusMessages.pending;
  }
  
  show(status) {
    if (!this.popup) this.createPopup();
    
    this.currentStatus = status;
    
    const statusData = this.getMsg(status);
    
    const icon = document.getElementById('orderStatusIcon');
    if (icon) icon.textContent = statusData.icon;
    
    const title = document.getElementById('orderStatusTitle');
    if (title) title.textContent = statusData.title;
    
    const message = document.getElementById('orderStatusMessage');
    if (message) message.textContent = statusData.message;
    
    const closeBtn = document.getElementById('orderStatusCloseBtn');
    if (closeBtn) closeBtn.textContent = statusData.closeBtn;
    
    const loader = document.getElementById('orderStatusLoader');
    if (loader) {
      if (status === 'pending') {
        loader.style.display = 'flex';
      } else {
        loader.style.display = 'none';
      }
    }
    
    this.popup.className = `order-status-popup status-${status}`;
    this.popup.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    console.log('📊 Order status popup shown:', status);
    
    // 🆕 BROWSER NOTIFICATION भेजें
    this.sendBrowserNotification(status);
    
    // 🆕 DELIVERED होने पर Rating Popup दिखाएं
    if (status === 'delivered' && !this.ratingShown) {
      this.ratingShown = true;
      setTimeout(() => {
        this.showRatingPopup();
      }, 3000);
    }
    
    // Auto-hide for final states
    if (status === 'delivered' || status === 'cancelled') {
      setTimeout(() => {
        this.hide();
      }, 5000);
    }
  }
  
  // ============================================
  // 🆕 BROWSER NOTIFICATION
  // ============================================
  sendBrowserNotification(status) {
    // अगर notification system available है
    if (window.notificationSystem && status !== 'pending') {
      console.log('🔔 Sending browser notification for:', status);
      window.notificationSystem.notifyOrderStatus(status, this.currentOrderId);
    }
  }
  
  // ============================================
  // 🆕 RATING POPUP
  // ============================================
  showRatingPopup() {
    // अगर rating system available है
    if (window.orderRating) {
      console.log('⭐ Showing rating popup');
      window.orderRating.showRatingPopup(this.currentOrderId);
    } else {
      console.log('⚠️ Rating system not loaded');
    }
  }
  
  hide() {
    if (!this.popup) return;
    
    this.popup.classList.add('hidden');
    document.body.style.overflow = '';
  }
  
  startTracking(orderId) {
    this.currentOrderId = orderId;
    this.notificationShown = false;
    this.ratingShown = false;
    
    console.log('🔄 Order tracking started for:', orderId);
    
    // Show pending status immediately
    this.show('pending');
    
    // पहले तुरंत check करें
    this.checkStatus();
    
    // हर 5 second में check करें
    this.trackingInterval = setInterval(() => {
      this.checkStatus();
    }, 5000);
  }
  
  async checkStatus() {
    if (!this.currentOrderId) return;
    
    try {
      const status = await window.googleSheetsOrders.checkOrderStatus(this.currentOrderId);
      
      console.log('📊 Status check result:', status);
      
      if (status && status.success) {
        const statusLower = status.status.toLowerCase();
        
        let mappedStatus = 'pending';
        if (statusLower === 'confirmed') mappedStatus = 'confirmed';
        else if (statusLower === 'cancelled') mappedStatus = 'cancelled';
        else if (statusLower === 'delivered') mappedStatus = 'delivered';
        
        console.log('📊 Mapped status:', mappedStatus, 'Current:', this.currentStatus);
        
        if (mappedStatus !== this.currentStatus) {
          this.show(mappedStatus);
          
          if (mappedStatus === 'delivered' || mappedStatus === 'cancelled') {
            this.stopTracking();
          }
        }
      } else {
        console.log('⚠️ Order not found yet, keeping pending');
      }
    } catch (error) {
      console.log('⚠️ Status check error:', error.message);
    }
  }
  
  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('🛑 Order tracking stopped');
    }
  }
  
  destroy() {
    this.stopTracking();
    if (this.popup) {
      this.popup.remove();
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.orderStatusPopup = new OrderStatusPopup();
});