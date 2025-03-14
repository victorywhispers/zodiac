import { supabaseService } from './SupabaseService';
import { userService } from '../User.service';
import { ErrorService } from '../Error.service.js';

class ChatLimitService {
    async saveLimits(limits) {
        const userId = userService.getCurrentUserId();
        
        try {
            const { data, error } = await supabaseService.client
                .from('chat_limits')
                .upsert({
                    user_id: userId,
                    daily_limit: limits.dailyLimit,
                    monthly_limit: limits.monthlyLimit,
                    current_daily_count: limits.currentDailyCount,
                    current_monthly_count: limits.currentMonthlyCount,
                    last_reset_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to save chat limits:', error);
            throw error;
        }
    }

    async getLimits() {
        const userId = userService.getCurrentUserId();
        
        try {
            const { data, error } = await supabaseService.client
                .from('chat_limits')
                .select('daily_limit, monthly_limit, current_daily_count, current_monthly_count, last_reset_date')
                .match({ user_id: userId })
                .maybeSingle();

            if (error || !data) {
                return this.getDefaultLimits();
            }

            return {
                dailyLimit: data.daily_limit,
                monthlyLimit: data.monthly_limit,
                currentDailyCount: data.current_daily_count,
                currentMonthlyCount: data.current_monthly_count,
                lastResetDate: data.last_reset_date
            };
        } catch (error) {
            console.error('Failed to get chat limits:', error);
            return this.getDefaultLimits();
        }
    }

    async incrementCount() {
        if (!navigator.onLine) {
            ErrorService.handleNetworkError();
            return;
        }

        try {
            const limits = await this.getLimits();
            let bonusMessages = 0;
            
            const { data, error } = await supabaseService.client
                .from('tasks')
                .select('bonus_messages')
                .eq('user_id', userService.getCurrentUserId())
                .single();

            if (error) throw error;
            
            bonusMessages = data?.bonus_messages || 0;

            // If regular limit is reached, use bonus messages
            if (limits.currentDailyCount >= limits.dailyLimit) {
                if (bonusMessages > 0) {
                    // Deduct from bonus messages
                    await supabaseService.client
                        .from('tasks')
                        .update({ 
                            bonus_messages: bonusMessages - 1,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', userService.getCurrentUserId());

                    // Update both displays immediately
                    this.updateBothDisplays(limits.dailyLimit - limits.currentDailyCount, bonusMessages - 1);
                    return limits;
                } else {
                    throw new Error('No more messages available');
                }
            }

            // If within regular limit, increment counters
            limits.currentDailyCount++;
            limits.currentMonthlyCount++;
            await this.saveLimits(limits);
            
            // Update both displays immediately
            this.updateBothDisplays(limits.dailyLimit - limits.currentDailyCount, bonusMessages);
            return limits;
        } catch (error) {
            console.error('Error incrementing count:', error);
            ErrorService.showError('Failed to update message count', 'error');
            throw error;
        }
    }

    // New helper method to update both displays
    updateBothDisplays(regularRemaining, bonusCount) {
        // Update remaining chats display
        const remainingChatsCount = document.querySelector('#remaining-chats-count');
        if (remainingChatsCount) {
            remainingChatsCount.textContent = `${regularRemaining} + ${bonusCount} bonus`;
        }

        // Update bonus messages display
        const bonusMessagesCount = document.getElementById('bonus-messages-count');
        if (bonusMessagesCount) {
            bonusMessagesCount.textContent = `${bonusCount} bonus messages`;
        }
    }

    shouldResetDaily(lastResetDate) {
        const now = new Date();
        const lastReset = new Date(lastResetDate);
        return lastReset.getUTCDate() !== now.getUTCDate();
    }

    shouldResetMonthly(lastResetDate) {
        const now = new Date();
        const lastReset = new Date(lastResetDate);
        return lastReset.getUTCMonth() !== now.getUTCMonth();
    }

    getDefaultLimits() {
        return {
            dailyLimit: 50,
            monthlyLimit: 1000,
            currentDailyCount: 0,
            currentMonthlyCount: 0,
            lastResetDate: new Date().toISOString()
        };
    }

    async isLimitReached() {
        const limits = await this.getLimits();
        let bonusMessages = 0;

        try {
            const { data } = await supabaseService.client
                .from('tasks')
                .select('bonus_messages')
                .eq('user_id', userService.getCurrentUserId())
                .single();
            
            bonusMessages = data?.bonus_messages || 0;
        } catch (error) {
            console.error('Error getting bonus messages:', error);
        }

        // Calculate total available messages
        const totalAvailable = limits.dailyLimit + bonusMessages;
        const usedMessages = limits.currentDailyCount;

        // First use regular limit, then bonus messages
        const usedBonusMessages = Math.max(0, usedMessages - limits.dailyLimit);
        const remainingBonusMessages = Math.max(0, bonusMessages - usedBonusMessages);
        const remainingRegular = Math.max(0, limits.dailyLimit - usedMessages);
        const remainingTotal = remainingRegular + remainingBonusMessages;

        return {
            isDailyLimitReached: usedMessages >= totalAvailable,
            isMonthlyLimitReached: limits.currentMonthlyCount >= limits.monthlyLimit,
            remainingDaily: remainingTotal,
            remainingBonusMessages: remainingBonusMessages,
            remainingMonthly: limits.monthlyLimit - limits.currentMonthlyCount
        };
    }

    async updateDisplay() {
        try {
            const { remainingDaily, remainingBonusMessages } = await this.isLimitReached();
            const remainingChatsCount = document.querySelector('#remaining-chats-count');
            if (remainingChatsCount) {
                const regularLimit = this.getDefaultLimits().dailyLimit;
                remainingChatsCount.textContent = `${remainingDaily} + ${remainingBonusMessages} bonus`;
            }
        } catch (error) {
            console.error('Error updating display:', error);
        }
    }

    async initializeChatLimit() {
        const userId = userService.getCurrentUserId();
        try {
            const { data, error } = await supabaseService.client
                .from('chat_limits')
                .select('*')
                .eq('user_id', userId)  // Use eq instead of match
                .single();

            // If no data exists, create new limits
            if (error || !data) {
                const defaultLimits = this.getDefaultLimits();
                await this.saveLimits(defaultLimits);
                return defaultLimits.dailyLimit;
            }

            // Handle existing data
            const limits = {
                dailyLimit: data.daily_limit,
                monthlyLimit: data.monthly_limit,
                currentDailyCount: data.current_daily_count,
                currentMonthlyCount: data.current_monthly_count,
                lastResetDate: data.last_reset_date
            };

            // Check for resets
            let needsUpdate = false;
            if (this.shouldResetDaily(limits.lastResetDate)) {
                limits.currentDailyCount = 0;
                needsUpdate = true;
            }
            if (this.shouldResetMonthly(limits.lastResetDate)) {
                limits.currentMonthlyCount = 0;
                needsUpdate = true;
            }

            // Update if needed
            if (needsUpdate) {
                await this.saveLimits(limits);
            }

            return limits.dailyLimit - limits.currentDailyCount;
        } catch (error) {
            console.error('Failed to initialize chat limits:', error);
            const defaultLimits = this.getDefaultLimits();
            return defaultLimits.dailyLimit;
        }
    }

    async canSendMessage() {
        const { isDailyLimitReached, isMonthlyLimitReached } = await this.isLimitReached();
        return !isDailyLimitReached && !isMonthlyLimitReached;
    }

    async resetChatLimit() {
        const userId = userService.getCurrentUserId();
        const defaultLimits = this.getDefaultLimits();
        
        try {
            const { error } = await supabaseService.client
                .from('chat_limits')
                .upsert({
                    user_id: userId,
                    daily_limit: defaultLimits.dailyLimit,
                    monthly_limit: defaultLimits.monthlyLimit,
                    current_daily_count: 0,
                    current_monthly_count: 0,
                    last_reset_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) throw error;
            await this.updateDisplay();
        } catch (error) {
            console.error('Failed to reset chat limits:', error);
            throw error;
        }
    }
}

export const chatLimitService = new ChatLimitService();