// ============================================
// CHECKOUT.JS - Premium Checkout Logic (Final)
// Quick Dukan - Uses LocationManager | Multilingual | Location Fix
// With User Block Check + Payment Method
// ============================================

class CheckoutManager {
    constructor() {
        // DOM Elements
        this.checkoutModal = document.getElementById('checkoutModal');
        this.closeCheckoutBtn = document.getElementById('closeCheckout');
        this.confirmOrderBtn = document.getElementById('confirmOrderBtn');
        this.checkoutOverlay = this.checkoutModal?.querySelector('.checkout-overlay') || null;

        // Form fields
        this.customerName = document.getElementById('customerName');
        this.customerPhone = document.getElementById('customerPhone');
        this.villageCity = document.getElementById('villageCity');
        this.landmark = document.getElementById('landmark');
        this.pincode = document.getElementById('pincode');
        this.saveInfo = document.getElementById('saveInfo');

        // Cart total display
        this.checkoutItemCount = document.getElementById('checkoutItemCount');
        this.checkoutTotal = document.getElementById('checkoutTotal');

        // Delivery time
        this.deliveryTimeRadios = document.querySelectorAll('input[name="deliveryTime"]');
        this.manualTimeInput = document.getElementById('manualTime');

        // 🆕 ORDER METHOD BUTTONS
        this.whatsappMethodBtn = document.getElementById('whatsappMethodBtn');
        this.directMethodBtn = document.getElementById('directMethodBtn');
        this.selectedOrderMethod = 'direct'; // 🆕 Default: direct

        // 🆕 PAYMENT METHOD
        this.paymentMethodSection = document.getElementById('paymentMethodSection');
        this.selectedPaymentMethod = ''; // UPI, COD, Card

        // Confetti
        this.confettiContainer = document.getElementById('checkoutConfetti');

        // Data
        this.cartItems = [];
        this.cartTotal = 0;
        this.cartItemCount = 0;
        this.currentLang = 'hi';
        this.storageKey = 'quick-dukan-user-info';
        
        // 🆕 ORDER TRACKING
        this.currentOrderId = null;
        this.orderTrackingInterval = null;
        this.orderStatusPopup = null;

        // 🔥 LOCATION MANAGER (from location.js)
        this.location = null;

        if (!this.checkoutModal) return;
        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    init() {
        this.bindEvents();
        this.detectLanguage();
        this.initLocation();
        this.createOrderStatusPopup();
        console.log('✅ Checkout Manager Initialized');
    }

    initLocation() {
        const checkLocation = setInterval(() => {
            if (window.locationManager) {
                clearInterval(checkLocation);
                this.location = window.locationManager;

                const indicator = document.getElementById('locationIndicator');
                if (indicator) {
                    this.location.setIndicator(indicator);
                }

                console.log('📍 LocationManager linked to CheckoutManager');
            }
        }, 100);

        setTimeout(() => clearInterval(checkLocation), 5000);
    }

    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
        if (this.location) {
            this.location.setLanguage(this.currentLang);
        }
    }

    getMsg(section, key) {
        const messages = {
            header: {
                hi: { title: 'ऑर्डर कन्फर्म करें', subtitle: 'डिलीवरी जानकारी भरें' },
                en: { title: 'Confirm Order', subtitle: 'Fill delivery details' }
            },
            cartTotal: {
                hi: { items: '{count} आइटम', total: 'कुल' },
                en: { items: '{count} items', total: 'Total' }
            },
            form: {
                hi: {
                    namePlaceholder: '👤  पूरा नाम लिखें...',
                    phonePlaceholder: '📱  मोबाइल नंबर',
                    villagePlaceholder: '🏘️  गाँव या शहर',
                    landmarkPlaceholder: '🏠  आस-पास की जगह (वैकल्पिक)',
                    pincodePlaceholder: '📮  पिन कोड (वैकल्पिक)',
                    deliveryTime: '⏱️  डिलीवरी समय',
                    now: 'अभी (30-45 मिनट)',
                    evening1: 'शाम 5-7 बजे',
                    evening2: 'शाम 7-9 बजे',
                    manual: 'अपना समय...',
                    saveInfo: 'जानकारी सेव करें',
                    orderMethod: '📋 ऑर्डर कैसे करें?',
                    whatsappMethod: 'WhatsApp Order',
                    directMethod: 'Direct Order',
                    whatsappSubtext: 'पुराना तरीका',
                    directSubtext: 'ऐप पर ही'
                },
                en: {
                    namePlaceholder: '👤  Enter full name...',
                    phonePlaceholder: '📱  Mobile number',
                    villagePlaceholder: '🏘️  Village or City',
                    landmarkPlaceholder: '🏠  Nearby place (optional)',
                    pincodePlaceholder: '📮  Pincode (optional)',
                    deliveryTime: '⏱️  Delivery Time',
                    now: 'Now (30-45 min)',
                    evening1: 'Evening 5-7 PM',
                    evening2: 'Evening 7-9 PM',
                    manual: 'Custom time...',
                    saveInfo: 'Save information',
                    orderMethod: '📋 How to order?',
                    whatsappMethod: 'WhatsApp Order',
                    directMethod: 'Direct Order',
                    whatsappSubtext: 'Old method',
                    directSubtext: 'On app'
                }
            },
            paymentMethod: {
                hi: {
                    title: '💳 Payment Method चुनें',
                    upi: '💳 UPI (Recommended)',
                    card: '💳 Card (जल्द आएगा)',
                    cod: '🏍️ Cash on Delivery',
                    required: '⚠️ पहले Payment Method चुनें!'
                },
                en: {
                    title: '💳 Select Payment Method',
                    upi: '💳 UPI (Recommended)',
                    card: '💳 Card (Coming Soon)',
                    cod: '🏍️ Cash on Delivery',
                    required: '⚠️ Please select Payment Method first!'
                }
            },
            button: {
                hi: {
                    waiting: '⏳ लोकेशन का इंतज़ार...',
                    gpsoff: '🔒 कृपया GPS चालू करें',
                    readyWhatsapp: '💬 WhatsApp पर भेजें →',
                    readyDirect: '🛒 ऑर्डर कन्फर्म करें →',
                    sending: '⏳ भेज रहे हैं...'
                },
                en: {
                    waiting: '⏳ Waiting for location...',
                    gpsoff: '🔒 Please turn ON GPS',
                    readyWhatsapp: '💬 Send on WhatsApp →',
                    readyDirect: '🛒 Confirm Order →',
                    sending: '⏳ Sending...'
                }
            },
            orderStatus: {
                hi: {
                    pending: '⏳ आपका ऑर्डर पेंडिंग है...',
                    confirmed: '✅ आपका ऑर्डर कन्फर्म हो गया!',
                    cancelled: '❌ आपका ऑर्डर कैंसिल कर दिया गया',
                    delivered: '🚚 आपका ऑर्डर डिलीवर हो गया!',
                    checking: '🔄 ऑर्डर स्टेटस चेक हो रहा है...'
                },
                en: {
                    pending: '⏳ Your order is pending...',
                    confirmed: '✅ Your order is confirmed!',
                    cancelled: '❌ Your order has been cancelled',
                    delivered: '🚚 Your order has been delivered!',
                    checking: '🔄 Checking order status...'
                }
            },
            toast: {
                hi: {
                    orderSent: '✅ ऑर्डर WhatsApp पर भेज दिया!',
                    orderSentDirect: '✅ ऑर्डर सफलतापूर्वक हो गया!',
                    nameRequired: '⚠️ कृपया नाम लिखें',
                    phoneRequired: '⚠️ सही मोबाइल नंबर डालें',
                    cityRequired: '⚠️ गाँव/शहर लिखें',
                    gpsRequired: '⚠️ कृपया GPS चालू करें और लोकेशन लें',
                    loginRequired: '🔐 कृपया पहले Login करें!'
                },
                en: {
                    orderSent: '✅ Order sent on WhatsApp!',
                    orderSentDirect: '✅ Order placed successfully!',
                    nameRequired: '⚠️ Please enter name',
                    phoneRequired: '⚠️ Enter valid mobile number',
                    cityRequired: '⚠️ Enter village/city',
                    gpsRequired: '⚠️ Please turn ON GPS and get location',
                    loginRequired: '🔐 Please Login first!'
                }
            }
        };

        return messages[section]?.[this.currentLang]?.[key] || 
               messages[section]?.en?.[key] || 
               `[${key}]`;
    }

    // ============================================
    // EVENT BINDING
    // ============================================
    bindEvents() {
        this.closeCheckoutBtn?.addEventListener('click', () => this.close());
        this.checkoutOverlay?.addEventListener('click', () => this.close());
        this.confirmOrderBtn?.addEventListener('click', () => this.handleOrderButton());
        this.customerPhone?.addEventListener('input', () => this.validatePhone());

        this.deliveryTimeRadios?.forEach(radio => {
            radio.addEventListener('change', () => this.updateTimeSelection());
        });

        this.manualTimeInput?.addEventListener('input', () => {
            this.deliveryTimeRadios?.forEach(r => r.checked = false);
            this.updateTimeSelection();
        });

        this.whatsappMethodBtn?.addEventListener('click', () => this.selectOrderMethod('whatsapp'));
        this.directMethodBtn?.addEventListener('click', () => this.selectOrderMethod('direct'));

        // 🆕 Payment Method buttons
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectPaymentMethod(btn));
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.checkoutModal.classList.contains('hidden')) {
                this.close();
            }
        });

        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
            this.updateAllLabels();
        });
    }

    // ============================================
    // 🆕 SELECT ORDER METHOD (Payment section show/hide)
    // ============================================
    selectOrderMethod(method) {
        this.selectedOrderMethod = method;
        
        if (this.whatsappMethodBtn && this.directMethodBtn) {
            this.whatsappMethodBtn.classList.remove('selected');
            this.directMethodBtn.classList.remove('selected');
            
            if (method === 'whatsapp') {
                this.whatsappMethodBtn.classList.add('selected');
                // WhatsApp में payment section hide
                if (this.paymentMethodSection) {
                    this.paymentMethodSection.classList.add('hidden');
                }
            } else {
                this.directMethodBtn.classList.add('selected');
                // Direct में payment section show
                if (this.paymentMethodSection) {
                    this.paymentMethodSection.classList.remove('hidden');
                }
            }
        }
        
        if (this.confirmOrderBtn?.classList.contains('state-ready')) {
            this.updateConfirmButtonText();
        }
        
        console.log('📋 Order method selected:', method);
    }

    // ============================================
    // 🆕 SELECT PAYMENT METHOD
    // ============================================
    selectPaymentMethod(btn) {
        const method = btn.getAttribute('data-payment');
        
        // Card check
        if (method === 'Card') {
            this.showToast(this.currentLang === 'hi' ? '⚠️ Card सुविधा जल्द आएगी' : '⚠️ Card feature coming soon');
            return;
        }
        
        this.selectedPaymentMethod = method;
        
        // UI update
        document.querySelectorAll('.payment-method-btn').forEach(b => {
            b.classList.remove('selected');
        });
        btn.classList.add('selected');
        
        console.log('💳 Payment method selected:', method);
    }

    // ============================================
    // 🆕 UPDATE CONFIRM BUTTON TEXT
    // ============================================
    updateConfirmButtonText() {
        if (!this.confirmOrderBtn) return;
        
        const btnText = this.confirmOrderBtn.querySelector('span:last-child');
        if (!btnText) return;
        
        if (this.selectedOrderMethod === 'direct') {
            btnText.textContent = this.currentLang === 'hi' ? '🛒 ऑर्डर कन्फर्म करें →' : '🛒 Confirm Order →';
        } else {
            btnText.textContent = this.currentLang === 'hi' ? '💬 WhatsApp पर भेजें →' : '💬 Send on WhatsApp →';
        }
    }

    updateTimeSelection() {
        document.querySelectorAll('.time-radio-label').forEach(label => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                label.classList.add('selected');
            } else {
                label.classList.remove('selected');
            }
        });
    }

    // ============================================
    // CREATE ORDER STATUS POPUP
    // ============================================
    createOrderStatusPopup() {
        if (document.getElementById('orderStatusPopup')) return;
        
        const popupHTML = `
            <div id="orderStatusPopup" class="order-status-popup hidden">
                <div class="order-status-overlay"></div>
                <div class="order-status-content">
                    <div class="order-status-icon" id="orderStatusIcon">⏳</div>
                    <h3 class="order-status-title" id="orderStatusTitle">ऑर्डर पेंडिंग है...</h3>
                    <p class="order-status-message" id="orderStatusMessage">कृपया थोड़ा इंतज़ार करें</p>
                    <div class="order-status-loader">
                        <div class="status-spinner"></div>
                    </div>
                    <button class="order-status-close-btn" id="orderStatusCloseBtn">ठीक है</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        
        document.getElementById('orderStatusCloseBtn')?.addEventListener('click', () => {
            this.hideOrderStatusPopup();
        });
        
        this.orderStatusPopup = document.getElementById('orderStatusPopup');
    }

    showOrderStatusPopup(status) {
        if (!this.orderStatusPopup) this.createOrderStatusPopup();
        
        const icon = document.getElementById('orderStatusIcon');
        const title = document.getElementById('orderStatusTitle');
        const message = document.getElementById('orderStatusMessage');
        const loader = document.querySelector('.order-status-loader');
        
        switch (status) {
            case 'Pending':
                if (icon) icon.textContent = '⏳';
                if (title) title.textContent = this.getMsg('orderStatus', 'pending');
                if (message) message.textContent = 'हमारी टीम जल्द ही आपके ऑर्डर को कन्फर्म करेगी';
                if (loader) loader.style.display = 'flex';
                break;
                
            case 'Confirmed':
                if (icon) icon.textContent = '✅';
                if (title) title.textContent = this.getMsg('orderStatus', 'confirmed');
                if (message) message.textContent = 'आपका ऑर्डर कन्फर्म हो गया है! जल्द ही डिलीवर किया जाएगा';
                if (loader) loader.style.display = 'none';
                break;
                
            case 'Cancelled':
                if (icon) icon.textContent = '❌';
                if (title) title.textContent = this.getMsg('orderStatus', 'cancelled');
                if (message) message.textContent = 'माफ़ कीजिए, आपका ऑर्डर कैंसिल कर दिया गया है';
                if (loader) loader.style.display = 'none';
                break;
                
            case 'Delivered':
                if (icon) icon.textContent = '🚚';
                if (title) title.textContent = this.getMsg('orderStatus', 'delivered');
                if (message) message.textContent = 'धन्यवाद! आपका ऑर्डर सफलतापूर्वक डिलीवर हो गया';
                if (loader) loader.style.display = 'none';
                break;
        }
        
        this.orderStatusPopup?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        if (status === 'Delivered' || status === 'Cancelled') {
            setTimeout(() => {
                this.hideOrderStatusPopup();
                this.stopOrderTracking();
            }, 3000);
        }
    }

    hideOrderStatusPopup() {
        this.orderStatusPopup?.classList.add('hidden');
        document.body.style.overflow = '';
    }

    startOrderTracking(orderId) {
        this.currentOrderId = orderId;
        this.checkOrderStatusNow();
        
        this.orderTrackingInterval = setInterval(() => {
            this.checkOrderStatusNow();
        }, 5000);
        
        console.log('🔄 Order tracking started for:', orderId);
    }

    async checkOrderStatusNow() {
        if (!this.currentOrderId) return;
        
        try {
            const status = await window.googleSheetsOrders?.checkOrderStatus(this.currentOrderId);
            
            if (status && status.success) {
                console.log('📊 Order Status:', status.status);
                this.showOrderStatusPopup(status.status);
                
                if (status.status === 'Delivered' || status.status === 'Cancelled') {
                    this.stopOrderTracking();
                }
            }
        } catch (error) {
            console.log('⚠️ Status check error:', error.message);
        }
    }

    stopOrderTracking() {
        if (this.orderTrackingInterval) {
            clearInterval(this.orderTrackingInterval);
            this.orderTrackingInterval = null;
            console.log('🛑 Order tracking stopped');
        }
    }

    // ============================================
    // OPEN / CLOSE
    // ============================================
    open(cartItems, totalPrice, totalItems) {
        if (!this.checkoutModal) return;

        this.cartItems = cartItems || [];
        this.cartTotal = totalPrice || 0;
        this.cartItemCount = totalItems || 0;

        this.updateCartTotal();
        this.updateAllLabels();
        this.fillSavedData();
        this.resetTimeSelection();
        
        // 🆕 Direct Order auto-select
        this.selectOrderMethod('direct');
        this.selectedPaymentMethod = '';

        this.checkoutModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        this.setButtonState('waiting');

        if (this.location) {
            this.location.setLanguage(this.currentLang);
            this.location.start(
                (data) => this.onLocationFound(data),
                (error) => this.onLocationError(error)
            );
        }
    }

    close() {
        if (!this.checkoutModal) return;

        if (this.location) {
            this.location.stop();
        }
        
        this.stopOrderTracking();
        this.clearForm();

        this.checkoutModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    clearForm() {
        if (this.customerName) this.customerName.value = '';
        if (this.customerPhone) this.customerPhone.value = '';
        if (this.villageCity) this.villageCity.value = '';
        if (this.landmark) this.landmark.value = '';
        if (this.pincode) this.pincode.value = '';
        if (this.manualTimeInput) this.manualTimeInput.value = '';

        this.deliveryTimeRadios?.forEach(r => r.checked = false);
        document.querySelectorAll('.time-radio-label').forEach(l => l.classList.remove('selected'));
        document.querySelectorAll('.form-input').forEach(el => {
            el.classList.remove('error', 'valid');
        });
        
        // 🆕 Payment method reset
        this.selectedPaymentMethod = '';
        document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('selected'));
    }

    resetTimeSelection() {
        const nowRadio = document.querySelector('input[value="अभी"]') || 
                         document.querySelector('input[value="Now"]');
        if (nowRadio) nowRadio.checked = true;
        if (this.manualTimeInput) this.manualTimeInput.value = '';
        this.updateTimeSelection();
    }

    onLocationFound(data) {
        console.log('📍 Location found!', data);
        this.setButtonState('ready');
    }

    onLocationError(error) {
        console.log('📍 Location error:', error);
        this.setButtonState('gpsoff');
    }

    updateCartTotal() {
        if (this.checkoutItemCount) {
            this.checkoutItemCount.textContent = this.getMsg('cartTotal', 'items').replace('{count}', this.cartItemCount);
        }
        if (this.checkoutTotal) {
            this.checkoutTotal.textContent = `₹${this.cartTotal}`;
        }
    }

    updateAllLabels() {
        const title = document.getElementById('checkoutTitle');
        const subtitle = document.querySelector('.checkout-subtitle');
        if (title) title.textContent = this.getMsg('header', 'title');
        if (subtitle) subtitle.textContent = this.getMsg('header', 'subtitle');

        this.updateCartTotal();

        if (this.customerName) this.customerName.placeholder = this.getMsg('form', 'namePlaceholder');
        if (this.customerPhone) this.customerPhone.placeholder = this.getMsg('form', 'phonePlaceholder');
        if (this.villageCity) this.villageCity.placeholder = this.getMsg('form', 'villagePlaceholder');
        if (this.landmark) this.landmark.placeholder = this.getMsg('form', 'landmarkPlaceholder');
        if (this.pincode) this.pincode.placeholder = this.getMsg('form', 'pincodePlaceholder');

        const timeLabel = document.querySelector('.delivery-time-label span:last-child');
        if (timeLabel) timeLabel.textContent = this.getMsg('form', 'deliveryTime');

        const nowLabel = document.querySelector('label[for="timeNow"] span:last-child');
        const eve1Label = document.querySelector('label[for="timeEve1"] span:last-child');
        const eve2Label = document.querySelector('label[for="timeEve2"] span:last-child');
        if (nowLabel) nowLabel.textContent = this.getMsg('form', 'now');
        if (eve1Label) eve1Label.textContent = this.getMsg('form', 'evening1');
        if (eve2Label) eve2Label.textContent = this.getMsg('form', 'evening2');

        if (this.manualTimeInput) this.manualTimeInput.placeholder = this.getMsg('form', 'manual');

        const saveText = document.querySelector('.checkbox-label span:last-child');
        if (saveText) saveText.textContent = this.getMsg('form', 'saveInfo');

        const methodLabel = document.querySelector('.order-method-label span:last-child');
        if (methodLabel) methodLabel.textContent = this.getMsg('form', 'orderMethod');

        const whatsappBtnText = document.querySelector('#whatsappMethodBtn .method-btn-text');
        const directBtnText = document.querySelector('#directMethodBtn .method-btn-text');
        if (whatsappBtnText) whatsappBtnText.textContent = this.getMsg('form', 'whatsappMethod');
        if (directBtnText) directBtnText.textContent = this.getMsg('form', 'directMethod');

        const whatsappBtnSubtext = document.querySelector('#whatsappMethodBtn .method-btn-subtext');
        const directBtnSubtext = document.querySelector('#directMethodBtn .method-btn-subtext');
        if (whatsappBtnSubtext) whatsappBtnSubtext.textContent = this.getMsg('form', 'whatsappSubtext');
        if (directBtnSubtext) directBtnSubtext.textContent = this.getMsg('form', 'directSubtext');

        // Payment method labels
        const paymentTitle = document.querySelector('.payment-method-title');
        if (paymentTitle) paymentTitle.textContent = this.getMsg('paymentMethod', 'title');

        const upiLabel = document.querySelector('[data-payment="UPI"] .pm-text');
        const cardLabel = document.querySelector('[data-payment="Card"] .pm-text');
        const codLabel = document.querySelector('[data-payment="COD"] .pm-text');
        if (upiLabel) upiLabel.textContent = this.getMsg('paymentMethod', 'upi');
        if (cardLabel) cardLabel.textContent = this.getMsg('paymentMethod', 'card');
        if (codLabel) codLabel.textContent = this.getMsg('paymentMethod', 'cod');

        if (this.location?.isReady()) {
            this.setButtonState('ready');
        } else if (this.location?.isSearching) {
            this.setButtonState('waiting');
        } else {
            this.setButtonState('gpsoff');
        }
    }

    setButtonState(state) {
        if (!this.confirmOrderBtn) return;

        this.confirmOrderBtn.classList.remove('state-waiting', 'state-gpsoff', 'state-ready', 'state-sending');

        const existingSpinner = this.confirmOrderBtn.querySelector('.btn-spinner');
        if (existingSpinner) existingSpinner.remove();

        const btnText = this.confirmOrderBtn.querySelector('span:last-child');
        const whatsappIcon = this.confirmOrderBtn.querySelector('.whatsapp-icon');

        switch (state) {
            case 'waiting':
                this.confirmOrderBtn.classList.add('state-waiting');
                this.confirmOrderBtn.disabled = true;
                if (btnText) btnText.textContent = this.getMsg('button', 'waiting');
                this.confirmOrderBtn.insertAdjacentHTML('afterbegin', '<span class="btn-spinner"></span>');
                if (whatsappIcon) whatsappIcon.style.display = 'none';
                break;

            case 'gpsoff':
                this.confirmOrderBtn.classList.add('state-gpsoff');
                this.confirmOrderBtn.disabled = false;
                if (btnText) btnText.textContent = this.getMsg('button', 'gpsoff');
                if (whatsappIcon) whatsappIcon.style.display = 'none';
                break;

            case 'ready':
                this.confirmOrderBtn.classList.add('state-ready');
                this.confirmOrderBtn.disabled = false;
                if (this.selectedOrderMethod === 'direct') {
                    if (btnText) btnText.textContent = this.getMsg('button', 'readyDirect');
                    if (whatsappIcon) whatsappIcon.style.display = 'none';
                } else {
                    if (btnText) btnText.textContent = this.getMsg('button', 'readyWhatsapp');
                    if (whatsappIcon) whatsappIcon.style.display = 'inline';
                }
                break;

            case 'sending':
                this.confirmOrderBtn.classList.add('state-sending');
                this.confirmOrderBtn.disabled = true;
                if (btnText) btnText.textContent = this.getMsg('button', 'sending');
                this.confirmOrderBtn.insertAdjacentHTML('afterbegin', '<span class="btn-spinner"></span>');
                if (whatsappIcon) whatsappIcon.style.display = 'none';
                break;
        }
    }

    handleOrderButton() {
        if (this.confirmOrderBtn.classList.contains('state-gpsoff')) {
            if (this.location) {
                this.location.showPopup();
            }
            return;
        }

        if (this.confirmOrderBtn.classList.contains('state-ready')) {
            this.submitOrder();
            return;
        }
    }

    validatePhone() {
        if (!this.customerPhone) return;

        const phone = this.customerPhone.value.replace(/\D/g, '');

        if (phone.length === 0) {
            this.customerPhone.classList.remove('error', 'valid');
            return;
        }

        if (phone.length === 10 && /^[6-9]/.test(phone)) {
            this.customerPhone.classList.remove('error');
            this.customerPhone.classList.add('valid');
        } else {
            this.customerPhone.classList.remove('valid');
            this.customerPhone.classList.add('error');
        }
    }

    // ============================================
    // 🔥 SUBMIT ORDER
    // ============================================
    async submitOrder() {
        const name = this.customerName?.value?.trim();
        const phone = this.customerPhone?.value?.replace(/\D/g, '');
        const villageCity = this.villageCity?.value?.trim();

        // Validate Name
        if (!name || name.length < 2) {
            this.showToast(this.getMsg('toast', 'nameRequired'));
            this.customerName?.classList.add('error');
            this.customerName?.focus();
            return;
        }
        this.customerName?.classList.remove('error');

        // Validate Phone
        if (!phone || phone.length !== 10 || !/^[6-9]/.test(phone)) {
            this.showToast(this.getMsg('toast', 'phoneRequired'));
            this.customerPhone?.classList.add('error');
            this.customerPhone?.focus();
            return;
        }
        this.customerPhone?.classList.remove('error');

        // Validate Village/City
        if (!villageCity || villageCity.length < 2) {
            this.showToast(this.getMsg('toast', 'cityRequired'));
            this.villageCity?.classList.add('error');
            this.villageCity?.focus();
            return;
        }
        this.villageCity?.classList.remove('error');

        // 🆕 PAYMENT METHOD CHECK (Direct Order में)
        if (this.selectedOrderMethod === 'direct') {
            if (!this.selectedPaymentMethod) {
                this.showToast(this.getMsg('paymentMethod', 'required'));
                return;
            }
        }

        // 🆕 USER LOGIN CHECK (Direct Order में)
        if (this.selectedOrderMethod === 'direct') {
            const userPhone = localStorage.getItem('userPhone');
            if (!userPhone) {
                this.showToast(this.getMsg('toast', 'loginRequired'));
                if (typeof openLoginPopup === 'function') {
                    openLoginPopup();
                }
                return;
            }
        }

        // 🆕 USER BLOCK CHECK
        try {
            const apiUrl = window.googleSheetsOrders?.API_URL || 'https://script.google.com/macros/s/AKfycbxiTbffb6_uPM2s5k9zTJ9WUEiexzepmKhM6UF2R4sUHKeFBhR8j9h24OiFnSxjyO6L/exec';
            const blockResponse = await fetch(`${apiUrl}?action=checkUserBlockedForOrder&phone=${phone}`);
            const blockData = await blockResponse.json();
            
            if (blockData.success && blockData.blocked) {
                alert('🚫 आपको admin ने block कर दिया है। आप order नहीं कर सकते।\n\nकारण: ' + (blockData.reason || 'नहीं बताया गया'));
                this.close();
                return;
            }
        } catch (error) {
            console.log('⚠️ Block check error:', error);
        }

        // Get location
        const lat = document.getElementById('latitude')?.value;
        const lng = document.getElementById('longitude')?.value;
        const locationUrl = document.getElementById('locationUrl')?.value;

        let locationData = { lat: '', lng: '', url: '' };

        if (lat && lng && parseFloat(lat) !== 0 && parseFloat(lng) !== 0) {
            locationData = {
                lat: lat,
                lng: lng,
                url: locationUrl || `https://maps.google.com/?q=${lat},${lng}`
            };
        } else if (this.location && this.location.isReady()) {
            locationData = this.location.getData();
        }

        if (!locationData.lat || !locationData.lng || 
            parseFloat(locationData.lat) === 0 || parseFloat(locationData.lng) === 0) {
            this.showToast(this.getMsg('toast', 'gpsRequired'));
            if (this.location) {
                this.location.showPopup();
            }
            return;
        }

        this.setButtonState('sending');
        this.saveUserInfo();

        const deliveryTime = this.getSelectedDeliveryTime();

        const orderData = {
            customer: {
                name: name,
                phone: '+91 ' + phone,
                villageCity: villageCity,
                landmark: this.landmark?.value?.trim() || '',
                pincode: this.pincode?.value?.trim() || '',
                deliveryTime: deliveryTime,
            },
            items: this.cartItems,
            totals: {
                total: this.cartTotal,
                itemCount: this.cartItemCount,
            },
            location: locationData,
            orderMethod: this.selectedOrderMethod,
            paymentMethod: this.selectedPaymentMethod,
        };

        console.log('📦 Final Order Data:', JSON.stringify(orderData, null, 2));

        if (this.selectedOrderMethod === 'direct') {
            this.submitDirectOrder(orderData);
        } else {
            this.submitWhatsAppOrder(orderData);
        }
    }

    // ============================================
    // SUBMIT WHATSAPP ORDER
    // ============================================
    submitWhatsAppOrder(orderData) {
        if (window.whatsappManager?.sendOrder) {
            window.whatsappManager.sendOrder(orderData);
        } else {
            this.sendDirectWhatsApp(orderData);
        }

        this.saveToOrderHistory(orderData);
        this.triggerConfetti();
        this.showSuccessPopup(orderData);
        this.finalizeOrder('whatsapp');
    }

    // ============================================
    // SUBMIT DIRECT ORDER (Payment Integration)
    // ============================================
    async submitDirectOrder(orderData) {
        if (window.googleSheetsOrders) {
            try {
                const result = await window.googleSheetsOrders.saveOrder(orderData);
                
                if (result && result.orderId) {
                    console.log('✅ Direct order Google Sheet में save हो गया, Order ID:', result.orderId);
                    orderData.orderId = result.orderId;
                    
                    // 🆕 Payment Popup खोलें (UPI के लिए)
                    if (this.selectedPaymentMethod === 'UPI') {
                        if (window.onlinePaymentManager) {
                            window.onlinePaymentManager.show(orderData);
                        }
                    }
                    
                    // COD के लिए सीधा order
                    if (this.selectedPaymentMethod === 'COD') {
                        if (window.onlinePaymentManager) {
                            window.onlinePaymentManager.savePaymentToSheet('COD', 0, this.cartTotal);
                        }
                    }
                    
                    // Order tracking शुरू करें
                    if (window.orderStatusPopup) {
                        console.log('🔄 Starting real-time order tracking...');
                        window.orderStatusPopup.startTracking(result.orderId);
                    } else {
                        this.startOrderTracking(result.orderId);
                    }
                } else {
                    console.log('⚠️ Direct order Google Sheet में save नहीं हुआ');
                }
            } catch (error) {
                console.log('⚠️ Google Sheets error:', error.message);
            }
        } else {
            console.log('⚠️ Google Sheets Orders system not loaded');
        }
        
        this.saveToOrderHistory(orderData);
        this.triggerConfetti();
       
        this.finalizeOrder('direct');
    }

    // ============================================
    // SAVE TO ORDER HISTORY
    // ============================================
    saveToOrderHistory(orderData) {
        if (window.ordersManager?.saveOrder) {
            window.ordersManager.saveOrder({
                items: this.cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    unit: item.unit,
                    discount: item.discount || 0,
                    quantity: item.quantity || 1,
                })),
                total: this.cartTotal,
                itemCount: this.cartItemCount,
                deliveryTime: orderData.customer.deliveryTime,
                location: orderData.location,
                orderMethod: orderData.orderMethod,
                paymentMethod: orderData.paymentMethod,
            });
        }
    }

    showSuccessPopup(orderData) {
        setTimeout(() => {
            if (window.orderPopupManager) {
                window.orderPopupManager.showSuccessPopup({
                    itemCount: this.cartItemCount,
                    total: this.cartTotal,
                    deliveryTime: orderData.customer.deliveryTime,
                });
            }
        }, 6000);
    }

    finalizeOrder(method) {
        setTimeout(() => {
            this.close();

            if (window.cartManager) {
                window.cartManager.cart = [];
                window.cartManager.saveCart();
                window.cartManager.updateBadge();
                if (!document.getElementById('cartModal')?.classList.contains('hidden')) {
                    window.cartManager.closeCart();
                }
            }

            if (method === 'direct') {
                this.showToast(this.getMsg('toast', 'orderSentDirect'));
            } else {
                this.showToast(this.getMsg('toast', 'orderSent'));
            }
        }, 2000);
    }

    getSelectedDeliveryTime() {
        const checkedRadio = document.querySelector('input[name="deliveryTime"]:checked');
        if (checkedRadio) return checkedRadio.value;

        const manualTime = this.manualTimeInput?.value?.trim();
        if (manualTime) return manualTime;

        return this.currentLang === 'hi' ? 'अभी' : 'Now';
    }

    sendDirectWhatsApp(orderData) {
        const isHindi = this.currentLang === 'hi';

        let message = isHindi
            ? '🛒 *Quick Dukan - नया ऑर्डर*\n\n━━━━━━━━━━━━━━━━\n\n'
            : '🛒 *Quick Dukan - New Order*\n\n━━━━━━━━━━━━━━━━\n\n';

        orderData.items.forEach((item, index) => {
            const name = typeof item.name === 'object' 
                ? (item.name[this.currentLang] || item.name.hi || item.name.en) 
                : item.name;
            const unit = typeof item.unit === 'object' 
                ? (item.unit[this.currentLang] || item.unit.hi || item.unit.en) 
                : (item.unit || '');
            message += `${index + 1}. *${name}*\n   ${unit} × ${item.quantity || 1} = ₹${(item.price || 0) * (item.quantity || 1)}\n`;
        });

        message += '\n━━━━━━━━━━━━━━━━\n';
        message += isHindi
            ? `📦 कुल: ${orderData.totals.itemCount} आइटम | 💰 कुल राशि: ₹${orderData.totals.total}\n\n`
            : `📦 Total: ${orderData.totals.itemCount} items | 💰 Total: ₹${orderData.totals.total}\n\n`;

        message += isHindi ? '👤 *ग्राहक जानकारी:*\n' : '👤 *Customer Info:*\n';
        message += `${orderData.customer.name}\n`;
        message += `${orderData.customer.phone}\n`;
        message += `${orderData.customer.villageCity}`;
        if (orderData.customer.landmark) message += `, ${orderData.customer.landmark}`;
        message += '\n';
        if (orderData.customer.deliveryTime) {
            message += isHindi 
                ? `⏱️ डिलीवरी: ${orderData.customer.deliveryTime}\n` 
                : `⏱️ Delivery: ${orderData.customer.deliveryTime}\n`;
        }
        if (orderData.location.url) {
            message += `\n📍 ${orderData.location.url}\n`;
        }
        message += isHindi ? '\n🙏 कृपया ऑर्डर कन्फर्म करें।' : '\n🙏 Please confirm the order.';

        const whatsappNumber = window.CONFIG?.whatsappNumber || '919719312956';
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }

    saveUserInfo() {
        if (!this.saveInfo?.checked) return;

        const data = {
            name: this.customerName?.value || '',
            phone: this.customerPhone?.value || '',
            villageCity: this.villageCity?.value || '',
            landmark: this.landmark?.value || '',
            pincode: this.pincode?.value || '',
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {}
    }

    fillSavedData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;

            const data = JSON.parse(saved);

            if (this.customerName && data.name) this.customerName.value = data.name;
            if (this.customerPhone && data.phone) {
                this.customerPhone.value = data.phone;
                this.validatePhone();
            }
            if (this.villageCity && data.villageCity) this.villageCity.value = data.villageCity;
            if (this.landmark && data.landmark) this.landmark.value = data.landmark;
            if (this.pincode && data.pincode) this.pincode.value = data.pincode;
        } catch (e) {}
    }

    triggerConfetti() {
        if (!this.confettiContainer) return;

        const colors = ['#FF9933', '#138808', '#FFD700', '#FF4444', '#25D366', '#FF6D00'];

        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            piece.style.animationDuration = (Math.random() * 1 + 1) + 's';
            this.confettiContainer.appendChild(piece);
            setTimeout(() => piece.remove(), 2000);
        }
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = msg;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2500);
    }

    destroy() {
        if (this.location) {
            this.location.stop();
        }
        this.stopOrderTracking();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
});