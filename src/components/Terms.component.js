export class TermsAndConditions {
    constructor(onBack) {
        this.container = document.createElement('div');
        this.onBack = onBack;
        this.render();
        this.initialize();
    }

    render() {
        this.container.innerHTML = `
            <div class="policy-page">
                <button class="back-button" id="termsBackBtn">
                    <span class="material-symbols-outlined">arrow_back</span>
                    <span>Back</span>
                </button>
                <div class="policy-content">
                    <div class="policy-header">
                        <span class="material-symbols-outlined">description</span>
                        <h2>Terms of Service</h2>
                    </div>
                    <div class="policy-body">
                        <p>By using WormGPT, you agree to these terms and conditions.</p>
                        
                        <h3>Usage Terms</h3>
                        <ul>
                            <li>Access keys are non-transferable</li>
                            <li>You are responsible for maintaining key confidentiality</li>
                            <li>Service access may be terminated for violations</li>
                        </ul>

                        <h3>Restrictions</h3>
                        <ul>
                            <li>Do not attempt to bypass security measures</li>
                            <li>Do not use the service for illegal activities</li>
                            <li>Do not share or resell access keys</li>
                        </ul>

                        <h3>Updates</h3>
                        <p>Terms may be updated without notice. Continued use constitutes acceptance.</p>
                    </div>
                </div>
            </div>
        `;
    }

    initialize() {
        const backBtn = this.container.querySelector('#termsBackBtn');
        backBtn.onclick = () => {
            this.container.remove();
        };
    }
}