import { chatLimitService } from './ChatLimitService.js';

class KeyValidationService {
    constructor() {
        this.STORAGE_KEY = 'wormgpt_access_key';
        this.BASE_URL = 'http://localhost:5000';
    }

    validateKeyFormat(key) {
        if (!key) return false;
        
        // Convert to uppercase for consistent validation
        key = key.toUpperCase();
        
        // Accept WR-TEST12345 and regular keys (WR-XXXXXXXXXX)
        return key === "WR-TEST12345" || /^WR-[A-Z0-9]{10}$/.test(key);
    }

    async validateKey(key) {
        try {
            if (!this.validateKeyFormat(key)) {
                return { 
                    valid: false, 
                    message: 'Invalid key format. Key should start with WR- followed by 10 characters' 
                };
            }

            const response = await fetch(`${this.BASE_URL}/validate-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ key: key.toUpperCase() })
            });

            const data = await response.json();
            
            if (data.valid) {
                // Check if this is a different key than the current one
                const currentKey = this.getKeyData()?.key;
                const isNewKey = !currentKey || currentKey !== key.toUpperCase();

                const keyData = {
                    key: key.toUpperCase(),
                    expiryTime: data.expiryTime,
                    activatedAt: new Date().toISOString()
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));

                // Reset chat limits if it's a new key
                if (isNewKey) {
                    await chatLimitService.resetChatLimit();
                }

                // Calculate remaining time
                const remaining = this.getRemainingTime();
                return {
                    ...data,
                    message: `Key activated successfully. Expires in ${remaining.hours}h ${remaining.minutes}m`
                };
            }
            
            return data;
        } catch (error) {
            console.error('Key validation error:', error);
            return { 
                valid: false, 
                message: 'Error connecting to validation server. Please try again.' 
            };
        }
    }

    isKeyValid() {
        try {
            const keyData = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            if (!keyData) return false;

            const now = new Date();
            const expiryTime = new Date(keyData.expiryTime);
            return now < expiryTime;
        } catch (error) {
            return false;
        }
    }

    getKeyData() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
        } catch {
            return null;
        }
    }

    getRemainingTime() {
        const keyData = this.getKeyData();
        if (!keyData) return null;

        const now = new Date();
        const expiryTime = new Date(keyData.expiryTime);
        const diff = expiryTime - now;

        return {
            hours: Math.max(0, Math.floor(diff / (1000 * 60 * 60))),
            minutes: Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)))
        };
    }
}

export const keyValidationService = new KeyValidationService();