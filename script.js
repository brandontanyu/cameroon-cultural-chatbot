// script.js
class CulturalChatbot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.cultureSelect = document.getElementById('cultureSelect');
        this.currentCulture = document.getElementById('currentCulture');
        this.culturalInfo = document.getElementById('culturalInfo');
        this.typingIndicator = document.getElementById('typingIndicator');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.cultureSelect.addEventListener('change', (e) => {
            this.updateCulturalInfo(e.target.value);
        });
    }

    updateCulturalInfo(culture) {
        const cultures = {
            'bamileke': 'Bamileke (Medumba)',
            'bassa': 'Bassa',
            'bakweri': 'Bakweri (Mokpwe)',
            'fulani': 'Fulani (Fulfulde)',
            '': 'General Cameroonian'
        };
        this.currentCulture.textContent = cultures[culture] || 'General Cameroonian';
    }

    addMessage(text, isUser = false, translation = '') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageDiv.textContent = text;

        if (translation && !isUser) {
            const translationDiv = document.createElement('div');
            translationDiv.className = 'translation';
            translationDiv.innerHTML = `<strong>Local Translation:</strong><br>${translation}`;
            messageDiv.appendChild(translationDiv);
        }

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, true);
        this.userInput.value = '';

        // Show typing indicator
        this.typingIndicator.style.display = 'block';

        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    selectedCulture: this.cultureSelect.value
                })
            });

            const data = await response.json();
            
            // Hide typing indicator
            this.typingIndicator.style.display = 'none';
            
            // Add AI response with translation
            this.addMessage(data.response, false, data.translation);
            
            // Update cultural info
            this.currentCulture.textContent = data.detectedCulture;
            
        } catch (error) {
            this.typingIndicator.style.display = 'none';
            this.addMessage('Sorry, I encountered an error while researching cultural traditions. Please try again.', false);
        }
    }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CulturalChatbot();
});
