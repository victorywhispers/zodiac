import weaviate from 'weaviate-ts-client';
import { DATABASE_CONFIG } from './config';
import { userService } from '../User.service.js';

class WeaviateService {
    constructor() {
        this.client = weaviate.client({
            scheme: 'http',
            host: 'localhost:5173/weaviate',
            headers: {
                'Authorization': `Bearer ${DATABASE_CONFIG.WEAVIATE.apiKey}`
            }
        });
        this.className = 'ChatMessage';
        this.initialize();
    }

    async initialize() {
        try {
            // Check if schema exists first
            const schema = await this.client.schema.getter().do();
            const classExists = schema.classes?.some(c => c.class === this.className);

            if (!classExists) {
                // Only create schema if it doesn't exist
                await this.client.schema
                    .classCreator()
                    .withClass({
                        class: this.className,
                        vectorizer: 'none',
                        properties: [
                            {
                                name: 'text',
                                dataType: ['text'],
                            },
                            {
                                name: 'userId',
                                dataType: ['string'],
                            },
                            {
                                name: 'timestamp',
                                dataType: ['int'],
                            }
                        ],
                    })
                    .do();
                console.log('Weaviate schema created successfully');
            } else {
                console.log('Weaviate schema already exists');
            }
        } catch (error) {
            console.error('Weaviate initialization error:', error);
        }
    }

    async storeMessage(message, embedding) {
        try {
            const response = await this.client.data
                .creator()
                .withClassName(this.className)
                .withVector(embedding)
                .withProperties({
                    text: message,
                    userId: userService.getCurrentUserId(),
                    timestamp: Date.now()
                })
                .do();

            console.log('Message stored in Weaviate:', response);
            return response;
        } catch (error) {
            console.error('Weaviate storage error:', error);
            return null;
        }
    }

    async querySimilarMessages(embedding, limit = 5) {
        try {
            const result = await this.client.graphql
                .get()
                .withClassName(this.className)
                .withFields(['text', 'timestamp'])
                .withNearVector({
                    vector: embedding,
                    certainty: 0.7
                })
                .withLimit(limit)
                .do();

            return result.data.Get[this.className] || [];
        } catch (error) {
            console.error('Weaviate query error:', error);
            return [];
        }
    }
}

export const weaviateService = new WeaviateService();