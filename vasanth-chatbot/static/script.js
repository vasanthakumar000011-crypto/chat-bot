// Chat Application JavaScript
let currentSession = 'session_' + Date.now();
let socket = io();
let isTyping = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    setInterval(updateTime, 60000); // Update time every minute
    loadStats();
    
    // Socket connection
    socket.on('connect', function() {
        console.log('Connected to WebSocket');
        updateConnectionStatus(true);
    });
    
    socket.on('disconnect', function() {
        updateConnectionStatus(false);
    });
    
    socket.on('response', function(data) {
        hideTyping();
        if (data.success) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('Error: ' + data.error, 'bot');
        }
        updateStats();
    });
    
    // Auto-resize textarea
    const textarea = document.getElementById('message-input');
    textarea.addEventListener('input', autoResize);
});

// Update current time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const dateString = now.toLocaleDateString();
    document.getElementById('current-time').textContent = `${dateString} ${timeString}`;
}

// Update connection status
function updateConnectionStatus(connected) {
    const indicator = document.querySelector('.status-dot');
    const statusText = document.querySelector('.model-info .status-dot');
    
    if (connected) {
        indicator.classList.add('active');
        if (statusText) statusText.classList.add('active');
    } else {
        indicator.classList.remove('active');
        if (statusText) statusText.classList.remove('active');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        document.getElementById('total-sessions').textContent = data.sessions;
        document.getElementById('total-messages').textContent = data.total_messages;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    autoResize({ target: input });
    
    // Show typing indicator
    showTyping();
    
    try {
        // Send via REST API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: currentSession,
                message: message
            })
        });
        
        const data = await response.json();
        
        hideTyping();
        
        if (data.success) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('Error: ' + data.error, 'bot');
        }
        
        updateStats();
        
    } catch (error) {
        hideTyping();
        addMessage('Connection error. Please try again.', 'bot');
        console.error('Error:', error);
    }
}

// Add message to chat
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    
    // Hide welcome screen on first message
    if (welcomeScreen && welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
        </div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Show typing indicator
function showTyping() {
    const indicator = document.getElementById('typing-indicator');
    indicator.style.display = 'flex';
    scrollToBottom();
}

// Hide typing indicator
function hideTyping() {
    const indicator = document.getElementById('typing-indicator');
    indicator.style.display = 'none';
}

// Auto-resize textarea
function autoResize(e) {
    const textarea = e.target || document.getElementById('message-input');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// Handle key press
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('chat-container');
    container.scrollTop = container.scrollHeight;
}

// Quick question buttons
function quickQuestion(question) {
    document.getElementById('message-input').value = question;
    sendMessage();
}

// Clear chat
async function clearChat() {
    if (confirm('Clear all messages in this chat?')) {
        try {
            await fetch('/api/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: currentSession
                })
            });
            
            document.getElementById('messages').innerHTML = '';
            document.getElementById('welcome-screen').style.display = 'flex';
            
        } catch (error) {
            console.error('Error clearing chat:', error);
        }
    }
}

// New chat
function newChat() {
    currentSession = 'session_' + Date.now();
    document.getElementById('messages').innerHTML = '';
    document.getElementById('welcome-screen').style.display = 'flex';
    updateStats();
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
}

// Update stats
async function updateStats() {
    await loadStats();
}

// Show settings
function showSettings() {
    alert('Settings feature coming soon!');
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
}

// Initialize theme
loadTheme();
