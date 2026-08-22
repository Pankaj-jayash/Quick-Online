// ============================================
// PREMIUM PULL-TO-REFRESH with Haptics
// ============================================

class PullToRefresh {
  constructor() {
    this.container = document.getElementById('mainContent');
    this.indicator = null;
    this.hint = null;
    this.toast = null;
    this.isPulling = false;
    this.isRefreshing = false;
    this.startY = 0;
    this.currentY = 0;
    this.pullDistance = 0;
    this.threshold = 80;
    this.maxPull = 140;
    this.hintShown = false;
    this.hintTimer = null;
    
    if (!this.container) return;
    this.init();
  }
  
  init() {
    this.createIndicator();
    this.createHint();
    this.createToast();
    this.attachEvents();
    
    // Show hint on first visit
    setTimeout(() => this.showHint(), 5000);
    
    console.log('🔄 Premium Pull-to-Refresh Ready');
  }
  
  createIndicator() {
    this.indicator = document.createElement('div');
    this.indicator.className = 'ptr-indicator';
    this.indicator.innerHTML = `
            <div class="ptr-progress-ring">
                <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle class="ptr-ring-bg" cx="25" cy="25" r="20"/>
                    <circle class="ptr-ring-fill" cx="25" cy="25" r="20" 
                            stroke-dasharray="125.6" stroke-dashoffset="125.6"/>
                </svg>
                <div class="ptr-cart-icon">🛒</div>
            </div>
            <div class="ptr-items-falling">
                <span class="ptr-fall-item">🍚</span>
                <span class="ptr-fall-item">🫘</span>
                <span class="ptr-fall-item">🧈</span>
            </div>
            <div class="ptr-spinner"></div>
            <div class="ptr-complete-check">✅</div>
            <div class="ptr-status">नीचे खींचें</div>
        `;
    this.container.parentNode.insertBefore(this.indicator, this.container);
  }
  
  createHint() {
    this.hint = document.createElement('div');
    this.hint.className = 'ptr-hint';
    this.hint.textContent = '👇 नीचे खींचें रिफ्रेश के लिए';
    document.body.appendChild(this.hint);
  }
  
  createToast() {
    this.toast = document.createElement('div');
    this.toast.className = 'ptr-toast';
    document.body.appendChild(this.toast);
  }
  
  showHint() {
    if (this.hintShown || this.isRefreshing) return;
    this.hintShown = true;
    this.hint.classList.add('show');
    
    this.hintTimer = setTimeout(() => {
      this.hint.classList.add('hide');
      setTimeout(() => this.hint.classList.remove('show', 'hide'), 400);
    }, 3000);
  }
  
  showToast(message, type = 'success') {
    this.toast.textContent = message;
    this.toast.className = 'ptr-toast ' + type + ' show';
    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2500);
  }
  
  attachEvents() {
    // Touch events
    this.container.addEventListener('touchstart', (e) => this.onStart(e.touches[0].clientY), { passive: true });
    this.container.addEventListener('touchmove', (e) => this.onMove(e.touches[0].clientY, e), { passive: false });
    this.container.addEventListener('touchend', () => this.onEnd());
    
    // Mouse events
    this.container.addEventListener('mousedown', (e) => this.onStart(e.clientY));
    document.addEventListener('mousemove', (e) => this.onMove(e.clientY));
    document.addEventListener('mouseup', () => this.onEnd());
  }
  
  onStart(y) {
    if (this.isRefreshing) return;
    if (this.container.scrollTop <= 5) {
      this.startY = y;
      this.isPulling = true;
    }
  }
  
  onMove(y, event = null) {
    if (!this.isPulling || this.isRefreshing) return;
    
    this.currentY = y;
    this.pullDistance = (this.currentY - this.startY) * 0.45;
    
    if (this.pullDistance > 5 && event) {
      event.preventDefault();
    }
    
    if (this.pullDistance > 0) {
      this.updatePull(Math.min(this.pullDistance, this.maxPull));
    }
  }
  
  onEnd() {
    if (!this.isPulling) return;
    
    if (this.pullDistance >= this.threshold && !this.isRefreshing) {
      this.startRefresh();
    } else {
      this.resetPull();
    }
    
    this.isPulling = false;
    this.pullDistance = 0;
  }
  
  updatePull(distance) {
    const progress = Math.min(distance / this.threshold, 1);
    const topPos = -100 + distance;
    
    this.indicator.style.top = topPos + 'px';
    this.indicator.classList.add('active');
    
    // Update ring progress
    const ring = this.indicator.querySelector('.ptr-ring-fill');
    const circumference = 125.6;
    ring.style.strokeDashoffset = circumference - (progress * circumference);
    
    // Status text
    const status = this.indicator.querySelector('.ptr-status');
    const cartIcon = this.indicator.querySelector('.ptr-cart-icon');
    
    if (progress < 0.4) {
      status.textContent = 'और नीचे खींचें...';
      status.className = 'ptr-status pulling';
    } else if (progress < 1) {
      status.textContent = 'थोड़ा और...';
      status.className = 'ptr-status pulling';
    } else {
      status.textContent = 'अब छोड़ें! 🎉';
      status.className = 'ptr-status ready';
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      // Cart shake
      cartIcon?.classList.add('pulling');
      setTimeout(() => cartIcon?.classList.remove('pulling'), 500);
    }
    
    // Rotate cart
    if (cartIcon) {
      cartIcon.style.transform = `translate(-50%, -50%) rotate(${progress * 30}deg)`;
    }
  }
  
  resetPull() {
    this.indicator.style.top = '-100px';
    this.indicator.classList.remove('active');
    
    const ring = this.indicator.querySelector('.ptr-ring-fill');
    ring.style.strokeDashoffset = '125.6';
    
    const status = this.indicator.querySelector('.ptr-status');
    status.textContent = 'नीचे खींचें';
    status.className = 'ptr-status';
    
    const cartIcon = this.indicator.querySelector('.ptr-cart-icon');
    if (cartIcon) cartIcon.style.transform = 'translate(-50%, -50%) rotate(0deg)';
  }
  
  async startRefresh() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    
    // Haptic
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    
    this.indicator.classList.add('refreshing');
    this.indicator.style.top = '10px';
    
    const status = this.indicator.querySelector('.ptr-status');
    status.textContent = 'रिफ्रेश हो रहा है...';
    status.className = 'ptr-status refreshing';
    
    // Check internet
    if (!navigator.onLine) {
      status.textContent = '❌ इंटरनेट नहीं है!';
      status.className = 'ptr-status offline';
      this.showToast('⚠️ कृपया इंटरनेट चेक करें', 'offline');
      setTimeout(() => this.finishRefresh(false), 2000);
      return;
    }
    
    try {
      await this.refreshData();
      
      // Success animation
      this.indicator.classList.remove('refreshing');
      this.indicator.classList.add('complete');
      status.textContent = '✅ अपडेट हो गया!';
      status.className = 'ptr-status success';
      
      // Haptic success
      if (navigator.vibrate) navigator.vibrate([20, 50, 20, 50, 20]);
      
      // Show items falling
      const items = this.indicator.querySelectorAll('.ptr-fall-item');
      items.forEach((item, i) => {
        item.style.animationDelay = (i * 0.1) + 's';
        item.style.animation = 'none';
        item.offsetHeight;
        item.style.animation = 'itemFall 0.6s ease-out forwards';
      });
      
      this.showToast('🔄 लेटेस्ट प्रोडक्ट लोड हो गए!', 'success');
      
      setTimeout(() => this.finishRefresh(true), 1500);
      
    } catch (error) {
      status.textContent = '❌ कुछ गलत हुआ';
      status.className = 'ptr-status offline';
      setTimeout(() => this.finishRefresh(false), 1500);
    }
  }
  
  async refreshData() {
    if (window.productsManager?.refreshAllProducts) {
      await window.productsManager.refreshAllProducts();
    }
    if (window.categoriesManager?.renderCategories && window.dataLoader?.categories) {
      window.categoriesManager.renderCategories(window.dataLoader.categories);
    }
    if (window.mostOrdersManager?.checkAndShow) {
      window.mostOrdersManager.checkAndShow();
    }
    return Promise.resolve();
  }
  
  finishRefresh(success) {
    this.indicator.style.top = '-100px';
    this.indicator.classList.remove('refreshing', 'complete', 'active');
    this.isRefreshing = false;
    
    const ring = this.indicator.querySelector('.ptr-ring-fill');
    ring.style.strokeDashoffset = '125.6';
    
    const status = this.indicator.querySelector('.ptr-status');
    status.textContent = 'नीचे खींचें';
    status.className = 'ptr-status';
    
    const cartIcon = this.indicator.querySelector('.ptr-cart-icon');
    if (cartIcon) cartIcon.style.transform = 'translate(-50%, -50%) rotate(0deg)';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => window.pullToRefresh = new PullToRefresh(), 1000);
});