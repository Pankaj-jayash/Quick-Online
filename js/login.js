// ============================================
// LOGIN JS - Complete with Validation + OTP Lock
// With iframe Popup Close (No Refresh)
// Logout Fixed + Header Button Fixed
// ============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbxiTbffb6_uPM2s5k9zTJ9WUEiexzepmKhM6UF2R4sUHKeFBhR8j9h24OiFnSxjyO6L/exec';

let currentUser = { phone: '', name: '', email: '', address: '' };

// OTP State
let loginOtpValue = '';
let registerOtpValue = '';
let forgetOtpValue = '';
let loginOtpTimerInterval = null;
let registerOtpTimerInterval = null;
let forgetOtpTimerInterval = null;
let loginOtpExpired = false;
let registerOtpExpired = false;
let forgetOtpExpired = false;

// OTP Attempts
let loginOtpAttempts = 0;
let registerOtpAttempts = 0;
let loginLocked = false;
let registerLocked = false;
let loginLockTimerInterval = null;
let registerLockTimerInterval = null;

const MAX_OTP_ATTEMPTS = 5;
const OTP_VALID_SECONDS = 40;
const LOCK_MINUTES = 10;

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initDeviceId();
    checkExistingLogin();
    console.log('🔐 Login Page Ready');
});

// 🆕 IFRAME POPUP CLOSE (बिना refresh)
function closeLoginPopupFromIframe() {
    if (window.parent !== window) {
        // iframe में हैं - parent popup close करें
        const parentModal = window.parent.document.getElementById('loginIframeModal');
        if (parentModal) {
            parentModal.classList.add('hidden');
            window.parent.document.body.style.overflow = '';
        }
        
        // Parent header button reset करें
        const loginBtn = window.parent.document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<span class="login-icon">👤</span>';
            loginBtn.classList.remove('login-active');
        }
    } else {
        // सीधे login.html खुला है
        window.location.href = 'index.html';
    }
}

function goHome() {
    closeLoginPopupFromIframe();
}

function closeLogin() {
    closeLoginPopupFromIframe();
}

// ============================================
// DEVICE ID
// ============================================
function initDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'DEV-' + generateId();
        localStorage.setItem('deviceId', deviceId);
    }
}

function getDeviceId() {
    return localStorage.getItem('deviceId') || ('DEV-' + generateId());
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function isValidPhone(phone) {
    return /^[6-9]\d{9}$/.test(phone);
}

function isValidGmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}

function isValidPassword(password) {
    return password && password.length >= 6 && password.length <= 15;
}

// ============================================
// CHECK EXISTING LOGIN
// ============================================
async function checkExistingLogin() {
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
        try {
            const response = await fetch(`${API_URL}?action=getUserProfile&phone=${savedPhone}`);
            const data = await response.json();
            if (data.success && data.profile) {
                showProfile(data.profile);
            }
        } catch (error) {}
    }
}

// ============================================
// TAB SWITCHING
// ============================================
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('registerSection').classList.add('hidden');
    } else {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('registerSection').classList.remove('hidden');
    }
}

// ============================================
// GENERATE LOGIN OTP
// ============================================
async function generateLoginOtp() {
    if (loginLocked) return;
    
    const phoneEmail = document.getElementById('loginPhoneEmail')?.value?.trim();
    
    if (!phoneEmail) {
        showLoginStatus('📱 Phone या Email डालें', 'error');
        return;
    }
    
    const isPhone = /^\d+$/.test(phoneEmail);
    if (isPhone) {
        if (!isValidPhone(phoneEmail)) {
            showLoginStatus('❌ सही 10 digit mobile number डालें', 'error');
            return;
        }
    } else {
        if (!isValidGmail(phoneEmail)) {
            showLoginStatus('❌ Email @gmail.com होना चाहिए', 'error');
            return;
        }
    }
    
    loginOtpValue = Math.floor(100000 + Math.random() * 900000).toString();
    loginOtpExpired = false;
    loginOtpAttempts = 0;
    
    document.getElementById('loginOtpDisplay').classList.remove('hidden');
    document.getElementById('loginOtpValue').textContent = loginOtpValue;
    document.getElementById('loginOtpSection').classList.remove('hidden');
    document.getElementById('loginOtpAttempts').textContent = `Attempts: ${loginOtpAttempts}/${MAX_OTP_ATTEMPTS}`;
    
    startOtpTimer('login', OTP_VALID_SECONDS);
    
    showLoginStatus(`🔐 OTP: ${loginOtpValue} (40 sec valid)`, 'pending');
}

// ============================================
// GENERATE REGISTER OTP
// ============================================
async function generateRegisterOtp() {
    if (registerLocked) return;
    
    const phone = document.getElementById('registerPhone')?.value?.trim();
    
    if (!isValidPhone(phone)) {
        showRegisterStatus('❌ सही 10 digit mobile number डालें', 'error');
        const phoneError = document.getElementById('registerPhoneError');
        if (phoneError) {
            phoneError.textContent = '10 digit mobile number डालें (6-9 से start)';
            phoneError.classList.remove('hidden');
        }
        return;
    }
    
    const phoneError = document.getElementById('registerPhoneError');
    if (phoneError) phoneError.classList.add('hidden');
    
    registerOtpValue = Math.floor(100000 + Math.random() * 900000).toString();
    registerOtpExpired = false;
    registerOtpAttempts = 0;
    
    document.getElementById('registerOtpDisplay').classList.remove('hidden');
    document.getElementById('registerOtpValue').textContent = registerOtpValue;
    document.getElementById('registerOtpSection').classList.remove('hidden');
    document.getElementById('registerOtpAttempts').textContent = `Attempts: ${registerOtpAttempts}/${MAX_OTP_ATTEMPTS}`;
    
    startOtpTimer('register', OTP_VALID_SECONDS);
    
    showRegisterStatus(`🔐 OTP: ${registerOtpValue} (40 sec valid)`, 'pending');
    console.log('📝 Register OTP Generated:', registerOtpValue);
}

// ============================================
// GENERATE FORGET OTP
// ============================================
async function generateForgetOtp() {
    const phone = document.getElementById('forgetPhone')?.value?.trim();
    
    if (!isValidPhone(phone)) {
        alert('❌ सही 10 digit mobile number डालें');
        return;
    }
    
    try {
        const profileResponse = await fetch(`${API_URL}?action=getUserProfile&phone=${phone}`);
        const profileData = await profileResponse.json();
        
        if (profileData.success && profileData.profile) {
            const registeredDeviceId = profileData.profile.deviceId;
            const currentDeviceId = getDeviceId();
            
            if (registeredDeviceId && registeredDeviceId !== currentDeviceId) {
                alert('❌ Password उसी phone से reset करें जिससे account बनाया था');
                return;
            }
        }
    } catch (error) {}
    
    forgetOtpValue = Math.floor(100000 + Math.random() * 900000).toString();
    forgetOtpExpired = false;
    
    document.getElementById('forgetOtpDisplay').classList.remove('hidden');
    document.getElementById('forgetOtpValue').textContent = forgetOtpValue;
    
    startOtpTimer('forget', OTP_VALID_SECONDS);
    
    alert(`🔐 आपका OTP: ${forgetOtpValue} (40 sec valid)`);
}

// ============================================
// OTP TIMER
// ============================================
function startOtpTimer(type, seconds) {
    const timerId = type === 'login' ? 'loginOtpTimer' : type === 'register' ? 'registerOtpTimer' : 'forgetOtpTimer';
    
    if (type === 'login') clearInterval(loginOtpTimerInterval);
    else if (type === 'register') clearInterval(registerOtpTimerInterval);
    else clearInterval(forgetOtpTimerInterval);
    
    let remaining = seconds;
    
    const interval = setInterval(() => {
        const secs = remaining;
        const timerEl = document.getElementById(timerId);
        
        if (timerEl) {
            timerEl.textContent = `⏱️ 00:${secs.toString().padStart(2, '0')}`;
        }
        
        if (remaining <= 0) {
            clearInterval(interval);
            if (type === 'login') loginOtpExpired = true;
            else if (type === 'register') registerOtpExpired = true;
            else forgetOtpExpired = true;
            
            if (timerEl) timerEl.textContent = '⏱️ Expired';
        }
        
        remaining--;
    }, 1000);
    
    if (type === 'login') loginOtpTimerInterval = interval;
    else if (type === 'register') registerOtpTimerInterval = interval;
    else forgetOtpTimerInterval = interval;
}

// ============================================
// LOCK SYSTEM
// ============================================
function lockOtp(type) {
    if (type === 'login') {
        loginLocked = true;
        document.getElementById('loginLockMessage').classList.remove('hidden');
        document.getElementById('loginOtpSection').classList.add('hidden');
        startLockTimer('login');
    } else {
        registerLocked = true;
        document.getElementById('registerLockMessage').classList.remove('hidden');
        document.getElementById('registerOtpSection').classList.add('hidden');
        startLockTimer('register');
    }
}

function startLockTimer(type) {
    let seconds = LOCK_MINUTES * 60;
    const timerId = type === 'login' ? 'loginLockTimer' : 'registerLockTimer';
    
    const interval = setInterval(() => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        const timerEl = document.getElementById(timerId);
        if (timerEl) timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (seconds <= 0) {
            clearInterval(interval);
            if (type === 'login') {
                loginLocked = false;
                loginOtpAttempts = 0;
                document.getElementById('loginLockMessage').classList.add('hidden');
            } else {
                registerLocked = false;
                registerOtpAttempts = 0;
                document.getElementById('registerLockMessage').classList.add('hidden');
            }
        }
        seconds--;
    }, 1000);
}

// ============================================
// LOGIN USER
// ============================================
async function loginUser() {
    if (loginLocked) {
        showLoginStatus('🔒 OTP locked! 10 मिनट बाद try करें।', 'error');
        return;
    }
    
    const phoneEmail = document.getElementById('loginPhoneEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;
    const otp = document.getElementById('loginOtp')?.value?.trim();
    
    if (!phoneEmail) {
        showLoginStatus('📱 Phone या Email डालें', 'error');
        return;
    }
    
    if (!password) {
        showLoginStatus('🔒 Password डालें', 'error');
        return;
    }
    
    if (!otp) {
        showLoginStatus('🔑 पहले OTP डालें! Generate करें।', 'error');
        return;
    }
    
    if (loginOtpExpired) {
        showLoginStatus('⏱️ OTP expired! दोबारा generate करें।', 'error');
        return;
    }
    
    if (otp !== loginOtpValue) {
        loginOtpAttempts++;
        document.getElementById('loginOtpAttempts').textContent = `Attempts: ${loginOtpAttempts}/${MAX_OTP_ATTEMPTS}`;
        
        if (loginOtpAttempts >= MAX_OTP_ATTEMPTS) {
            showLoginStatus('🔒 बहुत ज्यादा गलत OTP! 10 मिनट lock।', 'error');
            lockOtp('login');
            return;
        }
        
        showLoginStatus(`❌ गलत OTP! ${MAX_OTP_ATTEMPTS - loginOtpAttempts} attempts बाकी`, 'error');
        return;
    }
    
    showLoginStatus('🔄 Login हो रहा है...', 'pending');
    
    try {
        const deviceId = getDeviceId();
        const response = await fetch(`${API_URL}?action=userLogin&phoneOrEmail=${encodeURIComponent(phoneEmail)}&password=${encodeURIComponent(password)}&deviceId=${deviceId}`);
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('userPhone', data.phone);
            clearInterval(loginOtpTimerInterval);
            
            const profileResponse = await fetch(`${API_URL}?action=getUserProfile&phone=${data.phone}`);
            const profileData = await profileResponse.json();
            
            if (profileData.success) {
                showProfile(profileData.profile);
                
                // 🆕 Parent header button update (सिर्फ 👤, कोई green tick नहीं)
                if (window.parent !== window) {
                    const loginBtn = window.parent.document.getElementById('loginBtn');
                    if (loginBtn) {
                        loginBtn.innerHTML = '<span class="login-icon">👤</span>';
                        loginBtn.classList.remove('login-active');
                    }
                }
            }
        } else {
            showLoginStatus('❌ ' + (data.message || 'Login failed'), 'error');
            if (data.message && data.message.toLowerCase().includes('password')) {
                document.getElementById('forgetPasswordBtn').classList.remove('hidden');
            }
        }
    } catch (error) {
        showLoginStatus('❌ Login error', 'error');
    }
}

// ============================================
// REGISTER USER
// ============================================
async function registerUser() {
    if (registerLocked) {
        showRegisterStatus('🔒 OTP locked! 10 मिनट बाद try करें।', 'error');
        return;
    }
    
    const name = document.getElementById('registerName')?.value?.trim();
    const phone = document.getElementById('registerPhone')?.value?.trim();
    const email = document.getElementById('registerEmail')?.value?.trim();
    const password = document.getElementById('registerPassword')?.value;
    const rePassword = document.getElementById('registerRePassword')?.value;
    const otp = document.getElementById('registerOtp')?.value?.trim();
    
    if (!name || name.length < 2) {
        showRegisterStatus('👤 नाम डालें', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showRegisterStatus('❌ सही 10 digit number डालें', 'error');
        return;
    }
    
    if (email && !isValidGmail(email)) {
        showRegisterStatus('❌ Email @gmail.com होना चाहिए', 'error');
        return;
    }
    
    if (!isValidPassword(password)) {
        showRegisterStatus('🔒 Password 6-15 characters', 'error');
        return;
    }
    
    if (password !== rePassword) {
        showRegisterStatus('❌ Password match नहीं', 'error');
        return;
    }
    
    if (!otp) {
        showRegisterStatus('🔑 पहले OTP डालें! Get OTP दबाएं।', 'error');
        return;
    }
    
    if (registerOtpExpired) {
        showRegisterStatus('⏱️ OTP expired! दोबारा generate करें।', 'error');
        return;
    }
    
    if (otp !== registerOtpValue) {
        registerOtpAttempts++;
        document.getElementById('registerOtpAttempts').textContent = `Attempts: ${registerOtpAttempts}/${MAX_OTP_ATTEMPTS}`;
        
        if (registerOtpAttempts >= MAX_OTP_ATTEMPTS) {
            showRegisterStatus('🔒 बहुत ज्यादा गलत OTP! 10 मिनट lock।', 'error');
            lockOtp('register');
            return;
        }
        
        showRegisterStatus(`❌ गलत OTP! ${MAX_OTP_ATTEMPTS - registerOtpAttempts} attempts बाकी`, 'error');
        return;
    }
    
    showRegisterStatus('🔄 Registration हो रहा है...', 'pending');
    
    try {
        const deviceId = getDeviceId();
        const response = await fetch(`${API_URL}?action=userRegister&phone=${phone}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&deviceId=${deviceId}`);
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('userPhone', phone);
            clearInterval(registerOtpTimerInterval);
            showRegisterStatus('✅ Registration successful!', 'success');
            
            setTimeout(() => {
                switchAuthTab('login');
                document.getElementById('loginPhoneEmail').value = phone;
                showLoginStatus('✅ अब Login करें!', 'success');
            }, 1000);
        } else {
            if (data.message && data.message.includes('पहले से registered')) {
                showRegisterStatus('⚠️ आप पहले से registered हैं! कृपया Login करें।', 'error');
            } else {
                showRegisterStatus('❌ ' + (data.message || 'Registration failed'), 'error');
            }
        }
    } catch (error) {
        showRegisterStatus('❌ Registration error', 'error');
    }
}

// ============================================
// RESET PASSWORD
// ============================================
async function resetPassword() {
    const phone = document.getElementById('forgetPhone')?.value?.trim();
    const otp = document.getElementById('forgetOtp')?.value?.trim();
    const newPassword = document.getElementById('forgetNewPassword')?.value;
    
    if (!isValidPhone(phone)) {
        alert('❌ सही 10 digit number डालें');
        return;
    }
    
    if (!newPassword || newPassword.length < 6) {
        alert('🔒 Password 6-15 characters');
        return;
    }
    
    if (!otp) {
        alert('🔑 पहले OTP डालें!');
        return;
    }
    
    if (forgetOtpExpired) {
        alert('⏱️ OTP expired! दोबारा generate करें।');
        return;
    }
    
    if (otp !== forgetOtpValue) {
        alert('❌ गलत OTP!');
        return;
    }
    
    try {
        const deviceId = getDeviceId();
        const profileResponse = await fetch(`${API_URL}?action=getUserProfile&phone=${phone}`);
        const profileData = await profileResponse.json();
        
        if (profileData.success && profileData.profile) {
            const registeredDeviceId = profileData.profile.deviceId;
            if (registeredDeviceId && registeredDeviceId !== deviceId) {
                alert('❌ Password उसी phone से reset करें!');
                return;
            }
        }
    } catch (error) {}
    
    try {
        const response = await fetch(`${API_URL}?action=forgetUserPassword&phone=${phone}&otp=${otp}&newPassword=${encodeURIComponent(newPassword)}`);
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Password reset successful!');
            closeForgetModal();
            clearInterval(forgetOtpTimerInterval);
        } else {
            alert('❌ ' + (data.message || 'Reset failed'));
        }
    } catch (error) {
        alert('❌ Error');
    }
}

// ============================================
// SHOW PROFILE (Header button fix - कोई green tick नहीं)
// ============================================
function showProfile(profile) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.add('hidden');
    const authTabs = document.getElementById('authTabs');
    if (authTabs) authTabs.classList.add('hidden');
    document.getElementById('profileSection').classList.remove('hidden');
    
    document.getElementById('profileName').textContent = profile.name || 'User';
    document.getElementById('profileDetailName').textContent = profile.name || '--';
    document.getElementById('profileDetailPhone').textContent = profile.phone || '--';
    document.getElementById('profileDetailEmail').textContent = profile.email || '--';
    document.getElementById('profileDetailAddress').textContent = profile.address || '--';
    document.getElementById('profileMemberSince').textContent = 'Member since: ' + (profile.lastLogin || 'N/A');
    
    if (profile.status === 'Blocked') {
        document.getElementById('profileBlockedBanner').classList.remove('hidden');
        document.getElementById('profileBlockReason').textContent = 'Reason: ' + (profile.blockReason || 'नहीं बताया गया');
    }
    
    // 🆕 Parent header button - सिर्फ 👤 icon
    if (window.parent !== window) {
        const loginBtn = window.parent.document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<span class="login-icon">👤</span>';
            loginBtn.classList.remove('login-active');
        }
    }
}

// ============================================
// FORGET MODAL
// ============================================
function showForgetPassword() {
    document.getElementById('forgetModal').classList.remove('hidden');
}

function closeForgetModal() {
    document.getElementById('forgetModal').classList.add('hidden');
}

// ============================================
// LOGOUT (FIXED - अब काम करेगा)
// ============================================
function logoutUser() {
    // localStorage clear करें
    localStorage.removeItem('userPhone');
    
    // iframe में हैं तो popup close + button reset
    if (window.parent !== window) {
        // Parent popup close
        const parentModal = window.parent.document.getElementById('loginIframeModal');
        if (parentModal) {
            parentModal.classList.add('hidden');
            window.parent.document.body.style.overflow = '';
        }
        
        // Parent header button reset
        const loginBtn = window.parent.document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<span class="login-icon">👤</span>';
            loginBtn.classList.remove('login-active');
        }
        
        // iframe reload (login section दिखाने के लिए)
        window.location.reload();
    } else {
        window.location.href = 'index.html';
    }
}

// ============================================
// NAVIGATION
// ============================================
function viewMyOrders() {
    const phone = localStorage.getItem('userPhone');
    if (phone) {
        if (window.parent !== window) {
            window.parent.location.href = `orders.html?phone=${phone}`;
        } else {
            window.location.href = `orders.html?phone=${phone}`;
        }
    }
}

function showEditProfile() { alert('✏️ Edit Profile जल्द आएगा'); }
function showNotifications() { alert('🔔 Notifications जल्द आएगा'); }

// ============================================
// HELPERS
// ============================================
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 16; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
}

function showLoginStatus(message, type) {
    const status = document.getElementById('loginStatus');
    if (status) { status.textContent = message; status.className = 'auth-status ' + type; }
}

function showRegisterStatus(message, type) {
    const status = document.getElementById('registerStatus');
    if (status) { status.textContent = message; status.className = 'auth-status ' + type; }
}