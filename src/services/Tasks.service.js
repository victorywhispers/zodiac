export class TasksService {
    constructor() {
        this.STORAGE_KEY = 'wormgpt_tasks';
        this.BONUS_STORAGE_KEY = 'wormgpt_bonus_messages';
        this.initializeTasks();
    }

    getTasks() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    initializeTasks() {
        const tasks = this.getTasks();
        if (!tasks) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({}));
        }
        
        // Hide completed tasks on initialization
        const completedTasks = Object.keys(tasks).filter(taskId => tasks[taskId].completed);
        completedTasks.forEach(taskId => {
            const taskElement = document.getElementById(taskId);
            if (taskElement) {
                taskElement.style.display = 'none';
            }
        });
    }

    async startTask(taskId) {
        const tasks = this.getTasks();
        if (tasks[taskId] && tasks[taskId].completed) {
            // If task is already completed, hide it
            const taskElement = document.getElementById(taskId);
            if (taskElement) {
                taskElement.style.display = 'none';
            }
            return false;
        }

        // Rest of the startTask logic remains same
        // ...existing code...
    }

    completeTask(taskId) {
        const tasks = this.getTasks();
        tasks[taskId] = {
            completed: true,
            completedAt: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));

        // Hide the task immediately
        const taskElement = document.getElementById(taskId);
        if (taskElement) {
            taskElement.style.display = 'none';
        }

        // Add bonus messages
        if (taskId === 'task1') {
            this.addBonusMessages(20);
        }
    }

    getBonusMessages() {
        try {
            return parseInt(localStorage.getItem(this.BONUS_STORAGE_KEY)) || 0;
        } catch {
            return 0;
        }
    }

    addBonusMessages(count) {
        const currentBonus = this.getBonusMessages();
        localStorage.setItem(this.BONUS_STORAGE_KEY, currentBonus + count);
    }
}

export const tasksService = new TasksService();