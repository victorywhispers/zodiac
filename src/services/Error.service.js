export class ErrorService {
    static async showError(message, type = 'error') {
        const errorContainer = document.createElement('div');
        errorContainer.className = `error-toast ${type}`;
        errorContainer.innerHTML = `
            <span class="material-symbols-outlined">${type === 'error' ? 'error' : 'warning'}</span>
            <span class="error-message">${message}</span>
        `;

        document.body.appendChild(errorContainer);
        
        setTimeout(() => {
            errorContainer.classList.add('show');
        }, 100);

        setTimeout(() => {
            errorContainer.classList.remove('show');
            setTimeout(() => errorContainer.remove(), 300);
        }, 5000);
    }

    static async handleNetworkError() {
        // Show the error message
        this.showError('No internet connection. Please check your network.', 'warning');
        
        // Disable the message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.setAttribute('contenteditable', 'false');
            messageInput.style.opacity = '0.5';
        }
    }

    static async handleNetworkRestore() {
        this.showError('Connection restored! Refreshing...', 'warning');
        
        // Re-enable the message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.setAttribute('contenteditable', 'true');
            messageInput.style.opacity = '1';
        }

        // Wait a moment then reload the page
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
}