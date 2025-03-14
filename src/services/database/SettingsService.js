import { supabaseService } from './SupabaseService';
import { userService } from '../User.service';

class SettingsService {
    async saveSettings(settings) {
        const userId = userService.getCurrentUserId();
        
        try {
            const { data, error } = await supabaseService.client
                .from('user_settings')
                .upsert({
                    user_id: userId,
                    model: settings.model,
                    max_tokens: settings.maxTokens,
                    temperature: settings.temperature,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    }

    async getSettings() {
        const userId = userService.getCurrentUserId();
        
        try {
            const { data, error } = await supabaseService.client
                .from('user_settings')
                .select('model, max_tokens, temperature')
                .eq('user_id', userId)
                .single();

            if (error) {
                return this.getDefaultSettings();
            }

            return {
                model: data.model,
                maxTokens: data.max_tokens,
                temperature: data.temperature
            };
        } catch (error) {
            console.error('Failed to get settings:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            model: "gemini-2.0-flash",
            maxTokens: 100000,
            temperature: 80
        };
    }
}

export const settingsService = new SettingsService();