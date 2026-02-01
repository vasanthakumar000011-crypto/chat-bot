from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import google.generativeai as genai
from datetime import datetime
import os
from config import Config
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure Gemini using the key from your .env file 
# Ensure GEMINI_API_KEY is set in your .env 
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize chat history
chat_sessions = {}

class ChatBot:
    def __init__(self):
        # Updated to the 1.5-flash model to resolve the 404 error
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.features = {
            'name': 'Vasanth AI v2.0',
            'max_context': 10
        }
        
    def process_message(self, user_message, session_id, history=None):
        try:
            # Generate response using the model
            response = self.model.generate_content(
                user_message,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 1024,
                }
            )
            
            return {
                'success': True,
                'response': self.format_response(response.text),
                'timestamp': datetime.now().isoformat(),
                'session_id': session_id
            }
            
        except Exception as e:
            logger.error(f"API Error: {str(e)}")
            return {'success': False, 'error': f"Connection error: {str(e)}"}
    
    def format_response(self, text):
        # Clean up formatting for the frontend
        return text.replace('**', '<strong>').replace('**', '</strong>').replace('`', '<code>').replace('`', '</code>')

chatbot = ChatBot()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'success': False, 'error': 'Empty message'})
        
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []
        
        # Process message
        result = chatbot.process_message(message, session_id)
        
        if result['success']:
            chat_sessions[session_id].append({
                'user': message,
                'ai': result['response'],
                'time': result['timestamp']
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/stats')
def get_stats():
    return jsonify({
        'sessions': len(chat_sessions),
        'total_messages': sum(len(s) for s in chat_sessions.values()),
        'model': chatbot.features['name'],
        'status': 'Online'
    })

if __name__ == '__main__':
    # Use standard Flask-SocketIO run method
    socketio.run(app, debug=True, port=5000)