import * as messageService from '../services/Message.service';
import * as dbService from '../services/Db.service';
import * as helpers from '../utils/helpers';
import { chatLimitService } from '../services/database/ChatLimitService.js';
import { keyValidationService } from '../services/KeyValidationService.js';

const messageInput = document.querySelector("#messageInput");
const sendMessageButton = document.querySelector("#btn-send");

export class ChatInput {
    constructor() {
        this.form = document.querySelector("#message-box");
        this.messageInput = document.querySelector("#messageInput");
        this.sendButton = document.querySelector("#btn-send");
        this.remainingChatsElement = document.querySelector("#remaining-chats-count");
        
        // Initialize the component
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize chat limits asynchronously
            this.remainingChats = await chatLimitService.initializeChatLimit();
            this.updateRemainingChatsDisplay();
            this.checkKeyValidity();
            this.init();
        } catch (error) {
            console.error('Failed to initialize chat input:', error);
            this.remainingChats = 0;
            this.updateRemainingChatsDisplay();
        }
    }

    checkKeyValidity() {
        if (!keyValidationService.isKeyValid()) {
            this.messageInput.setAttribute('disabled', 'true');
            this.sendButton.setAttribute('disabled', 'true');
            this.messageInput.innerHTML = 'Please activate your access key to start chatting';
        }
    }

    updateRemainingChatsDisplay() {
        this.remainingChatsElement.textContent = `${this.remainingChats} chats remaining`;
        
        if (this.remainingChats <= 2) {
            this.remainingChatsElement.classList.add('warning');
        } else {
            this.remainingChatsElement.classList.remove('warning');
        }
    }

    async handleSubmit() {
        if (!keyValidationService.isKeyValid()) {
            this.showCustomAlert('Please activate your access key to start chatting');
            return;
        }

        try {
            const canSend = await chatLimitService.canSendMessage();
            if (!canSend) {
                this.showCustomAlert();
                return;
            }

            const message = helpers.getEncoded(this.messageInput.innerHTML);
            // Check if message is empty or contains only whitespace
            if (!message || !message.trim()) {
                return;
            }

            this.messageInput.innerHTML = "";
            await messageService.send(message, dbService.db);

            const limits = await chatLimitService.getLimits();
            this.remainingChats = limits.dailyLimit - limits.currentDailyCount;
            this.updateRemainingChatsDisplay();
        } catch (error) {
            console.error('Error sending message:', error);
            this.showCustomAlert('Error sending message. Please try again.');
        }
    }

    showCustomAlert(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'custom-alert';
        alertDiv.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5a/Wormgpt.svg" alt="WormGPT">
            <h3>Chat Limit Reached</h3>
            <p>${message || 'You have exhausted your daily chat limit. Please try again tomorrow.'}</p>
            <button onclick="this.parentElement.remove()">Got it</button>
        `;
        document.body.appendChild(alertDiv);
    }

    init() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        this.sendButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    }
}

// Initialize the chat input
const chatInput = new ChatInput();