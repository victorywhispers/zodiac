import { ErrorService } from './Error.service.js';

export class TasksService {
    constructor() {
        this.STORAGE_KEY = 'wormgpt_tasks';
        this.BONUS_STORAGE_KEY = 'wormgpt_bonus_messages';
        this.initializeTasks();
    }

    initializeTasks() {
        const tasks = this.getTasks();
        if (!tasks) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({}));
        }
        
        const bonusMessages = this.getBonusMessages();
        if (bonusMessages === null) {
            localStorage.setItem(this.BONUS_STORAGE_KEY, '0');
        }

        // Check for completed tasks and hide them
        this.hideCompletedTasks();
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
        return parseInt(localStorage.getItem(this.BONUS_STORAGE_KEY) || '0');
    }

    addBonusMessages(count) {
        const current = this.getBonusMessages();
        localStorage.setItem(this.BONUS_STORAGE_KEY, (current + count).toString());
    }

    hideCompletedTasks() {
        const tasks = this.getTasks();
        Object.entries(tasks).forEach(([taskId, task]) => {
            if (task.completed) {
                const taskElement = document.getElementById(taskId);
                if (taskElement) {
                    taskElement.style.display = 'none';
                }
            }
        });
    }

    async completeTask(taskId) {
        const tasks = this.getTasks();
        
        // Check if task is already completed
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
            const taskCard = document.getElementById('task1');
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
                    if (taskCard) {
                        taskCard.style.display = 'none';
                    }
                }, 3000);
            }
            return true;
        }
        return false;
    }
}

export const tasksService = new TasksService();
