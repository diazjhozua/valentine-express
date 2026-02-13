/**
 * Valentine's Day Web Application - Main Entry Point
 * Orchestrates all components and manages application state
 *
 * Features:
 * - Component initialization and lifecycle management
 * - State persistence using localStorage
 * - Customization panel integration
 * - Error handling and fallback behaviors
 * - Performance monitoring
 * - Accessibility support
 * - Mobile-responsive adjustments
 */

import IntroSlides from './components/IntroSlides.js';
import LetterDisplay from './components/LetterDisplay.js';

class ValentineApp {
    constructor() {
        // Application configuration
        this.config = {
            enableAnimations: true,
            enableHeartEffects: true,
            enableSound: false,
            autoStart: true,
            persistSettings: true,
            debugMode: false
        };

        // Application state
        this.state = {
            currentPhase: 'loading', // loading, intro, letter, customization
            introComplete: false,
            letterVisible: false,
            customizationOpen: false,
            userSettings: null,
            performanceMetrics: {
                loadStart: performance.now(),
                introStart: null,
                letterStart: null,
                totalHearts: 0
            }
        };

        // Component instances
        this.components = {
            introSlides: null,
            letterDisplay: null,
            customizationPanel: null,
            heartAnimations: null
        };

        // DOM elements
        this.elements = {
            loadingOverlay: null,
            customizeBtn: null,
            restartBtn: null,
            customizationPanel: null,
            appContainer: null
        };

        // Default content
        this.defaultContent = {
            messages: ['Hi', 'Happy', "Valentine's", 'Day', 'Babe'],
            letterText: [
                "From the moment I first saw you, my world became brighter and more beautiful. Every day with you feels like a gift, and every moment we share together becomes a treasured memory.",
                "Your smile lights up my darkest days, your laugh is the most beautiful melody I've ever heard, and your love gives my life meaning beyond anything I ever imagined possible.",
                "On this Valentine's Day, I want you to know that you are not just my love, but my best friend, my partner in all of life's adventures, and the person who makes me want to be better every single day.",
                "I promise to cherish you, support you, and love you not just today, but for all the days of my life. You are my everything, my forever, my heart.",
                "Happy Valentine's Day, my love. Thank you for being you, and thank you for choosing to share your beautiful life with me."
            ],
            signature: 'Your Valentine'
        };

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the Valentine's Day application
     */
    async init() {
        try {
            console.log('🌹 Initializing Valentine\'s Day Application...');

            // Set up DOM references
            await this.setupDOM();

            // Load user settings
            this.loadUserSettings();

            // Initialize components
            await this.initializeComponents();

            // Set up event listeners
            this.setupEventListeners();

            // Set up customization panel
            this.setupCustomizationPanel();

            // Set default theme to elegant
            this.changeTheme('elegant');

            // Handle initial load
            await this.handleInitialLoad();

            console.log('💕 Valentine\'s Day Application ready!');

        } catch (error) {
            console.error('Failed to initialize Valentine\'s Day Application:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Set up DOM element references
     */
    async setupDOM() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Get main elements
        this.elements.loadingOverlay = document.querySelector('#loadingOverlay');
        this.elements.customizeBtn = document.querySelector('#customizeBtn');
        this.elements.restartBtn = document.querySelector('#restartBtn');
        this.elements.customizationPanel = document.querySelector('#customizationPanel');
        this.elements.appContainer = document.querySelector('#appContainer');

        // Verify critical elements exist
        if (!this.elements.appContainer) {
            throw new Error('Main application container not found');
        }
    }

    /**
     * Load user settings from localStorage
     */
    loadUserSettings() {
        if (!this.config.persistSettings) return;

        try {
            const savedSettings = localStorage.getItem('valentine-app-settings');
            if (savedSettings) {
                this.state.userSettings = JSON.parse(savedSettings);
                console.log('📱 Loaded user settings:', this.state.userSettings);
            }
        } catch (error) {
            console.warn('Failed to load user settings:', error);
            localStorage.removeItem('valentine-app-settings');
        }
    }

    /**
     * Save user settings to localStorage
     */
    saveUserSettings() {
        if (!this.config.persistSettings) return;

        try {
            localStorage.setItem('valentine-app-settings', JSON.stringify(this.state.userSettings));
        } catch (error) {
            console.warn('Failed to save user settings:', error);
        }
    }

    /**
     * Initialize all components
     */
    async initializeComponents() {
        // Get user customizations or use defaults
        const messages = this.state.userSettings?.messages || this.defaultContent.messages;
        const letterContent = this.state.userSettings?.letterText || this.defaultContent.letterText;
        const signature = this.state.userSettings?.signature || this.defaultContent.signature;

        // Initialize IntroSlides component
        this.components.introSlides = new IntroSlides({
            messages: messages,
            autoStart: false, // We'll start manually after loading
            enableHeartEffects: this.config.enableHeartEffects,
            accessibilityMode: this.detectAccessibilityMode(),
            onSlideStart: (data) => this.handleSlideStart(data),
            onSlideComplete: (data) => this.handleSlideComplete(data),
            onSequenceComplete: (data) => this.handleIntroComplete(data)
        });

        // Initialize LetterDisplay component
        this.components.letterDisplay = new LetterDisplay({
            defaultContent: letterContent,
            defaultSignature: signature,
            enableHeartEffects: this.config.enableHeartEffects,
            enablePrintButton: true,
            accessibilityMode: this.detectAccessibilityMode(),
            onShow: () => this.handleLetterShow(),
            onHide: () => this.handleLetterHide(),
            onContentComplete: () => this.handleLetterComplete(),
            onHeartSpawn: (data) => this.handleHeartSpawn(data)
        });

        console.log('🎭 Components initialized');
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Customize button
        if (this.elements.customizeBtn) {
            this.elements.customizeBtn.addEventListener('click', () => {
                this.openCustomizationPanel();
            });
        }

        // Restart button
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => {
                this.restartExperience();
            });
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleGlobalKeyboard(event);
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });

        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Performance monitoring
        window.addEventListener('load', () => {
            this.logPerformanceMetrics();
        });

        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    /**
     * Set up customization panel functionality
     */
    setupCustomizationPanel() {
        if (!this.elements.customizationPanel) return;

        // Get panel elements
        const messageInputs = this.elements.customizationPanel.querySelectorAll('.message-input');
        const letterTextarea = this.elements.customizationPanel.querySelector('#letterContentInput');
        const signatureInput = this.elements.customizationPanel.querySelector('#signatureInput');
        const themeButtons = this.elements.customizationPanel.querySelectorAll('.theme-btn');
        const previewBtn = this.elements.customizationPanel.querySelector('#previewBtn');
        const saveBtn = this.elements.customizationPanel.querySelector('#saveBtn');
        const closeBtn = this.elements.customizationPanel.querySelector('#panelCloseBtn');

        // Populate current settings
        this.populateCustomizationPanel();

        // Message input handlers
        messageInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                this.updateMessagePreview(index, input.value);
            });
        });

        // Letter content handler
        if (letterTextarea) {
            letterTextarea.addEventListener('input', () => {
                this.updateLetterPreview(letterTextarea.value);
            });
        }

        // Signature handler
        if (signatureInput) {
            signatureInput.addEventListener('input', () => {
                this.updateSignaturePreview(signatureInput.value);
            });
        }

        // Theme buttons
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeTheme(btn.dataset.theme);
            });
        });

        // Action buttons
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewCustomizations();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCustomizations();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeCustomizationPanel();
            });
        }
    }

    /**
     * Handle initial application load
     */
    async handleInitialLoad() {
        // Show loading overlay
        this.showLoading('Preparing your Valentine\'s message...');

        // Simulate minimum loading time for UX
        await this.wait(1500);

        // Hide loading overlay
        this.hideLoading();

        // Start the experience
        if (this.config.autoStart) {
            this.startExperience();
        }
    }

    /**
     * Start the Valentine's experience
     */
    startExperience() {
        this.state.currentPhase = 'intro';
        this.state.performanceMetrics.introStart = performance.now();

        // Start intro slides
        if (this.components.introSlides) {
            this.components.introSlides.start();
        }
    }

    /**
     * Restart the entire experience
     */
    restartExperience() {
        // Reset state
        this.state.currentPhase = 'loading';
        this.state.introComplete = false;
        this.state.letterVisible = false;

        // Hide letter if visible
        if (this.components.letterDisplay) {
            this.components.letterDisplay.hide();
        }

        // Reset and show intro slides section
        if (this.components.introSlides) {
            this.components.introSlides.stop();
            this.components.introSlides.resetSlides();
            this.components.introSlides.show();
        }

        // Hide restart button
        if (this.elements.restartBtn) {
            this.elements.restartBtn.classList.add('hidden');
        }

        // Restart intro after brief delay
        setTimeout(() => {
            this.startExperience();
        }, 200);
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        if (this.elements.loadingOverlay) {
            const loadingText = this.elements.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
            this.elements.loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Open customization panel
     */
    openCustomizationPanel() {
        if (!this.elements.customizationPanel) return;

        this.state.customizationOpen = true;
        this.elements.customizationPanel.classList.remove('hidden');
        this.elements.customizationPanel.classList.add('slide-in-right');

        // Disable background interactions
        this.elements.appContainer.style.pointerEvents = 'none';
        this.elements.customizationPanel.style.pointerEvents = 'auto';

        // Focus management
        const firstInput = this.elements.customizationPanel.querySelector('input, textarea, button');
        if (firstInput) {
            firstInput.focus();
        }
    }

    /**
     * Close customization panel
     */
    closeCustomizationPanel() {
        if (!this.elements.customizationPanel || !this.state.customizationOpen) return;

        this.state.customizationOpen = false;
        this.elements.customizationPanel.classList.add('slide-out-right');

        setTimeout(() => {
            this.elements.customizationPanel.classList.add('hidden');
            this.elements.customizationPanel.classList.remove('slide-in-right', 'slide-out-right');

            // Re-enable background interactions
            this.elements.appContainer.style.pointerEvents = 'auto';
        }, 300);
    }

    /**
     * Populate customization panel with current settings
     */
    populateCustomizationPanel() {
        const settings = this.state.userSettings || {};

        // Message inputs
        const messageInputs = this.elements.customizationPanel.querySelectorAll('.message-input');
        messageInputs.forEach((input, index) => {
            const message = settings.messages?.[index] || this.defaultContent.messages[index];
            input.value = message || '';
        });

        // Letter textarea
        const letterTextarea = this.elements.customizationPanel.querySelector('#letterContentInput');
        if (letterTextarea) {
            const letterText = settings.letterText || this.defaultContent.letterText.join('\n\n');
            letterTextarea.value = Array.isArray(letterText) ? letterText.join('\n\n') : letterText;
        }

        // Signature input
        const signatureInput = this.elements.customizationPanel.querySelector('#signatureInput');
        if (signatureInput) {
            signatureInput.value = settings.signature || this.defaultContent.signature;
        }
    }

    /**
     * Save customizations
     */
    saveCustomizations() {
        const customizations = this.gatherCustomizations();

        // Update user settings
        this.state.userSettings = {
            ...this.state.userSettings,
            ...customizations,
            lastModified: new Date().toISOString()
        };

        // Save to localStorage
        this.saveUserSettings();

        // Update components
        this.applyCustomizations(customizations);

        // Close panel
        this.closeCustomizationPanel();

        // Show success feedback
        this.showNotification('Customizations saved! 💕');
    }

    /**
     * Gather customizations from panel
     */
    gatherCustomizations() {
        const customizations = {};

        // Messages
        const messageInputs = this.elements.customizationPanel.querySelectorAll('.message-input');
        customizations.messages = Array.from(messageInputs).map(input => input.value.trim() || 'Hi');

        // Letter content
        const letterTextarea = this.elements.customizationPanel.querySelector('#letterContentInput');
        if (letterTextarea) {
            customizations.letterText = letterTextarea.value
                .split('\n\n')
                .filter(p => p.trim())
                .map(p => p.trim());
        }

        // Signature
        const signatureInput = this.elements.customizationPanel.querySelector('#signatureInput');
        if (signatureInput) {
            customizations.signature = signatureInput.value.trim() || 'Your Valentine';
        }

        return customizations;
    }

    /**
     * Apply customizations to components
     */
    applyCustomizations(customizations) {
        // Update IntroSlides messages
        if (this.components.introSlides && customizations.messages) {
            this.components.introSlides.updateConfig({ messages: customizations.messages });
        }

        // Update LetterDisplay content
        if (this.components.letterDisplay) {
            if (customizations.letterText) {
                this.components.letterDisplay.setContent(customizations.letterText);
            }
            if (customizations.signature) {
                this.components.letterDisplay.setSignature(customizations.signature);
            }
        }
    }

    /**
     * Event Handlers
     */

    handleSlideStart(data) {
        console.log(`🎬 Slide ${data.index + 1} started: "${data.message}"`);
    }

    handleSlideComplete(data) {
        console.log(`✨ Slide ${data.index + 1} completed: "${data.message}"`);
    }

    handleIntroComplete(data) {
        console.log('🎉 Intro sequence completed in', data.duration + 'ms');

        this.state.currentPhase = 'letter';
        this.state.introComplete = true;
        this.state.performanceMetrics.letterStart = performance.now();

        // Show restart button
        if (this.elements.restartBtn) {
            this.elements.restartBtn.classList.remove('hidden');
        }
    }

    handleLetterShow() {
        console.log('📜 Letter display started');
        this.state.letterVisible = true;
    }

    handleLetterHide() {
        console.log('📜 Letter display hidden');
        this.state.letterVisible = false;
    }

    handleLetterComplete() {
        console.log('✅ Letter animation completed');

        // Log total completion time
        const totalTime = performance.now() - this.state.performanceMetrics.loadStart;
        console.log(`💝 Complete Valentine's experience in ${totalTime.toFixed(2)}ms`);
    }

    handleHeartSpawn(data) {
        this.state.performanceMetrics.totalHearts++;
    }

    handleGlobalKeyboard(event) {
        // Global shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'r':
                    event.preventDefault();
                    this.restartExperience();
                    break;
                case ',':
                    event.preventDefault();
                    this.openCustomizationPanel();
                    break;
            }
        }

        // Escape key
        if (event.key === 'Escape') {
            if (this.state.customizationOpen) {
                this.closeCustomizationPanel();
            }
        }
    }

    handleBeforeUnload() {
        // Save any pending settings
        if (this.state.userSettings) {
            this.saveUserSettings();
        }
    }

    handleResize() {
        // Update components for new screen size
        const isMobile = window.innerWidth < 768;

        // Adjust animation performance for mobile
        if (isMobile && this.config.enableAnimations) {
            this.config.enableHeartEffects = window.innerWidth > 480;
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animations when tab is not visible
            this.pauseAnimations();
        } else {
            // Resume animations when tab becomes visible
            this.resumeAnimations();
        }
    }

    /**
     * Utility Methods
     */

    detectAccessibilityMode() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
               window.matchMedia('(prefers-contrast: high)').matches;
    }

    pauseAnimations() {
        // Temporarily disable heart effects for performance
        this.config.enableHeartEffects = false;
    }

    resumeAnimations() {
        // Re-enable animations
        this.config.enableHeartEffects = true;
    }

    changeTheme(themeName) {
        // Update theme classes
        document.body.setAttribute('data-theme', themeName);

        // Update active theme button
        const themeButtons = this.elements.customizationPanel.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
    }

    showNotification(message, duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification fade-in';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-primary-red);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(notification);

        // Auto-remove
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    logPerformanceMetrics() {
        const metrics = this.state.performanceMetrics;
        const totalTime = performance.now() - metrics.loadStart;

        console.log('📊 Performance Metrics:', {
            totalLoadTime: `${totalTime.toFixed(2)}ms`,
            introTime: metrics.introStart ? `${(metrics.introStart - metrics.loadStart).toFixed(2)}ms` : 'N/A',
            letterTime: metrics.letterStart ? `${(metrics.letterStart - metrics.loadStart).toFixed(2)}ms` : 'N/A',
            totalHearts: metrics.totalHearts,
            memoryUsage: performance.memory ? `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` : 'N/A'
        });
    }

    wait(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    /**
     * Error Handling
     */

    handleInitializationError(error) {
        console.error('💔 Application failed to initialize:', error);

        // Show fallback content
        this.showFallbackExperience();
    }

    showFallbackExperience() {
        // Hide loading overlay
        this.hideLoading();

        // Show simple static content
        const fallbackHTML = `
            <div class="fallback-content" style="text-align: center; padding: 40px;">
                <h1 style="color: var(--color-primary-red); font-family: var(--font-display);">
                    Happy Valentine's Day! 💕
                </h1>
                <p style="font-size: 1.2rem; margin: 20px 0;">
                    My dearest Valentine, you make every day special.
                </p>
                <p style="font-style: italic;">
                    With all my love ❤️
                </p>
            </div>
        `;

        this.elements.appContainer.innerHTML = fallbackHTML;
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.valentineApp = new ValentineApp();
});

// Handle any global errors gracefully
window.addEventListener('error', (event) => {
    console.error('💔 Global error:', event.error);
    // The app will continue to function with fallbacks
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('💔 Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent the default error handling
});

export default ValentineApp;