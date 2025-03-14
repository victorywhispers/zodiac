import { supabaseService } from './database/SupabaseService';

class UserService {
    constructor() {
        this.USER_KEY = 'wormgpt_user';
    }

    async initializeUser() {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            let userId;
            
            if (!userData) {
                userId = 'user_' + Date.now();
                localStorage.setItem(this.USER_KEY, JSON.stringify({ userId }));
            } else {
                userId = JSON.parse(userData).userId;
            }

            const success = await supabaseService.ensureUser(userId);
            if (!success) {
                throw new Error('Failed to initialize user in database');
            }
            return userId;
        } catch (error) {
            console.error('User initialization failed:', error);
            throw error;
        }
    }

    getCurrentUserId() {
        const userData = localStorage.getItem(this.USER_KEY);
        if (!userData) {
            return null;
        }
        return JSON.parse(userData).userId;
    }
}

export const userService = new UserService();