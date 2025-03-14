import { supabaseService } from './database/SupabaseService';
import { userService } from './User.service';
import { ErrorService } from './Error.service.js';

export class TasksService {
    constructor() {
        this.initializeTasks();
    }

    async initializeTasks() {
        const userId = await userService.getCurrentUserId();
        if (!userId) return;

        const { data } = await supabaseService.client
            .from('tasks')
            .select('task_id, completed, bonus_messages')
            .eq('user_id', userId)
            .single();

        if (data?.completed) {
            // Hide task if already completed
            const taskCard = document.getElementById('task1');
            if (taskCard) {
                taskCard.classList.add('completed');
                taskCard.style.display = 'none';
            }
        }

        if (!data || data.length === 0) {
            // Initialize default task state
            await supabaseService.client
                .from('tasks')
                .insert({
                    user_id: userId,
                    task_id: 'task1',
                    completed: false,
                    bonus_messages: 0
                });
        }
    }

    async getTasks() {
        const userId = await userService.getCurrentUserId();
        const { data } = await supabaseService.client
            .from('tasks')
            .select('*')
            .eq('user_id', userId);
            
        return data || [];
    }

    async getBonusMessages() {
        const userId = await userService.getCurrentUserId();
        const { data } = await supabaseService.client
            .from('tasks')
            .select('bonus_messages')
            .eq('user_id', userId)
            .single();
            
        return data?.bonus_messages || 0;
    }

    async addBonusMessages(count) {
        const userId = await userService.getCurrentUserId();
        const currentBonus = await this.getBonusMessages();
        
        await supabaseService.client
            .from('tasks')
            .update({ 
                bonus_messages: currentBonus + count,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
    }

    async startTask(taskId) {
        const tasks = await this.getTasks();
        if (tasks.some(task => task.task_id === taskId && task.completed)) return false;

        if (taskId === 'task1') {
            // Start 2-minute timer
            await new Promise(resolve => {
                const timerElement = document.getElementById('task1-timer');
                const timerContainer = document.querySelector('.task-timer');
                const taskButton = document.getElementById('task1-button');
                
                taskButton.classList.add('hidden');
                timerContainer.classList.remove('hidden');
                
                let timeLeft = 120;
                const timer = setInterval(() => {
                    timeLeft--;
                    timerElement.textContent = timeLeft;
                    
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        this.completeTask('task1');
                        resolve();
                    }
                }, 1000);
            });
        }
    }

    async completeTask(taskId) {
        if (!navigator.onLine) {
            ErrorService.handleNetworkError();
            return;
        }

        const userId = await userService.getCurrentUserId();
        
        try {
            const { data, error } = await supabaseService.client
                .from('tasks')
                .update({
                    completed: true,
                    completed_at: new Date().toISOString(),
                    bonus_messages: taskId === 'task1' ? 20 : 0
                })
                .eq('user_id', userId)
                .eq('task_id', taskId);

            if (error) throw error;

            // Update chat limits display after adding bonus messages
            const chatLimitService = (await import('./database/ChatLimitService.js')).chatLimitService;
            await chatLimitService.updateDisplay();

            if (taskId === 'task1') {
                const taskCard = document.getElementById('task1');
                if (taskCard) {
                    taskCard.classList.add('completed');
                    setTimeout(() => {
                        taskCard.style.display = 'none';
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Error completing task:', error);
            ErrorService.showError('Failed to complete task. Please try again.', 'error');
        }
    }
}

export const tasksService = new TasksService();