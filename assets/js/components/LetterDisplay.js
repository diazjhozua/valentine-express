/**
 * LetterDisplay Component - Romantic Letter Presentation
 * Displays a beautiful Valentine's Day letter with typewriter effects and animations
 *
 * Features:
 * - Animated entrance after intro slides
 * - Typewriter effect for letter content
 * - Interactive heart spawning on clicks
 * - Customizable letter content and signature
 * - Responsive typography and layout
 * - Accessibility support
 * - Print functionality
 */

class LetterDisplay {
    constructor(options = {}) {
        // Default configuration
        this.config = {
            container: options.container || '#letterSection',
            letterContent: options.letterContent || '#letterText',
            signature: options.signature || '#signatureName',
            letterDate: options.letterDate || '#letterDate',
            heartsContainer: options.heartsContainer || '#letterHeartsContainer',

            // Animation settings
            entranceDelay: options.entranceDelay || 300,
            typewriterSpeed: options.typewriterSpeed || 50,
            paragraphDelay: options.paragraphDelay || 200,

            // Content settings
            defaultContent: options.defaultContent || null,
            defaultSignature: options.defaultSignature || 'Your Valentine',
            enableTypewriter: options.enableTypewriter !== false,
            enableHeartEffects: options.enableHeartEffects !== false,

            // Interaction settings
            clickToSpawnHearts: options.clickToSpawnHearts !== false,
            enablePrintButton: options.enablePrintButton !== false,

            // Accessibility
            accessibilityMode: options.accessibilityMode || false
        };

        // State management
        this.state = {
            isVisible: false,
            isAnimating: false,
            currentParagraph: 0,
            typewriterActive: false,
            heartsEnabled: true,
            originalContent: null,
            customContent: null
        };

        // DOM elements
        this.elements = {
            container: null,
            letterText: null,
            signature: null,
            letterDate: null,
            heartsContainer: null,
            paragraphs: [],
            printButton: null
        };

        // Event handlers
        this.eventHandlers = {
            onShow: options.onShow || null,
            onHide: options.onHide || null,
            onContentComplete: options.onContentComplete || null,
            onHeartSpawn: options.onHeartSpawn || null
        };

        // Heart animation settings
        this.heartConfig = {
            types: ['❤️', '💕', '💖', '💗', '💝', '💘'],
            colors: ['#e74c3c', '#f8d7da', '#ec7063', '#f1aeb5'],
            maxHearts: 10,
            heartLifetime: 2000
        };

        // Initialize the component
        this.init();
    }

    /**
     * Initialize the LetterDisplay component
     */
    init() {
        try {
            this.setupDOM();
            this.setupAccessibility();
            this.setupEventListeners();
            this.prepareContent();
            this.setupDate();
        } catch (error) {
            console.error('LetterDisplay initialization failed:', error);
        }
    }

    /**
     * Set up DOM elements and references
     */
    setupDOM() {
        // Get main container
        this.elements.container = document.querySelector(this.config.container);
        if (!this.elements.container) {
            throw new Error(`LetterDisplay container not found: ${this.config.container}`);
        }

        // Get content elements
        this.elements.letterText = document.querySelector(this.config.letterContent);
        this.elements.signature = document.querySelector(this.config.signature);
        this.elements.letterDate = document.querySelector(this.config.letterDate);
        this.elements.heartsContainer = document.querySelector(this.config.heartsContainer);

        if (!this.elements.letterText) {
            throw new Error('Letter text container not found');
        }

        // Get paragraphs
        this.elements.paragraphs = Array.from(
            this.elements.letterText.querySelectorAll('p')
        );

        // Create print button if enabled
        if (this.config.enablePrintButton) {
            this.createPrintButton();
        }
    }

    /**
     * Set up accessibility features
     */
    setupAccessibility() {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.config.accessibilityMode = true;
            this.config.enableTypewriter = false;
            this.config.typewriterSpeed = 10;
            this.config.paragraphDelay = 50;
        }

        // Set up ARIA attributes
        this.elements.container.setAttribute('role', 'main');
        this.elements.container.setAttribute('aria-labelledby', 'letter-title');

        if (this.elements.letterText) {
            this.elements.letterText.setAttribute('role', 'article');
            this.elements.letterText.setAttribute('tabindex', '0');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for intro slides completion
        document.addEventListener('introSlidesComplete', (event) => {
            setTimeout(() => {
                this.show();
            }, this.config.entranceDelay);
        });

        // Heart spawning on click/touch
        if (this.config.clickToSpawnHearts && this.elements.container) {
            this.elements.container.addEventListener('click', (event) => {
                if (this.state.isVisible && this.state.heartsEnabled) {
                    this.spawnHeart(event.clientX, event.clientY);
                }
            });

            // Touch support
            this.elements.container.addEventListener('touchstart', (event) => {
                if (this.state.isVisible && this.state.heartsEnabled) {
                    const touch = event.touches[0];
                    if (touch) {
                        this.spawnHeart(touch.clientX, touch.clientY);
                    }
                }
            });
        }

        // Keyboard interactions
        document.addEventListener('keydown', (event) => {
            if (this.state.isVisible) {
                switch (event.key) {
                    case 'p':
                    case 'P':
                        if (event.ctrlKey || event.metaKey) {
                            event.preventDefault();
                            this.print();
                        }
                        break;
                    case 'h':
                    case 'H':
                        if (!event.ctrlKey && !event.metaKey) {
                            this.toggleHearts();
                        }
                        break;
                }
            }
        });

        // Paragraph hover effects
        this.elements.paragraphs.forEach((paragraph, index) => {
            paragraph.addEventListener('mouseenter', () => {
                if (this.state.heartsEnabled && !this.config.accessibilityMode) {
                    this.createParagraphEffect(paragraph);
                }
            });

            paragraph.addEventListener('click', () => {
                if (this.state.heartsEnabled) {
                    this.highlightParagraph(paragraph);
                }
            });
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            this.adjustForScreenSize();
        });
    }

    /**
     * Prepare letter content for display
     */
    prepareContent() {
        // Store original content
        this.state.originalContent = this.elements.letterText.innerHTML;

        // Set custom content if provided
        if (this.config.defaultContent) {
            this.setContent(this.config.defaultContent);
        }

        // Set signature
        if (this.elements.signature && this.config.defaultSignature) {
            this.elements.signature.textContent = this.config.defaultSignature;
        }

        // Initially hide paragraphs for animation
        if (this.config.enableTypewriter || !this.config.accessibilityMode) {
            // Add class to ensure content stays hidden
            this.elements.letterText.parentElement.classList.add('pre-typewriter');

            this.elements.paragraphs.forEach(paragraph => {
                paragraph.style.opacity = '0';
                paragraph.style.transform = 'translateY(20px)';
                paragraph.style.visibility = 'hidden';
            });
        }
    }

    /**
     * Set up the current date
     */
    setupDate() {
        if (this.elements.letterDate) {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            this.elements.letterDate.textContent = formattedDate;
            this.elements.letterDate.setAttribute('datetime', now.toISOString().split('T')[0]);
        }
    }

    /**
     * Show the letter with entrance animation
     */
    async show() {
        if (this.state.isVisible || this.state.isAnimating) {
            return;
        }

        this.state.isAnimating = true;

        try {
            // Remove hidden class and add entrance animation
            this.elements.container.classList.remove('hidden');
            this.elements.container.classList.add('visible', 'page-enter');

            // Wait for entrance animation
            await this.wait(800);

            this.state.isVisible = true;
            this.state.isAnimating = false;

            // Start content animation
            if (this.config.enableTypewriter && !this.config.accessibilityMode) {
                await this.animateContent();
            } else {
                this.showAllContent();
            }

            // Fire show event
            if (this.eventHandlers.onShow) {
                this.eventHandlers.onShow();
            }

            // Start background heart effects
            if (this.config.enableHeartEffects) {
                this.startBackgroundHearts();
            }

        } catch (error) {
            console.error('Error showing letter:', error);
            this.state.isAnimating = false;
            this.showAllContent();
        }
    }

    /**
     * Animate letter content with typewriter effect
     */
    async animateContent() {
        this.state.typewriterActive = true;

        // Remove pre-typewriter class to allow animations
        const letterContent = this.elements.letterText.parentElement;
        if (letterContent) {
            letterContent.classList.remove('pre-typewriter');
        }

        for (let i = 0; i < this.elements.paragraphs.length; i++) {
            if (!this.state.typewriterActive) break;

            const paragraph = this.elements.paragraphs[i];
            await this.animateParagraph(paragraph, i);

            // Delay before next paragraph
            if (i < this.elements.paragraphs.length - 1) {
                await this.wait(this.config.paragraphDelay);
            }
        }

        // Animate signature
        if (this.elements.signature) {
            await this.animateSignature();
        }

        this.state.typewriterActive = false;

        if (this.eventHandlers.onContentComplete) {
            this.eventHandlers.onContentComplete();
        }
    }

    /**
     * Animate a single paragraph with typewriter effect
     */
    async animateParagraph(paragraph, index) {
        const originalText = paragraph.textContent;
        const words = originalText.split(' ');

        // Show paragraph container
        paragraph.style.visibility = 'visible';
        paragraph.style.opacity = '1';
        paragraph.style.transform = 'translateY(0)';
        paragraph.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        // Clear content for typewriter
        paragraph.textContent = '';

        // Add typewriter cursor
        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor';
        cursor.textContent = '|';
        cursor.style.animation = 'blink 1s infinite';
        paragraph.appendChild(cursor);

        // Type words progressively
        for (let i = 0; i < words.length; i++) {
            if (!this.state.typewriterActive) break;

            const currentText = words.slice(0, i + 1).join(' ');
            paragraph.childNodes[0].textContent = currentText + ' ';

            // Variable speed based on punctuation
            const word = words[i];
            const delay = word.includes('.') || word.includes('!') || word.includes('?')
                ? this.config.typewriterSpeed * 3
                : this.config.typewriterSpeed;

            await this.wait(delay);
        }

        // Remove cursor
        cursor.remove();
        paragraph.textContent = originalText;

        // Ensure full visibility after typing
        paragraph.style.opacity = '1';
        paragraph.style.visibility = 'visible';
        paragraph.style.transform = 'translateY(0)';
        paragraph.classList.add('typed-complete');

        // Add subtle completion effect
        paragraph.style.animation = 'paragraph-complete 0.3s ease';
    }

    /**
     * Animate signature
     */
    async animateSignature() {
        if (!this.elements.signature) return;

        // Show signature text first
        const signatureText = this.elements.container.querySelector('.signature-text');
        if (signatureText) {
            signatureText.style.opacity = '1';
            signatureText.style.visibility = 'visible';
        }

        // Then show signature name
        this.elements.signature.style.opacity = '1';
        this.elements.signature.style.visibility = 'visible';
        this.elements.signature.style.transform = 'translateX(0) scale(1)';
        this.elements.signature.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        // Add heart after signature
        setTimeout(() => {
            const heart = this.elements.signature.querySelector('::after') ||
                         document.createElement('span');
            if (!heart.parentElement) {
                heart.textContent = ' 💕';
                heart.style.opacity = '0';
                heart.style.animation = 'heartPulse 2s ease-in-out infinite';
                this.elements.signature.appendChild(heart);

                setTimeout(() => {
                    heart.style.opacity = '1';
                }, 500);
            }
        }, 1000);
    }

    /**
     * Show all content immediately (accessibility mode)
     */
    showAllContent() {
        // Remove pre-typewriter class
        const letterContent = this.elements.letterText.parentElement;
        if (letterContent) {
            letterContent.classList.remove('pre-typewriter');
        }

        this.elements.paragraphs.forEach(paragraph => {
            paragraph.style.visibility = 'visible';
            paragraph.style.opacity = '1';
            paragraph.style.transform = 'translateY(0)';
            paragraph.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        });

        if (this.elements.signature) {
            this.elements.signature.style.opacity = '1';
            this.elements.signature.style.transform = 'translateX(0) scale(1)';
        }

        if (this.eventHandlers.onContentComplete) {
            this.eventHandlers.onContentComplete();
        }
    }

    /**
     * Hide the letter
     */
    hide() {
        if (!this.state.isVisible) return;

        this.elements.container.classList.add('page-exit');

        setTimeout(() => {
            this.elements.container.classList.add('hidden');
            this.elements.container.classList.remove('visible', 'page-enter', 'page-exit');
            this.state.isVisible = false;

            if (this.eventHandlers.onHide) {
                this.eventHandlers.onHide();
            }
        }, 600);
    }

    /**
     * Spawn a heart at specific coordinates
     */
    spawnHeart(x, y) {
        if (!this.elements.heartsContainer || !this.state.heartsEnabled) return;

        const heart = document.createElement('div');
        heart.className = 'letter-heart';

        // Random heart type
        heart.textContent = this.heartConfig.types[
            Math.floor(Math.random() * this.heartConfig.types.length)
        ];

        // Position relative to container
        const containerRect = this.elements.container.getBoundingClientRect();
        const relativeX = x - containerRect.left;
        const relativeY = y - containerRect.top;

        heart.style.left = relativeX + 'px';
        heart.style.top = relativeY + 'px';

        // Random color
        heart.style.color = this.heartConfig.colors[
            Math.floor(Math.random() * this.heartConfig.colors.length)
        ];

        this.elements.heartsContainer.appendChild(heart);

        // Remove after animation
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, this.heartConfig.heartLifetime);

        // Fire heart spawn event
        if (this.eventHandlers.onHeartSpawn) {
            this.eventHandlers.onHeartSpawn({ x: relativeX, y: relativeY, element: heart });
        }
    }

    /**
     * Create subtle effect for paragraph hover
     */
    createParagraphEffect(paragraph) {
        const rect = paragraph.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Create small hearts around the paragraph
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 100;
                const offsetY = (Math.random() - 0.5) * 50;
                this.spawnHeart(centerX + offsetX, centerY + offsetY);
            }, i * 100);
        }
    }

    /**
     * Highlight a paragraph when clicked
     */
    highlightParagraph(paragraph) {
        // Remove existing highlights
        this.elements.paragraphs.forEach(p => {
            p.classList.remove('highlighted');
        });

        // Add highlight to clicked paragraph
        paragraph.classList.add('highlighted');

        setTimeout(() => {
            paragraph.classList.remove('highlighted');
        }, 2000);
    }

    /**
     * Start background heart effects
     */
    startBackgroundHearts() {
        if (!this.config.enableHeartEffects || this.config.accessibilityMode) return;

        const spawnBackgroundHeart = () => {
            if (!this.state.isVisible || !this.state.heartsEnabled) return;

            const containerRect = this.elements.container.getBoundingClientRect();
            const x = Math.random() * containerRect.width;
            const y = containerRect.height * 0.8 + Math.random() * containerRect.height * 0.2;

            this.spawnHeart(x + containerRect.left, y + containerRect.top);
        };

        // Spawn hearts periodically
        this.heartInterval = setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every interval
                spawnBackgroundHeart();
            }
        }, 2000);
    }

    /**
     * Toggle heart effects on/off
     */
    toggleHearts() {
        this.state.heartsEnabled = !this.state.heartsEnabled;

        if (!this.state.heartsEnabled) {
            // Clear existing hearts
            if (this.elements.heartsContainer) {
                this.elements.heartsContainer.innerHTML = '';
            }

            // Clear interval
            if (this.heartInterval) {
                clearInterval(this.heartInterval);
            }
        } else {
            this.startBackgroundHearts();
        }
    }

    /**
     * Set custom letter content
     */
    setContent(content) {
        if (!this.elements.letterText) return;

        if (typeof content === 'string') {
            // Simple text content
            this.elements.letterText.innerHTML = `<p>${content.replace(/\n\n/g, '</p><p>')}</p>`;
        } else if (Array.isArray(content)) {
            // Array of paragraphs
            this.elements.letterText.innerHTML = content.map(p => `<p>${p}</p>`).join('');
        } else if (content.html) {
            // HTML content
            this.elements.letterText.innerHTML = content.html;
        }

        // Update paragraphs array
        this.elements.paragraphs = Array.from(
            this.elements.letterText.querySelectorAll('p')
        );

        this.state.customContent = content;
    }

    /**
     * Set custom signature
     */
    setSignature(signature) {
        if (this.elements.signature) {
            this.elements.signature.textContent = signature;
        }
    }

    /**
     * Create print button
     */
    createPrintButton() {
        const printBtn = document.createElement('button');
        printBtn.className = 'print-button';
        printBtn.innerHTML = '🖨️';
        printBtn.setAttribute('aria-label', 'Print this letter');

        printBtn.addEventListener('click', () => {
            this.print();
        });

        // Add to letter container (positioned absolutely in top-right)
        const letterContainer = this.elements.container.querySelector('.letter-container');
        if (letterContainer) {
            // Make sure container has relative positioning for absolute button
            letterContainer.style.position = 'relative';
            letterContainer.appendChild(printBtn);
            this.elements.printButton = printBtn;
        }
    }

    /**
     * Print the letter
     */
    print() {
        const printWindow = window.open('', '_blank');

        const letterHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Valentine's Day Letter</title>
                <style>
                    body {
                        font-family: 'Times New Roman', serif;
                        max-width: 600px;
                        margin: 40px auto;
                        line-height: 1.6;
                        color: #333;
                    }
                    h1 {
                        font-family: 'Dancing Script', cursive;
                        color: #e74c3c;
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .letter-date {
                        text-align: center;
                        margin-bottom: 30px;
                        font-style: italic;
                    }
                    .letter-content {
                        margin: 30px 0;
                    }
                    .letter-content p {
                        margin-bottom: 20px;
                    }
                    .signature {
                        text-align: right;
                        margin-top: 40px;
                        font-style: italic;
                    }
                    @page {
                        margin: 1in;
                    }
                </style>
            </head>
            <body>
                <h1>${document.querySelector('#letter-title')?.textContent || 'My Valentine Letter'}</h1>
                <div class="letter-date">${this.elements.letterDate?.textContent || ''}</div>
                <div class="letter-content">${this.elements.letterText.innerHTML}</div>
                <div class="signature">
                    <p>With all my love,</p>
                    <p><strong>${this.elements.signature?.textContent || 'Your Valentine'}</strong></p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(letterHTML);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 100);
    }

    /**
     * Adjust layout for screen size
     */
    adjustForScreenSize() {
        const isMobile = window.innerWidth < 768;

        if (isMobile && this.config.enableTypewriter) {
            this.config.typewriterSpeed = Math.max(20, this.config.typewriterSpeed * 0.5);
        }
    }

    /**
     * Wait for specified duration
     */
    wait(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Destroy the component
     */
    destroy() {
        // Clear intervals
        if (this.heartInterval) {
            clearInterval(this.heartInterval);
        }

        // Stop typewriter
        this.state.typewriterActive = false;

        // Clean up DOM
        if (this.elements.heartsContainer) {
            this.elements.heartsContainer.innerHTML = '';
        }

        // Clear references
        this.elements = {};
        this.state = {};
        this.config = {};
        this.eventHandlers = {};
    }
}

export default LetterDisplay;