// ============================================
// PAYMENT-ONLINE.JS - Complete Online Payment
// Google Sheets + Google Apps Script Connected
// UPI + Card (Disabled) + COD + Service Charge
// With Callback Support for Order Saving
// ============================================

class OnlinePaymentManager {
    constructor() {
        // UPI Details
        this.upiId = '9719495844-2@ybl';
        this.payeeName = 'Quick Dukan';
        this.merchantCode = 'QKDKAN';
        
        // API URL (Google Apps Script)
        this.API_URL = 'https://script.google.com/macros/s/AKfycbzl2LvWqlmlt9tQFdZ-yPIhALBxhL1TRYNz6X9pGThOgEzQM-uaXKozw6ly-3oGr7o/exec';
        
        // Payment Settings (Google Sheets से)
        this.paymentSettings = {
            chargeEnabled: true,
            chargeMin: 1,
            chargeMax: 5
        };
        
        // Current Payment Data
        this.currentOrder = null;
        this.currentAmount = 0;
        this.currentCharge = 0;
        this.currentTotal = 0;
        this.currentUser = { phone: '', name: '' };
        this.currentLang = 'hi';
        
        // 🆕 CALLBACKS
        this.callbacks = {
            onPaymentSuccess: null,
            onPaymentFailure: null,
            onCODSelected: null,
        };
        
        // 🆕 PAYMENT STATUS
        this.paymentCompleted = false;
        this.paymentMethod = '';
        
        this.init();
    }
    
    // ============================================
    // INIT
    // ============================================
    async init() {
        this.detectLanguage();
        await this.loadPaymentSettings();
        document.addEventListener('languageChanged', () => this.detectLanguage());
        console.log('💳 Online Payment Manager Ready');
    }
    
    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }
    
    // ============================================
    // LOAD PAYMENT SETTINGS (Google Sheets से)
    // ============================================
    async loadPaymentSettings() {
        try {
            const response = await fetch(`${this.API_URL}?action=getPaymentSettings`);
            const data = await response.json();
            
            if (data.success) {
                this.paymentSettings = {
                    chargeEnabled: data.chargeEnabled,
                    chargeMin: data.chargeMin || 1,
                    chargeMax: data.chargeMax || 5
                };
                console.log('⚙️ Payment Settings Loaded:', this.paymentSettings);
            }
        } catch (error) {
            console.log('⚠️ Settings load error:', error);
        }
    }
    
    // ============================================
    // CHECK USER LOGIN
    // ============================================
    isUserLoggedIn() {
        const phone = localStorage.getItem('userPhone');
        if (phone) {
            this.currentUser.phone = phone;
            return true;
        }
        return false;
    }
    
    // ============================================
    // ✅ SHOW PAYMENT POPUP (With Callbacks)
    // ============================================
    async show(orderData, callbacks = {}) {
        // 🆕 Callbacks store karo
        this.callbacks = {
            onPaymentSuccess: callbacks.onPaymentSuccess || null,
            onPaymentFailure: callbacks.onPaymentFailure || null,
            onCODSelected: callbacks.onCODSelected || null,
        };
        
        // Login check
        if (!this.isUserLoggedIn()) {
            alert('🔐 कृपया पहले Login करें!');
            if (window.parent !== window) {
                window.parent.openLoginPopup();
            } else {
                window.location.href = 'login.html';
            }
            return;
        }
        
        // Settings reload करें
        await this.loadPaymentSettings();
        
        // Existing popup हटाएं
        const existing = document.querySelector('.payment-online-container');
        if (existing) existing.remove();
        
        // Order data set करें
        this.currentOrder = orderData;
        this.currentAmount = parseFloat(orderData.total || orderData.totals?.total || 0);
        
        // User info
        const userProfile = await this.getUserProfile();
        if (userProfile) {
            this.currentUser.name = userProfile.name || '';
            this.currentUser.phone = userProfile.phone || this.currentUser.phone;
        }
        
        // Service Charge calculate करें
        this.calculateCharge();
        
        const hi = this.currentLang === 'hi';
        
        const container = document.createElement('div');
        container.className = 'payment-online-container';
        container.innerHTML = `
            <div class="payment-online-overlay"></div>
            <div class="payment-online-card">
                <!-- Header -->
                <div class="payment-online-header">
                    <div class="payment-header-left">
                        <span class="payment-header-icon">💳</span>
                        <div>
                            <h3>${hi ? 'ऑनलाइन भुगतान' : 'Online Payment'}</h3>
                            <p class="payment-order-id">${hi ? 'ऑर्डर करने के लिए पेमेंट करें' : 'Pay to place order'}</p>
                        </div>
                    </div>
                    <button class="payment-close-btn" id="paymentCloseBtn">✕</button>
                </div>
                
                <!-- Amount Section -->
                <div class="payment-amount-section">
                    <div class="amount-row">
                        <span>${hi ? 'प्रोडक्ट राशि' : 'Product Amount'}</span>
                        <span>₹${this.currentAmount.toFixed(2)}</span>
                    </div>
                    ${this.paymentSettings.chargeEnabled ? `
                    <div class="amount-row charge-row">
                        <span>${hi ? 'ऑनलाइन सेवा शुल्क' : 'Online Service Charge'}</span>
                        <span>+ ₹${this.currentCharge.toFixed(2)}</span>
                    </div>
                    <div class="charge-message">
                        🛡️ ${hi 
                            ? 'सुरक्षित भुगतान के लिए ₹' + this.paymentSettings.chargeMin + '-₹' + this.paymentSettings.chargeMax + ' का सेवा शुल्क लागू होता है।' 
                            : 'Secure payment service charge of ₹' + this.paymentSettings.chargeMin + '-₹' + this.paymentSettings.chargeMax + ' applies.'}
                    </div>
                    ` : ''}
                    <div class="amount-row total-row">
                        <span>${hi ? 'कुल भुगतान' : 'Total Payable'}</span>
                        <span class="total-amount">₹${this.currentTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- QR Code - Click to Pay -->
                <div class="payment-qr-section" id="qrSection">
                    <p class="qr-hint">${hi ? '👇 QR स्कैन करें या टैप करें' : '👇 Scan QR or Tap to Pay'}</p>
                    <div class="qr-container" id="qrContainer">
                        <img id="qrImage" 
                             src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(this.buildUPIUrl(this.currentTotal))}&bgcolor=ffffff&color=000000" 
                             alt="Pay ₹${this.currentTotal}"
                             style="width:160px;height:160px;cursor:pointer;border-radius:12px;"
                             title="${hi ? 'टैप करें - UPI ऐप खोलें' : 'Tap to open UPI app'}">
                    </div>
                    <p class="qr-amount">₹${this.currentTotal.toFixed(2)}</p>
                    <p class="qr-upi">UPI: ${this.upiId}</p>
                    <button class="copy-upi-btn" id="btnCopyUPI">📋 ${hi ? 'UPI ID कॉपी करें' : 'Copy UPI ID'}</button>
                </div>
                
                <!-- Divider -->
                <div class="payment-divider"><span>${hi ? 'या' : 'OR'}</span></div>
                
                <!-- UPI Apps -->
                <div class="payment-apps-section">
                    <p class="apps-title">${hi ? '📱 UPI ऐप चुनें' : '📱 Choose UPI App'}</p>
                    <div class="upi-apps-grid">
                        <button class="upi-app-btn" data-app="gpay">
                            <span class="app-icon-g">G</span><span>GPay</span>
                        </button>
                        <button class="upi-app-btn" data-app="phonepe">
                            <span class="app-icon-p">P</span><span>PhonePe</span>
                        </button>
                        <button class="upi-app-btn" data-app="paytm">
                            <span class="app-icon-pt">₹</span><span>Paytm</span>
                        </button>
                        <button class="upi-app-btn" data-app="bhim">
                            <span class="app-icon-b">B</span><span>BHIM</span>
                        </button>
                    </div>
                    <button class="upi-any-btn" id="btnAnyUPI">📱 ${hi ? 'कोई भी UPI ऐप' : 'Any UPI App'}</button>
                </div>
                
                <!-- Divider -->
                <div class="payment-divider"><span>${hi ? 'या' : 'OR'}</span></div>
                
                <!-- Card (Disabled Message) -->
                <div class="payment-card-section">
                    <button class="card-btn-disabled" id="btnCard">
                        <span class="card-icon">💳</span>
                        <div>
                            <strong>${hi ? 'कार्ड से भुगतान' : 'Card Payment'}</strong>
                            <small>${hi ? '⚠️ यह सुविधा अभी उपलब्ध नहीं है' : '⚠️ This feature is not available yet'}</small>
                        </div>
                    </button>
                </div>
                
                <!-- Divider -->
                <div class="payment-divider"><span>${hi ? 'या' : 'OR'}</span></div>
                
                <!-- COD -->
                <div class="payment-cod-section">
                    <button class="cod-btn" id="btnCOD">
                        <span class="cod-icon">🏍️</span>
                        <div>
                            <strong>${hi ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'}</strong>
                            <small>${hi ? 'सामान आने पर ₹' + this.currentAmount + ' दें' : 'Pay ₹' + this.currentAmount + ' on delivery'}</small>
                        </div>
                    </button>
                </div>
                
                <!-- Payment Done Button -->
                <div class="payment-done-section">
                    <button class="payment-done-btn" id="btnPaymentDone">
                        ✅ ${hi ? 'मैंने Payment कर दिया - ऑर्डर कन्फर्म करें' : 'I have paid - Confirm Order'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        requestAnimationFrame(() => container.classList.add('show'));
        
        this.bindEvents(container);
    }
    
    // ============================================
    // CALCULATE SERVICE CHARGE
    // ============================================
    calculateCharge() {
        if (this.paymentSettings.chargeEnabled && this.currentAmount > 0) {
            const min = this.paymentSettings.chargeMin;
            const max = this.paymentSettings.chargeMax;
            this.currentCharge = Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
            this.currentCharge = 0;
        }
        this.currentTotal = this.currentAmount + this.currentCharge;
    }
    
    // ============================================
    // GET USER PROFILE
    // ============================================
    async getUserProfile() {
        try {
            const phone = this.currentUser.phone;
            const response = await fetch(`${this.API_URL}?action=getUserProfile&phone=${phone}`);
            const data = await response.json();
            
            if (data.success && data.profile) {
                return data.profile;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
    
    // ============================================
    // BUILD UPI URL
    // ============================================
    buildUPIUrl(amount, note) {
        const params = new URLSearchParams({
            pa: this.upiId,
            pn: this.payeeName,
            am: amount.toFixed(2),
            cu: 'INR',
            mode: '02',
            purpose: '00',
            mc: this.merchantCode,
            tn: note || 'Quick Dukan Payment',
            orgid: '000000'
        });
        return 'upi://pay?' + params.toString();
    }
    
    // ============================================
    // BIND EVENTS
    // ============================================
    bindEvents(container) {
        const hi = this.currentLang === 'hi';
        const amount = this.currentTotal;
        const note = 'Quick Dukan Payment - Order Amount';
        const upiUrl = this.buildUPIUrl(amount, note);
        
        // 🆕 Close button
        container.querySelector('#paymentCloseBtn')?.addEventListener('click', () => {
            this.handlePaymentCancel(container);
        });
        
        // Overlay click - band na ho (payment complete hona zaroori)
        container.querySelector('.payment-online-overlay')?.addEventListener('click', () => {
            this.showToast(hi ? '⚠️ कृपया पहले पेमेंट पूरा करें' : '⚠️ Please complete payment first');
        });
        
        // QR Click
        const qrImage = container.querySelector('#qrImage');
        const qrSection = container.querySelector('#qrSection');
        
        if (qrImage) {
            qrImage.addEventListener('click', () => this.openUPIUrl(upiUrl, amount));
        }
        
        if (qrSection) {
            qrSection.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                this.openUPIUrl(upiUrl, amount);
            });
        }
        
        // Copy UPI
        container.querySelector('#btnCopyUPI').addEventListener('click', () => {
            navigator.clipboard.writeText(this.upiId).then(() => {
                this.showToast(hi ? '✅ UPI ID कॉपी!' : '✅ UPI ID Copied!');
            });
        });
        
        // UPI Apps
        container.querySelectorAll('.upi-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openSpecificUPIApp(btn.dataset.app, amount);
            });
        });
        
        // Any UPI
        container.querySelector('#btnAnyUPI').addEventListener('click', () => {
            this.openUPIUrl(upiUrl, amount);
        });
        
        // Card (Disabled)
        container.querySelector('#btnCard').addEventListener('click', () => {
            this.showToast(hi ? '⚠️ कार्ड सुविधा जल्द आएगी' : '⚠️ Card feature coming soon');
        });
        
        // 🆕 COD - Direct order save karo (payment ke bina)
        container.querySelector('#btnCOD').addEventListener('click', () => {
            this.handleCOD(container);
        });
        
        // 🆕 Payment Done - Ab order save hoga
        container.querySelector('#btnPaymentDone').addEventListener('click', () => {
            this.handlePaymentDone(container);
        });
    }
    
    // ============================================
    // OPEN UPI URL
    // ============================================
    openUPIUrl(upiUrl, amount) {
        console.log('💳 Opening UPI:', upiUrl);
        
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = upiUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
            try {
                window.location.href = upiUrl;
            } catch (e) {
                window.open(upiUrl.replace('upi://', 'https://pay.google.com/gp/v/upi/'), '_blank');
            }
        }, 300);
        
        setTimeout(() => {
            if (iframe.parentNode) iframe.remove();
        }, 5000);
    }
    
    // ============================================
    // OPEN SPECIFIC UPI APP
    // ============================================
    openSpecificUPIApp(app, amount) {
        const note = 'Quick Dukan Payment - Order Amount';
        const upiUrl = this.buildUPIUrl(amount, note);
        
        const apps = {
            gpay: { pkg: 'com.google.android.apps.nbu.paisa.user', name: 'GPay', intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end` },
            phonepe: { pkg: 'com.phonepe.app', name: 'PhonePe', intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.phonepe.app;end` },
            paytm: { pkg: 'net.one97.paytm', name: 'Paytm', intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=net.one97.paytm;end` },
            bhim: { pkg: 'in.org.npci.upiapp', name: 'BHIM', intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=in.org.npci.upiapp;end` }
        };
        
        const config = apps[app];
        if (config) {
            try {
                window.location.href = config.intent;
            } catch (e) {
                window.open(upiUrl, '_blank');
            }
        } else {
            this.openUPIUrl(upiUrl, amount);
        }
    }
    
    // ============================================
    // ✅ HANDLE COD - Direct Order Save (No Payment)
    // ============================================
    async handleCOD(container) {
        const hi = this.currentLang === 'hi';
        
        // COD selected - Order direct save hoga
        console.log('🏍️ COD Selected - Order save hoga without payment');
        
        // Payment sheet mein COD entry
        await this.savePaymentToSheet('COD', 0, this.currentAmount);
        
        // 🆕 Callback - Order save karo
        if (this.callbacks.onCODSelected) {
            await this.callbacks.onCODSelected({
                method: 'COD',
                amount: this.currentAmount,
                charge: 0,
                total: this.currentAmount,
                transactionId: 'COD',
                status: 'Pending',
            });
        } else if (this.callbacks.onPaymentSuccess) {
            await this.callbacks.onPaymentSuccess({
                method: 'COD',
                amount: this.currentAmount,
                charge: 0,
                total: this.currentAmount,
                transactionId: 'COD',
                status: 'Pending',
            });
        }
        
        this.showToast(hi ? '✅ ऑर्डर कन्फर्म! ₹' + this.currentAmount + ' सामान आने पर दें।' : '✅ Order confirmed! Pay ₹' + this.currentAmount + ' on delivery.');
        
        setTimeout(() => this.hide(container), 1500);
    }
    
    // ============================================
    // ✅ HANDLE PAYMENT DONE (UPI) - Order Save After Payment
    // ============================================
    async handlePaymentDone(container) {
        const hi = this.currentLang === 'hi';
        
        console.log('✅ Payment Done clicked - Ab order save hoga');
        
        // Payment save karo
        const paymentId = await this.savePaymentToSheet('UPI', this.currentCharge, this.currentTotal);
        
        // 🆕 Callback - Payment success ke baad order save karo
        if (this.callbacks.onPaymentSuccess) {
            await this.callbacks.onPaymentSuccess({
                method: 'UPI',
                amount: this.currentAmount,
                charge: this.currentCharge,
                total: this.currentTotal,
                transactionId: paymentId || 'UPI-' + Date.now(),
                status: 'Paid',
            });
        }
        
        this.showToast(hi ? '✅ ऑर्डर कन्फर्म हो गया! Admin verify करेगा।' : '✅ Order confirmed! Admin will verify.');
        
        setTimeout(() => this.hide(container), 1500);
    }
    
    // ============================================
    // ✅ HANDLE PAYMENT CANCEL
    // ============================================
    handlePaymentCancel(container) {
        const hi = this.currentLang === 'hi';
        
        console.log('❌ Payment cancelled by user');
        
        // 🆕 Callback - Payment failure
        if (this.callbacks.onPaymentFailure) {
            this.callbacks.onPaymentFailure({
                message: 'Payment cancelled',
                method: this.currentOrder?.paymentMethod || 'UPI',
            });
        }
        
        this.showToast(hi ? '❌ पेमेंट कैंसिल - ऑर्डर नहीं हुआ' : '❌ Payment cancelled - Order not placed');
        
        this.hide(container);
    }
    
    // ============================================
    // SAVE PAYMENT TO GOOGLE SHEETS
    // ============================================
    async savePaymentToSheet(method, chargeAmount, totalAmount) {
        try {
            const orderData = this.currentOrder;
            const itemsText = this.formatItems(orderData.items || []);
            
            const response = await fetch(
                `${this.API_URL}?action=savePayment` +
                `&orderId=${encodeURIComponent(orderData.orderId || '')}` +
                `&phone=${encodeURIComponent(this.currentUser.phone)}` +
                `&name=${encodeURIComponent(this.currentUser.name)}` +
                `&items=${encodeURIComponent(itemsText)}` +
                `&productAmount=${this.currentAmount}` +
                `&chargeAmount=${chargeAmount}` +
                `&totalAmount=${totalAmount}` +
                `&method=${method}`
            );
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Payment saved:', data.paymentId);
                return data.paymentId;
            } else {
                console.log('⚠️ Payment save failed:', data.message);
                return null;
            }
        } catch (error) {
            console.log('⚠️ Payment save error:', error);
            return null;
        }
    }
    
    // ============================================
    // FORMAT ITEMS
    // ============================================
    formatItems(items) {
        if (!items || items.length === 0) return '';
        
        return items.map(item => {
            const name = typeof item.name === 'object' ? (item.name.hi || item.name.en || '') : (item.name || '');
            const qty = item.quantity || 1;
            return `${name} ×${qty}`;
        }).join(', ');
    }
    
    // ============================================
    // HIDE POPUP
    // ============================================
    hide(container) {
        container.classList.remove('show');
        setTimeout(() => {
            if (container.parentNode) container.remove();
        }, 300);
    }
    
    // ============================================
    // TOAST
    // ============================================
    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.onlinePaymentManager = new OnlinePaymentManager();
    }, 1200);
});