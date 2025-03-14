import { settingsService } from './SettingsService';

class MigrationService {
    async migrateUserSettings() {
        try {
            // Get settings from localStorage
            const localSettings = {
                model: localStorage.getItem('model'),
                maxTokens: parseInt(localStorage.getItem('maxTokens')),
                temperature: parseInt(localStorage.getItem('temperature'))
            };

            // Save to database
            await settingsService.saveSettings(localSettings);

            // Clear localStorage after successful migration
            localStorage.removeItem('model');
            localStorage.removeItem('maxTokens');
            localStorage.removeItem('temperature');

            console.log('Settings successfully migrated to database');
            return true;
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }
}

export const migrationService = new MigrationService();