import { Dexie } from 'dexie';
import * as personalityService from './Personality.service';
import * as chatService from './Chats.service';

let db = null;

export async function setupDB() {
    if (db) return db;
    
    try {
        db = new Dexie("chatDB");
        db.version(3).stores({
            chats: `++id, title, timestamp, content`
        });
        db.version(4).stores({
            personalities: `++id, name, image, prompt, aggressiveness, sensuality, internetEnabled, roleplayEnabled, toneExamples`
        });
        await migratePersonalities(db);
        await migrateChats(db);
        return db;
    } catch (error) {
        console.error("Failed to setup database:", error);
        throw error;
    }
}

export { db };

// Initialize DB when module loads
setupDB().then(database => {
    db = database;
}).catch(error => {
    console.error("Failed to initialize database:", error);
});

async function migratePersonalities(db) {
    const personalities = JSON.parse(localStorage.getItem('personalities')) || [];
    if (!personalities) return;
    await db.personalities.bulkPut(personalities);
    localStorage.removeItem('personalities');
}

async function migrateChats(db) {
    const chats = await chatService.getAllChats(db);
    if (!chats) return;
    //convert chats.message.txt to chats.message.parts[0].text
    await db.chats.bulkPut([...chats].map(chat => {
        for (const message of chat.content) {
            if (!message.parts) {
                message.parts = [{ text: message.txt }]
            }
            delete message.txt;
        }
        return chat;
    }));
}
