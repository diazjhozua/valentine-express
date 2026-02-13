/**
 * IntroSlides Component - Valentine's Day Greeting Sequence
 * Manages the sequential display of romantic messages with smooth animations
 *
 * Features:
 * - Sequential slide transitions with smooth animations
 * - Customizable messages and timing
 * - Progress indicator
 * - Event-driven completion signaling
 * - Accessibility support
 * - Performance optimized animations
 */

class IntroSlides {
    constructor(options = {}) {
        // Default configuration
        this.config = {
            messages: options.messages || ['Hi', 'Happy', "Valentine's", 'Day', 'Babe'],
            slideDelay: options.slideDelay || 800, // Time to show each slide
            transitionDuration: options.transitionDuration || 800, // Animation duration
            autoStart: options.autoStart !== false, // Auto-start by default
            container: options.container || '#introSlidesSection',
            progressBar: options.progressBar || '#progressBar',
            enableHeartEffects: options.enableHeartEffects !== false,
            accessibilityMode: options.accessibilityMode || false
        };

        // State management
        this.state = {
            currentSlide: -1,
            isPlaying: false,
            isPaused: false,
            isCompleted: false,
            startTime: null,
            slideElements: [],
            timeouts: []
        };

        // DOM elements
        this.elements = {
            container: null,
            slides: [],
            progressBar: null,
            section: null
        };

        // Event handlers
        this.eventHandlers = {
            onSlideStart: options.onSlideStart || null,
            onSlideComplete: options.onSlideComplete || null,
            onSequenceComplete: options.onSequenceComplete || null,
            onProgress: options.onProgress || null
        };

        // Initialize the component
        this.init();
    }

    /**
     * Initialize the IntroSlides component
     */
    init() {
        try {
            this.setupDOM();
            this.setupAccessibility();
            this.setupEventListeners();

            if (this.config.autoStart) {
                this.start();
            }
        } catch (error) {
            console.error('IntroSlides initialization failed:', error);
        }
    }

    /**
     * Set up DOM elements and initial states
     */
    setupDOM() {
        // Get main container
        this.elements.container = document.querySelector(this.config.container);
        if (!this.elements.container) {
            throw new Error(`IntroSlides container not found: ${this.config.container}`);
        }

        this.elements.section = this.elements.container.closest('.intro-slides-section');
        this.elements.progressBar = document.querySelector(this.config.progressBar);

        // Get all slide elements
        this.elements.slides = Array.from(
            this.elements.container.querySelectorAll('.slide')
        );

        if (this.elements.slides.length === 0) {
            throw new Error('No slide elements found in container');
        }

        // Update slide messages if provided
        this.updateSlideMessages();

        // Set initial states
        this.resetSlides();
        this.updateProgressBar(0);
    }

    /**
     * Update slide messages with custom content
     */
    updateSlideMessages() {
        this.config.messages.forEach((message, index) => {
            const slide = this.elements.slides[index];
            if (slide) {
                const textElement = slide.querySelector('.slide-text');
                if (textElement) {
                    textElement.textContent = message;
                    slide.setAttribute('data-message', message);
                    slide.setAttribute('aria-label', `Slide ${index + 1} of ${this.config.messages.length}: ${message}`);
                }
            }
        });
    }

    /**
     * Set up accessibility features
     */
    setupAccessibility() {
        // Add ARIA live region for screen readers
        this.elements.container.setAttribute('aria-live', 'polite');
        this.elements.container.setAttribute('role', 'presentation');

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.config.accessibilityMode = true;
            this.config.slideDelay = 800;
            this.config.transitionDuration = 200;
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (event) => {
            if (this.state.isPlaying) {
                switch (event.key) {
                    case 'Escape':
                        this.skip();
                        break;
                    case ' ':
                    case 'Enter':
                        event.preventDefault();
                        if (this.state.isPaused) {
                            this.resume();
                        } else {
                            this.pause();
                        }
                        break;
                    case 'ArrowRight':
                        event.preventDefault();
                        this.nextSlide();
                        break;
                }
            }
        });

        // Click to advance (optional)
        this.elements.container.addEventListener('click', (event) => {
            if (this.state.isPlaying && !this.state.isPaused) {
                this.nextSlide();
            }
        });

        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.isPlaying) {
                this.pause();
            } else if (!document.hidden && this.state.isPaused) {
                this.resume();
            }
        });

        // Reduced motion preference changes
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addListener((e) => {
            this.config.accessibilityMode = e.matches;
            if (e.matches && this.state.isPlaying) {
                this.adjustForReducedMotion();
            }
        });
    }

    /**
     * Reset all slides to initial state
     */
    resetSlides() {
        this.elements.slides.forEach((slide, index) => {
            slide.classList.remove('active', 'exiting');
            slide.style.visibility = 'hidden';
            slide.style.opacity = '0';
        });

        this.state.currentSlide = -1;
        this.state.isCompleted = false;
        this.updateProgressBar(0);
    }

    /**
     * Start the slide sequence
     */
    async start() {
        if (this.state.isPlaying || this.state.isCompleted) {
            return;
        }

        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.startTime = Date.now();

        try {
            // Show the container
            if (this.elements.section) {
                this.elements.section.classList.remove('hidden');
            }

            // Start the sequence
            await this.playSequence();
        } catch (error) {
            console.error('Error during slide sequence:', error);
            this.handleError(error);
        }
    }

    /**
     * Play the complete slide sequence
     */
    async playSequence() {
        for (let i = 0; i < this.config.messages.length; i++) {
            if (!this.state.isPlaying || this.state.isPaused) {
                break;
            }

            await this.showSlide(i);

            // Wait for slide duration (unless it's the last slide)
            if (i < this.config.messages.length - 1) {
                await this.wait(this.config.slideDelay);
            }
        }

        // Brief pause before completion
        if (this.state.isPlaying && !this.state.isPaused) {
            await this.wait(400); // Shorter final pause
            this.complete();
        }
    }

    /**
     * Show a specific slide with animation
     */
    async showSlide(index) {
        if (index < 0 || index >= this.elements.slides.length) {
            return;
        }

        const previousIndex = this.state.currentSlide;
        this.state.currentSlide = index;

        const currentSlide = this.elements.slides[index];
        const previousSlide = previousIndex >= 0 ? this.elements.slides[previousIndex] : null;

        // Update progress
        this.updateProgressBar((index + 1) / this.config.messages.length * 100);

        // Fire slide start event
        if (this.eventHandlers.onSlideStart) {
            this.eventHandlers.onSlideStart({
                index,
                message: this.config.messages[index],
                slide: currentSlide
            });
        }

        // Handle previous slide exit
        if (previousSlide) {
            previousSlide.classList.remove('active');
            previousSlide.classList.add('exiting');
        }

        // Show current slide
        currentSlide.style.visibility = 'visible';
        currentSlide.classList.add('active');

        // Add heart effects if enabled
        if (this.config.enableHeartEffects) {
            this.addHeartEffect(currentSlide);
        }

        // Announce to screen readers
        this.announceSlide(this.config.messages[index]);

        // Wait for transition to complete
        await this.wait(this.config.transitionDuration);

        // Clean up previous slide
        if (previousSlide) {
            previousSlide.classList.remove('exiting');
            previousSlide.style.visibility = 'hidden';
        }

        // Fire slide complete event
        if (this.eventHandlers.onSlideComplete) {
            this.eventHandlers.onSlideComplete({
                index,
                message: this.config.messages[index],
                slide: currentSlide
            });
        }

        // Fire progress event
        if (this.eventHandlers.onProgress) {
            this.eventHandlers.onProgress({
                current: index + 1,
                total: this.config.messages.length,
                percentage: (index + 1) / this.config.messages.length * 100
            });
        }
    }

    /**
     * Add heart effect to a slide
     */
    addHeartEffect(slide) {
        if (!slide || this.config.accessibilityMode) {
            return;
        }

        // Create hearts container if it doesn't exist
        let heartsContainer = slide.querySelector('.slide-hearts');
        if (!heartsContainer) {
            heartsContainer = document.createElement('div');
            heartsContainer.className = 'slide-hearts';
            heartsContainer.setAttribute('aria-hidden', 'true');
            slide.appendChild(heartsContainer);
        }

        // Add floating hearts
        const heartCount = Math.random() * 3 + 2; // 2-5 hearts
        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                this.createFloatingHeart(heartsContainer);
            }, Math.random() * 1000);
        }
    }

    /**
     * Create a floating heart element
     */
    createFloatingHeart(container) {
        const heart = document.createElement('span');
        heart.className = 'slide-heart';
        heart.textContent = ['💕', '💖', '💗', '💝'][Math.floor(Math.random() * 4)];
        heart.style.left = Math.random() * 80 + 10 + '%';
        heart.style.top = Math.random() * 80 + 10 + '%';

        container.appendChild(heart);

        // Remove after animation
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 3000);
    }

    /**
     * Announce slide content to screen readers
     */
    announceSlide(message) {
        // Create or update live region for announcements
        let liveRegion = document.querySelector('#slides-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'slides-live-region';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('aria-live', 'assertive');
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = message;
    }

    /**
     * Update progress bar
     */
    updateProgressBar(percentage) {
        if (!this.elements.progressBar) {
            return;
        }

        this.elements.progressBar.style.width = `${percentage}%`;

        // Add step classes for styling
        const step = Math.ceil(percentage / 20);
        this.elements.progressBar.className = 'progress-bar';
        if (step > 0) {
            this.elements.progressBar.classList.add(`step-${step}`);
        }
    }

    /**
     * Pause the slide sequence
     */
    pause() {
        if (!this.state.isPlaying || this.state.isPaused) {
            return;
        }

        this.state.isPaused = true;
        this.clearTimeouts();
    }

    /**
     * Resume the slide sequence
     */
    resume() {
        if (!this.state.isPlaying || !this.state.isPaused) {
            return;
        }

        this.state.isPaused = false;
        // Continue from current position
        this.continueSequence();
    }

    /**
     * Continue sequence after pause
     */
    async continueSequence() {
        const remainingSlides = this.config.messages.length - (this.state.currentSlide + 1);

        for (let i = this.state.currentSlide + 1; i < this.config.messages.length; i++) {
            if (!this.state.isPlaying || this.state.isPaused) {
                break;
            }

            await this.showSlide(i);

            if (i < this.config.messages.length - 1) {
                await this.wait(this.config.slideDelay);
            }
        }

        if (this.state.isPlaying && !this.state.isPaused) {
            await this.wait(this.config.slideDelay);
            this.complete();
        }
    }

    /**
     * Skip to next slide
     */
    nextSlide() {
        if (!this.state.isPlaying || this.state.currentSlide >= this.config.messages.length - 1) {
            return;
        }

        this.clearTimeouts();
        this.showSlide(this.state.currentSlide + 1);
    }

    /**
     * Skip the entire sequence
     */
    skip() {
        this.clearTimeouts();
        this.complete();
    }

    /**
     * Complete the slide sequence
     */
    complete() {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.isCompleted = true;

        this.updateProgressBar(100);

        // Fire completion event
        if (this.eventHandlers.onSequenceComplete) {
            this.eventHandlers.onSequenceComplete({
                duration: Date.now() - this.state.startTime,
                slideCount: this.config.messages.length
            });
        }

        // Dispatch custom event for other components
        const event = new CustomEvent('introSlidesComplete', {
            detail: {
                component: this,
                duration: Date.now() - this.state.startTime
            }
        });
        document.dispatchEvent(event);

        // Auto-hide after completion (optional)
        setTimeout(() => {
            this.hide();
        }, 1000);
    }

    /**
     * Hide the intro slides section
     */
    hide() {
        if (this.elements.section) {
            this.elements.section.classList.add('fade-out');
            setTimeout(() => {
                this.elements.section.classList.add('hidden');
                this.elements.section.classList.remove('fade-out');
            }, this.config.transitionDuration);
        }
    }

    /**
     * Show the intro slides section
     */
    show() {
        if (this.elements.section) {
            this.elements.section.classList.remove('hidden');
            this.elements.section.classList.add('fade-in');
        }
    }

    /**
     * Restart the sequence
     */
    restart() {
        this.stop();
        this.resetSlides();
        this.start();
    }

    /**
     * Stop the sequence
     */
    stop() {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.clearTimeouts();
    }

    /**
     * Clear all timeouts
     */
    clearTimeouts() {
        this.state.timeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
        this.state.timeouts = [];
    }

    /**
     * Wait for specified duration
     */
    wait(duration) {
        return new Promise((resolve) => {
            const timeout = setTimeout(resolve, duration);
            this.state.timeouts.push(timeout);
        });
    }

    /**
     * Adjust animations for reduced motion
     */
    adjustForReducedMotion() {
        this.config.slideDelay = 500;
        this.config.transitionDuration = 100;
        this.config.enableHeartEffects = false;

        // Remove animation classes
        this.elements.slides.forEach(slide => {
            slide.style.transition = 'opacity 0.2s ease';
        });
    }

    /**
     * Handle errors gracefully
     */
    handleError(error) {
        console.error('IntroSlides error:', error);
        this.state.isPlaying = false;

        // Fallback: show all messages at once
        this.elements.slides.forEach((slide, index) => {
            setTimeout(() => {
                slide.style.visibility = 'visible';
                slide.style.opacity = '1';
                slide.classList.add('active');
            }, index * 200);
        });

        // Complete after showing all slides
        setTimeout(() => {
            this.complete();
        }, this.config.messages.length * 200 + 1000);
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        if (newConfig.messages) {
            this.updateSlideMessages();
        }
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.stop();

        // Remove event listeners
        // (In a real implementation, you'd store references to remove them)

        // Clean up DOM
        const liveRegion = document.querySelector('#slides-live-region');
        if (liveRegion) {
            liveRegion.remove();
        }

        // Clear references
        this.elements = {};
        this.state = {};
        this.config = {};
        this.eventHandlers = {};
    }
}

export default IntroSlides;