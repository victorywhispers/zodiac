import { tasksService } from '../services/Tasks.service.js';

export class TasksComponent {
    constructor() {
        this.initialize();
    }

    async initialize() {
        const taskButton = document.getElementById('task1-button');
        if (!taskButton) return;

        await this.updateBonusDisplay();

        taskButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            window.open('https://t.me/Get_Chatgpt2Bot?start=7903500450', '_blank');

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
                    await tasksService.completeTask('task1');
                    await this.updateBonusDisplay();
                    
                    const taskContent = document.querySelector('#task1 .task-content');
                    if (taskContent) {
                        taskContent.innerHTML = `
                            <div class="task-success">
                                <span class="material-symbols-outlined">check_circle</span>
                                Task completed! 20 bonus messages added to your account
                            </div>
                        `;
                    }
                }
            }, 1000);
        });
    }

    async updateBonusDisplay() {
        const bonusElement = document.getElementById('bonus-messages-count');
        if (bonusElement) {
            const currentBonus = await tasksService.getBonusMessages();
            bonusElement.textContent = `${currentBonus} bonus messages`;
        }
    }
}

// Initialize Tasks Component
new TasksComponent();