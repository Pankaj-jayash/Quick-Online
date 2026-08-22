// ============================================
// ORDER RATING SYSTEM - Fixed
// ============================================

class OrderRating {
  constructor() {
    this.rating = 0;
    this.currentOrderId = null;
    this.init();
  }
  
  init() {
    console.log('⭐ Rating System Ready');
  }
  
  // Rating popup show करें
  showRatingPopup(orderId) {
    this.currentOrderId = orderId;
    
    const popupHTML = `
            <div id="ratingPopup" class="rating-popup">
                <div class="rating-overlay"></div>
                <div class="rating-content">
                    <div class="rating-header">
                        <span class="rating-close" onclick="window.orderRating.closeRatingPopup()">✕</span>
                    </div>
                    <div class="rating-icon">⭐</div>
                    <h3>ऑर्डर कैसा रहा?</h3>
                    <p>कृपया अपना अनुभव बताएं</p>
                    <div class="rating-stars" id="ratingStars">
                        <span class="star" data-rating="1" onclick="window.orderRating.setRating(1)">⭐</span>
                        <span class="star" data-rating="2" onclick="window.orderRating.setRating(2)">⭐</span>
                        <span class="star" data-rating="3" onclick="window.orderRating.setRating(3)">⭐</span>
                        <span class="star" data-rating="4" onclick="window.orderRating.setRating(4)">⭐</span>
                        <span class="star" data-rating="5" onclick="window.orderRating.setRating(5)">⭐</span>
                    </div>
                    <textarea id="ratingComment" class="rating-comment" placeholder="कोई सुझाव? (वैकल्पिक)"></textarea>
                    <button class="rating-submit-btn" onclick="window.orderRating.submitRating()">
                        सबमिट करें
                    </button>
                </div>
            </div>
        `;
    
    // पुराना popup हटाएं
    document.getElementById('ratingPopup')?.remove();
    document.body.insertAdjacentHTML('beforeend', popupHTML);
  }
  
  setRating(rating) {
    this.rating = rating;
    console.log('⭐ Rating selected:', rating);
    
    // Stars highlight करें
    document.querySelectorAll('#ratingStars .star').forEach(star => {
      const starRating = parseInt(star.getAttribute('data-rating'));
      if (starRating <= rating) {
        star.style.opacity = '1';
        star.style.filter = 'grayscale(0%)';
        star.style.transform = 'scale(1.2)';
      } else {
        star.style.opacity = '0.4';
        star.style.filter = 'grayscale(100%)';
        star.style.transform = 'scale(1)';
      }
    });
  }
  
  // Rating submit करें - Google Sheets में save
  async submitRating() {
    const comment = document.getElementById('ratingComment')?.value || '';
    
    if (!this.rating || this.rating === 0) {
      alert('⚠️ कृपया stars से rating दें');
      return;
    }
    
    if (!this.currentOrderId) {
      alert('⚠️ Order ID नहीं मिली');
      return;
    }
    
    console.log('⭐ Submitting rating:', this.rating, 'for order:', this.currentOrderId);
    
    const API_URL = window.googleSheetsOrders?.API_URL ||
      'https://script.google.com/macros/s/AKfycbxiTbffb6_uPM2s5k9zTJ9WUEiexzepmKhM6UF2R4sUHKeFBhR8j9h24OiFnSxjyO6L/exec';
    
    try {
      const response = await fetch(`${API_URL}?action=saveRating&orderId=${this.currentOrderId}&rating=${this.rating}&comment=${encodeURIComponent(comment)}`);
      const data = await response.json();
      
      console.log('📊 Rating save response:', data);
      
      if (data.success) {
        alert('✅ धन्यवाद! आपकी रेटिंग दर्ज कर ली गई है।');
        this.closeRatingPopup();
      } else {
        alert('❌ Rating save नहीं हुई: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Rating submit error:', error);
      alert('❌ Rating submit error: ' + error.message);
    }
  }
  
  closeRatingPopup() {
    document.getElementById('ratingPopup')?.remove();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.orderRating = new OrderRating();
});