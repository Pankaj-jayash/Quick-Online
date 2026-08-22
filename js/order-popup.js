// ============================================
// ORDER-POPUP.JS - Order Popups Logic
// Quick Dukan - Map Only on Confirm | Unclosable Delivery | Celebration
// ============================================

class OrderPopupManager {
    constructor() {
        this.currentLang = 'hi';
        this.activePopup = null;
        this.deliveryRetryInterval = null;
        this.unansweredPopup = null;
        this.celebrationTimer = null;
        
        this.init();
        console.log('✅ Order Popup Manager Initialized');
    } 
    
    init() {
        this.detectLanguage();
        
        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
        });
        
        // PWA Reopen — check for unanswered popup
        window.addEventListener('pageshow', () => {
            setTimeout(() => this.checkUnansweredPopup(), 500);
        });
        
        // Visibility change — when user returns to tab
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.unansweredPopup) {
                setTimeout(() => {
                    this.showStoredPopup();
                }, 500);
            }
        });
    }
    
    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }
    
    getMsg(key) {
        const messages = {
            hi: {
                // Success Popup
                successTitle: '🎉 ऑर्डर तैयार है!',
                successMessage: 'आपका ऑर्डर पैक हो गया है। क्या हम इसे आपके पास भेजें?',
                confirmBtn: '✅ हाँ, लाएं!',
                cancelBtn: '❌ रद्द करें',
                
                // Cancel Popup
                cancelTitle: '😔 ऑर्डर रद्द करें',
                cancelMessage: 'कृपया बताएं कि आप ऑर्डर क्यों रद्द करना चाहते हैं?',
                cancelPlaceholder: 'कारण लिखें...',
                sendReasonBtn: '📤 कारण भेजें',
                skipBtn: 'बिना कारण छोड़ें',
                
                // Delivery Popup
                deliveryTitle: '🚚 डिलीवरी कन्फर्मेशन',
                deliveryMessage: 'क्या आपका ऑर्डर आ गया?',
                yesBtn: '✅ हाँ, आ गया!',
                noBtn: '❌ नहीं आया',
                retryMessage: '⏱️ समय बढ़ा दिया गया, जल्द ही पहुँचेगा!',
                
                // Celebration Popup
                celebrationTitle: '🎊 धन्यवाद!',
                celebrationMessage: 'आपका ऑर्डर सफलतापूर्वक डिलीवर हो गया!',
                celebrationSubMessage: 'हमें खुशी है कि हम आपकी सेवा कर पाए! 🙏',
                celebrationStars: '⭐⭐⭐⭐⭐',
                reorderBtn: '🛒 फिर से ऑर्डर करें',
                browseBtn: '🏪 और प्रोडक्ट देखें',
                closeBtn: '✕ बंद करें',
                
                // Toast
                confirmed: '✅ ऑर्डर कन्फर्म हो गया!',
                cancelled: '❌ ऑर्डर रद्द कर दिया',
                delivered: '🎉 ऑर्डर डिलीवर हो गया!',
                reasonSent: '📤 कारण भेज दिया गया',
                mapOpened: '🗺️ लाइव ट्रैकिंग शुरू!',
                orderComplete: '🎉 आपका ऑर्डर पूरा हुआ! धन्यवाद!',
                welcomeBack: 'फिर मिलेंगे! ❤️',
            },
            en: {
                successTitle: '🎉 Order Ready!',
                successMessage: 'Your order is packed. Shall we send it to you?',
                confirmBtn: '✅ Yes, Send it!',
                cancelBtn: '❌ Cancel Order',
                
                cancelTitle: '😔 Cancel Order',
                cancelMessage: 'Please tell us why you want to cancel?',
                cancelPlaceholder: 'Write reason...',
                sendReasonBtn: '📤 Send Reason',
                skipBtn: 'Skip without reason',
                
                deliveryTitle: '🚚 Delivery Confirmation',
                deliveryMessage: 'Has your order arrived?',
                yesBtn: '✅ Yes, Arrived!',
                noBtn: '❌ Not Yet',
                retryMessage: '⏱️ Time extended, arriving soon!',
                
                // Celebration Popup
                celebrationTitle: '🎊 Thank You!',
                celebrationMessage: 'Your order has been delivered successfully!',
                celebrationSubMessage: 'We are happy to serve you! 🙏',
                celebrationStars: '⭐⭐⭐⭐⭐',
                reorderBtn: '🛒 Order Again',
                browseBtn: '🏪 Browse Products',
                closeBtn: '✕ Close',
                
                // Toast
                confirmed: '✅ Order Confirmed!',
                cancelled: '❌ Order Cancelled',
                delivered: '🎉 Order Delivered!',
                reasonSent: '📤 Reason sent',
                mapOpened: '🗺️ Live tracking started!',
                orderComplete: '🎉 Your order is complete! Thank you!',
                welcomeBack: 'See you again! ❤️',
            }
        };
        
        return messages[this.currentLang]?.[key] || messages.hi[key] || key;
    }
    
    // ============================================
    // CHECK UNANSWERED POPUP (PWA Reopen)
    // ============================================
    checkUnansweredPopup() {
        if (!window.ordersManager) return;
        
        const orders = window.ordersManager.getOrders();
        const activeOrder = orders.find(o => o.status === 'confirmed' || o.status === 'in_transit');
        
        if (activeOrder && this.unansweredPopup) {
            console.log('🔄 PWA reopened — showing stored popup');
            this.showStoredPopup();
        }
    }
    
    showStoredPopup() {
        if (!this.unansweredPopup) return;
        
        const { type, order } = this.unansweredPopup;
        
        if (type === 'delivery' && order) {
            this.showDeliveryPopup(order);
        }
    }
    
    // ============================================
    // POPUP 1: SUCCESS (Confirm/Cancel)
    // ============================================
   showSuccessPopup(orderData) {
        this.hidePopup();
        
        const overlay = document.createElement('div');
        overlay.className = 'order-popup-overlay';
        overlay.id = 'orderSuccessPopup';
        
        const isHindi = this.currentLang === 'hi';
        
        overlay.innerHTML = `
            <div class="order-popup-card">
                <div class="popup-icon">🛵</div>
                
                <!-- ⚠️ WHATSAPP WARNING — Eye-catching -->
                <div style="
                    background: linear-gradient(135deg, #FFF8E1, #FFF3E0);
                    border: 2.5px solid #FF6D00;
                    border-radius: 14px;
                    padding: 14px 16px;
                    margin-bottom: 16px;
                    text-align: center;
                    box-shadow: 0 2px 12px rgba(255, 109, 0, 0.18);
                    position: relative;
                ">
                    <div style="
                        position: absolute;
                        top: -14px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #FF6D00;
                        color: white;
                        font-size: 10px;
                        font-weight: 800;
                        padding: 4px 14px;
                        border-radius: 20px;
                        letter-spacing: 0.5px;
                        white-space: nowrap;
                    ">
                        ⚠️ ${isHindi ? 'ज़रूरी सूचना' : 'IMPORTANT'}
                    </div>
                    <span style="font-size: 28px; display: block; margin-top: 6px;">📱</span>
                    <p style="
                        font-size: 14px;
                        font-weight: 800;
                        color: #BF360C;
                        margin: 8px 0 0 0;
                        line-height: 1.6;
                        letter-spacing: 0.2px;
                    ">
                        ${isHindi 
                            ? 'क्या आपने WhatsApp पर ऑर्डर भेज दिया?'
                            : 'Did you send the order on WhatsApp?'}
                    </p>
                    <p style="
                        font-size: 12px;
                        color: #E65100;
                        margin: 4px 0 0 0;
                        font-weight: 600;
                        line-height: 1.5;
                    ">
                        ${isHindi 
                            ? 'अगर हाँ, तभी नीचे <span style="background:#FFE0B2;padding:2px 8px;border-radius:4px;font-weight:800;">✅ हाँ, लाएं!</span> दबाएँ'
                            : 'Only then press <span style="background:#FFE0B2;padding:2px 8px;border-radius:4px;font-weight:800;">✅ Yes, Send it!</span> below'}
                    </p>
                    <p style="
                        font-size: 11px;
                        color: #888;
                        margin: 4px 0 0 0;
                        font-style: italic;
                    ">
                        ${isHindi 
                            ? 'नहीं भेजा? → पहले WhatsApp खोलकर भेजें, फिर वापस आएँ'
                            : 'Not sent? → Open WhatsApp & send first, then come back'}
                    </p>
                </div>
                
                <h2 class="popup-title">${this.getMsg('successTitle')}</h2>
                <p class="popup-message">${this.getMsg('successMessage')}</p>
                
                <div class="popup-order-info">
                    <span>📦 ${orderData.itemCount || 0} ${isHindi ? 'आइटम' : 'items'}</span>
                    <span>💰 ₹${orderData.total || 0}</span>
                    <span>⏱️ ${orderData.deliveryTime || (isHindi ? 'अभी' : 'Now')}</span>
                </div>
                
                <!-- 💳 PAYMENT PREVIEW — Attractive -->
                <div style="
                    background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
                    border: 2px solid #4CAF50;
                    border-radius: 14px;
                    padding: 14px 12px;
                    margin: 12px 0 8px 0;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(76, 175, 80, 0.15);
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        margin-bottom: 6px;
                    ">
                        <span style="font-size: 24px;">💳</span>
                        <span style="font-size: 24px;">📱</span>
                        <span style="font-size: 24px;">🏍️</span>
                    </div>
                    <p style="
                        font-size: 13px;
                        font-weight: 700;
                        color: #1B5E20;
                        margin: 0 0 4px 0;
                    ">
                        ${isHindi 
                            ? 'Confirm के बाद आप भुगतान कर पाएँगे!'
                            : 'You can pay after confirming!'}
                    </p>
                    <p style="
                        font-size: 11px;
                        color: #2E7D32;
                        margin: 0;
                        font-weight: 500;
                        line-height: 1.5;
                    ">
                        ${isHindi 
                            ? 'UPI • QR Code • Google Pay • PhonePe • Paytm • Cash on Delivery'
                            : 'UPI • QR Code • Google Pay • PhonePe • Paytm • Cash on Delivery'}
                    </p>
                </div>
                
                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-confirm" id="btnConfirmOrder" type="button"
                        style="
                            background: linear-gradient(135deg, #2E7D32, #43A047);
                            font-size: 15px;
                            font-weight: 700;
                            box-shadow: 0 4px 14px rgba(46, 125, 50, 0.35);
                        ">
                        ${this.getMsg('confirmBtn')}
                    </button>
                    <button class="popup-btn popup-btn-cancel" id="btnCancelOrder" type="button">
                        ${this.getMsg('cancelBtn')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        const btnConfirm = overlay.querySelector('#btnConfirmOrder');
        const btnCancel = overlay.querySelector('#btnCancelOrder');
        
        btnConfirm.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.confirmOrder(orderData);
            this.hidePopup();
        };
        
        btnCancel.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hidePopup();
            setTimeout(() => this.showCancelReasonPopup(orderData), 300);
        };
        
        this.activePopup = 'success';
    }
    
    // // ============================================
// CONFIRM ORDER — MAP + PAYMENT POPUP OPENS
// ============================================
confirmOrder(orderData) {
    if (window.ordersManager) {
        const orders = window.ordersManager.getOrders();
        const order = orders[0];
        
        if (order) {
            window.ordersManager.updateOrderStatus(order.id, 'confirmed');
            
            // 🔥 PAYMENT POPUP — Confirm ke baad khulega
            setTimeout(() => {
                if (window.paymentPopupManager) {
                    window.paymentPopupManager.show({
                        total: orderData.total || 0,
                        itemCount: orderData.itemCount || 0,
                        deliveryTime: orderData.deliveryTime || '',
                        orderData: orderData
                    });
                }
            }, 400);
            
            // MAP SIRF YAHIN SE OPEN HOGA
            setTimeout(() => {
                if (window.floatingMapManager) {
                    // Check if map already running for another order
                    const isMapRunning = window.floatingMapManager.timerInterval || 
                                        window.floatingMapManager.riderInterval;
                    
                    if (isMapRunning) {
                        console.log('🗺️ Map already running for previous order — keeping it');
                        this.showToast(this.getMsg('confirmed'));
                    } else {
                        const updatedOrder = window.ordersManager.getOrderById(order.id);
                        if (updatedOrder && updatedOrder.tracking?.customerLocation) {
                            window.floatingMapManager.show();
                            window.floatingMapManager.updateMapWithOrder(updatedOrder);
                            this.showToast(this.getMsg('mapOpened'));
                        } else {
                            console.warn('⚠️ No customer location found for tracking');
                            this.showToast(this.getMsg('confirmed'));
                        }
                    }
                } else {
                    this.showToast(this.getMsg('confirmed'));
                }
            }, 15000);
        }
    }
}
    
    // ============================================
    // POPUP 2: CANCEL REASON
    // ============================================
    showCancelReasonPopup(orderData) {
        this.hidePopup();
        
        const overlay = document.createElement('div');
        overlay.className = 'order-popup-overlay';
        overlay.id = 'orderCancelPopup';
        
        overlay.innerHTML = `
            <div class="order-popup-card">
                <div class="popup-icon">😔</div>
                <h2 class="popup-title">${this.getMsg('cancelTitle')}</h2>
                <p class="popup-message">${this.getMsg('cancelMessage')}</p>
                <textarea class="cancel-reason-textarea" id="cancelReasonInput" 
                          rows="3" placeholder="${this.getMsg('cancelPlaceholder')}"></textarea>
                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-send" id="btnSendReason" type="button">
                        ${this.getMsg('sendReasonBtn')}
                    </button>
                    <button class="popup-btn-skip" id="btnSkipCancel" type="button">
                        ${this.getMsg('skipBtn')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        const btnSend = overlay.querySelector('#btnSendReason');
        const btnSkip = overlay.querySelector('#btnSkipCancel');
        
        btnSend.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const reason = document.getElementById('cancelReasonInput')?.value?.trim();
            this.cancelOrder(orderData, reason || 'कोई कारण नहीं');
            this.hidePopup();
        };
        
        btnSkip.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.cancelOrder(orderData, 'कोई कारण नहीं');
            this.hidePopup();
        };
        
        setTimeout(() => {
            document.getElementById('cancelReasonInput')?.focus();
        }, 500);
        
        this.activePopup = 'cancel';
    }
    
    // ============================================
    // CANCEL ORDER — MAP NAHI KHULEGA
    // ============================================
    cancelOrder(orderData, reason) {
        if (window.ordersManager) {
            const orders = window.ordersManager.getOrders();
            const order = orders[0];
            
            if (order) {
                window.ordersManager.updateOrderStatus(order.id, 'cancelled');
                window.ordersManager.addCancelReason(order.id, reason);
                this.sendCancelWhatsApp(orderData, reason);
            }
        }
        
        if (window.floatingMapManager) {
            window.floatingMapManager.hide();
            window.floatingMapManager.stopTimer();
            window.floatingMapManager.stopRiderUpdates();
        }
        
        this.showToast(this.getMsg('cancelled'));
    }
    
    sendCancelWhatsApp(orderData, reason) {
        const isHindi = this.currentLang === 'hi';
        
        let message = isHindi
            ? '❌ *Quick Dukan - ऑर्डर रद्द*\n\n'
            : '❌ *Quick Dukan - Order Cancelled*\n\n';
        
        message += isHindi ? 'कारण: ' : 'Reason: ';
        message += reason + '\n\n';
        
        message += isHindi
            ? `📦 ऑर्डर: ${orderData.itemCount} आइटम | 💰 ₹${orderData.total}\n`
            : `📦 Order: ${orderData.itemCount} items | 💰 ₹${orderData.total}\n`;
        
        message += isHindi ? '\n🙏 धन्यवाद!' : '\n🙏 Thank you!';
        
        const phoneNumber = window.CONFIG?.whatsappNumber || '919719312956';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        this.showToast(this.getMsg('reasonSent'));
    }
    
    // ============================================
    // POPUP 3: DELIVERY CONFIRMATION (UNCLOSABLE)
    // ============================================
    showDeliveryPopup(order) {
        this.hidePopup();
        
        this.unansweredPopup = { type: 'delivery', order: order };
        
        const overlay = document.createElement('div');
        overlay.className = 'order-popup-overlay';
        overlay.id = 'orderDeliveryPopup';
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                e.stopPropagation();
                e.preventDefault();
            }
        });
        
        const isHindi = this.currentLang === 'hi';
        
        overlay.innerHTML = `
            <div class="order-popup-card" style="pointer-events:auto;">
                <div class="popup-icon">🚚</div>
                <h2 class="popup-title">${this.getMsg('deliveryTitle')}</h2>
                <p class="popup-message">${this.getMsg('deliveryMessage')}</p>
                <div class="popup-order-info">
                    <span>📦 #${order.id}</span>
                    <span>💰 ₹${order.total}</span>
                    <span>⏱️ ${order.deliveryTime || ''}</span>
                </div>
                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-yes" id="btnDeliveryYes" type="button">
                        ${this.getMsg('yesBtn')}
                    </button>
                    <button class="popup-btn popup-btn-no" id="btnDeliveryNo" type="button">
                        ${this.getMsg('noBtn')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        document.addEventListener('keydown', escapeHandler, true);
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        const btnYes = overlay.querySelector('#btnDeliveryYes');
        const btnNo = overlay.querySelector('#btnDeliveryNo');
        
        btnYes.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener('keydown', escapeHandler, true);
            this.confirmDelivery(order);
            this.hidePopup();
        };
        
        btnNo.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener('keydown', escapeHandler, true);
            this.retryDelivery(order);
            this.hidePopup();
        };
        
        this.activePopup = 'delivery';
    }
    
    // ============================================
    // CONFIRM DELIVERY — SHOW CELEBRATION POPUP
    // ============================================
    confirmDelivery(order) {
        this.unansweredPopup = null;
        
        if (window.ordersManager) {
            window.ordersManager.updateOrderStatus(order.id, 'delivered');
        }
        
        if (window.floatingMapManager) {
            window.floatingMapManager.hide();
            window.floatingMapManager.stopTimer();
            window.floatingMapManager.stopRiderUpdates();
        }
        
        // 🔥 SHOW CELEBRATION POPUP
        setTimeout(() => {
            this.showCelebrationPopup(order);
        }, 400);
    }
    
    // ============================================
    // RETRY DELIVERY — ADD EXTRA TIME
    // ============================================
    retryDelivery(order) {
        this.unansweredPopup = null;
        
        if (window.ordersManager) {
            window.ordersManager.updateOrderStatus(order.id, 'in_transit');
        }
        
        if (window.floatingMapManager) {
            window.floatingMapManager.addExtraTime();
            window.floatingMapManager.show();
        }
        
        this.showToast(this.getMsg('retryMessage'));
    }
    
    // ============================================
    // 🎉 CELEBRATION POPUP — NEW!
    // ============================================
    showCelebrationPopup(order) {
        this.hidePopup();
        
        const overlay = document.createElement('div');
        overlay.className = 'order-popup-overlay celebration-overlay';
        overlay.id = 'orderCelebrationPopup';
        
        const isHindi = this.currentLang === 'hi';
        const customerName = order.customerName || (isHindi ? 'ग्राहक' : 'Customer');
        
        overlay.innerHTML = `
            <div class="order-popup-card celebration-card">
                <div class="celebration-confetti-container" id="celebrationConfetti"></div>
                <div class="popup-icon celebration-icon">🎉</div>
                <h2 class="popup-title celebration-title">
                    ${customerName} ${isHindi ? 'जी!' : '!'} 🎉
                </h2>
                <p class="popup-message celebration-message">${this.getMsg('celebrationMessage')}</p>
                <p class="celebration-sub-message">${this.getMsg('celebrationSubMessage')}</p>
                <div class="celebration-stars">${this.getMsg('celebrationStars')}</div>
                <div class="popup-order-info">
                    <span>📦 #${order.id}</span>
                    <span>💰 ₹${order.total}</span>
                    <span>📦 ${order.itemCount} ${isHindi ? 'आइटम' : 'items'}</span>
                </div>
                <div class="popup-buttons">
                    <button class="popup-btn popup-btn-confirm celebration-reorder-btn" id="btnCelebrationReorder" type="button">
                        ${this.getMsg('reorderBtn')}
                    </button>
                    <button class="popup-btn celebration-browse-btn" id="btnCelebrationBrowse" type="button">
                        ${this.getMsg('browseBtn')}
                    </button>
                </div>
                <button class="celebration-close-btn" id="btnCelebrationClose" type="button">
                    ${this.getMsg('closeBtn')}
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // 🔥 Trigger confetti
        this.triggerCelebrationConfetti();
        
        // 🔥 Auto-close after 7 seconds
        this.celebrationTimer = setTimeout(() => {
            this.hidePopup();
        }, 7000);
        
        // Button events
        const btnReorder = overlay.querySelector('#btnCelebrationReorder');
        const btnBrowse = overlay.querySelector('#btnCelebrationBrowse');
        const btnClose = overlay.querySelector('#btnCelebrationClose');
        
        btnReorder.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(this.celebrationTimer);
            this.hidePopup();
            // Open cart
            setTimeout(() => {
                if (window.cartManager) {
                    window.cartManager.openCart();
                }
            }, 300);
        };
        
        btnBrowse.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(this.celebrationTimer);
            this.hidePopup();
            // Scroll to products
            setTimeout(() => {
                document.getElementById('allProductsSection')?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        };
        
        btnClose.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(this.celebrationTimer);
            this.hidePopup();
        };
        
        this.activePopup = 'celebration';
    }
    
    // ============================================
    // 🎊 CELEBRATION CONFETTI
    // ============================================
    triggerCelebrationConfetti() {
        const container = document.getElementById('celebrationConfetti');
        if (!container) return;
        
        const colors = ['#FF9933', '#138808', '#FFD700', '#FF4444', '#25D366', '#FF6D00', '#2196F3', '#9C27B0'];
        
        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece celebration-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.8 + 's';
            piece.style.animationDuration = (Math.random() * 1.5 + 1) + 's';
            piece.style.width = (Math.random() * 8 + 4) + 'px';
            piece.style.height = (Math.random() * 8 + 4) + 'px';
            container.appendChild(piece);
            setTimeout(() => piece.remove(), 2500);
        }
    }
    
    // ============================================
    // HIDE POPUP
    // ============================================
    hidePopup() {
        const popups = document.querySelectorAll('.order-popup-overlay');
        popups.forEach(popup => {
            popup.classList.remove('visible');
            setTimeout(() => {
                if (popup.parentNode) popup.remove();
            }, 300);
        });
        
        const otherModals = document.getElementById('checkoutModal');
        if (!otherModals || otherModals.classList.contains('hidden')) {
            document.body.style.overflow = '';
        }
        
        if (this.celebrationTimer) {
            clearTimeout(this.celebrationTimer);
            this.celebrationTimer = null;
        }
        
        this.activePopup = null;
    }
    
    // ============================================
    // TOAST
    // ============================================
    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = msg;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';
        
        setTimeout(() => {
            if (toast) {
                toast.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => {
                    if (toast) toast.classList.add('hidden');
                }, 300);
            }
        }, 2500);
    }
    
    // ============================================
    // DESTROY
    // ============================================
    destroy() {
        this.hidePopup();
        this.unansweredPopup = null;
        if (this.deliveryRetryInterval) {
            clearInterval(this.deliveryRetryInterval);
        }
        if (this.celebrationTimer) {
            clearTimeout(this.celebrationTimer);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.orderPopupManager = new OrderPopupManager();
});