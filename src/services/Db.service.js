import { Dexie } from 'dexie';
import * as personalityService from './Personality.service';
import * as chatService from './Chats.service';

class ChatDatabase extends Dexie {
    constructor() {
        super('chatDB');
        
        this.version(4).stores({
            chats: '++id, title, timestamp, content',
            personalities: '++id, name, image, prompt, aggressiveness, sensuality, internetEnabled, roleplayEnabled, toneExamples'
        });
    }
}

export const db = new ChatDatabase();

export async function setupDB() {
    try {
        await db.open();
        await migratePersonalities();
        await migrateChats();
        return db;
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

async function migratePersonalities() {
    const personalities = JSON.parse(localStorage.getItem('personalities')) || [];
    if (personalities.length > 0) {
        await db.personalities.bulkPut(personalities);
        localStorage.removeItem('personalities');
    }
}

async function migrateChats() {
    const chats = await db.chats.toArray();
    if (chats.length > 0) {
        await db.chats.bulkPut(chats.map(chat => {
            if (chat.content) {
                chat.content = chat.content.map(message => {
                    if (!message.parts) {
                        message.parts = [{ text: message.txt }];
                        delete message.txt;
                    }
                    return message;
                });
            }
            return chat;
        }));
    }
}