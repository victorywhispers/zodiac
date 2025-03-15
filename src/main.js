import * as personalityService from "./services/Personality.service";
import * as settingsService from "./services/Settings.service";
import * as overlayService from './services/Overlay.service';
import * as helpers from "./utils/helpers";
import { tasksService } from './services/Tasks.service.js';
import { VerificationPage } from './components/VerificationPage.component.js';
import { keyValidationService } from './services/KeyValidationService.js';
import { db } from './services/Db.service.js';
import * as chatsService from './services/Chats.service.js';

//load all component code
const components = import.meta.glob('./components/*.js');
for (const path in components) {
    components[path]();
}

// Initialize services and check key validation first
async function initialize() {
    try {
        // Check key validation before loading anything else
        if (!keyValidationService.isKeyValid()) {
            const verificationPage = new VerificationPage();
            document.body.appendChild(verificationPage.container);
            return;
        }

        // Only load these if key is valid
        await settingsService.loadSettings();
        await chatsService.initialize(db);
        await personalityService.initialize();

        initializeErrorHandling();
        initializeNetworkHandling();
        initializeEventListeners();

    } catch (error) {
        console.error('Initialization error:', error);
        showErrorToast('Error initializing application');
    }
}

function initializeErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
        showErrorToast('An error occurred: ' + event.error.message);
        event.preventDefault();
    });

    window.addEventListener('unhandledrejection', (event) => {
        showErrorToast('An error occurred: ' + event.reason);
    });
}

function initializeNetworkHandling() {
    let isReconnecting = false;
    let connectionStatus = document.createElement('div');
    connectionStatus.className = 'connection-status online'; // Set default to online
    document.body.appendChild(connectionStatus);

    function updateConnectionStatus(online) {
        connectionStatus.className = `connection-status ${online ? 'online' : 'offline'}`;
        connectionStatus.innerHTML = online ? 
            '🌐 Connected' : 
            '📡 Offline - Reconnecting...';
    }

    // Only check when actually offline
    window.addEventListener('offline', () => {
        updateConnectionStatus(false);
        showErrorToast('No internet connection. Please check your connection.');
    });

    window.addEventListener('online', () => {
        updateConnectionStatus(true);
        showSuccessToast('Connection restored!');
    });

    // Remove the periodic ping check
    // setInterval(...) removed
}

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
        <span class="material-symbols-outlined">error</span>
        <span>${message}</span>
    `;
    showToast(toast);
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
        <span class="material-symbols-outlined">check_circle</span>
        <span>${message}</span>
    `;
    showToast(toast);
}

function showToast(toast) {
    const container = document.querySelector('.toast-container') || createToastContainer();
    
    // Remove existing toasts of the same type
    const existingToasts = container.querySelectorAll(`.${toast.classList[1]}`);
    existingToasts.forEach(existingToast => {
        existingToast.remove();
    });
    
    container.appendChild(toast);
    
    // Force a reflow before adding the fade-out class
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function initializeEventListeners() {
    // Initialize chat buttons
    chatsService.initializeChatButtons();
    
    const hideOverlayButton = document.querySelector("#btn-hide-overlay");
    const addPersonalityButton = document.querySelector("#btn-add-personality");
    const newChatButton = document.querySelector("#btn-new-chat");
    const deleteAllChatsButton = document.querySelector("#btn-reset-chat");
    const clearAllButton = document.querySelector("#btn-clearall-personality");
    const importPersonalityButton = document.querySelector("#btn-import-personality");

    // Add event listeners only if elements exist
    if (hideOverlayButton) {
        hideOverlayButton.addEventListener("click", () => overlayService.closeOverlay());
    }

    if (addPersonalityButton) {
        addPersonalityButton.addEventListener("click", () => overlayService.showAddPersonalityForm());
    }

    if (newChatButton) {
        newChatButton.addEventListener("click", () => {
            if (!chatsService.getCurrentChatId()) {
                return;
            }
            chatsService.newChat();
        });
    }

    if (deleteAllChatsButton) {
        deleteAllChatsButton.addEventListener("click", () => {
            chatsService.deleteAllChats();
        });
    }

    if (clearAllButton) {
        clearAllButton.addEventListener("click", () => {
            personalityService.removeAll();
        });
    }

    if (importPersonalityButton) {
        importPersonalityButton.addEventListener("click", () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = function (e) {
                    const personality = JSON.parse(e.target.result);
                    personalityService.add(personality);
                };
                reader.readAsText(file);
            });
            fileInput.click();
            fileInput.remove();
        });
    }

    window.addEventListener("resize", () => {
        //show sidebar if window is resized to desktop size
        if (window.innerWidth > 1032) {
            const sidebarElement = document.querySelector(".sidebar");
            //to prevent running showElement more than necessary
            if (sidebarElement.style.opacity == 0) {
                helpers.showElement(sidebarElement, false);
            }
        }
    });

    // Initialize tasks when bot link is clicked
    const taskButton = document.getElementById('task1-button');
    if (taskButton) {
        taskButton.addEventListener('click', async () => {
            // Show feedback that task has started
            const timerContainer = document.querySelector('.task-timer');
            const timerElement = document.getElementById('task1-timer');
            
            // Hide button and show timer
            taskButton.classList.add('hidden');
            timerContainer.classList.remove('hidden');
            
            let timeLeft = 120;
            const timer = setInterval(() => {
                timeLeft--;
                if (timerElement) {
                    timerElement.textContent = timeLeft;
                }
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    // Complete task and add bonus messages
                    taskService.completeTask('task1');
                    
                    // Show success message
                    const taskContent = document.querySelector('#task1 .task-content');
                    if (taskContent) {
                        taskContent.innerHTML = `
                            <div class="task-success">
                                <span class="material-symbols-outlined">check_circle</span>
                                Task completed! 20 bonus messages added to your account
                            </div>
                        `;
                    }
                    
                    // Hide task after 3 seconds
                    setTimeout(() => {
                        const taskCard = document.getElementById('task1');
                        if (taskCard) {
                            taskCard.classList.add('completed');
                        }
                    }, 3000);
                }
            }, 1000);
        });
    }

    // New Chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', async () => {
            await chatsService.createNewChat();
        });
    }

    // Clear All button
    const clearChatsBtn = document.getElementById('clearChatsBtn');
    if (clearChatsBtn) {
        clearChatsBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete all chats? This action cannot be undone.')) {
                await chatsService.clearAllChats(db);
            }
        });
    }
}

// Start initialization
initialize();


