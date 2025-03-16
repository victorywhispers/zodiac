import * as personalityService from "./services/Personality.service";
import * as settingsService from "./services/Settings.service";
import * as overlayService from './services/Overlay.service';
import * as helpers from "./utils/helpers";
import { tasksService } from './services/Tasks.service.js';
import { VerificationPage } from './components/VerificationPage.component.js';
import { keyValidationService } from './services/KeyValidationService.js';
import { db, setupDB } from './services/Db.service.js';
import * as chatsService from './services/Chats.service.js';
import { ErrorService } from './services/Error.service.js';

//load all component code
const components = import.meta.glob('./components/*.js');
for (const path in components) {
    components[path]();
}

// Add network status check with auto-refresh
window.addEventListener('online', () => {
    ErrorService.handleNetworkRestore();
});

window.addEventListener('offline', () => {
    ErrorService.handleNetworkError();
});

// Initialize services and check storage first
async function initialize() {
    try {
        // Initialize local database first
        try {
            await setupDB();
        } catch (error) {
            ErrorService.handleDatabaseError();
            return;
        }
        
        // Verify key in local storage
        try {
            const isKeyValid = await keyValidationService.isKeyValid();
            if (!isKeyValid) {
                const verificationPage = new VerificationPage();
                document.body.appendChild(verificationPage.container);
                return;
            }
        } catch (error) {
            ErrorService.showError('Key validation failed. Please try again.', 'error');
            return;
        }

        // Initialize local services
        try {
            await chatsService.initialize();
            await personalityService.initialize();
            initializeEventListeners();
        } catch (error) {
            ErrorService.showError('Failed to initialize services. Please refresh.', 'error');
        }
    } catch (error) {
        console.error('Initialization failed:', error);
        ErrorService.showError('Application failed to start. Please refresh.', 'error');
    }
}

function initializeEventListeners() {
    // Initialize chat buttons
    chatsService.initializeChatButtons();
    
    const hideOverlayButton = document.querySelector("#btn-hide-overlay");
    if (hideOverlayButton) {
        hideOverlayButton.addEventListener("click", () => overlayService.closeOverlay());
    }

    const addPersonalityButton = document.querySelector("#btn-add-personality");
    if (addPersonalityButton) {
        addPersonalityButton.addEventListener("click", () => overlayService.showAddPersonalityForm());
    }

    const newChatButton = document.querySelector("#btn-new-chat");
    if (newChatButton) {
        newChatButton.addEventListener("click", () => {
            if (!chatsService.getCurrentChatId()) {
                return;
            }
            chatsService.newChat();
        });
    }

    const deleteAllChatsButton = document.querySelector("#btn-reset-chat");
    if (deleteAllChatsButton) {
        deleteAllChatsButton.addEventListener("click", () => {
            chatsService.deleteAllChats();
        });
    }

    const clearAllButton = document.querySelector("#btn-clearall-personality");
    if (clearAllButton) {
        clearAllButton.addEventListener("click", () => {
            personalityService.removeAll();
        });
    }

    const importPersonalityButton = document.querySelector("#btn-import-personality");
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
                    // Fix: Change taskService to tasksService
                    tasksService.completeTask('task1');
                    
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


