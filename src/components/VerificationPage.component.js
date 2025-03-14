import { keyValidationService } from '../services/KeyValidationService.js';
import { PrivacyPolicy } from './Privacy.component.js';
import { TermsAndConditions } from './Terms.component.js';

export class VerificationPage {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'verification-overlay';
        this.render();
        this.initialize();
    }

    render() {
        this.container.innerHTML = `
            <div class="min-h-screen bg-black overflow-hidden relative">
                <!-- Animated background -->
                <div class="verification-background">
                    <div class="gradient-overlay"></div>
                    ${Array(20).fill(0).map(() => 
                        `<div class="floating-particle" style="
                            left: ${Math.random() * 100}%;
                            top: ${Math.random() * 100}%;
                            animation-delay: ${Math.random() * 5}s;
                            animation-duration: ${5 + Math.random() * 5}s"
                        ></div>`
                    ).join('')}
                </div>

                <!-- Navigation -->
                <nav class="verification-nav">
                    <div class="logo-section">
                        <div class="logo-wrapper">
                            <div class="logo-glow"></div>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5a/Wormgpt.svg" 
                                alt="WormGPT Logo" 
                                class="logo-image">
                        </div>
                        <span class="logo-text">WormGPT</span>
                    </div>
                    <div class="nav-buttons">
                        <button class="nav-button" data-page="privacy">
                            <span class="material-symbols-outlined">shield</span>
                            <span>Privacy</span>
                        </button>
                        <button class="nav-button" data-page="terms">
                            <span class="material-symbols-outlined">description</span>
                            <span>Terms</span>
                        </button>
                    </div>
                </nav>

                <!-- Main Content -->
                <main class="verification-content">
                    <div class="verification-card">
                        <div class="glow-effect"></div>
                        <div class="card-content">
                            <div class="card-header">
                                <span class="material-symbols-outlined">vpn_key</span>
                                <h2>Verify Your Access</h2>
                            </div>
                            <p class="card-description">Enter your WormGPT access key to continue</p>
                            <div class="key-input-section">
                                <input type="text" 
                                    id="verificationKeyInput" 
                                    placeholder="Enter your key (e.g., WR-XXXXXXXXXX)"
                                    class="verification-input"
                                >
                                <button id="verifyKeyBtn" class="verify-button">
                                    <span class="material-symbols-outlined">check_circle</span>
                                    Verify
                                </button>
                            </div>
                            <div id="verificationStatus" class="verification-status"></div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }

    initialize() {
        const verifyBtn = this.container.querySelector('#verifyKeyBtn');
        const keyInput = this.container.querySelector('#verificationKeyInput');
        const statusElement = this.container.querySelector('#verificationStatus');
        const privacyBtn = this.container.querySelector('[data-page="privacy"]');
        const termsBtn = this.container.querySelector('[data-page="terms"]');

        // Function to update button state based on input
        const updateButtonState = () => {
            const isEmpty = !keyInput.value.trim();
            
            // Update button appearance based on state
            if (isEmpty) {
                verifyBtn.innerHTML = `
                    <span class="material-symbols-outlined">download</span>
                    Get Key
                `;
                verifyBtn.className = 'verify-button get-key';
            } else {
                verifyBtn.innerHTML = `
                    <span class="material-symbols-outlined">check_circle</span>
                    Verify
                `;
                verifyBtn.className = 'verify-button verify';
            }

            // Update click handler
            verifyBtn.onclick = isEmpty ? 
                () => window.open('https://t.me/HecKeys_bot', '_blank') :
                async () => {
                    try {
                        verifyBtn.disabled = true;
                        verifyBtn.innerHTML = `
                            <span class="material-symbols-outlined loading">sync</span>
                            Verifying...
                        `;

                        const result = await keyValidationService.validateKey(keyInput.value.trim());

                        if (result.valid) {
                            statusElement.innerHTML = `
                                <div class="success-message">
                                    <span class="material-symbols-outlined">check_circle</span>
                                    ${result.message}
                                </div>`;
                            
                            setTimeout(() => {
                                this.container.classList.add('verified');
                                setTimeout(() => {
                                    this.container.remove();
                                    window.location.reload();
                                }, 500);
                            }, 1500);
                        } else {
                            statusElement.innerHTML = `
                                <div class="error-message">
                                    <span class="material-symbols-outlined">error</span>
                                    ${result.message}
                                </div>`;
                            
                            verifyBtn.disabled = false;
                            updateButtonState();
                        }
                    } catch (error) {
                        statusElement.innerHTML = `
                            <div class="error-message">
                                <span class="material-symbols-outlined">error</span>
                                Error connecting to server
                            </div>`;
                        
                        verifyBtn.disabled = false;
                        updateButtonState();
                    }
                };
        };

        // Listen for input changes
        keyInput.addEventListener('input', updateButtonState);
        
        // Initialize button state
        updateButtonState();

        // Add input animations
        keyInput.addEventListener('focus', () => {
            keyInput.parentElement.classList.add('input-focused');
        });

        keyInput.addEventListener('blur', () => {
            keyInput.parentElement.classList.remove('input-focused');
        });

        // Handle privacy and terms navigation
        privacyBtn.onclick = () => {
            const privacyPage = new PrivacyPolicy(() => {
                privacyPage.container.remove();
            });
            document.body.appendChild(privacyPage.container);
        };

        termsBtn.onclick = () => {
            const termsPage = new TermsAndConditions(() => {
                termsPage.container.remove();
            });
            document.body.appendChild(termsPage.container);
        };
    }
}