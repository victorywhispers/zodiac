import { keyValidationService } from '../services/KeyValidationService.js';

export class KeyInput {
    constructor() {
        // Create the container instead of querying it
        this.container = document.createElement('div');
        this.container.className = 'key-status-section';
        this.initialize();
    }

    async initialize() {
        await this.render();
        this.startUpdateTimer();
    }

    async render() {
        const keyData = await keyValidationService.getKeyData();
        const remaining = await keyValidationService.getRemainingTime();

        this.container.innerHTML = `
            <h3>Access Key Status</h3>
            <div class="key-info">
                ${keyData ? `
                    <div class="key-display">
                        <div class="key-value">
                            <span class="material-symbols-outlined">vpn_key</span>
                            ${keyData.key || 'No key'}
                        </div>
                        <div class="key-expiry">
                            <span class="material-symbols-outlined">schedule</span>
                            ${remaining ? `Expires in ${remaining.hours}h ${remaining.minutes}m` : 'Expired'}
                        </div>
                    </div>
                    <div class="key-meta">
                        <div class="activation-date">
                            Activated: ${keyData.activatedAt ? new Date(keyData.activatedAt).toLocaleString() : 'Not available'}
                        </div>
                        <div class="expiry-date">
                            Expires: ${keyData.expiryTime ? new Date(keyData.expiryTime).toLocaleString() : 'Not available'}
                        </div>
                    </div>
                ` : `
                    <div class="no-key-message">
                        <span class="material-symbols-outlined">error</span>
                        No active key found
                    </div>
                `}
            </div>
        `;
    }

    startUpdateTimer() {
        // Update remaining time every minute
        setInterval(async () => {
            await this.render();
        }, 60000);
    }
}