// ============================================
// ORDERS PAGE JS - Complete (No Login)
// URL Parameter + User-specific Orders
// Bike Animation + Payment Status + Rating + Share
// ============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbxiTbffb6_uPM2s5k9zTJ9WUEiexzepmKhM6UF2R4sUHKeFBhR8j9h24OiFnSxjyO6L/exec';

// Shop Location
const SHOP_LOCATION = { lat: 27.6667496, lng: 77.7124673, name: 'Quick Dukan' };

// Product Emojis (Fallback)
const PRODUCT_EMOJIS = ['🛒', '🥛', '🍚', '🌾', '🧹', '🧴', '🍪', '☕', '🧂', '🫙', '🥤', '🍫', '🧃', '🥜', '🫘', '🍯', '🧼', '📦'];

let currentUser = { phone: '', name: '' };
let allPayments = [];

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkURLParameters();
    console.log('📋 Orders Page Ready');
});

function goBack() {
    window.history.back();
}

function goHome() {
    window.location.href = 'index.html';
}

function retryLoad() {
    checkURLParameters();
}

function logoutUser() {
    window.location.href = 'index.html';
}

// ============================================
// CHECK URL PARAMETERS
// ============================================
function checkURLParameters() {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get('phone');
    const email = params.get('email');
    
    if (phone) {
        currentUser.phone = phone.replace(/\D/g, '').slice(-10);
        loadOrdersByPhone(currentUser.phone);
    } else if (email) {
        loadOrdersByEmail(email);
    } else {
        window.location.href = 'index.html';
    }
}

// ============================================
// LOAD ORDERS BY PHONE
// ============================================
async function loadOrdersByPhone(phone) {
    showLoading();
    
    try {
        // Payment data भी load करें
        await loadPaymentsData();
        
        const url = `${API_URL}?action=getUserOrders&phone=${phone}`;
        console.log('📡 Loading orders for:', phone);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📦 Orders response:', data);
        
        if (data.success && data.orders && data.orders.length > 0) {
            displayUserInfo(phone, data.orders[0][1] || '');
            displayOrders(data.orders);
        } else {
            showNoOrders();
        }
    } catch (error) {
        console.error('❌ Load orders error:', error);
        showError();
    }
}

// ============================================
// LOAD ORDERS BY EMAIL
// ============================================
async function loadOrdersByEmail(email) {
    showLoading();
    
    try {
        const userResponse = await fetch(`${API_URL}?action=checkUserByEmail&email=${encodeURIComponent(email)}`);
        const userData = await userResponse.json();
        
        if (userData.success && userData.exists) {
            const phone = userData.phone;
            currentUser.phone = phone;
            await loadOrdersByPhone(phone);
        } else {
            showNoOrders();
        }
    } catch (error) {
        showError();
    }
}

// ============================================
// 🆕 LOAD PAYMENTS DATA
// ============================================
async function loadPaymentsData() {
    try {
        const response = await fetch(`${API_URL}?action=getPayments`);
        const data = await response.json();
        
        if (data.success && data.payments) {
            allPayments = data.payments;
            console.log('💳 Payments loaded:', allPayments.length);
        }
    } catch (error) {
        console.log('⚠️ Payments load error:', error);
    }
}

// ============================================
// 🆕 GET PAYMENT INFO FOR ORDER
// ============================================
function getPaymentInfo(orderId) {
    const payment = allPayments.find(p => p[1] === orderId);
    
    if (payment) {
        return {
            paymentId: payment[0] || '',
            orderId: payment[1] || '',
            phone: payment[2] || '',
            name: payment[3] || '',
            items: payment[4] || '',
            productAmount: payment[5] || '0',
            chargeAmount: payment[6] || '0',
            totalAmount: payment[7] || '0',
            method: payment[8] || '',
            time: payment[9] || '',
            status: payment[10] || 'Pending'
        };
    }
    
    return null;
}

// ============================================
// DISPLAY USER INFO
// ============================================
function displayUserInfo(phone, name) {
    currentUser.phone = phone;
    currentUser.name = name || 'User';
    
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userPhone').textContent = '+91 ' + phone;
    document.getElementById('userInfoBar').classList.remove('hidden');
}

// ============================================
// SHOW STATES
// ============================================
function showLoading() {
    document.getElementById('ordersContainer').classList.remove('hidden');
    document.getElementById('noOrdersState').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    
    document.getElementById('ordersContainer').innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>🔄 Orders load हो रहे हैं...</p>
        </div>
    `;
}

function showNoOrders() {
    document.getElementById('ordersContainer').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.getElementById('noOrdersState').classList.remove('hidden');
}

function showError() {
    document.getElementById('ordersContainer').classList.add('hidden');
    document.getElementById('noOrdersState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
}

// ============================================
// DISPLAY ORDERS
// ============================================
function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    container.classList.remove('hidden');
    document.getElementById('noOrdersState').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    
    container.innerHTML = '';
    
    orders.reverse().forEach(order => {
        container.appendChild(createOrderCard(order));
    });
}

// ============================================
// CREATE ORDER CARD
// ============================================
function createOrderCard(order) {
    const orderId = order[0] || 'N/A';
    const customerName = order[1] || 'N/A';
    const phone = order[2] || 'N/A';
    const villageCity = order[3] || 'N/A';
    const landmark = order[4] || '';
    const pincode = order[5] || '';
    const deliveryTime = order[6] || '';
    const orderDetails = order[7] || '';
    const totalAmount = order[8] || '0';
    const itemCount = order[9] || '0';
    const userLat = order[10] || '';
    const userLng = order[11] || '';
    const status = order[13] || 'Pending';
    const orderDate = order[14] || '';
    const rating = order[17] || '';
    
    // 🆕 Payment Info
    const paymentInfo = getPaymentInfo(orderId);
    
    const items = parseOrderItems(orderDetails);
    
    const card = document.createElement('div');
    card.className = 'order-card';
    card.id = `order-${orderId}`;
    
    let html = '';
    
    // Header
    html += `
        <div class="order-card-header">
            <div>
                <div class="order-id">#${orderId}</div>
                <div class="order-date">${orderDate}</div>
            </div>
            <span class="order-status-badge ${status.toLowerCase()}">${getStatusLabel(status)}</span>
        </div>
    `;
    
    // Cancelled Banner
    if (status === 'Cancelled') {
        html += `
            <div class="cancelled-banner">
                <div class="cancelled-icon">😢</div>
                <div class="cancelled-title">Order Cancelled</div>
                <div class="cancelled-reason">यह order cancel कर दिया गया है</div>
            </div>
        `;
    }
    
    // Delivered Banner
    if (status === 'Delivered') {
        html += `
            <div class="delivered-banner">
                <div class="delivered-icon">🎉😊</div>
                <div class="delivered-title">✅ Order Delivered!</div>
            </div>
        `;
    }
    
    // Bike Animation (Better with Check Marks)
    if (status === 'Confirmed' || status === 'in_transit') {
        html += createBikeAnimation(status, orderId);
    }
    
    // 🆕 Payment Status Bar
    if (paymentInfo) {
        html += createPaymentStatusBar(paymentInfo);
    }
    
    // Items
    html += '<div class="order-items">';
    items.forEach((item, index) => {
        const emoji = PRODUCT_EMOJIS[index % PRODUCT_EMOJIS.length];
        html += `
            <div class="order-item">
                <div class="order-item-image">
                    ${item.image ? `<img src="${item.image}" onerror="this.outerHTML='<span class=item-emoji>${emoji}</span>'">` : `<span class="item-emoji">${emoji}</span>`}
                </div>
                <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-detail">${item.unit} × ${item.quantity}</div>
                </div>
                <div class="order-item-price">₹${item.total}</div>
            </div>
        `;
    });
    html += '</div>';
    
    // Summary
    html += `
        <div class="order-summary">
            <span class="order-total">₹${totalAmount}</span>
            <span class="order-item-count">${itemCount} items</span>
        </div>
    `;
    
    // Delivery Info
    html += `
        <div class="delivery-info">
            <span>🚚 ${deliveryTime || 'N/A'}</span>
            <span>📍 ${villageCity}${landmark ? ', ' + landmark : ''}${pincode ? ' - ' + pincode : ''}</span>
        </div>
    `;
    
    // Location Buttons
    html += '<div class="location-buttons">';
    html += `<button class="location-btn shop-btn" onclick="openShopLocation()">🏪 Dukan</button>`;
    if (userLat && userLng) {
        html += `<button class="location-btn user-btn" onclick="openUserLocation('${userLat}', '${userLng}')">📍 मेरी Loc</button>`;
    }
    if (status === 'Confirmed' || status === 'in_transit') {
        html += `<button class="location-btn rider-btn" onclick="openRiderLocation('${orderId}')">🛵 Rider</button>`;
    }
    html += '</div>';
    
    // Timeline
    html += createTimeline(status);
    
    // Buttons
    html += '<div class="order-actions">';
    
    if (status === 'Delivered') {
        html += `<button class="order-btn reorder-btn" onclick="reorderOrder('${orderId}')">🔄 Reorder</button>`;
    }
    
    if (status === 'Delivered') {
        if (rating) {
            html += `<button class="order-btn rate-btn rated" disabled>⭐ ${rating}.0</button>`;
        } else {
            html += `<button class="order-btn rate-btn" onclick="openRating('${orderId}')">⭐ Rate</button>`;
        }
    }
    
    html += `<button class="order-btn share-btn" onclick="shareOrder('${orderId}', '${totalAmount}', '${customerName}')">📤 Share</button>`;
    
    html += '</div>';
    
    card.innerHTML = html;
    return card;
}

// ============================================
// 🆕 CREATE PAYMENT STATUS BAR
// ============================================
function createPaymentStatusBar(paymentInfo) {
    const method = paymentInfo.method || 'N/A';
    const status = paymentInfo.status || 'Pending';
    const totalAmount = paymentInfo.totalAmount || '0';
    
    let statusClass = 'payment-pending';
    let statusIcon = '⏳';
    let statusText = 'Pending';
    
    if (status === 'Verified') {
        statusClass = 'payment-verified';
        statusIcon = '✅';
        statusText = 'Verified';
    } else if (status === 'Cancelled') {
        statusClass = 'payment-cancelled';
        statusIcon = '❌';
        statusText = 'Cancelled';
    }
    
    return `
        <div class="payment-status-bar ${statusClass}">
            <div class="payment-status-info">
                <span class="payment-status-icon">${statusIcon}</span>
                <div class="payment-status-details">
                    <span class="payment-status-label">💳 Payment: ${method}</span>
                    <span class="payment-status-value">₹${totalAmount} - ${statusText}</span>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// BIKE ANIMATION (Better with Check Marks)
// ============================================
function createBikeAnimation(status, orderId) {
    const progress = status === 'in_transit' ? 70 : 30;
    const checkmarks = getCheckmarks(status);
    
    return `
        <div class="bike-animation-container">
            <div class="bike-checkmarks">
                ${checkmarks}
            </div>
            <div class="bike-track">
                <span class="bike-shop">🏪</span>
                <div class="bike-road">
                    <div class="bike-progress" style="width:${progress}%"></div>
                    <span class="bike-rider" style="left:${progress}%">🛵</span>
                </div>
                <span class="bike-customer">📍</span>
            </div>
            <div class="bike-status-text">
                ${status === 'in_transit' ? '🛵 आपका order आ रहा है...' : '✅ Order confirmed, rider जल्द निकलेगा'}
            </div>
            <div class="bike-eta">⏱️ Estimated: 30-45 मिनट</div>
        </div>
    `;
}

// ============================================
// 🆕 GET CHECKMARKS
// ============================================
function getCheckmarks(status) {
    const steps = [
        { label: 'Order Placed', done: true },
        { label: 'Confirmed', done: status === 'in_transit' || status === 'Confirmed' },
        { label: 'Out for Delivery', done: status === 'in_transit' },
        { label: 'Delivered', done: false }
    ];
    
    let html = '<div class="checkmark-row">';
    steps.forEach((step, index) => {
        html += `
            <div class="checkmark-item ${step.done ? 'done' : ''} ${index === 2 && status === 'in_transit' ? 'active' : ''}">
                <div class="checkmark-dot">${step.done ? '✓' : (index + 1)}</div>
                <span class="checkmark-label">${step.label}</span>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// ============================================
// TIMELINE
// ============================================
function createTimeline(status) {
    if (status === 'Cancelled') {
        return `
            <div class="order-timeline">
                <div class="timeline-step completed"><div class="timeline-dot">📋</div><span>Sent</span></div>
                <div class="timeline-line completed"></div>
                <div class="timeline-step cancelled"><div class="timeline-dot">❌</div><span>Cancelled</span></div>
            </div>
        `;
    }
    
    const steps = [
        { label: 'Sent', key: 'pending' },
        { label: 'Confirmed', key: 'confirmed' },
        { label: 'In Transit', key: 'in_transit' },
        { label: 'Delivered', key: 'delivered' }
    ];
    
    const statusIndex = steps.findIndex(s => s.key === status.toLowerCase());
    
    let html = '<div class="order-timeline">';
    steps.forEach((step, index) => {
        if (index > 0) {
            html += `<div class="timeline-line ${index <= statusIndex ? 'completed' : ''}"></div>`;
        }
        const isCompleted = index < statusIndex || (index === statusIndex && status === 'Delivered');
        const isActive = index === statusIndex && status !== 'Delivered';
        html += `
            <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                <div class="timeline-dot">${isCompleted ? '✓' : index + 1}</div>
                <span>${step.label}</span>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// ============================================
// PARSE ORDER ITEMS
// ============================================
function parseOrderItems(orderDetails) {
    const items = [];
    const lines = orderDetails.split('\n');
    
    lines.forEach(line => {
        if (line.trim()) {
            const match = line.match(/\d+\.\s*(.+?)\s*-\s*(.+?)\s*×\s*(\d+)\s*=\s*₹(\d+)/);
            if (match) {
                items.push({ 
                    name: match[1].trim(), 
                    unit: match[2].trim(), 
                    quantity: parseInt(match[3]), 
                    total: match[4], 
                    image: '' 
                });
            }
        }
    });
    return items;
}

// ============================================
// LOCATION FUNCTIONS
// ============================================
function openShopLocation() {
    window.open(`https://www.google.com/maps?q=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`, '_blank');
}

function openUserLocation(lat, lng) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
}

async function openRiderLocation(orderId) {
    try {
        const response = await fetch(`${API_URL}?action=getRiderLocation&orderId=${orderId}`);
        const data = await response.json();
        
        if (data.success && data.location) {
            window.open(`https://www.google.com/maps?q=${data.location.lat},${data.location.lng}`, '_blank');
        } else {
            alert('🛵 Rider की location अभी available नहीं है');
        }
    } catch (error) {
        alert('🛵 Rider location नहीं मिली');
    }
}

// ============================================
// REORDER
// ============================================
function reorderOrder(orderId) {
    window.location.href = `index.html?reorder=${orderId}`;
}

// ============================================
// RATING
// ============================================
function openRating(orderId) {
    if (window.orderRating) {
        window.orderRating.showRatingPopup(orderId);
    } else {
        window.location.href = `index.html?rate=${orderId}`;
    }
}

// ============================================
// SHARE
// ============================================
function shareOrder(orderId, total, customerName) {
    const text = `🛒 Quick Dukan Order\n\n📋 Order ID: ${orderId}\n👤 Customer: ${customerName}\n💰 Total: ₹${total}`;
    
    if (navigator.share) {
        navigator.share({ title: 'Quick Dukan', text: text }).catch(() => {});
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
}

// ============================================
// STATUS LABEL
// ============================================
function getStatusLabel(status) {
    const labels = {
        'Pending': '⏳ Pending',
        'Confirmed': '✅ Confirmed',
        'in_transit': '🛵 In Transit',
        'Delivered': '🚚 Delivered',
        'Cancelled': '❌ Cancelled'
    };
    return labels[status] || status;
}