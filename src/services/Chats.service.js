import * as messageService from "./Message.service";
import * as helpers from "../utils/helpers";
import { db, setupDB } from './Db.service.js'; // Add setupDB import

const messageContainer = document.querySelector(".message-container");
const chatHistorySection = document.querySelector("#chatHistorySection");
const sidebar = document.querySelector(".sidebar");

export function getCurrentChatId() {
    const currentChatElement = document.querySelector("input[name='currentChat']:checked");
    if (currentChatElement) {
        return parseInt(currentChatElement.value.replace("chat", ""), 10);
    }
    return null;
}

export async function getAllChatIdentifiers() {
    try {
        if (!db?.chats) {
            console.error('Database not ready');
            return [];
        }

        const chats = await db.chats.orderBy('timestamp').toArray();
        return chats.map(chat => ({
            id: chat.id,
            title: chat.title
        }));
    } catch (error) {
        console.error('Error getting chat identifiers:', error);
        return [];
    }
}

export async function initialize() {
    try {
        // Ensure DB is initialized
        await db.open();
        
        chatHistorySection.innerHTML = "";
        const chats = await getAllChatIdentifiers();
        
        if (Array.isArray(chats)) {
            for (let chat of chats) {
                insertChatEntry(chat);
            }
        } else {
            console.error('Invalid chats data:', chats);
        }
    } catch (error) {
        console.error('Error initializing chats:', error);
        throw error;
    }
}

// Single newChat function
export function newChat() {
    messageContainer.innerHTML = "";
    const currentSelected = document.querySelector("input[name='currentChat']:checked");
    if (currentSelected) {
        currentSelected.checked = false;
    }
    // Select none radio
    const noneRadio = document.querySelector("input[value='none']");
    if (noneRadio) {
        noneRadio.checked = true;
    }
}

// Single deleteAllChats function
export async function deleteAllChats() {
    try {
        await db.chats.clear();
        initialize(db);
        messageContainer.innerHTML = "";
        // Select none radio after clearing
        const noneRadio = document.querySelector("input[value='none']");
        if (noneRadio) {
            noneRadio.checked = true;
        }
    } catch (error) {
        console.error("Error clearing chats:", error);
        alert("Error clearing chats. Please try again.");
    }
}

function insertChatEntry(chat) {
    // Add radio button for chat selection
    const chatRadioButton = document.createElement("input");
    chatRadioButton.setAttribute("type", "radio");
    chatRadioButton.setAttribute("name", "currentChat");
    chatRadioButton.setAttribute("value", "chat" + chat.id);
    chatRadioButton.id = "chat" + chat.id;
    chatRadioButton.classList.add("input-radio-currentchat");

    // Create label
    const chatLabel = document.createElement("label");
    chatLabel.setAttribute("for", "chat" + chat.id);
    chatLabel.classList.add("title-chat", "label-currentchat");

    // Chat icon and text
    const chatIcon = document.createElement("span");
    chatIcon.classList.add("material-symbols-outlined");
    chatIcon.textContent = "chat_bubble";

    const chatLabelText = document.createElement("span");
    chatLabelText.style.overflow = "hidden";
    chatLabelText.style.textOverflow = "ellipsis";
    chatLabelText.textContent = chat.title;

    // Delete button
    const deleteEntryButton = document.createElement("button");
    deleteEntryButton.classList.add("btn-textual", "material-symbols-outlined");
    deleteEntryButton.textContent = "delete";
    deleteEntryButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        await deleteChat(chat.id);
    });

    // Assemble elements
    chatLabel.append(chatIcon, chatLabelText, deleteEntryButton);
    
    chatRadioButton.addEventListener("change", async () => {
        await loadChat(chat.id);
        if (window.innerWidth < 1032) {
            helpers.hideElement(sidebar);
        }
    });

    chatHistorySection.prepend(chatRadioButton, chatLabel);
}

export async function addChat(title, firstMessage = null, db) {
    const id = await db.chats.put({
        title: title,
        timestamp: Date.now(),
        content: firstMessage ? [{ role: "user", parts: [{ text: firstMessage }] }] : []
    });
    insertChatEntry({ title, id }, db);
    console.log("chat added with id: ", id);
    return id;
}

export async function getCurrentChat(db) {
    const id = getCurrentChatId();
    if (!id) {
        return null;
    }
    return (await getChatById(id, db));
}

export async function deleteChat(id) {
    try {
        await db.chats.delete(id);
        if (getCurrentChatId() == id) {
            newChat();
        }
        await initialize(); // This will refresh the chat list
    } catch (error) {
        console.error('Error deleting chat:', error);
        throw error;
    }
}

export async function loadChat(chatID, db) {
    try {
        // Wait for DB to be ready
        if (!db) {
            db = await setupDB();
        }

        if (!chatID || !db?.chats) {
            console.error('Invalid chat ID or database not initialized');
            return;
        }

        messageContainer.innerHTML = "";
        const chat = await getChatById(chatID, db);
        
        if (chat?.content) {
            for (const msg of chat.content) {
                await messageService.insertMessage(
                    msg.role, 
                    msg.parts[0].text, 
                    msg.personality, 
                    null, 
                    db
                );
            }
            messageContainer.scrollTo(0, messageContainer.scrollHeight);
        }
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

export async function getAllChats(db) {
    const chats = await db.chats.orderBy('timestamp').toArray();
    return chats.reverse(); // Latest chat at top
}

export async function getChatById(id, db) {
    return await db.chats.get(id);
}

// Initialize chat buttons
export function initializeChatButtons() {
    const newChatButton = document.querySelector("#btn-new-chat");
    if (newChatButton) {
        newChatButton.addEventListener("click", () => {
            if (!getCurrentChatId()) return;
            newChat();
        });
    }

    const deleteAllChatsButton = document.querySelector("#btn-reset-chat");
    if (deleteAllChatsButton) {
        deleteAllChatsButton.addEventListener("click", () => {
            deleteAllChats(); // Remove confirmation dialog
        });
    }
}