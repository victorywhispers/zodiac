import { tasksService } from '../services/Tasks.service.js';

export class TasksComponent {
    constructor() {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initialize();
        });
    }

    initialize() {
        const taskButton = document.getElementById('task1-button');
        if (!taskButton) return;

        taskButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Update bot link
            window.open('https://t.me/LuckyDrawMasterBot/app?startapp=Y2g9a1FqOXh2SFI3RyZnPXNwJmw9a1FqOXh2SFI3RyZzbz1TaGFyZSZ1PTc5MDM1MDA0NTA=', '_blank');

            // Hide button immediately
            taskButton.classList.add('hidden');
            
            // Complete task after delay without showing timer
            setTimeout(() => {
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
                
                // Hide task after delay
                setTimeout(() => {
                    const taskCard = document.getElementById('task1');
                    if (taskCard) {
                        taskCard.classList.add('completed');
                    }
                }, 3000);
            }, 5000); // Reduced from 120s to 5s for better UX
        });

        // Initialize bonus messages display on load
        const bonusElement = document.getElementById('bonus-messages-count');
        if (bonusElement) {
            const currentBonus = tasksService.getBonusMessages();
            bonusElement.textContent = `${currentBonus} bonus messages`;
        }
    }
}

// Initialize Tasks Component
new TasksComponent();
