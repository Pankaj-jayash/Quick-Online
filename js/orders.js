// ============================================
// ORDERS.JS - My Orders Logic (Final)
// Quick Dukan - All Statuses | GPS | Tracking | Cancel | Track Fix | Reorder
// ============================================

class OrdersManager {
    constructor() {
        // DOM Elements
        this.ordersModal = document.getElementById('ordersModal');
        this.ordersList = document.getElementById('ordersList');
        this.emptyOrders = document.getElementById('emptyOrders');
        this.closeOrdersBtn = document.getElementById('closeOrders');
        this.ordersOverlay = null;
        this.filterBtns = document.querySelectorAll('.order-filter-btn');
        this.activeFilter = 'all';
        this.storageKey = 'quick-dukan-orders';
        this.expandedOrder = null;
        this.currentLang = 'hi';
        
        // Delivery check interval
        this.deliveryCheckInterval = null;
        
        // Shop location
        this.shopLocation = {
            lat: 27.6667496,
            lng: 77.7124673,
            name: 'Quick Dukan'
        };
        
        if (!this.ordersModal) {
            console.error('❌ Orders Modal not found!');
            return;
        }
        
        this.ordersOverlay = this.ordersModal.querySelector('.orders-overlay');
        this.init();
        console.log('✅ Orders Manager Initialized');
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    init() {
        this.detectLanguage();
        this.bindEvents();
        this.startDeliveryCheck();
    }
    
    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }
    
    bindEvents() {
        // Close button
        this.closeOrdersBtn?.addEventListener('click', () => this.close());
        
        // Overlay click
        this.ordersOverlay?.addEventListener('click', () => this.close());
        
        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setFilter(btn));
        });
        
        // Start shopping button
        document.addEventListener('click', (e) => {
            if (e.target.closest('.start-shopping-btn')) {
                e.preventDefault();
                this.close();
                document.getElementById('allProductsSection')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        // Bottom nav orders button
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-nav="orders"]')) {
                e.preventDefault();
                e.stopPropagation();
                this.open();
            }
        });
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.ordersModal.classList.contains('hidden')) {
                this.close();
            }
        });
        
        // Language change
        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
            this.render();
        });
    }
    
    // ============================================
    // DELIVERY TIME CHECK LOOP
    // ============================================
    startDeliveryCheck() {
        this.deliveryCheckInterval = setInterval(() => {
            this.checkDeliveryTime();
        }, 60000);
        
        setTimeout(() => this.checkDeliveryTime(), 5000);
    }
    
    checkDeliveryTime() {
        const orders = this.getOrders();
        const now = new Date();
        
        orders.forEach(order => {
            if (order.status === 'confirmed' || order.status === 'in_transit') {
                if (order.deliveryTime && !order.deliveryPopupShown) {
                    const deliveryTime = this.parseDeliveryTime(order.deliveryTime);
                    if (deliveryTime && now >= deliveryTime) {
                        order.deliveryPopupShown = true;
                        this.saveOrders(orders);
                        this.triggerDeliveryPopup(order);
                    }
                }
            }
        });
    }
    
    parseDeliveryTime(timeStr) {
        if (!timeStr) return null;
        
        const now = new Date();
        let targetHour = 18;
        
        if (timeStr.includes('5-7') || timeStr.includes('शाम 5-7')) {
            targetHour = 17;
        } else if (timeStr.includes('7-9') || timeStr.includes('शाम 7-9')) {
            targetHour = 19;
        } else if (timeStr.includes('अभी') || timeStr.includes('Now') || timeStr.includes('30-45')) {
            return new Date(now.getTime() + 35 * 60000);
        }
        
        const target = new Date(now);
        target.setHours(targetHour, 0, 0, 0);
        return target;
    }
    
    triggerDeliveryPopup(order) {
        if (window.orderPopupManager) {
            window.orderPopupManager.showDeliveryPopup(order);
        } else {
            console.log('⏰ Delivery time reached for order:', order.id);
        }
    }
    
    // ============================================
    // DATA PERSISTENCE
    // ============================================
    getOrders() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading orders:', e);
            return [];
        }
    }
    
    saveOrders(orders) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(orders));
        } catch (e) {
            console.error('Error saving orders:', e);
        }
    }
    
    getOrderById(orderId) {
        const orders = this.getOrders();
        return orders.find(o => o.id === orderId) || null;
    }
    
    // ============================================
    // SAVE NEW ORDER
    // ============================================
    saveOrder(orderData) {
        const orders = this.getOrders();
        
        // Save customer location from checkout
        let customerLocation = null;
        
        if (orderData.location && orderData.location.lat && orderData.location.lng) {
            customerLocation = {
                lat: parseFloat(orderData.location.lat),
                lng: parseFloat(orderData.location.lng)
            };
            console.log('📍 Customer Location Saved:', customerLocation);
        } else {
            console.error('❌ No location in orderData!');
        }
        
        // Save customer name for celebration popup
        const customerName = orderData.customer?.name || '';
        
        const newOrder = {
            id: 'ORD-' + Date.now().toString(36).toUpperCase(),
            date: new Date().toISOString(),
            status: 'pending',
            items: orderData.items || [],
            total: orderData.total || 0,
            itemCount: orderData.itemCount || 0,
            deliveryTime: orderData.deliveryTime || null,
            customerName: customerName,
            cancelReason: null,
            deliveryPopupShown: false,
            location: orderData.location || null,
            tracking: {
                enabled: false,
                currentLocation: null,
                customerLocation: customerLocation,
                riderProgress: 0,
                updates: []
            },
            timeline: [
                { label: 'भेजा गया', labelEn: 'Sent', time: new Date().toISOString(), completed: true },
                { label: 'कन्फर्म', labelEn: 'Confirmed', time: null, completed: false },
                { label: 'डिलीवर्ड', labelEn: 'Delivered', time: null, completed: false }
            ],
        };
        
        orders.unshift(newOrder);
        this.saveOrders(orders);
        console.log('✅ Order saved:', newOrder.id, '| Customer:', customerName, '| Location:', customerLocation);
        
        return newOrder;
    }
    
    // ============================================
    // UPDATE ORDER
    // ============================================
    updateOrderStatus(orderId, newStatus) {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            console.error('❌ Order not found:', orderId);
            return false;
        }
        
        order.status = newStatus;
        const now = new Date().toISOString();
        
        switch (newStatus) {
            case 'confirmed':
                order.timeline[1].completed = true;
                order.timeline[1].time = now;
                this.startTracking(order);
                if (window.floatingMapManager) {
                    setTimeout(() => window.floatingMapManager.checkActiveOrder(), 500);
                }
                break;
                
            case 'cancelled':
                order.timeline = [
                    { label: 'भेजा गया', labelEn: 'Sent', time: order.timeline[0].time, completed: true },
                    { label: 'रद्द', labelEn: 'Cancelled', time: now, completed: true }
                ];
                this.stopTracking(order);
                if (window.floatingMapManager) {
                    window.floatingMapManager.hide();
                    window.floatingMapManager.stopTimer();
                    window.floatingMapManager.stopRiderUpdates();
                }
                break;
                
            case 'delivered':
                order.timeline[2].completed = true;
                order.timeline[2].time = now;
                this.stopTracking(order);
                if (window.floatingMapManager) {
                    window.floatingMapManager.hide();
                    window.floatingMapManager.stopTimer();
                    window.floatingMapManager.stopRiderUpdates();
                }
                break;
                
            case 'in_transit':
                break;
        }
        
        this.saveOrders(orders);
        console.log(`✅ Order ${orderId} updated to: ${newStatus}`);
        
        if (!this.ordersModal.classList.contains('hidden')) {
            this.render();
        }
        
        return true;
    }
    
    addCancelReason(orderId, reason) {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        
        if (!order) return false;
        
        order.cancelReason = reason;
        this.saveOrders(orders);
        
        if (!this.ordersModal.classList.contains('hidden')) {
            this.render();
        }
        
        return true;
    }
    
    // ============================================
    // GPS TRACKING
    // ============================================
    startTracking(order) {
        if (!order) return;
        
        order.tracking.enabled = true;
        
        if (!order.tracking.customerLocation && order.location) {
            order.tracking.customerLocation = {
                lat: parseFloat(order.location.lat),
                lng: parseFloat(order.location.lng)
            };
        }
        
        const orders = this.getOrders();
        const idx = orders.findIndex(o => o.id === order.id);
        if (idx !== -1) {
            orders[idx] = order;
            this.saveOrders(orders);
        }
        
        console.log('📍 Tracking started for order:', order.id);
    }
    
    stopTracking(order) {
        if (!order) return;
        
        order.tracking.enabled = false;
        
        const orders = this.getOrders();
        const idx = orders.findIndex(o => o.id === order.id);
        if (idx !== -1) {
            orders[idx] = order;
            this.saveOrders(orders);
        }
    }
    
    // ============================================
    // CALCULATE DISTANCE
    // ============================================
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    toRad(deg) {
        return deg * (Math.PI / 180);
    }
    
    getTrackingInfo(order) {
        if (!order.tracking?.customerLocation) return null;
        
        const distance = this.calculateDistance(
            this.shopLocation.lat, this.shopLocation.lng,
            order.tracking.customerLocation.lat, order.tracking.customerLocation.lng
        );
        
        const remainingDistance = distance * (1 - (order.tracking.riderProgress || 0));
        const eta = Math.round(remainingDistance * 5);
        
        return {
            distance: remainingDistance,
            eta: eta,
            progress: order.tracking.riderProgress || 0
        };
    }
    
    // ============================================
    // FILTER & RENDER
    // ============================================
    getFilteredOrders() {
        const orders = this.getOrders();
        if (this.activeFilter === 'all') return orders;
        return orders.filter(o => o.status === this.activeFilter);
    }
    
    setFilter(btn) {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.getAttribute('data-filter');
        this.render();
    }
    
    open() {
        if (!this.ordersModal) return;
        
        this.render();
        this.ordersModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        if (window.floatingMapManager) {
            window.floatingMapManager.hide();
        }
    }
    
    close() {
        if (!this.ordersModal) return;
        this.ordersModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.expandedOrder = null;
        
        setTimeout(() => {
            if (window.floatingMapManager) {
                const activeOrder = this.getOrders().find(o => 
                    o.status === 'confirmed' || o.status === 'in_transit'
                );
                
                if (activeOrder && window.floatingMapManager.timerInterval) {
                    window.floatingMapManager.show();
                } else if (activeOrder) {
                    window.floatingMapManager.checkActiveOrder();
                }
            }
        }, 300);
    }
    
    render() {
        if (!this.ordersList) return;
        
        const orders = this.getFilteredOrders();
        this.ordersList.innerHTML = '';
        
        if (orders.length === 0) {
            if (this.emptyOrders) this.emptyOrders.classList.remove('hidden');
            return;
        }
        
        if (this.emptyOrders) this.emptyOrders.classList.add('hidden');
        
        orders.forEach(order => {
            const card = this.createOrderCard(order);
            this.ordersList.appendChild(card);
        });
    }
    
    // ============================================
    // CREATE ORDER CARD
    // ============================================
    createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'order-card fade-in';
        
        const isHindi = this.currentLang === 'hi';
        const date = new Date(order.date);
        const dateStr = date.toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        const statusLabels = {
            hi: {
                pending: '⏳ पेंडिंग',
                confirmed: '🟢 कन्फर्म',
                in_transit: '🛵 आ रहा है',
                delivered: '✅ डिलीवर्ड',
                cancelled: '❌ रद्द'
            },
            en: {
                pending: '⏳ Pending',
                confirmed: '🟢 Confirmed',
                in_transit: '🛵 In Transit',
                delivered: '✅ Delivered',
                cancelled: '❌ Cancelled'
            }
        };
        
        const statusText = (statusLabels[this.currentLang] || statusLabels.hi)[order.status] || '⏳ पेंडिंग';
        
        const trackingInfo = this.getTrackingInfo(order);
        
        let html = '';
        
        // Header
        html += `
            <div class="order-card-header">
                <div>
                    <div class="order-id">#${order.id}</div>
                    <div class="order-date">${dateStr}</div>
                </div>
                <span class="order-status ${order.status}">${statusText}</span>
            </div>
        `;
        
        // Tracking bar
        if (order.status === 'confirmed' || order.status === 'in_transit') {
            let trackingText = isHindi ? 'आपका ऑर्डर आ रहा है...' : 'Your order is on the way...';
            let distanceText = '';
            
            if (trackingInfo) {
                if (trackingInfo.distance < 1) {
                    distanceText = `${Math.round(trackingInfo.distance * 1000)} m`;
                } else {
                    distanceText = `${trackingInfo.distance.toFixed(1)} km`;
                }
                
                if (trackingInfo.eta < 1) {
                    trackingText = isHindi ? 'अभी पहुँच रहा है!' : 'Arriving now!';
                } else {
                    trackingText = isHindi 
                        ? `📍 ${distanceText} दूर | ⏱️ ~${trackingInfo.eta} मिनट`
                        : `📍 ${distanceText} away | ⏱️ ~${trackingInfo.eta} min`;
                }
            }
            
            html += `
                <div class="order-tracking-mini" style="cursor:pointer;" 
                     onclick="window.ordersManager?.close(); setTimeout(() => window.floatingMapManager?.show(), 400);">
                    <span class="tracking-dot"></span>
                    <span>${trackingText}</span>
                    <span style="margin-left:auto;font-size:10px;opacity:0.7;">${isHindi ? '🗺️ देखें' : '🗺️ View'}</span>
                </div>
            `;
        }
        
        // Items preview
        const previewItems = order.items.slice(0, 4);
        const moreCount = order.items.length - 4;
        html += '<div class="order-items-preview">';
        previewItems.forEach(item => {
            const img = item.image || '';
            const name = item.name?.hi || item.name?.en || '';
            html += `<img src="${img}" alt="${name}" class="order-item-thumb" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23f0f0f0%22 width=%2240%22 height=%2240%22 rx=%2210%22/><text x=%2220%22 y=%2228%22 text-anchor=%22middle%22 font-size=%2220%22>📦</text></svg>'">`;
        });
        if (moreCount > 0) {
            html += `<span class="order-item-more">+${moreCount}</span>`;
        }
        html += '</div>';
        
        // Summary
        html += `
            <div class="order-summary">
                <span class="order-total">₹${order.total}</span>
                <span class="order-item-count">${order.itemCount} ${isHindi ? 'आइटम' : 'items'}</span>
            </div>
        `;
        
        // Delivery time
        if (order.deliveryTime) {
            html += `
                <div class="order-delivery-time">
                    ⏱️ ${order.deliveryTime}
                </div>
            `;
        }
        
        // Cancel reason
        if (order.status === 'cancelled' && order.cancelReason) {
            html += `
                <div class="order-cancel-reason">
                    <div class="cancel-label">${isHindi ? 'रद्द करने का कारण' : 'Cancel Reason'}:</div>
                    "${order.cancelReason}"
                </div>
            `;
        }
        
        // Timeline
        html += '<div class="order-timeline">';
        order.timeline.forEach((step, i) => {
            if (i > 0) {
                html += `<div class="timeline-line ${step.completed ? 'completed' : ''}"></div>`;
            }
            
            const isCancelled = step.label === 'रद्द' || step.label === 'Cancelled';
            const isActive = !step.completed && (i === 0 || order.timeline[i - 1].completed);
            
            html += `
                <div class="timeline-step ${step.completed ? 'completed' : ''} ${isActive ? 'active' : ''} ${isCancelled ? 'cancelled-step' : ''}">
                    <div class="timeline-dot"></div>
                    <span>${isHindi ? step.label : (step.labelEn || step.label)}</span>
                </div>
            `;
        });
        html += '</div>';
        
        // Actions
        html += '<div class="order-actions">';
        
        // 🆕 REORDER BUTTON - हमेशा दिखेगा
        html += `
            <button class="order-action-btn reorder-btn" data-order-id="${order.id}">
                🔄 ${isHindi ? 'दोबारा ऑर्डर' : 'Reorder'}
            </button>
            <button class="order-action-btn view-detail-btn" data-order-id="${order.id}">
                📋 ${isHindi ? 'डिटेल' : 'Details'}
            </button>
        `;
        
        if (order.status === 'confirmed' || order.status === 'in_transit') {
            html += `
                <button class="order-action-btn track-order-btn" data-order-id="${order.id}">
                    🗺️ ${isHindi ? 'ट्रैक' : 'Track'}
                </button>
            `;
        }
        html += '</div>';
        
        // Detail view
        html += `
            <div class="order-detail hidden" id="detail-${order.id}">
                ${order.items.map(item => {
                    const name = item.name?.hi || item.name?.en || '';
                    return `
                        <div class="order-detail-item">
                            <span>${name} × ${item.quantity || 1}</span>
                            <span>₹${(item.price || 0) * (item.quantity || 1)}</span>
                        </div>
                    `;
                }).join('')}
                <div class="order-detail-item">
                    <span>${isHindi ? 'कुल' : 'Total'}</span>
                    <span>₹${order.total}</span>
                </div>
            </div>
        `;
        
        card.innerHTML = html;
        
        // 🆕 REORDER BUTTON EVENT
        card.querySelector('.reorder-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.reorder(order);
        });
        
        card.querySelector('.view-detail-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDetail(order.id);
        });
        
        card.querySelector('.track-order-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
            setTimeout(() => {
                if (window.floatingMapManager) {
                    if (window.floatingMapManager.timerInterval || window.floatingMapManager.riderInterval) {
                        window.floatingMapManager.show();
                        console.log('🗺️ Track: Map shown (timer already running, no reset)');
                    } else {
                        window.floatingMapManager.show();
                        window.floatingMapManager.updateMapWithOrder(order);
                        console.log('🗺️ Track: Map updated with order (fresh start)');
                    }
                }
            }, 300);
        });
        
        return card;
    }
    
    toggleDetail(orderId) {
        const detail = document.getElementById(`detail-${orderId}`);
        if (!detail) return;
        
        if (this.expandedOrder === orderId) {
            detail.classList.add('hidden');
            this.expandedOrder = null;
        } else {
            if (this.expandedOrder) {
                const prev = document.getElementById(`detail-${this.expandedOrder}`);
                if (prev) prev.classList.add('hidden');
            }
            detail.classList.remove('hidden');
            this.expandedOrder = orderId;
        }
    }
    
    // ============================================
    // 🆕 REORDER FUNCTION
    // ============================================
    reorder(order) {
        console.log('🔄 Reordering order:', order.id);
        console.log('📦 Items:', order.items);
        
        // Cart Manager check
        if (!window.cartManager) {
            console.error('❌ Cart Manager not found');
            return;
        }
        
        // पुराना cart clear करें
        window.cartManager.cart = [];
        
        // Items add करें
        order.items.forEach(item => {
            window.cartManager.cart.push({
                id: item.id || ('RE-' + Date.now().toString(36)),
                name: item.name,
                price: item.price,
                image: item.image,
                unit: item.unit,
                discount: item.discount || 0,
                quantity: item.quantity || 1,
            });
        });
        
        // Cart save करें
        window.cartManager.saveCart();
        window.cartManager.updateBadge();
        
        console.log('✅ Items added to cart:', window.cartManager.cart.length);
        
        // Orders modal close करें
        this.close();
        
        // Cart open करें
        setTimeout(() => {
            if (window.cartManager) {
                window.cartManager.openCart();
            }
        }, 300);
        
        // Toast show करें
        if (window.checkoutManager) {
            const msg = this.currentLang === 'hi' 
                ? '✅ पुराना ऑर्डर कार्ट में add हो गया!' 
                : '✅ Previous order added to cart!';
            window.checkoutManager.showToast(msg);
        }
    }
    
    destroy() {
        if (this.deliveryCheckInterval) {
            clearInterval(this.deliveryCheckInterval);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.ordersManager = new OrdersManager();
    }, 100);
});