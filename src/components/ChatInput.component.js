import * as messageService from '../services/Message.service';
import * as dbService from '../services/Db.service';
import * as helpers from '../utils/helpers';
import { chatLimitService } from '../services/ChatLimitService.js';
import { keyValidationService } from '../services/KeyValidationService.js';

const messageInput = document.querySelector("#messageInput");
const sendMessageButton = document.querySelector("#btn-send");

export class ChatInput {
    constructor() {
        this.form = document.querySelector("#message-box");
        this.messageInput = document.querySelector("#messageInput");
        this.sendButton = document.querySelector("#btn-send");
        this.remainingChatsElement = document.querySelector("#remaining-chats-count");
        this.remainingChats = chatLimitService.initializeChatLimit();
        this.updateRemainingChatsDisplay();
        this.checkKeyValidity();
        this.init();
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
        const sendButton = document.querySelector("#btn-send");
        
        if (sendButton.classList.contains('processing')) {
            return; // Prevent multiple submissions
        }

        if (!keyValidationService.isKeyValid()) {
            this.showCustomAlert('Please activate your access key to start chatting');
            return;
        }

        if (!chatLimitService.canSendMessage()) {
            this.showCustomAlert();
            return;
        }

        const message = helpers.getEncoded(this.messageInput.innerHTML);
        // Check if message is empty or contains only whitespace
        if (!message || !message.trim()) {
            return;
        }

        // Show processing state
        sendButton.classList.add('processing');
        sendButton.innerHTML = '<span class="material-symbols-outlined">sync</span>';

        try {
            this.messageInput.innerHTML = "";
            await messageService.send(message, dbService.db);

            this.remainingChats = chatLimitService.decrementChat();
            this.updateRemainingChatsDisplay();
        } finally {
            // Reset button state
            sendButton.classList.remove('processing');
            sendButton.innerHTML = '<span class="material-symbols-outlined">send</span>';
        }
    }

    // Replace the handleRetry method with:
    async handleRetry() {
        const retryBtn = document.querySelector('.retry-button');
        if (!retryBtn) return;
        
        try {
            retryBtn.disabled = true;
            retryBtn.classList.add('loading');
            
            // Get the last message from the chat history
            const lastMessage = await dbService.db.messages
                .orderBy('timestamp')
                .last();
                
            if (lastMessage) {
                await messageService.send(lastMessage.content, dbService.db);
            }
            
        } catch (error) {
            console.error('Retry failed:', error);
            this.showCustomAlert('Failed to retry message. Please try again.');
        } finally {
            retryBtn.disabled = false;
            retryBtn.classList.remove('loading');
        }
    }

    // Update the logo style in showCustomAlert method:
    showCustomAlert(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'custom-alert';
        alertDiv.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5a/Wormgpt.svg" 
                 alt="WormGPT"
                 style="filter: brightness(0) saturate(100%) invert(21%) sepia(100%) saturate(7414%) hue-rotate(359deg) brightness(94%) contrast(117%);">
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
