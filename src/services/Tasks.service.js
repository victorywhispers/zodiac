import { ErrorService } from './Error.service.js';

export class TasksService {
    constructor() {
        this.STORAGE_KEY = 'tasks';
        this.BONUS_STORAGE_KEY = 'bonusMessages';
    }

    getTasks() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    isTaskCompleted(taskId) {
        const tasks = this.getTasks();
        return tasks[taskId]?.completed || false;
    }

    getBonusMessages() {
        const bonus = localStorage.getItem(this.BONUS_STORAGE_KEY);
        return parseInt(bonus || '0', 10);
    }

    addBonusMessages(count) {
        const current = this.getBonusMessages();
        const newTotal = current + count;
        localStorage.setItem(this.BONUS_STORAGE_KEY, newTotal.toString());
        
        // Update display immediately
        const bonusElement = document.getElementById('bonus-messages-count');
        if (bonusElement) {
            bonusElement.textContent = `${newTotal} bonus messages`;
        }
        return newTotal;
    }

    async completeTask(taskId) {
        const tasks = this.getTasks();
        if (tasks[taskId]?.completed) {
            return false;
        }

        tasks[taskId] = {
            completed: true,
            completedAt: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));

        // Add bonus messages for task1
        if (taskId === 'task1') {
            this.addBonusMessages(20);
            const taskCard = document.getElementById(taskId);
            if (taskCard) {
                const taskContent = taskCard.querySelector('.task-content');
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
                    taskCard.style.display = 'none';
                }, 3000);
            }
            return true;
        }
        return false;
    }
}

export const tasksService = new TasksService();
