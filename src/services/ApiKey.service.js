// src/services/ApiKey.service.js
export class ApiKeyService {
    constructor() {
        this.baseUrl = 'https://your-backend-url.com/api';
    }

    async generateKey() {
        try {
            const response = await fetch(`${this.baseUrl}/generate-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate API key');
            }

            const data = await response.json();
            return data.apiKey;
        } catch (error) {
            console.error('Error generating API key:', error);
            throw error;
        }
    }

    async validateKey(apiKey) {
        try {
            const response = await fetch(`${this.baseUrl}/validate-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey })
            });

            return response.ok;
        } catch (error) {
            console.error('Error validating API key:', error);
            return false;
        }
    }
}
