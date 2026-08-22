'use strict';

// ============================================
// INDEPENDENCE-THEME.JS - Water Flag
// 2-Minute Formation | Aug 13-17 Active
// Real Waves + Tricolor Rain + Ashoka Chakra
// ============================================

class IndependenceTheme {
    constructor() {
        this.header = document.getElementById('topHeader');
        this.canvas = null;
        this.ctx = null;
        this.rainContainer = null;
        
        // Canvas
        this.width = 0;
        this.height = 0;
        
        // Waves (3 strips)
        this.waveTime = 0;
        this.waves = {
            saffron: { amp: 3.5, freq: 0.025, spd: 0.03, phase: 0, baseY: 0 },
            white:   { amp: 2.8, freq: 0.035, spd: 0.04, phase: Math.PI/3, baseY: 0 },
            green:   { amp: 3.2, freq: 0.03, spd: 0.035, phase: Math.PI/1.5, baseY: 0 }
        };
        
        // Flag fill - 2 minutes = 120 seconds
        this.fillLevel = 0;
        this.maxLevel = 72; // Fill 72% of header height
        this.totalFillTime = 120; // seconds
        this.fillSpeed = this.maxLevel / (this.totalFillTime * 60); // per frame at 60fps
        this.isFilled = false;
        this.isPaused = false;
        this.pauseCounter = 0;
        this.pauseFrames = 300; // 5 seconds at 60fps
        
        // Chakra
        this.chakraVisible = false;
        
        // Rain
        this.rainInterval = null;
        this.maxRaindrops = 14;
        this.rainSpeed = 200; // ms between drops
        
        // Animation
        this.animationId = null;
        this.isRunning = false;
        this.frameCount = 0;
        
        // Date check (Aug 13-17)
        this.isActive = this.checkDate();
        
        if (this.isActive) this.init();
    }
    
    // ============================================
    // DATE CHECK - Active Aug 13 to Aug 17
    // ============================================
    checkDate() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        
        // August 13 to 17
        if (month === 8 && date >= 7 && date <= 17) return true;
        
        // Force enable: ?independence=1
        if (window.location.search.includes('independence=1')) return true;
        
        return false;
    }
    
    // ============================================
    // INIT
    // ============================================
    init() {
        if (!this.header) return;
        
        this.createCanvas();
        this.createRainContainer();
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        this.start();
        
        const minutes = this.totalFillTime / 60;
        console.log(`🇮🇳 Water Flag Active! Flag forms in ${minutes} minutes`);
        console.log('📅 Active: August 13-17');
        console.log('🌊 Tricolor waves + Real rain + Ashoka Chakra');
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'flagWaterCanvas';
        this.canvas.setAttribute('aria-hidden', 'true');
        this.header.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }
    
    createRainContainer() {
        this.rainContainer = document.createElement('div');
        this.rainContainer.className = 'rain-container';
        this.rainContainer.setAttribute('aria-hidden', 'true');
        this.header.appendChild(this.rainContainer);
    }
    
    resize() {
        if (!this.canvas || !this.header) return;
        
        const rect = this.header.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Lightweight
        
        this.width = rect.width;
        this.height = rect.height;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        
        this.updateBasePositions();
    }
    
    updateBasePositions() {
        const flagHeight = (this.height * this.fillLevel) / 100;
        const stripH = flagHeight / 3;
        
        this.waves.green.baseY = this.height;
        this.waves.white.baseY = this.height - stripH;
        this.waves.saffron.baseY = this.height - stripH * 2;
    }
    
    // ============================================
    // START / STOP
    // ============================================
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startRain();
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.rainInterval) {
            clearInterval(this.rainInterval);
            this.rainInterval = null;
        }
    }
    
    // ============================================
    // MAIN LOOP
    // ============================================
    animate() {
        if (!this.isRunning) return;
        
        this.frameCount++;
        this.waveTime += 0.016;
        
        // Skip frames on slow devices (adaptive)
        if (this.frameCount % 2 !== 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    update() {
        // Fill flag slowly
        if (!this.isFilled && !this.isPaused) {
            this.fillLevel += this.fillSpeed;
            
            if (this.fillLevel >= this.maxLevel) {
                this.fillLevel = this.maxLevel;
                this.isFilled = true;
                this.chakraVisible = true;
                this.isPaused = true;
                this.pauseCounter = 0;
            }
        }
        
        // Pause when full
        if (this.isPaused) {
            this.pauseCounter++;
            if (this.pauseCounter >= this.pauseFrames) {
                // Reset
                this.isPaused = false;
                this.isFilled = false;
                this.fillLevel = 0;
                this.chakraVisible = false;
                this.pauseCounter = 0;
            }
        }
        
        this.updateBasePositions();
    }
    
    // ============================================
    // RENDER WAVES
    // ============================================
    render() {
        const ctx = this.ctx;
        if (!ctx) return;
        
        ctx.clearRect(0, 0, this.width, this.height);
        
        const flagHeight = (this.height * this.fillLevel) / 100;
        if (flagHeight < 0.5) return;
        
        const stripH = flagHeight / 3;
        
        // Draw from bottom to top: Green → White → Saffron
        this.drawStrip(this.waves.green, '#138808', 'rgba(19,136,8,0.3)', stripH);
        this.drawStrip(this.waves.white, '#FFFFFF', 'rgba(255,255,255,0.35)', stripH);
        this.drawStrip(this.waves.saffron, '#FF9933', 'rgba(255,153,51,0.3)', stripH);
        
        // Ashoka Chakra at white strip center
        if (this.chakraVisible && flagHeight > 15) {
            const chakraY = this.waves.white.baseY - stripH / 2;
            this.drawChakra(this.width / 2, chakraY);
        }
    }
    
    drawStrip(wave, color, gradientTop, stripH) {
        const ctx = this.ctx;
        const yBottom = wave.baseY;
        const yTop = yBottom - stripH;
        const segments = Math.min(60, Math.floor(this.width / 6));
        const segW = this.width / segments;
        
        // Clip path with wave
        ctx.beginPath();
        ctx.moveTo(0, yBottom);
        
        for (let i = 0; i <= segments; i++) {
            const x = i * segW;
            let y = yTop;
            
            // Primary wave
            y += wave.amp * Math.sin(x * wave.freq * 0.04 + this.waveTime * wave.spd * 50 + wave.phase);
            // Secondary wave (detail)
            y += wave.amp * 0.4 * Math.sin(x * wave.freq * 0.07 + this.waveTime * wave.spd * 35 + wave.phase + 2);
            
            ctx.lineTo(x, Math.max(0, y));
        }
        
        ctx.lineTo(this.width, yBottom);
        ctx.closePath();
        
        // Gradient fill
        const grad = ctx.createLinearGradient(0, yTop - 5, 0, yBottom);
        grad.addColorStop(0, gradientTop);
        grad.addColorStop(0.6, color);
        grad.addColorStop(1, color);
        
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Crest highlight
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const x = i * segW;
            let y = yTop;
            y += wave.amp * Math.sin(x * wave.freq * 0.04 + this.waveTime * wave.spd * 50 + wave.phase);
            y += wave.amp * 0.4 * Math.sin(x * wave.freq * 0.07 + this.waveTime * wave.spd * 35 + wave.phase + 2);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // ============================================
    // ASHOKA CHAKRA
    // ============================================
    drawChakra(cx, cy) {
        const ctx = this.ctx;
        const r = Math.min(11, this.width * 0.035);
        
        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,139,0.65)';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        
        // Inner ring
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,139,0.45)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
        
        // 12 spokes
        for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 * i) / 12;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5);
            ctx.lineTo(cx + Math.cos(a) * r * 0.88, cy + Math.sin(a) * r * 0.88);
            ctx.strokeStyle = 'rgba(0,0,139,0.45)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        
        // Center
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,139,0.65)';
        ctx.fill();
    }
    
    // ============================================
    // RAIN
    // ============================================
    startRain() {
        this.createRaindrop();
        this.rainInterval = setInterval(() => this.createRaindrop(), this.rainSpeed);
    }
    
    createRaindrop() {
        if (!this.rainContainer) return;
        
        // Limit drops
        const drops = this.rainContainer.querySelectorAll('.tricolor-raindrop');
        if (drops.length >= this.maxRaindrops) drops[0].remove();
        
        const drop = document.createElement('div');
        const colors = ['saffron-drop', 'white-drop', 'green-drop'];
        drop.className = `tricolor-raindrop ${colors[Math.floor(Math.random() * 3)]}`;
        
        // Realistic varying size
        const w = Math.random() * 2 + 1.5;
        const h = Math.random() * 5 + 6;
        drop.style.width = w + 'px';
        drop.style.height = h + 'px';
        drop.style.left = Math.random() * 95 + '%';
        drop.style.animationDuration = (Math.random() * 0.5 + 0.6) + 's';
        drop.style.animationDelay = Math.random() * 0.3 + 's';
        drop.style.setProperty('--header-height', this.height + 'px');
        
        this.rainContainer.appendChild(drop);
        
        setTimeout(() => {
            if (drop.parentNode) drop.remove();
        }, 1200);
    }
    
    // ============================================
    // DESTROY
    // ============================================
    destroy() {
        this.stop();
        if (this.canvas?.parentNode) this.canvas.remove();
        if (this.rainContainer?.parentNode) this.rainContainer.remove();
        this.canvas = null;
        this.ctx = null;
        this.rainContainer = null;
    }
}

// ============================================
// AUTO-INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const check = setInterval(() => {
        if (document.getElementById('topHeader')) {
            clearInterval(check);
            window.independenceTheme = new IndependenceTheme();
        }
    }, 100);
    setTimeout(() => clearInterval(check), 10000);
});