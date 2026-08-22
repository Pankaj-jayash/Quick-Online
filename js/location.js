// ============================================
// LOCATION.JS - Live GPS Manager
// Quick Dukan - Silent Loop | GPS Popup | Auto-Detect
// ============================================

class LocationManager {
    constructor() {
        // State
        this.isFound = false;
        this.isSearching = false;
        this.popupVisible = false;
        this.currentLang = 'hi';
        
        // Loop control
        this.retryInterval = null;
        this.retryDelay = 5000; // 5 seconds
        
        // GPS settings
        this.gpsTimeout = 8000; // 8 seconds timeout
        this.highAccuracy = true;
        
        // Callbacks
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        this.onStateChangeCallback = null;
        
        // DOM refs (set via setIndicator)
        this.indicatorElement = null;
        
        // Hidden fields (auto-detect)
        this.latitudeField = document.getElementById('latitude');
        this.longitudeField = document.getElementById('longitude');
        this.locationUrlField = document.getElementById('locationUrl');
        this.villageCityField = document.getElementById('villageCity');
        this.landmarkField = document.getElementById('landmark');
        
        // Auto-detect events
        this.bindAutoDetectEvents();
        
        console.log('📍 LocationManager Initialized');
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    /**
     * Start silent GPS detection loop
     * @param {Function} onFound - Callback when location found
     * @param {Function} onError - Callback when GPS error
     */
    start(onFound, onError) {
        console.log('📍 Starting silent GPS loop...');
        
        this.onFoundCallback = onFound || null;
        this.onErrorCallback = onError || null;
        this.isSearching = true;
        this.isFound = false;
        
        // Try immediately
        this.tryGetLocation();
        
        // Start loop
        this.startLoop();
        
        // Update indicator
        this.updateIndicator('searching');
    }
    
    /**
     * Stop GPS detection and hide popup
     */
    stop() {
        console.log('📍 Stopping GPS...');
        
        this.stopLoop();
        this.hidePopup();
        this.isSearching = false;
        this.isFound = false;
        
        // Clear callbacks
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        
        // Clear hidden fields
        this.clearLocationData();
        
        // Update indicator
        this.updateIndicator('off');
    }
    
    /**
     * Check if location is ready
     * @returns {boolean}
     */
    isReady() {
        return this.isFound && 
               this.latitudeField?.value && 
               this.longitudeField?.value;
    }
    
    /**
     * Get current location data
     * @returns {Object} {lat, lng, url}
     */
    getData() {
        return {
            lat: this.latitudeField?.value || '',
            lng: this.longitudeField?.value || '',
            url: this.locationUrlField?.value || '',
        };
    }
    
    /**
     * Show GPS popup (public)
     */
    showPopup() {
        this.showGPSPopup();
    }
    
    /**
     * Hide GPS popup (public)
     */
    hidePopup() {
        this.hideGPSPopup();
    }
    
    /**
     * Open device GPS settings
     */
    openSettings() {
        this.openGPSSettings();
    }
    
    /**
     * Set indicator element for UI updates
     * @param {HTMLElement} element 
     */
    setIndicator(element) {
        this.indicatorElement = element;
    }
    
    /**
     * Set language
     * @param {string} lang - 'hi' or 'en'
     */
    setLanguage(lang) {
        this.currentLang = lang;
        this.updateIndicator(this.isSearching ? 'searching' : (this.isFound ? 'found' : 'off'));
    }
    
    /**
     * Update location indicator UI
     * @param {string} state - 'searching', 'found', 'off'
     */
    updateIndicator(state) {
        if (!this.indicatorElement) return;
        
        const messages = {
            searching: {
                hi: '⏳ लोकेशन ले रहे हैं...',
                en: '⏳ Getting location...'
            },
            found: {
                hi: '✅ लोकेशन मिल गई',
                en: '✅ Location found'
            },
            off: {
                hi: '📡 GPS बंद है',
                en: '📡 GPS is OFF'
            }
        };
        
        const msg = messages[state]?.[this.currentLang] || messages[state]?.hi || '';
        const dotClass = state === 'searching' ? 'searching' : (state === 'found' ? 'found' : 'off');
        
        this.indicatorElement.innerHTML = `<span class="location-dot ${dotClass}"></span> ${msg}`;
        this.indicatorElement.className = `location-indicator ${state}`;
    }
    
    /**
     * Register state change callback
     * @param {Function} callback 
     */
    onStateChange(callback) {
        this.onStateChangeCallback = callback;
    }
    
    // ============================================
    // PRIVATE: SILENT LOOP
    // ============================================
    
    startLoop() {
        this.stopLoop();
        
        this.retryInterval = setInterval(() => {
            if (this.isFound) {
                this.stopLoop();
                return;
            }
            this.tryGetLocation();
        }, this.retryDelay);
        
        console.log(`🔄 GPS loop started (every ${this.retryDelay / 1000}s)`);
    }
    
    stopLoop() {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
            console.log('🔄 GPS loop stopped');
        }
    }
    
    tryGetLocation() {
        if (this.isFound) return;
        
        if (!navigator.geolocation) {
            console.error('❌ Geolocation not supported');
            this.showGPSPopup();
            return;
        }
        
        console.log('📍 Trying GPS...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => this.onLocationSuccess(position),
            (error) => this.onLocationError(error),
            {
                enableHighAccuracy: this.highAccuracy,
                timeout: this.gpsTimeout,
                maximumAge: 0 // LIVE only, no cached
            }
        );
    }
    
    // ============================================
    // PRIVATE: SUCCESS / ERROR HANDLERS
    // ============================================
    
    onLocationSuccess(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const url = `https://maps.google.com/?q=${lat},${lng}`;
        
        console.log(`✅ GPS SUCCESS: ${lat.toFixed(6)}, ${lng.toFixed(6)} (${Math.round(accuracy)}m)`);
        
        // Validate coordinates
        if ((lat === 0 && lng === 0) || !isFinite(lat) || !isFinite(lng)) {
            console.error('❌ Invalid coordinates');
            return;
        }
        
        // Save to hidden fields
        this.saveLocationData(lat, lng, url);
        
        // Update state
        this.isFound = true;
        this.isSearching = false;
        
        // Stop loop
        this.stopLoop();
        
        // Update indicator
        this.updateIndicator('found');
        
        // Hide popup if visible
        this.hideGPSPopup();
        
        // Reverse geocode
        this.reverseGeocode(lat, lng);
        
        // Fire callbacks
        if (this.onFoundCallback) {
            this.onFoundCallback({ lat, lng, accuracy, url });
        }
        
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('found', { lat, lng, accuracy, url });
        }
    }
    
    onLocationError(error) {
        const errorMessages = {
            1: 'PERMISSION_DENIED',
            2: 'POSITION_UNAVAILABLE',
            3: 'TIMEOUT'
        };
        
        const errorName = errorMessages[error.code] || 'UNKNOWN';
        console.log(`❌ GPS Error: ${errorName} (${error.message})`);
        
        // Show popup for permission denied or unavailable
        if (error.code === 1 || error.code === 2) {
            if (!this.popupVisible) {
                this.showGPSPopup();
            }
        }
        
        // Fire error callback
        if (this.onErrorCallback) {
            this.onErrorCallback({ code: error.code, message: error.message, name: errorName });
        }
        
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback('error', { code: error.code, message: error.message });
        }
    }
    
    // ============================================
    // PRIVATE: SAVE / CLEAR LOCATION DATA
    // ============================================
    
    saveLocationData(lat, lng, url) {
        if (this.latitudeField) this.latitudeField.value = lat.toFixed(6);
        if (this.longitudeField) this.longitudeField.value = lng.toFixed(6);
        if (this.locationUrlField) this.locationUrlField.value = url;
        
        // Also save to localStorage for persistence
        try {
            localStorage.setItem('quick-dukan-live-location', JSON.stringify({
                lat: lat.toFixed(6),
                lng: lng.toFixed(6),
                url: url,
                timestamp: Date.now()
            }));
        } catch (e) {}
    }
    
    clearLocationData() {
        if (this.latitudeField) this.latitudeField.value = '';
        if (this.longitudeField) this.longitudeField.value = '';
        if (this.locationUrlField) this.locationUrlField.value = '';
        
        try {
            localStorage.removeItem('quick-dukan-live-location');
        } catch (e) {}
    }
    
    // ============================================
    // PRIVATE: REVERSE GEOCODE
    // ============================================
    
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=${this.currentLang}`,
                { headers: { 'User-Agent': 'QuickDukan/1.0' } }
            );
            
            if (!response.ok) return;
            
            const data = await response.json();
            if (!data?.address) return;
            
            const addr = data.address;
            const city = addr.village || addr.town || addr.city || 
                         addr.county || addr.state_district || '';
            
            if (city && this.villageCityField && !this.villageCityField.value) {
                this.villageCityField.value = city;
                this.villageCityField.classList.add('valid');
                console.log(`🏘️ Auto-filled city: ${city}`);
            }
            
            const landmark = addr.road || addr.neighbourhood || addr.suburb || '';
            if (landmark && this.landmarkField && !this.landmarkField.value) {
                this.landmarkField.value = landmark;
                console.log(`🏠 Auto-filled landmark: ${landmark}`);
            }
        } catch (error) {
            console.log('📍 Reverse geocode failed (will use manual entry)');
        }
    }
    
    // ============================================
    // PRIVATE: GPS POPUP
    // ============================================
    
    showGPSPopup() {
        if (this.popupVisible) return;
        
        // Remove existing
        this.hideGPSPopup();
        
        const messages = this.getGPSPopupMessages();
        
        const overlay = document.createElement('div');
        overlay.id = 'gpsPopup';
        overlay.className = 'gps-popup-overlay';
        
        overlay.innerHTML = `
            <div class="gps-popup-card">
                <button class="gps-close-btn" id="gpsCloseBtn">✕</button>
                
                <div class="gps-popup-icon">📡</div>
                
                <h2 class="gps-popup-title">${messages.title}</h2>
                
                <p class="gps-popup-message">${messages.message}</p>
                
                <div class="gps-instruction-box">
                    <p>${messages.instruction}</p>
                </div>
                
                <div class="gps-waves">
                    <span>📡</span>
                    <span>📡</span>
                    <span>📡</span>
                </div>
                
                <button class="gps-primary-btn" id="gpsSettingsBtn">
                    ${messages.openSettings}
                </button>
                
                <button class="gps-retry-btn" id="gpsRetryBtn">
                    ${messages.retry}
                </button>
                
                <button class="gps-skip-btn" id="gpsSkipBtn" style="display:block;width:100%;padding:10px;background:transparent;color:#999;border:none;font-size:12px;cursor:pointer;margin-top:4px;">
                    ${messages.skip}
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // Bind events
        this.bindPopupEvents(overlay);
        
        this.popupVisible = true;
        console.log('📡 GPS Popup shown');
    }
    
    hideGPSPopup() {
        const popup = document.getElementById('gpsPopup');
        if (popup) {
            popup.classList.remove('visible');
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.remove();
                }
                // Restore body scroll if checkout modal is not open
                const checkoutModal = document.getElementById('checkoutModal');
                if (checkoutModal && checkoutModal.classList.contains('hidden')) {
                    document.body.style.overflow = '';
                }
            }, 300);
        }
        this.popupVisible = false;
    }
    
    bindPopupEvents(overlay) {
        // Close button
        overlay.querySelector('#gpsCloseBtn')?.addEventListener('click', () => {
            this.hideGPSPopup();
        });
        
        // Open GPS Settings
        overlay.querySelector('#gpsSettingsBtn')?.addEventListener('click', () => {
            this.openGPSSettings();
        });
        
        // Retry button
        overlay.querySelector('#gpsRetryBtn')?.addEventListener('click', () => {
            this.hideGPSPopup();
            this.isFound = false;
            this.isSearching = true;
            this.updateIndicator('searching');
            this.tryGetLocation();
            this.startLoop();
            
            // Fire state change
            if (this.onStateChangeCallback) {
                this.onStateChangeCallback('retrying');
            }
        });
        
        // Skip button
        overlay.querySelector('#gpsSkipBtn')?.addEventListener('click', () => {
            this.hideGPSPopup();
        });
    }
    
    openGPSSettings() {
        console.log('⚙️ Opening GPS settings...');
        
        // Try Android intent
        if (navigator.userAgent.match(/Android/i)) {
            try {
                window.location.href = 'intent://com.android.settings/#Intent;scheme=android-app;end';
            } catch (e) {}
        }
        
        // Fallback for iOS and others
        setTimeout(() => {
            try {
                window.open('app-settings:', '_blank');
            } catch (e) {
                // Last resort
                alert(this.currentLang === 'hi' 
                    ? 'कृपया Settings में जाकर Location ON करें' 
                    : 'Please go to Settings and turn ON Location');
            }
        }, 500);
    }
    
    getGPSPopupMessages() {
        const messages = {
            hi: {
                title: '📡 GPS बंद है!',
                message: 'आपका सामान सही-सलामत पहुँचाने के लिए हमें आपकी सटीक लोकेशन चाहिए। कृपया GPS चालू करें। 🙏',
                instruction: '📱 ऊपर से स्वाइप करें → ⚙️ Settings खोलें → 📍 Location ON करें',
                openSettings: '⚙️ GPS SETTING खोलें',
                retry: '🔄 फिर से कोशिश करें',
                skip: '✕ बाद में'
            },
            en: {
                title: '📡 GPS is OFF!',
                message: 'We need your exact location to deliver your order safely. Please turn ON GPS. 🙏',
                instruction: '📱 Swipe down → ⚙️ Open Settings → 📍 Turn Location ON',
                openSettings: '⚙️ Open GPS Settings',
                retry: '🔄 Try Again',
                skip: '✕ Skip'
            }
        };
        
        return messages[this.currentLang] || messages.hi;
    }
    
    // ============================================
    // PRIVATE: AUTO-DETECT EVENTS
    // ============================================
    
    bindAutoDetectEvents() {
        // When user returns to tab (after turning on GPS)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isSearching && !this.isFound) {
                console.log('👁 Tab visible — retrying GPS...');
                setTimeout(() => this.tryGetLocation(), 1000);
            }
        });
        
        // When window gains focus (user may have turned on GPS)
        window.addEventListener('focus', () => {
            if (this.popupVisible && !this.isFound) {
                console.log('👁 Window focused — checking GPS...');
                setTimeout(() => {
                    this.hideGPSPopup();
                    this.isSearching = true;
                    this.updateIndicator('searching');
                    this.tryGetLocation();
                    this.startLoop();
                }, 1500);
            }
        });
    }
    
    // ============================================
    // DESTROY
    // ============================================
    
    destroy() {
        this.stop();
        this.hideGPSPopup();
        this.onFoundCallback = null;
        this.onErrorCallback = null;
        this.onStateChangeCallback = null;
        console.log('📍 LocationManager destroyed');
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.locationManager = new LocationManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.locationManager) {
        window.locationManager.destroy();
    }
});