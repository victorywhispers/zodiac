import * as messageService from "./Message.service";
import * as helpers from "../utils/helpers";
import { db } from './Db.service.js';

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

export async function getAllChatIdentifiers(db) {
    try {
        let identifiers = [];
        await db.chats.orderBy('timestamp').each(
            chat => {
                identifiers.push({ id: chat.id, title: chat.title });
            }
        );
        return identifiers;
    } catch (error) {
        console.error(error);
    }
}

export async function initialize(db) {
    chatHistorySection.innerHTML = "";
    const chats = await getAllChatIdentifiers(db);
    for (let chat of chats) {
        insertChatEntry(chat, db);
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

function insertChatEntry(chat, db) {
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

    // Chat icon
    const chatIcon = document.createElement("span");
    chatIcon.classList.add("material-symbols-outlined");
    chatIcon.textContent = "chat_bubble";

    // Chat label text
    const chatLabelText = document.createElement("span");
    chatLabelText.style.overflow = "hidden";
    chatLabelText.style.textOverflow = "ellipsis";
    chatLabelText.textContent = chat.title;

    // Delete button
    const deleteEntryButton = document.createElement("button");
    deleteEntryButton.classList.add("btn-textual", "material-symbols-outlined");
    deleteEntryButton.textContent = "delete";
    deleteEntryButton.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteChat(chat.id, db);
    });

    // Assemble elements
    chatLabel.append(chatIcon, chatLabelText, deleteEntryButton);
    
    chatRadioButton.addEventListener("change", async () => {
        await loadChat(chat.id, db);
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

export async function deleteChat(id, db) {
    await db.chats.delete(id);
    if (getCurrentChatId() == id) {
        newChat();
    }
    initialize(db);
}

export async function loadChat(chatID, db) {
    try {
        if (!chatID) return;
        messageContainer.innerHTML = "";
        const chat = await getChatById(chatID, db);
        for (const msg of chat.content) {
            await messageService.insertMessage(msg.role, msg.parts[0].text, msg.personality, null, db);
        }
        messageContainer.scrollTo(0, messageContainer.scrollHeight);
    } catch (error) {
        console.error(error);
        alert("Error loading chat. Please try again.");
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