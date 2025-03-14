export class PrivacyPolicy {
    constructor(onBack) {
        this.container = document.createElement('div');
        this.onBack = onBack;
        this.render();
        this.initialize();
    }

    render() {
        this.container.innerHTML = `
            <div class="policy-page">
                <button class="back-button" id="privacyBackBtn">
                    <span class="material-symbols-outlined">arrow_back</span>
                    <span>Back</span>
                </button>
                <div class="policy-content">
                    <div class="policy-header">
                        <span class="material-symbols-outlined">shield</span>
                        <h2>Privacy Policy</h2>
                    </div>
                    <div class="policy-body">
                        <p>At WormGPT, we value your privacy and are committed to protecting your personal information.</p>
                        
                        <h3>Data Collection</h3>
                        <ul>
                            <li>We collect minimal data necessary for service operation</li>
                            <li>We do not store conversations with WormGPT</li>
                            <li>Access keys are used solely for service authentication</li>
                        </ul>

                        <h3>Data Usage</h3>
                        <ul>
                            <li>We do not sell or share your data with third parties</li>
                            <li>We employ industry-standard security measures</li>
                            <li>Your data is used only to provide and improve our services</li>
                        </ul>

                        <h3>Contact</h3>
                        <p>For questions or concerns about your privacy, contact @Mesosig on Telegram.</p>
                    </div>
                </div>
            </div>
        `;
    }

    initialize() {
        const backBtn = this.container.querySelector('#privacyBackBtn');
        backBtn.onclick = () => {
            this.container.remove();
        };
    }
}