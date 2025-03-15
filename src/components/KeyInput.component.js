import { keyValidationService } from '../services/KeyValidationService.js';

export class KeyInput {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'key-input-container';
        this.render();
        this.initialize();
    }

    render() {
        const keyData = keyValidationService.getKeyData();
        const remaining = keyValidationService.getRemainingTime();

        this.container.innerHTML = `
            <div class="key-status-section">
                <h3>Access Key Status</h3>
                <div class="key-info">
                    ${keyData ? `
                        <div class="key-display">
                            <div class="key-value">
                                <span class="material-symbols-outlined">vpn_key</span>
                                ${keyData.key}
                            </div>
                            <div class="key-expiry">
                                <span class="material-symbols-outlined">schedule</span>
                                Expires in ${remaining.hours}h ${remaining.minutes}m
                            </div>
                        </div>
                        <div class="key-meta">
                            <div class="activation-date">
                                Activated: ${new Date(keyData.activatedAt).toLocaleString()}
                            </div>
                            <div class="expiry-date">
                                Expires: ${new Date(keyData.expiryTime).toLocaleString()}
                            </div>
                        </div>
                    ` : `
                        <div class="no-key-message">
                            <span class="material-symbols-outlined">error</span>
                            No active key found
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    initialize() {
        // Only need to handle auto-updates of remaining time
        if (keyValidationService.isKeyValid()) {
            setInterval(() => {
                const remaining = keyValidationService.getRemainingTime();
                const expiryElement = this.container.querySelector('.key-expiry');
                if (expiryElement) {
                    expiryElement.innerHTML = `
                        <span class="material-symbols-outlined">schedule</span>
                        Expires in ${remaining.hours}h ${remaining.minutes}m
                    `;
                }
            }, 60000); // Update every minute
        }
    }
}