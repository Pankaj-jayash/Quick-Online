// ============================================
// CONFIG.JS - All Settings in One Place
// ============================================

const CONFIG = {
    
    // Shop Info
    shopName: 'Quick Dukan',
    shopNameHi: 'क्विक दुकान',
    
    // WhatsApp
    whatsappNumber: '919XXXXXXXXX', // CHANGE THIS to your WhatsApp number
    
    // Colors (CSS variables are in theme.css, these are for JS reference)
    colors: {
        primary: '#6A1B9A',
        primaryLight: '#8E24AA',
        primaryDark: '#4A148C',
        bgPrimary: '#F5F5DC',
        bgCard: '#FFFFFF',
        gold: '#D4A017',
        success: '#2E7D32',
    },
    
    // Default Language
    defaultLanguage: 'hi', // 'hi' or 'en'
    
    // Animation Speed
    animationSpeed: '0.3s',
    
    // Search
    searchPlaceholderTexts: {
        hi: [
            'आज क्या चाहिए? 😋',
            'चाय पत्ती भूल गए क्या? ☕',
            'मम्मी ने क्या मँगाया? 🤔',
            'जल्दी बताओ, भूख लगी है! 🍽️',
            'आज कुछ मीठा हो जाए? 🍬',
            'दाल-चावल का स्टॉक खत्म? 🍚',
            'मसालों की महक याद आ रही? 🌿',
            'गरमा-गरम चाय बनानी है? ☕',
        ],
        en: [
            'What do you need today? 😋',
            'Forgot tea leaves? ☕',
            'What did mom order? 🤔',
            'Tell me fast, I\'m hungry! 🍽️',
            'Something sweet today? 🍬',
            'Dal-rice stock finished? 🍚',
            'Missing the aroma of spices? 🌿',
            'Want to make hot tea? ☕',
        ]
    },
    
    // Product not found messages
    noProductMessages: {
        hi: 'अरे! यह सामान अभी नहीं है। हम जल्दी ऐड करेंगे! 😊',
        en: 'Oops! This product is not available yet. We\'ll add it soon! 😊',
    },
    
    // Section Titles
    sectionTitles: {
        hi: {
            // Header Badge
            freeDelivery: 'फ्री डिलीवरी',
            verifiedTrust: 'भरोसेमंद',
            
            // Sections
            recentlyViewed: '🕐 हाल ही में देखा',
            mostOrders: '🔥 सबसे ज़्यादा मँगाया जाने वाला',
            allProducts: '📦 सभी प्रोडक्ट',
            
            // Cart
            cart: '🛒 आपका कार्ट',
            emptyCart: 'आपका कार्ट खाली है 😔',
            sendOrder: '📱 WhatsApp पर ऑर्डर भेजें',
            
            // Nav
            home: 'होम',
            search: 'खोजें',
            myOrders: 'मेरे ऑर्डर',
            top: 'ऊपर',
            allCategory: 'सब',
            
            // Search
            searchPlaceholder: 'आज क्या चाहिए? 😋',
            
            // Toast Messages
            addedToCart: '✅ कार्ट में जोड़ दिया!',
            removedFromCart: '🗑️ कार्ट से हटा दिया',
            orderSent: '✅ ऑर्डर WhatsApp पर भेज दिया!',
            
            // Orders
            ordersSubtitle: 'आपके सभी ऑर्डर यहाँ हैं',
            allOrders: 'सभी',
            pending: 'पेंडिंग',
            confirmed: 'कन्फर्म',
            delivered: 'डिलीवर्ड',
            noOrders: 'कोई ऑर्डर नहीं है',
            noOrdersDesc: 'अपना पहला ऑर्डर करो! 🛒',
            startShopping: '🏪 खरीदारी शुरू करें',
            
            // Checkout
            checkoutTitle: 'ऑर्डर कन्फर्म करें',
            checkoutSubtitle: 'डिलीवरी के लिए जानकारी भरें',
            fullName: '👤 पूरा नाम',
            phoneNumber: '📱 मोबाइल नंबर',
            deliveryAddress: '📍 डिलीवरी का पता',
            getLocation: 'लोकेशन लें',
            villageCity: 'गाँव या शहर',
            landmark: 'आस-पास की जगह',
            orderNotes: '📝 कोई खास निर्देश',
            notesPlaceholder: 'जैसे: शाम 5 बजे के बाद डिलीवर करें',
            saveInfo: 'यह जानकारी सेव करें (अगली बार ऑटो-फिल होगी)',
            confirmOrder: '💬 WhatsApp पर ऑर्डर भेजें',
            orderSummary: '📋 ऑर्डर समरी',
            nameHint: 'जैसे: रमेश कुमार',
            phoneHint: '10 अंक का मोबाइल नंबर',
            phoneError: '⚠️ कृपया सही 10 अंक का नंबर डालें',
        },
        en: {
            // Header Badge
            freeDelivery: 'Free Delivery',
            verifiedTrust: 'Trusted',
            
            // Sections
            recentlyViewed: '🕐 Recently Viewed',
            mostOrders: '🔥 Most Ordered',
            allProducts: '📦 All Products',
            
            // Cart
            cart: '🛒 Your Cart',
            emptyCart: 'Your cart is empty 😔',
            sendOrder: '📱 Send Order on WhatsApp',
            
            // Nav
            home: 'Home',
            search: 'Search',
            myOrders: 'My Orders',
            top: 'Top',
            allCategory: 'All',
            
            // Search
            searchPlaceholder: 'What do you need today? 😋',
            
            // Toast Messages
            addedToCart: '✅ Added to cart!',
            removedFromCart: '🗑️ Removed from cart',
            orderSent: '✅ Order sent on WhatsApp!',
            
            // Orders
            ordersSubtitle: 'All your orders are here',
            allOrders: 'All',
            pending: 'Pending',
            confirmed: 'Confirmed',
            delivered: 'Delivered',
            noOrders: 'No Orders Yet',
            noOrdersDesc: 'Place your first order! 🛒',
            startShopping: '🏪 Start Shopping',
            
            // Checkout
            checkoutTitle: 'Confirm Order',
            checkoutSubtitle: 'Fill delivery details',
            fullName: '👤 Full Name',
            phoneNumber: '📱 Phone Number',
            deliveryAddress: '📍 Delivery Address',
            getLocation: 'Get Location',
            villageCity: 'Village or City',
            landmark: 'Nearby Landmark',
            orderNotes: '📝 Special Instructions',
            notesPlaceholder: 'e.g., Deliver after 5 PM',
            saveInfo: 'Save this info (Auto-fill next time)',
            confirmOrder: '💬 Send Order on WhatsApp',
            orderSummary: '📋 Order Summary',
            nameHint: 'e.g., Ramesh Kumar',
            phoneHint: '10 digit mobile number',
            phoneError: '⚠️ Please enter a valid 10 digit number',
        }
    },
    
    // Category Colors (for buttons)
    categoryColors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
        '#F1948A', '#85929E', '#AED6F1', '#F5B7B1',
        '#A3E4D7', '#FAD7A0', '#D2B4DE', '#A9CCE3',
    ],
    
    // Layout (can be modified from config)
    layout: {
        headerHeight: '60px',
        searchHeight: '50px',
        categoriesHeight: '55px',
        bottomNavHeight: '60px',
        cardWidth: '170px',
        cardImageRatio: '56%',
    },
    
    // Features Toggle
    features: {
        darkMode: true,
        languageToggle: true,
        recentlyViewed: true,
        mostOrders: true,
        cart: true,
        backToTop: true,
        liveSearch: true,
        spellCorrection: true,
    },
};

// Freeze the object so it can't be accidentally modified
Object.freeze(CONFIG); 