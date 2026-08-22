// ============================================
// SERVICE-WORKER.JS - Full Offline Support v3
// ============================================

const CACHE_VERSION = 'v3';
const CACHE_NAME = `quick-dukan-${CACHE_VERSION}`;
const DATA_CACHE = `quick-dukan-data-${CACHE_VERSION}`;

// Static files - MUST be cached for offline
const STATIC_CACHE = [
    '/Quick-Dukan/',
    '/Quick-Dukan/index.html',
    '/Quick-Dukan/manifest.json',
    
    // CSS
    '/Quick-Dukan/css/theme.css',
    '/Quick-Dukan/css/animations.css',
    '/Quick-Dukan/css/layout.css',
    '/Quick-Dukan/css/header.css',
    '/Quick-Dukan/css/search.css',
    '/Quick-Dukan/css/categories.css',
    '/Quick-Dukan/css/product-card.css',
    '/Quick-Dukan/css/category-products.css',
    '/Quick-Dukan/css/recently-viewed.css',
    '/Quick-Dukan/css/most-orders.css',
    '/Quick-Dukan/css/bottom-nav.css',
    '/Quick-Dukan/css/cart.css',
    '/Quick-Dukan/css/checkout.css',
    '/Quick-Dukan/css/orders.css',
    '/Quick-Dukan/css/dark-mode.css',
    '/Quick-Dukan/css/pwa-install.css',
    '/Quick-Dukan/css/floating-cart-bubble.css',
    '/Quick-Dukan/css/order-popup.css',
    '/Quick-Dukan/css/floating-map.css',
    '/Quick-Dukan/css/pull-to-refresh.css',
    '/Quick-Dukan/css/splash-screen.css',
    
    // JS
    '/Quick-Dukan/js/config.js',
    '/Quick-Dukan/js/whatsapp.js',
    '/Quick-Dukan/js/theme.js',
    '/Quick-Dukan/js/language.js',
    '/Quick-Dukan/js/data-loader.js',
    '/Quick-Dukan/js/search.js',
    '/Quick-Dukan/js/categories.js',
    '/Quick-Dukan/js/products.js',
    '/Quick-Dukan/js/category-products.js',
    '/Quick-Dukan/js/recently-viewed.js',
    '/Quick-Dukan/js/most-orders.js',
    '/Quick-Dukan/js/cart.js',
    '/Quick-Dukan/js/orders.js',
    '/Quick-Dukan/js/checkout.js',
    '/Quick-Dukan/js/location.js',
    '/Quick-Dukan/js/bottom-nav.js',
    '/Quick-Dukan/js/back-to-top.js',
    '/Quick-Dukan/js/animations.js',
    '/Quick-Dukan/js/app.js',
    '/Quick-Dukan/js/auto-refresh.js',
    '/Quick-Dukan/js/pwa-install.js',
    '/Quick-Dukan/js/floating-cart-bubble.js',
    '/Quick-Dukan/js/order-popup.js',
    '/Quick-Dukan/js/floating-map.js',
    '/Quick-Dukan/js/pull-to-refresh.js',
    
    // Icons
    '/Quick-Dukan/icons/icon-72.png',
    '/Quick-Dukan/icons/icon-96.png',
    '/Quick-Dukan/icons/icon-128.png',
    '/Quick-Dukan/icons/icon-144.png',
    '/Quick-Dukan/icons/icon-152.png',
    '/Quick-Dukan/icons/icon-192.png',
    '/Quick-Dukan/icons/icon-384.png',
    '/Quick-Dukan/icons/icon-512.png',
];

// ============================================
// INSTALL - Cache all static files
// ============================================
self.addEventListener('install', (event) => {
    console.log(`🔧 SW ${CACHE_VERSION} Installing...`);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching all files for offline...');
                return Promise.allSettled(
                    STATIC_CACHE.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('❌ Failed to cache:', url);
                        })
                    )
                );
            })
            .then(() => {
                console.log('✅ All files cached! Offline ready!');
                return self.skipWaiting();
            })
    );
});

// ============================================
// ACTIVATE - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
    console.log(`✅ SW ${CACHE_VERSION} Activated`);
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cache => cache !== CACHE_NAME && cache !== DATA_CACHE)
                    .map(cache => {
                        console.log('🗑️ Deleting old:', cache);
                        return caches.delete(cache);
                    })
            );
        }).then(() => {
            console.log('👑 Taking control of all pages...');
            return self.clients.claim();
        })
    );
});

// ============================================
// FETCH - Offline First Strategy
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip chrome extensions
    if (url.protocol === 'chrome-extension:') return;
    
    // Skip Google Analytics etc.
    if (url.hostname.includes('google-analytics')) return;
    if (url.hostname.includes('googletagmanager')) return;

    // 🔥 DATA FILES - Network First, Cache Fallback
    if (url.pathname.includes('/data/') || url.pathname.includes('.json')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // 🔥 STATIC FILES - Cache First, Network Fallback
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/) ||
        url.pathname.includes('/Quick-Dukan/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // 🔥 EXTERNAL RESOURCES - Network Only (maps, cdn etc.)
    if (url.hostname.includes('openstreetmap') || 
        url.hostname.includes('unpkg.com') ||
        url.hostname.includes('leafletjs')) {
        event.respondWith(networkOnly(request));
        return;
    }

    // Default: Cache First
    event.respondWith(cacheFirst(request));
});

// ============================================
// CACHE FIRST STRATEGY
// ============================================
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        // Return cached, update in background
        updateCache(request, cache);
        return cached;
    }

    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // 🔥 OFFLINE FALLBACK
        if (request.destination === 'document') {
            const offlinePage = await cache.match('/Quick-Dukan/index.html');
            if (offlinePage) return offlinePage;
        }
        return new Response('Offline - Please connect to internet', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ============================================
// NETWORK FIRST STRATEGY
// ============================================
async function networkFirst(request) {
    const cache = await caches.open(DATA_CACHE);
    
    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        console.log('🌐 Offline - Using cached data');
        const cached = await cache.match(request);
        if (cached) return cached;
        
        throw err;
    }
}

// ============================================
// NETWORK ONLY
// ============================================
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (err) {
        return new Response('Offline', { status: 503 });
    }
}

// ============================================
// BACKGROUND CACHE UPDATE
// ============================================
async function updateCache(request, cache) {
    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
            cache.put(request, response.clone());
        }
    } catch (err) {
        // Silent fail - offline mein update nahi ho sakta
    }
}

// ============================================
// MESSAGE LISTENER
// ============================================
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data === 'CHECK_OFFLINE') {
        caches.keys().then(names => {
            console.log('📦 Cached:', names);
        });
    }
});

console.log(`🔄 Service Worker ${CACHE_VERSION} Ready - Full Offline Support ✅`);

// ============================================
// ENGAGEMENT NOTIFICATION CLICK HANDLER
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'dismiss' || event.action === 'dismiss-engagement') {
        // User dismissed, do nothing
        return;
    }
    
    // Open app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes('/Quick-Dukan/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/Quick-Dukan/');
                }
            })
    );
});