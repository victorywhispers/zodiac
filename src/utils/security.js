export class SecurityService {
    static initialize() {
        // Disable console
        this.disableConsole();
        // Prevent dev tools
        this.preventDevTools();
        // Add debugger traps
        this.addDebuggerTraps();
        // Disable right click
        this.disableRightClick();
        // Add source protection
        this.protectSource();
    }

    static disableConsole() {
        window.console = {
            log: function() {},
            info: function() {},
            warn: function() {},
            error: function() {},
            debug: function() {}
        };
    }

    static preventDevTools() {
        // Detect dev tools opening
        let devtools = function() {};
        devtools.toString = function() {
            this.checkDevTools();
            return '[native code]';
        };
        
        setInterval(() => {
            this.checkDevTools();
        }, 1000);
    }

    static checkDevTools() {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            document.body.innerHTML = 'Developer tools detected. Access denied.';
        }
    }

    static addDebuggerTraps() {
        setInterval(() => {
            debugger;
        }, 100);
    }

    static disableRightClick() {
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { // Ctrl+Shift+I
                e.preventDefault();
            }
            if (e.ctrlKey && e.keyCode === 85) { // Ctrl+U
                e.preventDefault();
            }
            if (e.keyCode === 123) { // F12
                e.preventDefault();
            }
        });
    }

    static protectSource() {
        // Make it harder to view source
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && 
                (e.keyCode === 67 || 
                 e.keyCode === 86 || 
                 e.keyCode === 85 || 
                 e.keyCode === 117)) {
                return false;
            }
        });
    }
}