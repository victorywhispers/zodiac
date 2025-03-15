class ChatLimitService {
    constructor() {
        this.CHATS_PER_DAY = 10;
        this.STORAGE_KEY = 'chat_limit_data';
        this.BONUS_KEY = 'wormgpt_bonus_messages';
    }

    initializeChatLimit() {
        const keyData = JSON.parse(localStorage.getItem('wormgpt_access_key'));
        if (!keyData) return 0;

        const currentData = this.getChatLimitData();
        
        if (!currentData || currentData.keyExpiryTime !== keyData.expiryTime) {
            return this.resetChatLimit(keyData.expiryTime);
        }

        return currentData.remainingChats;
    }

    shouldReset(lastReset, keyExpiryTime) {
        const now = new Date().getTime();
        const expiryTime = new Date(keyExpiryTime).getTime();
        
        // Reset if current time is past expiry
        if (now >= expiryTime) {
            return true;
        }

        // Check if 24 hours have passed since last reset
        const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);
        return hoursSinceReset >= 24;
    }

    resetChatLimit(keyExpiryTime) {
        const data = {
            remainingChats: this.CHATS_PER_DAY,
            lastReset: new Date().getTime(),
            keyExpiryTime: keyExpiryTime
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        return this.CHATS_PER_DAY;
    }

    getChatLimitData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;

            const parsedData = JSON.parse(data);
            
            // Check if key has expired
            const keyData = JSON.parse(localStorage.getItem('wormgpt_access_key'));
            if (!keyData || new Date() >= new Date(keyData.expiryTime)) {
                localStorage.removeItem(this.STORAGE_KEY);
                return null;
            }

            return parsedData;
        } catch (error) {
            console.error('Error reading chat limit data:', error);
            return null;
        }
    }

    decrementChat() {
        const data = this.getChatLimitData();
        let bonusMessages = parseInt(localStorage.getItem(this.BONUS_KEY) || '0');

        // First try to use regular chats
        if (data && data.remainingChats > 0) {
            data.remainingChats -= 1;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            this.remainingChats = data.remainingChats;
            this.updateRemainingChatsDisplay();
            return data.remainingChats;
        } 
        // Then use bonus messages if available
        else if (bonusMessages > 0) {
            bonusMessages -= 1;
            localStorage.setItem(this.BONUS_KEY, bonusMessages.toString());
            // Update the display immediately
            this.updateRemainingChatsDisplay();
            return 0; // Return 0 for regular chats
        }
        return 0;
    }

    canSendMessage() {
        const data = this.getChatLimitData();
        const bonusMessages = parseInt(localStorage.getItem(this.BONUS_KEY) || '0');
        return (data && data.remainingChats > 0) || bonusMessages > 0;
    }

    updateRemainingChatsDisplay() {
        const remainingElement = document.querySelector('#remaining-chats-count');
        const bonusElement = document.querySelector('#bonus-messages-count');
        const bonusMessages = parseInt(localStorage.getItem(this.BONUS_KEY) || '0');
        
        if (remainingElement) {
            remainingElement.textContent = `${this.remainingChats} chats remaining`;
            
            if (this.remainingChats <= 2) {
                remainingElement.classList.add('warning');
            } else {
                remainingElement.classList.remove('warning');
            }
        }

        // Update bonus messages display in real-time
        if (bonusElement) {
            bonusElement.textContent = `${bonusMessages} bonus messages`;
            
            // Add warning class if bonus messages are low
            if (bonusMessages <= 2 && bonusMessages > 0) {
                bonusElement.classList.add('warning');
            } else {
                bonusElement.classList.remove('warning');
            }
        }

        // Force update both sections visibility
        const userStats = document.querySelectorAll('.user-stats');
        userStats.forEach(stat => {
            stat.style.display = 'block';
        });
    }
}

export const chatLimitService = new ChatLimitService();