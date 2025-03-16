export class ChatLimitService {
    constructor() {
        this.storageKey = 'chatLimits';
    }

    async initializeChatLimit() {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) {
            const initial = {
                remaining: 40,
                total: 40,
                lastReset: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initial));
            return initial.remaining;
        }
        await this.checkDailyReset();
        return JSON.parse(stored).remaining;
    }

    async checkDailyReset() {
        const limits = JSON.parse(localStorage.getItem(this.storageKey));
        if (!limits) return;

        const lastReset = new Date(limits.lastReset);
        const now = new Date();
        
        // Check if it's a new day
        if (lastReset.getDate() !== now.getDate() || 
            lastReset.getMonth() !== now.getMonth() || 
            lastReset.getFullYear() !== now.getFullYear()) {
            // Reset daily limit
            limits.remaining = 40;
            limits.total = 40;
            limits.lastReset = now.toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(limits));
        }
    }

    async canSendMessage() {
        await this.checkDailyReset();
        const limits = JSON.parse(localStorage.getItem(this.storageKey));
        return limits && limits.remaining > 0;
    }

    async decrementChatLimit() {
        await this.checkDailyReset();
        const limits = JSON.parse(localStorage.getItem(this.storageKey));
        if (limits.remaining > 0) {
            limits.remaining--;
            localStorage.setItem(this.storageKey, JSON.stringify(limits));
        }
        return limits.remaining;
    }

    async getRemainingChats() {
        await this.checkDailyReset();
        const limits = JSON.parse(localStorage.getItem(this.storageKey));
        return limits ? limits.remaining : 0;
    }

    async resetChatLimit() {
        const initial = {
            remaining: 40,
            total: 40,
            lastReset: new Date().toISOString()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(initial));
        return initial.remaining;
    }

    async updateDisplay() {
        const remaining = await this.getRemainingChats();
        const displayElement = document.querySelector('.chat-limit-display');
        if (displayElement) {
            displayElement.textContent = `${remaining} messages remaining today`;
        }
    }
}

export const chatLimitService = new ChatLimitService();