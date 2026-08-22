'use strict';

// ============================================
// WATER-EFFECT.JS - Realistic Water Simulation
// Canvas-based, High Performance, 60fps
// ============================================

class WaterEffect {
    constructor() {
        // DOM Elements
        this.bottomNav = document.getElementById('bottomNav');
        this.canvas = null;
        this.ctx = null;
        
        // Canvas dimensions
        this.width = 0;
        this.height = 0;
        
        // Animation
        this.animationId = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        this.targetFPS = 60;
        this.isRunning = false;
        this.isVisible = true;
        
        // Performance tier (auto-detected)
        this.performanceTier = 'high'; // 'high' | 'medium' | 'low'
        
        // Wave properties
        this.waveTime = 0;
        this.waves = [
            { amplitude: 4, frequency: 0.02, speed: 0.03, phase: 0 },
            { amplitude: 3, frequency: 0.04, speed: 0.05, phase: Math.PI / 2 },
            { amplitude: 2, frequency: 0.06, speed: 0.07, phase: Math.PI }
        ];
        
        // Surface points for wave drawing
        this.surfacePoints = [];
        this.numSurfacePoints = 80;
        
        // Ripples
        this.ripples = [];
        this.maxRipples = 6;
        
        // Bubbles
        this.bubbles = [];
        this.maxBubbles = 8;
        this.bubbleTimer = 0;
        this.bubbleInterval = 2000; // New bubble every 2 seconds
        
        // Caustics (light patterns)
        this.causticPoints = [];
        this.numCausticPoints = 20;
        
        // Mouse/Touch tracking for swipe trail
        this.isTouching = false;
        this.touchX = 0;
        this.touchY = 0;
        this.swipeTrailTimer = 0;
        
        // Color themes
        this.colors = this.getColorTheme();
        
        // Init
        this.init();
    }
    
    // ============================================
    // COLOR THEMES
    // ============================================
    getColorTheme() {
        const isDark = document.body.classList.contains('dark-mode');
        
        if (isDark) {
            return {
                surface: 'rgba(100, 150, 200, 0.2)',
                waveTop: 'rgba(70, 130, 180, 0.25)',
                waveMid: 'rgba(40, 80, 140, 0.3)',
                waveDeep: 'rgba(15, 40, 80, 0.4)',
                foam: 'rgba(200, 220, 255, 0.1)',
                ripple: 'rgba(180, 210, 255, 0.25)',
                caustic: 'rgba(150, 180, 255, 0.04)',
                bubble: 'rgba(180, 210, 255, 0.3)',
                bubbleShine: 'rgba(255, 255, 255, 0.5)'
            };
        }
        
        return {
            surface: 'rgba(135, 206, 235, 0.25)',
            waveTop: 'rgba(100, 180, 230, 0.28)',
            waveMid: 'rgba(30, 144, 255, 0.3)',
            waveDeep: 'rgba(0, 50, 128, 0.35)',
            foam: 'rgba(255, 255, 255, 0.2)',
            ripple: 'rgba(255, 255, 255, 0.3)',
            caustic: 'rgba(255, 255, 255, 0.06)',
            bubble: 'rgba(180, 220, 255, 0.35)',
            bubbleShine: 'rgba(255, 255, 255, 0.6)'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    init() {
        if (!this.bottomNav) {
            console.warn('🌊 WaterEffect: #bottomNav not found');
            return;
        }
        
        // Create canvas
        this.createCanvas();
        
        // Detect performance
        this.detectPerformance();
        
        // Setup event listeners
        this.bindEvents();
        
        // Initialize caustic points
        this.initCaustics();
        
        // Start animation
        this.start();
        
        // Listen for theme changes
        this.observeThemeChanges();
        
        console.log(`🌊 WaterEffect initialized (${this.performanceTier} tier)`);
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'waterCanvas';
        this.canvas.setAttribute('aria-hidden', 'true');
        this.canvas.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.85;
            transition: opacity 0.4s ease;
        `;
        
        // Insert as first child of bottomNav
        this.bottomNav.insertBefore(this.canvas, this.bottomNav.firstChild);
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resize();
    }
    
    resize() {
        if (!this.canvas || !this.bottomNav) return;
        
        const rect = this.bottomNav.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
        
        this.width = rect.width;
        this.height = rect.height;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        
        // Adjust number of surface points based on width
        this.numSurfacePoints = Math.max(40, Math.floor(this.width / 5));
        this.initSurfacePoints();
    }
    
    initSurfacePoints() {
        this.surfacePoints = new Array(this.numSurfacePoints).fill(0);
    }
    
    initCaustics() {
        this.causticPoints = [];
        for (let i = 0; i < this.numCausticPoints; i++) {
            this.causticPoints.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 20 + 8,
                speed: Math.random() * 0.3 + 0.1,
                phase: Math.random() * Math.PI * 2,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    // ============================================
    // PERFORMANCE DETECTION
    // ============================================
    detectPerformance() {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4; // GB
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        if (cores <= 2 || memory <= 2 || (isMobile && cores <= 4)) {
            this.performanceTier = 'low';
            this.targetFPS = 30;
            this.maxRipples = 3;
            this.maxBubbles = 3;
            this.numCausticPoints = 0;
            this.numSurfacePoints = Math.floor(this.numSurfacePoints / 2);
        } else if (cores <= 4 || memory <= 4) {
            this.performanceTier = 'medium';
            this.targetFPS = 45;
            this.maxRipples = 5;
            this.maxBubbles = 5;
            this.numCausticPoints = 10;
        } else {
            this.performanceTier = 'high';
            this.targetFPS = 60;
            this.maxRipples = 6;
            this.maxBubbles = 8;
            this.numCausticPoints = 20;
        }
        
        this.frameInterval = 1000 / this.targetFPS;
    }
    
    // ============================================
    // EVENT BINDING
    // ============================================
    bindEvents() {
        // Resize observer
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                this.resize();
            });
            resizeObserver.observe(this.bottomNav);
        }
        
        window.addEventListener('resize', () => this.resize());
        
        // Button clicks → ripples
        this.bottomNav.addEventListener('click', (e) => {
            const btn = e.target.closest('.nav-btn');
            if (btn) {
                const rect = btn.getBoundingClientRect();
                const navRect = this.bottomNav.getBoundingClientRect();
                const x = rect.left + rect.width / 2 - navRect.left;
                const y = rect.top + rect.height / 2 - navRect.top;
                this.addRipple(x, y, 1.2);
                
                // Secondary ripple after short delay
                setTimeout(() => {
                    this.addRipple(x, y, 0.6);
                }, 150);
            }
        });
        
        // Touch/swipe trail
        this.bottomNav.addEventListener('touchmove', (e) => {
            if (!this.isTouching) return;
            const navRect = this.bottomNav.getBoundingClientRect();
            this.touchX = e.touches[0].clientX - navRect.left;
            this.touchY = e.touches[0].clientY - navRect.top;
            
            this.swipeTrailTimer++;
            if (this.swipeTrailTimer % 3 === 0) { // Every 3rd frame
                this.addRipple(this.touchX, this.touchY, 0.4);
            }
        }, { passive: true });
        
        this.bottomNav.addEventListener('touchstart', (e) => {
            this.isTouching = true;
        });
        
        this.bottomNav.addEventListener('touchend', () => {
            this.isTouching = false;
        });
        
        // Navbar hide/show observer
        this.observeNavVisibility();
        
        // Listen for dark mode changes
        document.addEventListener('themeChanged', () => {
            this.colors = this.getColorTheme();
        });
    }
    
    observeNavVisibility() {
        if (!window.MutationObserver) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isHidden = this.bottomNav.classList.contains('nav-hidden');
                    this.isVisible = !isHidden;
                    
                    if (!isHidden && !this.isRunning) {
                        this.start();
                    } else if (isHidden && this.isRunning) {
                        // Don't stop, just reduce FPS
                        this.targetFPS = 15;
                    } else if (!isHidden) {
                        this.targetFPS = this.getTargetFPS();
                    }
                }
            });
        });
        
        observer.observe(this.bottomNav, { attributes: true, attributeFilter: ['class'] });
    }
    
    getTargetFPS() {
        const tiers = { high: 60, medium: 45, low: 30 };
        return tiers[this.performanceTier] || 60;
    }
    
    observeThemeChanges() {
        // Watch for class changes on body
        const bodyObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    this.colors = this.getColorTheme();
                }
            });
        });
        
        bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    
    // ============================================
    // RIPPLE MANAGEMENT
    // ============================================
    addRipple(x, y, strength = 1) {
        if (this.ripples.length >= this.maxRipples) {
            // Remove oldest ripple
            this.ripples.shift();
        }
        
        this.ripples.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 50 + Math.random() * 40,
            strength: strength,
            life: 1.0, // 1 to 0
            decay: 0.015 + Math.random() * 0.01
        });
    }
    
    updateRipples(deltaTime) {
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            
            // Expand radius
            ripple.radius += (2.5 * deltaTime);
            
            // Decay life
            ripple.life -= ripple.decay * deltaTime;
            
            // Remove dead ripples
            if (ripple.life <= 0 || ripple.radius >= ripple.maxRadius) {
                this.ripples.splice(i, 1);
            }
        }
    }
    
    // ============================================
    // BUBBLE MANAGEMENT
    // ============================================
    addBubble() {
        if (this.bubbles.length >= this.maxBubbles) return;
        
        this.bubbles.push({
            x: Math.random() * this.width * 0.8 + this.width * 0.1,
            y: this.height,
            size: Math.random() * 5 + 2,
            speed: 0.3 + Math.random() * 0.7,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            opacity: 0.3 + Math.random() * 0.4
        });
    }
    
    updateBubbles(deltaTime) {
        // Timer for new bubbles
        this.bubbleTimer += deltaTime * 1000;
        if (this.bubbleTimer >= this.bubbleInterval) {
            this.bubbleTimer = 0;
            this.addBubble();
        }
        
        // Update existing bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            
            bubble.y -= bubble.speed * deltaTime;
            bubble.wobble += bubble.wobbleSpeed * deltaTime;
            bubble.x += Math.sin(bubble.wobble) * 0.3;
            
            // Remove if above surface
            if (bubble.y < -10) {
                this.bubbles.splice(i, 1);
            }
        }
    }
    
    // ============================================
    // MAIN ANIMATION LOOP
    // ============================================
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.animate(this.lastFrameTime);
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate(currentTime) {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame((t) => this.animate(t));
        
        // Frame rate limiting
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // seconds
        if (deltaTime < this.frameInterval / 1000) return;
        
        this.lastFrameTime = currentTime;
        const dt = Math.min(deltaTime, 0.1); // Cap delta to prevent jumps
        
        // Update
        this.waveTime += dt;
        this.updateRipples(60 * dt); // Normalize to 60fps
        this.updateBubbles(60 * dt);
        this.updateCaustics(dt);
        
        // Render
        this.render(dt);
        
        // FPS tracking
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1 / dt);
        }
    }
    
    // ============================================
    // RENDER
    // ============================================
    render(dt) {
        const ctx = this.ctx;
        if (!ctx) return;
        
        // Clear
        ctx.clearRect(0, 0, this.width, this.height);
        
        // 1. Draw deep water background
        this.drawBackground(ctx);
        
        // 2. Draw caustics (light patterns at bottom)
        if (this.performanceTier !== 'low') {
            this.drawCaustics(ctx);
        }
        
        // 3. Calculate and draw wave body
        this.drawWaveBody(ctx, dt);
        
        // 4. Draw ripples
        this.drawRipples(ctx);
        
        // 5. Draw foam/surface shimmer
        this.drawSurfaceFoam(ctx);
        
        // 6. Draw bubbles
        this.drawBubbles(ctx);
    }
    
    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.colors.surface);
        gradient.addColorStop(0.3, this.colors.waveTop);
        gradient.addColorStop(0.6, this.colors.waveMid);
        gradient.addColorStop(1, this.colors.waveDeep);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawWaveBody(ctx, dt) {
        const surfaceY = this.calculateSurface(dt);
        
        // Create clipping path for wave body
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        
        for (let i = 0; i < this.surfacePoints.length; i++) {
            const x = (i / (this.surfacePoints.length - 1)) * this.width;
            const y = surfaceY[i];
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        
        // Fill with wave gradient
        const waveGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        waveGradient.addColorStop(0, 'rgba(135, 206, 235, 0.4)');
        waveGradient.addColorStop(0.5, this.colors.waveMid);
        waveGradient.addColorStop(1, this.colors.waveDeep);
        
        ctx.fillStyle = waveGradient;
        ctx.fill();
    }
    
    calculateSurface(dt) {
        const points = [];
        const baseY = this.height * 0.25; // Surface at 25% from top
        
        for (let i = 0; i < this.numSurfacePoints; i++) {
            const x = i / (this.numSurfacePoints - 1);
            let displacement = 0;
            
            // Combine multiple waves
            for (const wave of this.waves) {
                displacement += wave.amplitude * 
                    Math.sin(x * Math.PI * 2 * wave.frequency * this.width * 0.1 + 
                             this.waveTime * wave.speed * 60 + 
                             wave.phase);
            }
            
            points.push(baseY + displacement);
        }
        
        return points;
    }
    
    drawSurfaceFoam(ctx) {
        const surfaceY = this.calculateSurface(0);
        
        // Draw shimmer line along surface
        ctx.beginPath();
        ctx.moveTo(0, surfaceY[0] - 2);
        
        for (let i = 1; i < surfaceY.length; i++) {
            const x = (i / (surfaceY.length - 1)) * this.width;
            ctx.lineTo(x, surfaceY[i] - 2);
        }
        
        ctx.strokeStyle = this.colors.foam;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    drawRipples(ctx) {
        for (const ripple of this.ripples) {
            if (ripple.life <= 0) continue;
            
            const alpha = ripple.life * ripple.strength;
            const progress = ripple.radius / ripple.maxRadius;
            
            // Main ripple ring
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.strokeStyle = this.colors.ripple.replace(/[\d.]+\)$/, `${alpha * 0.6})`);
            ctx.lineWidth = 3 * (1 - progress);
            ctx.stroke();
            
            // Inner glow
            if (ripple.radius > 5) {
                const innerRadius = ripple.radius * 0.8;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, innerRadius, 0, Math.PI * 2);
                ctx.strokeStyle = this.colors.ripple.replace(/[\d.]+\)$/, `${alpha * 0.3})`);
                ctx.lineWidth = 1.5 * (1 - progress);
                ctx.stroke();
            }
        }
    }
    
    drawCaustics(ctx) {
        for (const point of this.causticPoints) {
            const alpha = point.opacity * 0.15;
            const gradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, point.size
            );
            gradient.addColorStop(0, this.colors.caustic.replace(/[\d.]+\)$/, `${alpha})`));
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    updateCaustics(dt) {
        for (const point of this.causticPoints) {
            point.x += Math.sin(this.waveTime * point.speed + point.phase) * 0.5;
            point.y += Math.cos(this.waveTime * point.speed * 0.7 + point.phase) * 0.3;
            
            // Wrap around
            if (point.x > this.width + 20) point.x = -20;
            if (point.x < -20) point.x = this.width + 20;
            if (point.y > this.height + 20) point.y = -20;
            if (point.y < -20) point.y = this.height + 20;
        }
    }
    
    drawBubbles(ctx) {
        for (const bubble of this.bubbles) {
            const x = bubble.x;
            const y = bubble.y;
            const size = bubble.size;
            
            // Bubble body
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = this.colors.bubble.replace(/[\d.]+\)$/, `${bubble.opacity})`);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            // Shine highlight
            ctx.beginPath();
            ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = this.colors.bubbleShine.replace(/[\d.]+\)$/, `${bubble.opacity * 0.8})`);
            ctx.fill();
        }
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    /**
     * Trigger ripple programmatically
     * @param {number} x - X position relative to navbar
     * @param {number} y - Y position relative to navbar
     * @param {number} strength - Ripple strength (0-1)
     */
    triggerRipple(x, y, strength = 1) {
        this.addRipple(x, y, strength);
    }
    
    /**
     * Pause water animation
     */
    pause() {
        this.stop();
    }
    
    /**
     * Resume water animation
     */
    resume() {
        if (!this.isRunning) {
            this.start();
        }
    }
    
    /**
     * Get current FPS
     */
    getFPS() {
        return this.fps;
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.stop();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.ripples = [];
        this.bubbles = [];
        this.canvas = null;
        this.ctx = null;
    }
}

// ============================================
// AUTO-INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Wait for bottom nav to be available
    const checkInterval = setInterval(() => {
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) {
            clearInterval(checkInterval);
            window.waterEffect = new WaterEffect();
        }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
});