// ============================================
// ADMIN.JS - Quick Dukan Admin Panel
// Complete with Delivery Boys, Ratings, Users, Payments
// Per-Order Popup Control (हर order 2 बार)
// ============================================

// ⚠️ अपना Google Apps Script Web App URL डालें
const API_URL = 'https://script.google.com/macros/s/AKfycbxiTbffb6_uPM2s5k9zTJ9WUEiexzepmKhM6UF2R4sUHKeFBhR8j9h24OiFnSxjyO6L/exec';

let soundEnabled = true;
let lastOrderCount = 0;
let currentOrders = [];
let currentNotificationOrderId = null;
let currentAssignOrderId = null;
let deliveryBoysList = [];
let lastDeliveryBoyRequestCount = 0;
let currentBlockUserPhone = null;
let currentPayments = [];
let currentPaymentFilter = 'all';

// 🆕 PER-ORDER POPUP CONTROL
let notifiedOrderIds = {};
let notifiedDeliveryBoyPhones = {};
const MAX_POPUP_SHOW_PER_ITEM = 2;

// ============================================
// SOUND SYSTEM
// ============================================
function playNotificationSound() {
    if (!soundEnabled) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
        console.log('Sound error:', e);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggle');
    if (soundEnabled) {
        btn.textContent = '🔊 Sound ON';
        btn.classList.remove('muted');
    } else {
        btn.textContent = '🔇 Sound OFF';
        btn.classList.add('muted');
    }
}

// ============================================
// REFRESH ALL
// ============================================
async function refreshAll() {
    console.log('🔄 Refreshing all data...');
    await Promise.all([
        loadOrders(),
        loadPayments(),
        loadDeliveryBoyRequests(),
        loadDeliveryBoyStats(),
        loadRatings(),
        loadBlockedUsers()
    ]);
    console.log('✅ All data refreshed');
}

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }

    if (tabName === 'orders') loadOrders();
    else if (tabName === 'payments') loadPayments();
    else if (tabName === 'deliveryBoys') {
        loadDeliveryBoyRequests();
        loadDeliveryBoyStats();
    }
    else if (tabName === 'ratings') loadRatings();
    else if (tabName === 'users') loadBlockedUsers();

    console.log('📑 Tab switched to:', tabName);
}

function viewDeliveryBoys() {
    document.getElementById('deliveryBoyNotification')?.classList.remove('show');
    switchTab('deliveryBoys');
}

// ============================================
// 💳 LOAD PAYMENTS
// ============================================
async function loadPayments() {
    try {
        const response = await fetch(`${API_URL}?action=getPayments`);
        const data = await response.json();

        if (data.success && data.payments) {
            currentPayments = data.payments;
            displayPayments(data.payments);
            updatePaymentsStats(data.payments);
        }
    } catch (error) {
        console.error('❌ Payments load error:', error);
        document.getElementById('paymentsBody').innerHTML =
            '<tr><td colspan="12" style="text-align:center;padding:30px;color:#f44336;">❌ Payments load नहीं हो सके</td></tr>';
    }
}

// ============================================
// 💳 DISPLAY PAYMENTS
// ============================================
function displayPayments(payments) {
    const tbody = document.getElementById('paymentsBody');
    document.getElementById('paymentsCount').textContent = payments.length;
    document.getElementById('paymentsTabCount').textContent = payments.length;

    if (!payments || payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:30px;">💳 कोई payments नहीं</td></tr>';
        return;
    }

    // नए payments पहले
    const sortedPayments = payments.slice().reverse();
    tbody.innerHTML = '';

    sortedPayments.forEach(payment => {
        const paymentId = payment[0] || 'N/A';
        const orderId = payment[1] || 'N/A';
        const phone = payment[2] || 'N/A';
        const name = payment[3] || '—';
        const items = payment[4] || '—';
        const productAmount = payment[5] || '0';
        const chargeAmount = payment[6] || '0';
        const totalAmount = payment[7] || '0';
        const method = payment[8] || 'N/A';
        const time = payment[9] || 'N/A';
        const status = payment[10] || 'Pending';

        const statusClass = status === 'Verified' ? 'verified' : status === 'Cancelled' ? 'cancelled' : 'pending-payment';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${paymentId}</strong></td>
            <td>${orderId}</td>
            <td>${name}</td>
            <td><a href="tel:${phone}" style="color:#2196F3;text-decoration:none;">${phone}</a></td>
            <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${items}">${items}</td>
            <td>₹${productAmount}</td>
            <td style="color:#FF9800;">₹${chargeAmount}</td>
            <td><strong style="color:#2E7D32;">₹${totalAmount}</strong></td>
            <td>${method}</td>
            <td style="font-size:11px;">${time}</td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td>
                ${status === 'Pending' ? `
                    <button class="action-btn btn-verify" onclick="verifyPayment('${paymentId}')" title="Verify">✅</button>
                    <button class="action-btn btn-cancel" onclick="rejectPayment('${paymentId}')" title="Reject">❌</button>
                ` : status === 'Verified' ? `
                    <span style="color:#4CAF50;">✅ Verified</span>
                ` : `
                    <span style="color:#f44336;">❌ Cancelled</span>
                `}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// 💳 SEARCH PAYMENTS
// ============================================
function searchPayments() {
    const query = document.getElementById('paymentSearchInput')?.value?.toLowerCase()?.trim();
    
    if (!query) {
        applyPaymentFilter();
        return;
    }
    
    const filtered = currentPayments.filter(payment => {
        const paymentId = (payment[0] || '').toLowerCase();
        const orderId = (payment[1] || '').toLowerCase();
        const phone = (payment[2] || '').toLowerCase();
        const name = (payment[3] || '').toLowerCase();
        const items = (payment[4] || '').toLowerCase();
        const productAmount = (payment[5] || '').toString();
        const totalAmount = (payment[7] || '').toString();
        const method = (payment[8] || '').toLowerCase();
        const status = (payment[10] || '').toLowerCase();
        
        return paymentId.includes(query) || 
               orderId.includes(query) || 
               phone.includes(query) || 
               name.includes(query) || 
               items.includes(query) ||
               productAmount.includes(query) ||
               totalAmount.includes(query) ||
               method.includes(query) ||
               status.includes(query);
    });
    
    displayPayments(filtered);
}

function clearPaymentSearch() {
    document.getElementById('paymentSearchInput').value = '';
    applyPaymentFilter();
}

// ============================================
// 💳 FILTER PAYMENTS
// ============================================
function filterPayments(filter) {
    currentPaymentFilter = filter;
    
    document.querySelectorAll('.payment-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        }
    });
    
    applyPaymentFilter();
}

function applyPaymentFilter() {
    const query = document.getElementById('paymentSearchInput')?.value?.toLowerCase()?.trim();
    
    let filtered = currentPayments;
    
    // Status filter
    if (currentPaymentFilter !== 'all') {
        filtered = filtered.filter(p => (p[10] || 'Pending') === currentPaymentFilter);
    }
    
    // Search filter
    if (query) {
        filtered = filtered.filter(payment => {
            const paymentId = (payment[0] || '').toLowerCase();
            const orderId = (payment[1] || '').toLowerCase();
            const phone = (payment[2] || '').toLowerCase();
            const name = (payment[3] || '').toLowerCase();
            const totalAmount = (payment[7] || '').toString();
            
            return paymentId.includes(query) || 
                   orderId.includes(query) || 
                   phone.includes(query) || 
                   name.includes(query) ||
                   totalAmount.includes(query);
        });
    }
    
    displayPayments(filtered);
}

// ============================================
// 💳 UPDATE PAYMENTS STATS
// ============================================
function updatePaymentsStats(payments) {
    const pending = payments.filter(p => p[10] === 'Pending').length;
    document.getElementById('pendingPayments').textContent = pending;
}

// ============================================
// 💳 VERIFY PAYMENT
// ============================================
async function verifyPayment(paymentId) {
    if (!confirm('✅ Payment verify करें?')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=verifyPayment&paymentId=${paymentId}`);
        const data = await response.json();
        
        if (data.success) {
            playNotificationSound();
            alert('✅ Payment verified!');
            loadPayments();
        } else {
            alert('❌ Verify failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Verify error:', error);
    }
}

// ============================================
// 💳 REJECT PAYMENT
// ============================================
async function rejectPayment(paymentId) {
    if (!confirm('❌ Payment reject करें?')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=rejectPayment&paymentId=${paymentId}`);
        const data = await response.json();
        
        if (data.success) {
            playNotificationSound();
            alert('❌ Payment rejected!');
            loadPayments();
        } else {
            alert('❌ Reject failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Reject error:', error);
    }
}

// ============================================
// LOAD ORDERS
// ============================================
async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}?action=getOrders`);
        const data = await response.json();

        if (data.success && data.orders) {
            const orders = data.orders;

            if (orders.length > lastOrderCount) {
                const newOrders = orders.slice(lastOrderCount);
                newOrders.forEach(newOrder => {
                    showNewOrderNotification(newOrder);
                    playNotificationSound();
                });
            }

            lastOrderCount = orders.length;
            currentOrders = orders;

            displayOrders(orders);
            updateStats(orders);
            updateOrdersTabCount(orders);
        } else {
            document.getElementById('ordersBody').innerHTML =
                '<tr><td colspan="10" style="text-align:center;padding:30px;color:#f44336;">❌ Orders load नहीं हो सके</td></tr>';
        }
    } catch (error) {
        console.error('❌ Load error:', error);
    }
}

// ============================================
// LOAD DELIVERY BOY REQUESTS
// ============================================
async function loadDeliveryBoyRequests() {
    try {
        const response = await fetch(`${API_URL}?action=getDeliveryBoyRequests`);
        const data = await response.json();

        if (data.success && data.requests) {
            const requests = data.requests;
            const pendingRequests = requests.filter(r => r[2] === 'Pending Approval');

            pendingRequests.forEach(request => {
                const phone = request[0] || 'Unknown';
                if (!notifiedDeliveryBoyPhones[phone] || notifiedDeliveryBoyPhones[phone] < MAX_POPUP_SHOW_PER_ITEM) {
                    showDeliveryBoyNotification(phone);
                    playNotificationSound();
                }
            });

            deliveryBoysList = requests.filter(r => r[2] === 'Approved');

            displayDeliveryBoyRequests(requests);
            updateDeliveryBoysStats(requests);
        }
    } catch (error) {
        console.error('❌ Delivery boys load error:', error);
    }
}

// ============================================
// LOAD DELIVERY BOY STATS
// ============================================
async function loadDeliveryBoyStats() {
    try {
        const response = await fetch(`${API_URL}?action=getDeliveryBoyStats`);
        const data = await response.json();

        if (data.success && data.stats) {
            displayDeliveryBoyStats(data.stats);
        }
    } catch (error) {
        console.error('❌ Stats load error:', error);
    }
}

// ============================================
// LOAD RATINGS
// ============================================
async function loadRatings() {
    try {
        const response = await fetch(`${API_URL}?action=getRatings`);
        const data = await response.json();

        if (data.success && data.ratings) {
            displayRatings(data.ratings);
            updateRatingsStats(data.ratings);
        }
    } catch (error) {
        console.error('❌ Ratings load error:', error);
    }
}

// ============================================
// LOAD BLOCKED USERS
// ============================================
async function loadBlockedUsers() {
    try {
        const response = await fetch(`${API_URL}?action=getBlockedUsers`);
        const data = await response.json();

        if (data.success && data.users) {
            displayBlockedUsers(data.users);
            document.getElementById('blockedUsers').textContent = data.users.filter(u => u[2] === 'Blocked').length;
            document.getElementById('usersTabCount').textContent = data.users.length;
        }
    } catch (error) {
        console.error('❌ Users load error:', error);
    }
}

// ============================================
// SHOW NEW ORDER NOTIFICATION
// ============================================
function showNewOrderNotification(order) {
    const orderId = order[0] || 'Unknown';

    if (!notifiedOrderIds[orderId]) {
        notifiedOrderIds[orderId] = 0;
    }

    if (notifiedOrderIds[orderId] >= MAX_POPUP_SHOW_PER_ITEM) {
        return;
    }

    notifiedOrderIds[orderId]++;

    currentNotificationOrderId = orderId;
    const customerName = order[1] || 'Unknown';
    const total = order[8] || '0';

    document.getElementById('notificationBody').innerHTML = `
        <strong>Order ID:</strong> ${orderId}<br>
        <strong>Customer:</strong> ${customerName}<br>
        <strong>Total:</strong> ₹${total}
    `;

    document.getElementById('notificationPopup').classList.add('show');

    setTimeout(() => {
        document.getElementById('notificationPopup').classList.remove('show');
    }, 10000);
}

// ============================================
// SHOW DELIVERY BOY NOTIFICATION
// ============================================
function showDeliveryBoyNotification(phone) {
    const cleanPhone = phone || 'Unknown';

    if (!notifiedDeliveryBoyPhones[cleanPhone]) {
        notifiedDeliveryBoyPhones[cleanPhone] = 0;
    }

    if (notifiedDeliveryBoyPhones[cleanPhone] >= MAX_POPUP_SHOW_PER_ITEM) {
        return;
    }

    notifiedDeliveryBoyPhones[cleanPhone]++;

    document.getElementById('deliveryBoyNotificationBody').innerHTML = `
        <strong>🛵 नई Delivery Boy Login Request!</strong><br>
        <strong>Phone:</strong> ${cleanPhone}<br>
        कृपया request को approve या reject करें।
    `;

    document.getElementById('deliveryBoyNotification').classList.add('show');

    setTimeout(() => {
        document.getElementById('deliveryBoyNotification').classList.remove('show');
    }, 10000);
}

// ============================================
// DISPLAY ORDERS
// ============================================
function displayOrders(orders) {
    const tbody = document.getElementById('ordersBody');
    document.getElementById('ordersCount').textContent = orders.length;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;">📭 कोई ऑर्डर नहीं</td></tr>';
        return;
    }

    const recentOrders = orders.slice(-50).reverse();
    tbody.innerHTML = '';

    recentOrders.forEach(order => {
        const orderId = order[0] || 'N/A';
        const customerName = order[1] || 'N/A';
        const phone = order[2] || 'N/A';
        const villageCity = order[3] || 'N/A';
        const landmark = order[4] || '';
        const pincode = order[5] || '';
        const totalAmount = order[8] || '0';
        const latitude = order[10] || '';
        const longitude = order[11] || '';
        const status = order[13] || 'Pending';
        const orderDate = order[14] || '';
        const deliveryBoyPhone = order[16] || '';
        const rating = order[17] || '';

        const statusClass = status.toLowerCase();
        const address = [villageCity, landmark, pincode].filter(Boolean).join(', ');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${orderId}</strong></td>
            <td style="font-size:11px;">${orderDate}</td>
            <td>${customerName}</td>
            <td><a href="tel:${phone}" style="color:#2196F3;text-decoration:none;">${phone}</a></td>
            <td>${address || 'N/A'}</td>
            <td><strong style="color:#2E7D32;">₹${totalAmount}</strong></td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td>
                ${deliveryBoyPhone ? `
                    <span style="font-size:11px;color:#666;">${deliveryBoyPhone}</span>
                ` : `
                    <button class="action-btn btn-assign" onclick="openAssignModal('${orderId}')" title="Assign">🛵</button>
                `}
            </td>
            <td>
                ${rating ? displayStars(rating) : '<span style="color:#ccc;">—</span>'}
            </td>
            <td>
                <button class="action-btn btn-confirm" onclick="updateStatus('${orderId}', 'Confirmed')" title="Confirm">✅</button>
                <button class="action-btn btn-cancel" onclick="updateStatus('${orderId}', 'Cancelled')" title="Cancel">❌</button>
                <button class="action-btn btn-deliver" onclick="updateStatus('${orderId}', 'Delivered')" title="Deliver">🚚</button>
                <button class="action-btn btn-call" onclick="callCustomer('${phone}')" title="Call">📞</button>
                <button class="action-btn btn-whatsapp" onclick="whatsappCustomer('${phone}')" title="WhatsApp">💬</button>
                <button class="action-btn btn-map" onclick="openMap('${latitude}', '${longitude}')" title="Map">📍</button>
                <button class="action-btn btn-block" onclick="openBlockUserModal('${phone}')" title="Block User">🚫</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// DISPLAY DELIVERY BOY REQUESTS
// ============================================
function displayDeliveryBoyRequests(requests) {
    const tbody = document.getElementById('deliveryBoysBody');
    document.getElementById('deliveryBoysCount').textContent = requests.length;
    document.getElementById('deliveryBoysTabCount').textContent = requests.length;

    if (!requests || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;">🛵 कोई requests नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    requests.reverse().forEach(request => {
        const phone = request[0] || 'N/A';
        const otp = request[1] || 'N/A';
        const status = request[2] || 'Pending';
        const requestTime = request[3] || 'N/A';
        const name = request[5] || '';
        const loginCode = request[6] || '';

        const statusClass = status.toLowerCase().replace(' ', '-');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${phone}</strong></td>
            <td>${otp}</td>
            <td style="font-size:11px;">${requestTime}</td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td>${name || '—'}</td>
            <td>
                ${status === 'Pending Approval' ? `
                    <input type="text" id="nameInput_${phone}" placeholder="नाम" style="padding:5px;border:1px solid #ddd;border-radius:5px;font-size:11px;margin-right:4px;width:80px;">
                    <button class="action-btn btn-approve" onclick="approveDeliveryBoy('${phone}')" title="Approve">✅</button>
                    <button class="action-btn btn-reject" onclick="rejectDeliveryBoy('${phone}')" title="Reject">❌</button>
                ` : status === 'Approved' ? `
                    <span class="login-code-display">${loginCode || 'N/A'}</span>
                    <button class="action-btn btn-block" onclick="blockDeliveryBoy('${phone}')" title="Block">🚫</button>
                ` : status === 'Blocked' ? `
                    <button class="action-btn btn-unblock" onclick="unblockDeliveryBoy('${phone}')" title="Unblock">✅ Unblock</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// DISPLAY DELIVERY BOY STATS
// ============================================
function displayDeliveryBoyStats(stats) {
    const tbody = document.getElementById('deliveryBoysStatsBody');
    document.getElementById('activeDeliveryBoysCount').textContent = stats.length;

    if (!stats || stats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;">📊 कोई delivery boys नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    stats.forEach(stat => {
        const phone = stat[0] || 'N/A';
        const name = stat[1] || '—';
        const status = stat[2] || 'Pending';
        const loginTime = stat[3] || '—';
        const logoutTime = stat[4] || '—';
        const isLoggedIn = stat[5] || 'No';
        const deliveries = stat[6] || '0';
        const earnings = stat[7] || '0';

        const statusClass = status.toLowerCase();
        const isOnline = isLoggedIn === 'Yes';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${phone}</strong></td>
            <td>${name}</td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td style="font-size:11px;">${loginTime}</td>
            <td style="font-size:11px;">${logoutTime}</td>
            <td>
                <span class="online-dot ${isOnline ? 'yes' : 'no'}"></span>
                ${isOnline ? 'Online' : 'Offline'}
            </td>
            <td><strong style="color:#FF9800;">${deliveries}</strong></td>
            <td><strong style="color:#2E7D32;">₹${earnings}</strong></td>
            <td>
                <button class="action-btn btn-call" onclick="callCustomer('${phone}')" title="Call">📞</button>
                ${status === 'Blocked' ? `
                    <button class="action-btn btn-unblock" onclick="unblockDeliveryBoy('${phone}')" title="Unblock">✅</button>
                ` : `
                    <button class="action-btn btn-block" onclick="blockDeliveryBoy('${phone}')" title="Block">🚫</button>
                `}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// DISPLAY RATINGS
// ============================================
function displayRatings(ratings) {
    const tbody = document.getElementById('ratingsBody');
    document.getElementById('ratingsCount').textContent = ratings.length;
    document.getElementById('ratingsTabCount').textContent = ratings.length;

    if (!ratings || ratings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;">⭐ कोई ratings नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    ratings.reverse().forEach(rating => {
        const orderId = rating[0] || 'N/A';
        const ratingValue = rating[1] || '0';
        const comment = rating[2] || '—';
        const time = rating[3] || 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${orderId}</strong></td>
            <td>${displayStars(ratingValue)}</td>
            <td style="max-width:200px;">${comment}</td>
            <td style="font-size:11px;">${time}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// DISPLAY BLOCKED USERS
// ============================================
function displayBlockedUsers(users) {
    const tbody = document.getElementById('usersBody');
    document.getElementById('usersCount').textContent = users.length;

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;">👤 कोई users नहीं</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    users.forEach(user => {
        const phone = user[0] || 'N/A';
        const name = user[1] || '—';
        const status = user[2] || 'Active';
        const blockedTime = user[3] || '—';
        const reason = user[4] || '—';

        const statusClass = status.toLowerCase();

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${phone}</strong></td>
            <td>${name}</td>
            <td><span class="badge badge-${statusClass}">${status}</span></td>
            <td style="font-size:11px;">${blockedTime}</td>
            <td>${reason}</td>
            <td>
                ${status === 'Blocked' ? `
                    <button class="action-btn btn-unblock" onclick="unblockUser('${phone}')" title="Unblock">✅ Unblock</button>
                ` : `
                    <button class="action-btn btn-block" onclick="openBlockUserModal('${phone}')" title="Block">🚫 Block</button>
                `}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// DISPLAY STARS
// ============================================
function displayStars(rating) {
    const ratingNum = parseInt(rating) || 0;
    let stars = '<span class="rating-stars-display">';

    for (let i = 1; i <= 5; i++) {
        if (i <= ratingNum) {
            stars += '<span class="rating-star-filled">⭐</span>';
        } else {
            stars += '<span class="rating-star-empty">☆</span>';
        }
    }

    stars += `<span class="rating-value">${ratingNum}.0</span></span>`;
    return stars;
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats(orders) {
    const total = orders.length;
    const pending = orders.filter(o => (o[13] || 'Pending') === 'Pending').length;
    const confirmed = orders.filter(o => o[13] === 'Confirmed').length;
    const revenue = orders.reduce((sum, o) => sum + parseFloat(o[8] || '0'), 0);

    document.getElementById('totalOrders').textContent = total;
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('confirmedOrders').textContent = confirmed;
    document.getElementById('totalRevenue').textContent = '₹' + revenue.toFixed(2);
    document.getElementById('ordersTabCount').textContent = total;
}

function updateDeliveryBoysStats(requests) {
    const approved = requests.filter(r => r[2] === 'Approved').length;
    const pending = requests.filter(r => r[2] === 'Pending Approval').length;

    document.getElementById('totalDeliveryBoys').textContent = approved;
    document.getElementById('pendingRequests').textContent = pending;
}

function updateRatingsStats(ratings) {
    if (ratings.length === 0) {
        document.getElementById('averageRating').textContent = '0.0';
        return;
    }

    const totalRating = ratings.reduce((sum, r) => sum + parseFloat(r[1] || '0'), 0);
    const avg = (totalRating / ratings.length).toFixed(1);
    document.getElementById('averageRating').textContent = avg;
}

function updateOrdersTabCount(orders) {
    document.getElementById('ordersTabCount').textContent = orders.length;
}

// ============================================
// UPDATE ORDER STATUS
// ============================================
async function updateStatus(orderId, status) {
    try {
        const response = await fetch(`${API_URL}?action=updateStatus&orderId=${orderId}&status=${status}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            alert('✅ Order ' + orderId + ' ' + status + ' हो गया!');
            loadOrders();
        } else {
            alert('❌ Update failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Update error:', error);
    }
}

// ============================================
// APPROVE / REJECT DELIVERY BOY
// ============================================
async function approveDeliveryBoy(phone) {
    const name = document.getElementById(`nameInput_${phone}`)?.value || 'Delivery Boy';

    try {
        const response = await fetch(`${API_URL}?action=approveDeliveryBoy&phone=${phone}&name=${encodeURIComponent(name)}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            alert('✅ Delivery Boy approved! Login Code: ' + (data.loginCode || 'N/A'));
            loadDeliveryBoyRequests();
            loadDeliveryBoyStats();
        } else {
            alert('❌ Approval failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Approval error:', error);
    }
}

async function rejectDeliveryBoy(phone) {
    try {
        const response = await fetch(`${API_URL}?action=rejectDeliveryBoy&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            alert('❌ Delivery Boy rejected!');
            loadDeliveryBoyRequests();
        }
    } catch (error) {
        console.error('❌ Reject error:', error);
    }
}

// ============================================
// BLOCK / UNBLOCK DELIVERY BOY
// ============================================
async function blockDeliveryBoy(phone) {
    if (!confirm('क्या आप इस delivery boy को block करना चाहते हैं?')) return;

    try {
        const response = await fetch(`${API_URL}?action=blockDeliveryBoy&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            alert('🚫 Delivery Boy blocked!');
            loadDeliveryBoyRequests();
            loadDeliveryBoyStats();
        }
    } catch (error) {
        console.error('❌ Block error:', error);
    }
}

async function unblockDeliveryBoy(phone) {
    try {
        const response = await fetch(`${API_URL}?action=unblockDeliveryBoy&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            alert('✅ Delivery Boy unblocked!');
            loadDeliveryBoyRequests();
            loadDeliveryBoyStats();
        }
    } catch (error) {
        console.error('❌ Unblock error:', error);
    }
}

// ============================================
// BLOCK / UNBLOCK USER
// ============================================
function openBlockUserModal(phone) {
    currentBlockUserPhone = phone;
    document.getElementById('blockUserPhone').textContent = phone;
    document.getElementById('blockReasonInput').value = '';
    document.getElementById('blockUserModal').classList.remove('hidden');
}

function closeBlockUserModal() {
    document.getElementById('blockUserModal').classList.add('hidden');
    currentBlockUserPhone = null;
}

async function confirmBlockUser() {
    const reason = document.getElementById('blockReasonInput')?.value || 'No reason';

    if (!currentBlockUserPhone) return;

    try {
        const response = await fetch(`${API_URL}?action=blockUser&phone=${currentBlockUserPhone}&reason=${encodeURIComponent(reason)}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            alert('🚫 User blocked!');
            closeBlockUserModal();
            loadBlockedUsers();
        }
    } catch (error) {
        console.error('❌ Block user error:', error);
    }
}

async function unblockUser(phone) {
    try {
        const response = await fetch(`${API_URL}?action=unblockUser&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            alert('✅ User unblocked!');
            loadBlockedUsers();
        }
    } catch (error) {
        console.error('❌ Unblock user error:', error);
    }
}

// ============================================
// ASSIGN DELIVERY BOY
// ============================================
function openAssignModal(orderId) {
    currentAssignOrderId = orderId;
    document.getElementById('assignOrderId').textContent = orderId;

    const select = document.getElementById('deliveryBoySelect');
    select.innerHTML = '<option value="">-- चुनें --</option>';

    deliveryBoysList.forEach(deliveryBoy => {
        const phone = deliveryBoy[0] || '';
        const name = deliveryBoy[5] || 'Delivery Boy';
        const option = document.createElement('option');
        option.value = phone;
        option.textContent = `${name} (${phone})`;
        select.appendChild(option);
    });

    document.getElementById('assignModal').classList.remove('hidden');
}

function closeAssignModal() {
    document.getElementById('assignModal').classList.add('hidden');
    currentAssignOrderId = null;
}

async function assignDeliveryBoy() {
    const phone = document.getElementById('deliveryBoySelect')?.value;

    if (!phone || !currentAssignOrderId) {
        alert('⚠️ कृपया delivery boy चुनें');
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=acceptOrder&orderId=${currentAssignOrderId}&phone=${phone}`);
        const data = await response.json();

        if (data.success) {
            playNotificationSound();
            alert('✅ Delivery Boy assigned!');
            closeAssignModal();
            loadOrders();
        }
    } catch (error) {
        console.error('❌ Assign error:', error);
    }
}

// ============================================
// NOTIFICATION BUTTONS
// ============================================
function notifConfirm() {
    if (currentNotificationOrderId) {
        updateStatus(currentNotificationOrderId, 'Confirmed');
        document.getElementById('notificationPopup').classList.remove('show');
    }
}

function notifCancel() {
    if (currentNotificationOrderId) {
        updateStatus(currentNotificationOrderId, 'Cancelled');
        document.getElementById('notificationPopup').classList.remove('show');
    }
}

function notifView() {
    document.getElementById('notificationPopup').classList.remove('show');
    document.querySelector('.orders-container').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// CUSTOMER FUNCTIONS
// ============================================
function callCustomer(phone) {
    window.open(`tel:${phone}`);
}

function whatsappCustomer(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`);
}

function openMap(lat, lng) {
    if (lat && lng && lat !== '' && lng !== '') {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`);
    }
}

// ============================================
// AUTO REFRESH
// ============================================
setInterval(() => {
    loadOrders();
    loadPayments();
    loadDeliveryBoyRequests();
    loadDeliveryBoyStats();
    loadRatings();
    loadBlockedUsers();
}, 5000);

// Initial load
refreshAll();

console.log('🛒 Quick Dukan Admin Panel Ready');
console.log('🔄 Auto-refresh: 5 seconds');
console.log('🔊 Sound:', soundEnabled ? 'ON' : 'OFF');
console.log('💳 Payment System: Enabled');
console.log('🛵 Delivery Boy System: Enabled');
console.log('⭐ Rating System: Enabled');
console.log('👤 User Management: Enabled');
console.log('🚫 Block System: Enabled');
console.log('🔔 Popup Control: Per-order ' + MAX_POPUP_SHOW_PER_ITEM + ' times');