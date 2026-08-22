// ============================================
// FLOATING-MAP.JS - Complete Fixed v7
// No Drag | localStorage Timer | 1hr Expiry Fix | Smart Retry
// ============================================

class FloatingMapManager {
    constructor() {
        this.container = null;
        this.mapElement = null;
        this.map = null;
        this.markers = {};
        this.routeLine = null;
        this.offlineBanner = null;

        this.shopLocation = {
            lat: 27.6667496,
            lng: 77.7124673,
            name: 'Quick Dukan'
        };

        this.isVisible = false;
        this.isCollapsed = false;
        this.currentLang = 'hi';
        this.activeOrder = null;

        // DRAG FULLY DISABLED
        this.isDragging = false;

        this.currentSize = 'normal';
        this.sizes = {
            compact: { w: 155, h: 135 },
            normal:  { w: 290, h: 210 },
            full:    { w: 360, h: 320 }
        };

        // Timer
        this.initialSeconds = 0;
        this.startTimestamp = null;
        this.remainingSeconds = 0;
        this.totalSteps = 0;
        this.currentStep = 0;
        this.distance = 0;
        this.timerInterval = null;
        this.riderInterval = null;
        this.popupShown = false;

        // SMART RETRY COUNTER
        this.retryCount = 0;
        this.RETRY_ADD_TIMES = [120, 180, 300, 0]; // 2min, 3min, 5min, band
        this.MAX_RETRY = 4;

        // Settings
        this.MIN_TIMER_MINUTES = 10;
        this.MAX_TIMER_MINUTES = 45;
        this.SPEED_PER_KM = 5;
        this.RIDER_INTERVAL = 10000;
        this.TIMER_INTERVAL = 1000;
        this.MAX_ORDER_AGE = 65 * 60 * 1000; // 1hr 5min

        this.autoHideTimeout = null;
        this._toastTimer = null;
        this.init();
    }

    init() {
        this.detectLanguage();
        this.createContainer();
        this.createOfflineBanner();
        this.bindEvents();
        this.bindOnlineEvents();
        this.restoreTimerFromStorage();
        setInterval(() => this.checkActiveOrder(), 30000);
        console.log('🗺️ Floating Map v7 Ready (No Drag | Smart Retry | Persistent Timer)');
    }

    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }

    // ============================================
    // CREATE DOM
    // ============================================
    createContainer() {
        const old = document.getElementById('floatingMapContainer');
        if (old) old.remove();

        this.container = document.createElement('div');
        this.container.className = 'floating-map-container size-normal';
        this.container.id = 'floatingMapContainer';

        const hi = this.currentLang === 'hi';

        this.container.innerHTML = `
            <div class="floating-map-header" id="floatingMapHeader" style="cursor:default;">
                <div class="floating-map-header-left">
                    <span class="pulse-dot"></span>
                    <span class="map-header-text">${hi ? '🛵 लाइव ट्रैकिंग' : '🛵 Live Tracking'}</span>
                </div>
                <div class="floating-map-actions">
                    <button class="floating-map-btn size-btn" data-size="compact" title="Compact">S</button>
                    <button class="floating-map-btn size-btn active" data-size="normal" title="Normal">M</button>
                    <button class="floating-map-btn size-btn" data-size="full" title="Full">L</button>
                    <button class="floating-map-btn" id="btnCollapseMap" title="${hi ? 'छोटा करें' : 'Collapse'}">−</button>
                    <button class="floating-map-btn" id="btnCloseMap" title="${hi ? 'बंद करें' : 'Close'}">✕</button>
                </div>
            </div>
            <div class="floating-map-body" id="floatingMapBody"></div>
            <div class="floating-map-info">
                <div class="floating-map-info-row">
                    <span>⏱️ <span class="map-timer" id="mapTimer">--:--</span></span>
                    <span>📍 <span class="map-distance" id="mapDistance">-- km</span></span>
                </div>
                <div class="floating-map-actions-row">
                    <button class="floating-map-action-btn call-btn" id="btnCallShop">
                        📞 ${hi ? 'दुकान' : 'Call Shop'}
                    </button>
                    <button class="floating-map-action-btn view-btn" id="btnViewFullMap">
                        🗺️ ${hi ? 'पूरा मैप' : 'Full Map'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.mapElement = document.getElementById('floatingMapBody');
        this.applySize(this.currentSize);
        setTimeout(() => this.initMap(), 500);
    }

    createOfflineBanner() {
        this.offlineBanner = document.createElement('div');
        this.offlineBanner.className = 'map-offline-banner';
        this.offlineBanner.innerHTML = '⚠️ ऑफलाइन - टाइमर चल रहा है';
        this.offlineBanner.style.display = 'none';
        this.container.appendChild(this.offlineBanner);
    }

    bindOnlineEvents() {
        window.addEventListener('offline', () => {
            if (this.offlineBanner && this.isVisible) this.offlineBanner.style.display = 'flex';
        });
        window.addEventListener('online', () => {
            if (this.offlineBanner) this.offlineBanner.style.display = 'none';
            if (this.map && this.isVisible) setTimeout(() => this.map.invalidateSize(), 400);
        });
    }

    // ============================================
    // SIZE MANAGEMENT — No position change
    // ============================================
    applySize(size) {
        if (!this.sizes[size]) return;
        this.currentSize = size;

        this.container.classList.remove('size-compact', 'size-normal', 'size-full');
        this.container.classList.add('size-' + size);

        // Reset position to CSS default (bottom-right)
        this.container.style.left = '';
        this.container.style.top = '';
        this.container.style.right = '';
        this.container.style.bottom = '';

        const allBtns = this.container.querySelectorAll('.size-btn');
        allBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.size === size));

        try { localStorage.setItem('qd-map-size', size); } catch(e) {}

        setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 350);
    }

    // ============================================
    // MAP INIT
    // ============================================
    initMap() {
        if (!this.mapElement) { setTimeout(() => this.initMap(), 300); return; }
        if (typeof L === 'undefined') {
            if (!navigator.onLine) { console.log('⚠️ Offline - map tiles unavailable'); return; }
            setTimeout(() => this.initMap(), 500); return;
        }
        if (this.map) { this.map.remove(); this.map = null; }

        this.map = L.map(this.mapElement, {
            center: [this.shopLocation.lat, this.shopLocation.lng],
            zoom: 14,
            zoomControl: false,
            attributionControl: false,
            dragging: false,       // NO DRAG
            scrollWheelZoom: false // NO ZOOM
        });

        if (navigator.onLine) {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(this.map);
        }
        this.addShopMarker();
    }

    addShopMarker() {
        if (!this.map) return;
        if (this.markers.shop) this.map.removeLayer(this.markers.shop);
        const icon = L.divIcon({ html: '<div style="font-size:26px;">🏪</div>', className: 'custom-marker', iconSize: [34,34], iconAnchor: [17,17] });
        this.markers.shop = L.marker([this.shopLocation.lat, this.shopLocation.lng], { icon }).addTo(this.map);
    }

    addCustomerMarker(lat, lng) {
        if (!this.map) return;
        if (this.markers.customer) this.map.removeLayer(this.markers.customer);
        const icon = L.divIcon({ html: '<div style="font-size:26px;">📍</div>', className: 'custom-marker', iconSize: [34,34], iconAnchor: [17,34] });
        this.markers.customer = L.marker([lat, lng], { icon }).addTo(this.map);
    }

    addRiderMarker(lat, lng) {
        if (!this.map) return;
        if (this.markers.rider) this.map.removeLayer(this.markers.rider);
        const icon = L.divIcon({ html: '<div class="rider-marker">🛵</div>', className: 'custom-marker', iconSize: [40,40], iconAnchor: [20,20] });
        this.markers.rider = L.marker([lat, lng], { icon }).addTo(this.map);
    }

    addRouteLine() {
        if (!this.map || !this.activeOrder) return;
        if (this.routeLine) this.map.removeLayer(this.routeLine);
        const clat = this.activeOrder.tracking?.customerLocation?.lat || this.shopLocation.lat + 0.01;
        const clng = this.activeOrder.tracking?.customerLocation?.lng || this.shopLocation.lng + 0.01;
        this.routeLine = L.polyline(
            [[this.shopLocation.lat, this.shopLocation.lng], [clat, clng]],
            { color: '#2E7D32', weight: 3, opacity: 0.5, dashArray: '8, 8' }
        ).addTo(this.map);
        this.map.fitBounds(L.latLngBounds([this.shopLocation.lat, this.shopLocation.lng], [clat, clng]), { padding: [15,15] });
    }

    calcDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
        return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    // ============================================
    // UPDATE WITH ORDER
    // ============================================
    updateMapWithOrder(order) {
        if (!order) return;
        this.activeOrder = order;
        this.retryCount = 0;

        if (!order.tracking?.customerLocation) { 
            console.warn('⚠️ No customer location'); 
            return; 
        }

        const clat = order.tracking.customerLocation.lat;
        const clng = order.tracking.customerLocation.lng;

        this.addCustomerMarker(clat, clng);
        this.addRouteLine();
        this.distance = this.calcDistance(this.shopLocation.lat, this.shopLocation.lng, clat, clng);

        let mins = Math.round(this.distance * this.SPEED_PER_KM);
        mins = Math.max(this.MIN_TIMER_MINUTES, Math.min(this.MAX_TIMER_MINUTES, mins));

        this.initialSeconds = mins * 60;
        this.remainingSeconds = this.initialSeconds;
        this.startTimestamp = Date.now();
        this.totalSteps = Math.ceil(this.remainingSeconds / (this.RIDER_INTERVAL/1000));
        this.currentStep = 0;
        this.popupShown = false;

        this.addRiderMarker(this.shopLocation.lat, this.shopLocation.lng);
        this.updateTimerDisplay();
        this.updateDistanceDisplay();
        this.saveTimerToStorage();
        this.startTimer();
        this.startRiderUpdates();
        this.show();
    }

    // ============================================
    // TIMER — localStorage persisted
    // ============================================
    saveTimerToStorage() {
        try {
            localStorage.setItem('qd-map-timer', JSON.stringify({
                initialSeconds: this.initialSeconds,
                remainingSeconds: this.remainingSeconds,
                startTimestamp: this.startTimestamp,
                distance: this.distance,
                totalSteps: this.totalSteps,
                currentStep: this.currentStep,
                retryCount: this.retryCount,
                popupShown: this.popupShown,
                orderId: this.activeOrder?.id || null,
                savedAt: Date.now()
            }));
        } catch(e) {}
    }

    restoreTimerFromStorage() {
        try {
            const saved = localStorage.getItem('qd-map-timer');
            if (!saved) return;
            const data = JSON.parse(saved);
            if (!data.startTimestamp) return;

            // 🔥 Check if order still exists
            if (data.orderId && window.ordersManager) {
                const order = window.ordersManager.getOrderById(data.orderId);
                if (!order || (order.status !== 'confirmed' && order.status !== 'in_transit')) {
                    localStorage.removeItem('qd-map-timer');
                    this.activeOrder = null;
                    return;
                }
            }

            const now = Date.now();
            const elapsed = Math.floor((now - data.startTimestamp) / 1000);
            const remaining = Math.max(0, data.initialSeconds - elapsed);

            console.log(`🔄 Restoring timer: elapsed=${elapsed}s, remaining=${remaining}s`);

            if (remaining <= 0) {
                // Timer khatam — popup dikhao
                localStorage.removeItem('qd-map-timer');
                if (data.orderId && window.ordersManager) {
                    const order = window.ordersManager.getOrderById(data.orderId);
                    if (order && (order.status === 'confirmed' || order.status === 'in_transit')) {
                        this.activeOrder = order;
                        this.showDeliveryPopup();
                    }
                }
                return;
            }

            // Restore
            this.initialSeconds = data.initialSeconds;
            this.remainingSeconds = remaining;
            this.startTimestamp = data.startTimestamp;
            this.distance = data.distance || 0;
            this.totalSteps = data.totalSteps || 0;
            this.currentStep = data.currentStep || 0;
            this.retryCount = data.retryCount || 0;
            this.popupShown = data.popupShown || false;

            if (data.orderId && window.ordersManager) {
                this.activeOrder = window.ordersManager.getOrderById(data.orderId);
            }

            if (this.activeOrder && this.activeOrder.tracking?.customerLocation) {
                this.addCustomerMarker(this.activeOrder.tracking.customerLocation.lat, this.activeOrder.tracking.customerLocation.lng);
                this.addRouteLine();
                this.updateTimerDisplay();
                this.updateDistanceDisplay();
                this.show();
                this.startTimer();
                this.startRiderUpdates();
            }
        } catch(e) { localStorage.removeItem('qd-map-timer'); }
    }

    clearTimerStorage() {
        try { localStorage.removeItem('qd-map-timer'); } catch(e) {}
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTimestamp) / 1000);
            this.remainingSeconds = Math.max(0, this.initialSeconds - elapsed);
            this.updateTimerDisplay();
            this.saveTimerToStorage();

            if (this.remainingSeconds <= 0 && !this.popupShown) {
                this.popupShown = true;
                this.stopTimer();
                this.stopRiderUpdates();
                this.clearTimerStorage();
                this.showDeliveryPopup();
            }
        }, this.TIMER_INTERVAL);
    }

    stopTimer() { if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; } }

    updateTimerDisplay() {
        const el = document.getElementById('mapTimer');
        if (!el) return;
        if (this.remainingSeconds <= 0) { 
            el.textContent = '00:00'; 
            el.style.color = '#FF1744'; 
            return; 
        }
        const m = Math.floor(this.remainingSeconds/60), s = this.remainingSeconds%60;
        el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        el.style.color = this.remainingSeconds <= 60 ? '#FF1744' : '#FF6D00';
    }

    startRiderUpdates() {
        this.stopRiderUpdates();
        this.riderInterval = setInterval(() => {
            if (!this.activeOrder) return;
            this.currentStep++;
            const progress = Math.min(this.currentStep / this.totalSteps, 1);
            const clat = this.activeOrder.tracking?.customerLocation?.lat || this.shopLocation.lat+0.01;
            const clng = this.activeOrder.tracking?.customerLocation?.lng || this.shopLocation.lng+0.01;
            this.addRiderMarker(
                this.shopLocation.lat + (clat-this.shopLocation.lat)*progress,
                this.shopLocation.lng + (clng-this.shopLocation.lng)*progress
            );
            this.updateDistanceDisplay();
        }, this.RIDER_INTERVAL);
    }

    stopRiderUpdates() { if (this.riderInterval) { clearInterval(this.riderInterval); this.riderInterval = null; } }

    updateDistanceDisplay() {
        const el = document.getElementById('mapDistance');
        if (!el) return;

        // Timer progress ke hisaab se distance kam hogi
        const elapsed = Date.now() - this.startTimestamp;
        const totalTime = this.initialSeconds * 1000;
        const progress = Math.min(elapsed / totalTime, 1);

        // Distance = total distance × (1 - progress)
        const remaining = this.distance * (1 - progress);

        if (remaining < 0.05) {
            el.textContent = this.currentLang === 'hi' ? 'पहुँच गया' : 'Arrived!';
            el.style.color = '#4CAF50';
        } else if (remaining < 1) {
            el.textContent = `${Math.round(remaining * 1000)} m`;
            el.style.color = '#2E7D32';
        } else {
            el.textContent = `${remaining.toFixed(1)} km`;
            el.style.color = '#2E7D32';
        }
    }

    // ============================================
    // DELIVERY POPUP — with Smart Retry
    // ============================================
    showDeliveryPopup() {
        if (window.orderPopupManager && this.activeOrder) {
            window.orderPopupManager.showDeliveryPopup(this.activeOrder);
        } else {
            console.log('⏰ Delivery time reached!');
            this.showToast('⏰ Delivery time reached!');
        }
    }

    // CALLED WHEN USER SAYS "NO, NOT YET"
    addExtraTime() {
        this.retryCount++;
        console.log(`🔄 Retry #${this.retryCount}`);

        if (this.retryCount > this.MAX_RETRY) {
            // Max retries reached — close map
            console.log('❌ Max retries reached — closing map');
            this.hide();
            this.stopTimer();
            this.stopRiderUpdates();
            this.clearTimerStorage();
            this.activeOrder = null;
            return;
        }

        const addSeconds = this.RETRY_ADD_TIMES[this.retryCount - 1] || 0;
        if (addSeconds <= 0) {
            this.hide();
            this.clearTimerStorage();
            return;
        }

        this.remainingSeconds += addSeconds;
        this.initialSeconds = this.remainingSeconds;
        this.startTimestamp = Date.now();
        this.popupShown = false;

        const totalDuration = this.remainingSeconds + (this.currentStep * (this.RIDER_INTERVAL/1000));
        this.totalSteps = Math.ceil(totalDuration / (this.RIDER_INTERVAL/1000));

        this.updateTimerDisplay();
        this.updateDistanceDisplay();
        this.saveTimerToStorage();
        this.startTimer();
        this.startRiderUpdates();

        const mins = Math.floor(addSeconds/60);
        const secs = addSeconds%60;
        console.log(`⏱️ +${mins}:${String(secs).padStart(2,'0')} added (Retry ${this.retryCount}/${this.MAX_RETRY})`);
        this.showToast(`⏱️ +${mins} min added!`);
    }

    // ============================================
    // CHECK ACTIVE ORDER — Fixed 1hr 5min expiry
    // ============================================
    checkActiveOrder() {
        if (!window.ordersManager) return;

        const orders = window.ordersManager.getOrders();
        if (!orders || orders.length === 0) {
            this.hide();
            this.stopTimer();
            this.stopRiderUpdates();
            this.clearTimerStorage();
            this.activeOrder = null;
            return;
        }

        const now = Date.now();

        const activeOrder = orders.find(o => {
            // Sirf confirmed ya in_transit
            if (o.status !== 'confirmed' && o.status !== 'in_transit') return false;

            // Cancelled check
            if (o.status === 'cancelled') return false;

            const orderTime = o.timestamp || o.date || 0;

            // 1hr 5min = 65 minutes
            if (orderTime > 0 && (now - orderTime) > this.MAX_ORDER_AGE) {
                o.status = 'delivered';
                if (window.ordersManager.saveOrders) window.ordersManager.saveOrders(orders);
                console.log('🕐 Order auto-delivered (65min expired)');
                return false;
            }
            return true;
        });

        if (!activeOrder) {
            this.hide();
            this.stopTimer();
            this.stopRiderUpdates();
            this.clearTimerStorage();
            this.activeOrder = null;
            return;
        }

        if (this.timerInterval && this.activeOrder?.id === activeOrder.id) {
            if (!this.isVisible) this.show();
            return;
        }

        this.activeOrder = activeOrder;
        this.updateMapWithOrder(activeOrder);
        this.show();
    }

    // ============================================
    // UPDATE ORDER INFO (For Track button)
    // ============================================
    updateOrderInfo(order) {
        if (!order) return;
        this.activeOrder = order;
        
        // Update timer display if already running
        if (this.timerInterval) {
            this.updateTimerDisplay();
            this.updateDistanceDisplay();
            this.show();
        } else {
            this.updateMapWithOrder(order);
        }
    }

    show() {
        if (!this.container || this.isVisible) return;
        this.container.classList.add('visible');
        this.isVisible = true;
        if (!navigator.onLine && this.offlineBanner) this.offlineBanner.style.display = 'flex';
        setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 350);
    }

    hide() {
        if (!this.container) return;
        this.container.classList.remove('visible');
        this.isVisible = false;
        if (this.offlineBanner) this.offlineBanner.style.display = 'none';
    }

    // ============================================
    // EVENTS — Drag FULLY REMOVED
    // ============================================
    bindEvents() {
        document.addEventListener('click', (e) => {
            const sizeBtn = e.target.closest('.size-btn');
            if (sizeBtn) {
                this.applySize(sizeBtn.dataset.size);
                return;
            }
            if (e.target.closest('#btnCollapseMap')) {
                this.container.classList.toggle('collapsed');
                this.isCollapsed = !this.isCollapsed;
                setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 350);
                return;
            }
            if (e.target.closest('#btnCloseMap')) {
                this.hide();
                return;
            }
            if (e.target.closest('#btnCallShop')) {
                window.open('tel:919719312956', '_blank');
                return;
            }
            if (e.target.closest('#btnViewFullMap')) {
                this.openFullMap();
                return;
            }
        });

        try {
            const saved = localStorage.getItem('qd-map-size');
            if (saved && this.sizes[saved]) { this.currentSize = saved; this.applySize(saved); }
        } catch(e) {}

        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
            this.updateHeaderText();
        });
    }

    updateHeaderText() {
        const headerText = this.container?.querySelector('.map-header-text');
        if (headerText) {
            headerText.textContent = this.currentLang === 'hi' ? '🛵 लाइव ट्रैकिंग' : '🛵 Live Tracking';
        }
        // Update button texts
        const callBtn = document.getElementById('btnCallShop');
        if (callBtn) {
            callBtn.innerHTML = `📞 ${this.currentLang === 'hi' ? 'दुकान' : 'Call Shop'}`;
        }
        const viewBtn = document.getElementById('btnViewFullMap');
        if (viewBtn) {
            viewBtn.innerHTML = `🗺️ ${this.currentLang === 'hi' ? 'पूरा मैप' : 'Full Map'}`;
        }
        const collapseBtn = document.getElementById('btnCollapseMap');
        if (collapseBtn) {
            collapseBtn.title = this.currentLang === 'hi' ? 'छोटा करें' : 'Collapse';
        }
        const closeBtn = document.getElementById('btnCloseMap');
        if (closeBtn) {
            closeBtn.title = this.currentLang === 'hi' ? 'बंद करें' : 'Close';
        }
    }

    openFullMap() {
        if (!this.activeOrder?.tracking?.customerLocation) {
            window.open(`https://www.google.com/maps?q=${this.shopLocation.lat},${this.shopLocation.lng}`, '_blank');
            return;
        }
        const c = this.activeOrder.tracking.customerLocation;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${this.shopLocation.lat},${this.shopLocation.lng}&destination=${c.lat},${c.lng}&travelmode=driving`, '_blank');
    }

    refreshSize() { if (this.map) setTimeout(() => this.map.invalidateSize(), 200); }

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

        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2500);
    }

    // ============================================
    // DESTROY
    // ============================================
    destroy() {
        this.stopTimer();
        this.stopRiderUpdates();
        clearTimeout(this._toastTimer);
        if (this.map) { this.map.remove(); this.map = null; }
        if (this.container) { this.container.remove(); this.container = null; }
        console.log('🗺️ FloatingMapManager destroyed');
    }
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.floatingMapManager) {
            window.floatingMapManager.destroy();
        }
        window.floatingMapManager = new FloatingMapManager();
    }, 1000);
});

// Also initialize if DOM already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (!window.floatingMapManager) {
        setTimeout(() => {
            if (window.floatingMapManager) {
                window.floatingMapManager.destroy();
            }
            window.floatingMapManager = new FloatingMapManager();
        }, 1000);
    }
}

window.addEventListener('beforeunload', () => {
    if (window.floatingMapManager) {
        window.floatingMapManager.destroy();
    }
});

console.log('🗺️ FloatingMapManager v7 Ready!');