import { tasksService } from '../services/Tasks.service.js';

export class TasksComponent {
    constructor() {
        this.tasksService = tasksService;
    }

    async initialize() {
        const taskButton = document.getElementById('task1-button');
        if (!taskButton) return;

        // Check if task is already completed
        if (this.tasksService.isTaskCompleted('task1')) {
            const taskCard = document.getElementById('task1');
            if (taskCard) {
                taskCard.style.display = 'none';
            }
            return;
        }

        await this.updateBonusDisplay();

        taskButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Open bot link in new tab and remove onclick="return false"
            const botUrl = 'https://t.me/Get_Chatgpt2Bot?start=7903500450';
            window.open(botUrl, '_blank').focus();

            const timerContainer = document.querySelector('.task-timer');
            const timerElement = document.getElementById('task1-timer');
            
            taskButton.classList.add('hidden');
            timerContainer.classList.remove('hidden');
            
            let timeLeft = 120;
            const timer = setInterval(async () => {
                timeLeft--;
                if (timerElement) {
                    timerElement.textContent = timeLeft;
                }
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    // Complete task and update bonus messages
                    await this.tasksService.completeTask('task1');
                    await this.updateBonusDisplay();
                }
            }, 1000);
        });
    }

    async updateBonusDisplay() {
        const bonusElement = document.getElementById('bonus-messages-count');
        if (bonusElement) {
            const currentBonus = await this.tasksService.getBonusMessages();
            bonusElement.textContent = `${currentBonus} bonus messages`;
        }
    }
}

// Initialize Tasks Component
new TasksComponent();
