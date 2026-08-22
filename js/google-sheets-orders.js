// ============================================
// GOOGLE SHEETS ORDERS - Real-time System
// ============================================

class GoogleSheetsOrders {
  constructor() {
    this.API_URL = 'https://script.google.com/macros/s/AKfycbxiTbffb6_uPM2s5k9zTJ9WUEiexzepmKhM6UF2R4sUHKeFBhR8j9h24OiFnSxjyO6L/exec';
    this.isEnabled = true;
    this.orderCheckInterval = null;
    console.log('📊 Google Sheets Real-time System Ready');
  }
  
  // Order Save करें
  async saveOrder(orderData) {
    if (!this.isEnabled) {
      console.log('⚠️ Google Sheets disabled');
      return { success: false, message: 'Disabled' };
    }
    
    try {
      const formattedData = this.formatOrderData(orderData);
      
      console.log('📊 Sending order to Google Sheets...');
      
      // पहले order भेजें
      await fetch(this.API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formattedData).toString()
      });
      
      // थोड़ा wait करें ताकि sheet update हो जाए
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Latest order ID fetch करें
      const orderId = await this.getLatestOrderId();
      
      console.log('✅ Order sent, Order ID:', orderId);
      
      return {
        success: true,
        orderId: orderId,
        message: 'Order sent successfully'
      };
      
    } catch (error) {
      console.log('⚠️ Save error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Latest Order ID get करें
  async getLatestOrderId() {
    try {
      const response = await fetch(`${this.API_URL}?action=getLatestOrder`);
      const data = await response.json();
      
      console.log('📋 Latest order response:', data);
      
      if (data.success && data.order && data.order.length > 0) {
        const orderId = data.order[0] || '';
        console.log('📋 Latest Order ID:', orderId);
        return orderId;
      }
      
      // Fallback
      const fallbackId = 'QD' + Date.now().toString().slice(-6);
      console.log('⚠️ Using fallback ID:', fallbackId);
      return fallbackId;
      
    } catch (error) {
      console.log('⚠️ Get latest order error:', error.message);
      return 'QD' + Date.now().toString().slice(-6);
    }
  }
  
  // Order Data Format करें
  formatOrderData(orderData) {
    let orderDetails = '';
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach((item, index) => {
        const name = typeof item.name === 'object' ?
          (item.name.hi || item.name.en || 'Product') :
          (item.name || 'Product');
        const unit = typeof item.unit === 'object' ?
          (item.unit.hi || item.unit.en || '') :
          (item.unit || '');
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        orderDetails += `${index + 1}. ${name} - ${unit} × ${quantity} = ₹${price * quantity}\n`;
      });
    }
    
    return {
      customerName: orderData.customer?.name || '',
      phone: orderData.customer?.phone || '',
      villageCity: orderData.customer?.villageCity || '',
      landmark: orderData.customer?.landmark || '',
      pincode: orderData.customer?.pincode || '',
      deliveryTime: orderData.customer?.deliveryTime || '',
      orderDetails: orderDetails,
      totalAmount: orderData.totals?.total || '0',
      itemCount: orderData.totals?.itemCount || '0',
      latitude: orderData.location?.lat || '',
      longitude: orderData.location?.lng || '',
      locationUrl: orderData.location?.url || '',
      orderMethod: orderData.orderMethod || 'direct'
    };
  }
  
  // Order Status Check करें
  async checkOrderStatus(orderId) {
    try {
      console.log('🔄 Checking status for:', orderId);
      const response = await fetch(`${this.API_URL}?action=getOrderStatus&orderId=${orderId}`);
      const data = await response.json();
      console.log('📊 Status response:', data);
      return data;
    } catch (error) {
      console.log('⚠️ Status check error:', error.message);
      return {
        success: false,
        status: 'Pending',
        message: error.message
      };
    }
  }
  
  // Real-time Tracking शुरू करें
  startOrderTracking(orderId, callback) {
    this.orderCheckInterval = setInterval(async () => {
      const status = await this.checkOrderStatus(orderId);
      if (status && status.success) {
        callback(status);
      }
    }, 5000);
  }
  
  // Tracking बंद करें
  stopOrderTracking() {
    if (this.orderCheckInterval) {
      clearInterval(this.orderCheckInterval);
      this.orderCheckInterval = null;
    }
  }
}

// Global Instance
window.googleSheetsOrders = new GoogleSheetsOrders();