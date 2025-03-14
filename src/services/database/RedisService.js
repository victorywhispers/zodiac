import { DATABASE_CONFIG } from './config';

class RedisService {
    async storeRecentMessage(chatId, message) {
        const response = await fetch('/api/redis/recent-messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatId, message })
        });
        return response.ok;
    }

    async getRecentMessages(chatId) {
        const response = await fetch(`/api/redis/recent-messages?chatId=${chatId}`);
        return await response.json();
    }
}

export const redisService = new RedisService();