import { chatLimitService } from './ChatLimitService.js';

export class KeyValidationService {
    constructor() {
        // Set default API URL with fallback
        this.API_URL = import.meta.env.VITE_API_URL || 'https://wormgpt-api.onrender.com';
        this.KEY_STORAGE = 'wormgpt_access_key';
        this.EXPIRY_STORAGE = 'wormgpt_key_expiry';
        this.USER_ID_STORAGE = 'wormgpt_user_id';
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

            const response = await fetch(`${this.API_URL}/api/validate-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key: key.toUpperCase() })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.valid) {
                // Store key data
                localStorage.setItem(this.KEY_STORAGE, JSON.stringify({
                    key: key.toUpperCase(),
                    expiryTime: data.expiryTime,
                    activatedAt: new Date().toISOString()
                }));
                return {
                    valid: true,
                    message: data.message,
                    expiryTime: data.expiryTime
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

    async generateTrialKey() {
        try {
            let userId = localStorage.getItem(this.USER_ID_STORAGE);
            if (!userId) {
                userId = 'web_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem(this.USER_ID_STORAGE, userId);
            }

            const response = await fetch(`${this.API_URL}/api/generate-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                throw new Error('Failed to generate key');
            }

            const data = await response.json();
            if (data.success) {
                localStorage.setItem(this.KEY_STORAGE, JSON.stringify({
                    key: data.key,
                    expiryTime: data.expiryTime,
                    activatedAt: new Date().toISOString()
                }));
                return {
                    success: true,
                    key: data.key,
                    expiryTime: data.expiryTime
                };
            }
            return {
                success: false,
                message: data.message || 'Failed to generate key'
            };
        } catch (error) {
            console.error('Error generating key:', error);
            return {
                success: false,
                message: 'Error connecting to server'
            };
        }
    }

    isKeyValid() {
        const key = localStorage.getItem(this.KEY_STORAGE);
        const expiry = localStorage.getItem(this.EXPIRY_STORAGE);

        if (!key || !expiry) return false;

        const expiryDate = new Date(expiry);
        return expiryDate > new Date();
    }

    getKeyData() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY_STORAGE));
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
