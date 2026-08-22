
    (function() {
        const splash = document.getElementById('splashScreen');
        if (!splash) return;
        
        // localStorage से open count लें
        let openCount = parseInt(localStorage.getItem('splashOpenCount') || '0');
        
        // Count बढ़ाएं
        openCount++;
        localStorage.setItem('splashOpenCount', openCount);
        
        // Splash दिखाना है या नहीं
        // पहली बार (count=1) या हर 6th बार (6, 12, 18...)
        const shouldShowSplash = (openCount === 1) || (openCount % 6 === 0);
        
        console.log('📊 Open count:', openCount, '| Splash show:', shouldShowSplash);
        
        if (!shouldShowSplash) {
            // Splash skip करो - तुरंत हटाओ
            splash.style.display = 'none';
            if (splash.parentNode) {
                splash.parentNode.removeChild(splash);
            }
            return;
        }
        
        // Splash दिखाओ और 2 second बाद hide करो
        window.addEventListener('load', function() {
            setTimeout(function() {
                splash.classList.add('hide');
                setTimeout(function() {
                    if (splash.parentNode) {
                        splash.parentNode.removeChild(splash);
                    }
                }, 700);
            }, 2000);
        });
        
        // Fallback: 4 second बाद hide
        setTimeout(function() {
            if (splash && !splash.classList.contains('hide')) {
                splash.classList.add('hide');
                setTimeout(function() {
                    if (splash.parentNode) {
                        splash.parentNode.removeChild(splash);
                    }
                }, 700);
            }
        }, 4000);
    })();
