import { createClient } from '@supabase/supabase-js';
import { DATABASE_CONFIG } from './config';

class SupabaseService {
    constructor() {
        this.client = createClient(
            DATABASE_CONFIG.SUPABASE.url,
            DATABASE_CONFIG.SUPABASE.apiKey
        );
    }

    async ensureUser(userId) {
        if (!userId || typeof userId !== 'string') {
            console.error('Invalid userId:', userId);
            return false;
        }

        try {
            const { data: existingUser, error: searchError } = await this.client
                .from('users')
                .select('user_id')
                .eq('user_id', userId)
                .single();

            if (!searchError && existingUser) {
                return true;
            }

            const { error: insertError } = await this.client
                .from('users')
                .insert({
                    user_id: userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error inserting user:', insertError);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error ensuring user:', error);
            return false;
        }
    }

    async storeChat(chatData) {
        try {
            // Ensure user exists first
            const userExists = await this.ensureUser(chatData.user_id);
            if (!userExists) {
                console.error('Failed to ensure user exists');
                return null;
            }
            
            const { data, error } = await this.client
                .from('chats')
                .insert({
                    user_id: chatData.user_id,
                    message: chatData.message,
                    timestamp: chatData.timestamp,
                    metadata: chatData.metadata || {}
                })
                .select()
                .single();
            
            if (error) {
                console.error('Supabase error:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Failed to store chat:', error);
            return null;
        }
    }

    async getChatHistory(userId, limit = 50) {
        try {
            const { data, error } = await this.client
                .from('chats')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Supabase error:', error);
                return [];
            }
            return data;
        } catch (error) {
            console.error('Failed to get chat history:', error);
            return [];
        }
    }

    async validateKey(key) {
        try {
            const { data, error } = await this.client
                .from('keys')
                .select()
                .eq('key', key)
                .single();

            if (error || !data) return false;
            
            const expiryTime = new Date(data.expiry_time);
            return new Date() < expiryTime;
        } catch (error) {
            console.error('Failed to validate key:', error);
            return false;
        }
    }

    async saveKey(userId, key, expiryTime) {
        try {
            const { data, error } = await this.client
                .from('keys')
                .insert({
                    user_id: userId,
                    key: key,
                    expiry_time: expiryTime
                });
            
            return !error;
        } catch (error) {
            console.error('Failed to save key:', error);
            return false;
        }
    }
}

export const supabaseService = new SupabaseService();