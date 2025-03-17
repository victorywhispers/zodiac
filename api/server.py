from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import datetime
import os
import redis
from functools import wraps
import ssl

app = Flask(__name__)
CORS(app)

# Security middleware
def security_headers(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = f(*args, **kwargs)
        response.headers['Content-Security-Policy'] = """
            default-src 'self';
            connect-src 'self' https://*.googleapis.com https://generativelanguage.googleapis.com;
            script-src 'self' 'unsafe-inline';
            img-src 'self' data: https://upload.wikimedia.org https://64.media.tumblr.com;
            style-src 'self' 'unsafe-inline';
        """
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response
    return decorated_function

# Get the absolute path to user_data.json from Telegram bot
USER_DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'user_data.json')

def load_user_data():
    try:
        if not os.path.exists(USER_DATA_FILE):
            return {}
        with open(USER_DATA_FILE, 'r') as f:
            data = json.load(f)
            return data
    except Exception as e:
        print(f"Error loading user data: {e}")
        return {}

redis_client = redis.Redis(
    host='redis-18791.c264.ap-south-1-1.ec2.redns.redis-cloud.com',
    port=18791,
    password='sdzY9dRrY7VblRNqnq0AxSmyehdj1Trq'
)

@app.route('/validate-key', methods=['POST'])
def validate_key():
    try:
        data = request.json
        key = data.get('key')
        if not key:
            return jsonify({
                'valid': False,
                'message': 'No key provided'
            }), 400

        print(f"Validating key: {key}")
        user_data = load_user_data()

        # Check if key exists in any user's data
        for user_info in user_data.values():
            if user_info.get('key') == key:
                try:
                    expiry_time = datetime.datetime.strptime(
                        user_info['expiry_time'], 
                        "%Y-%m-%d %H:%M:%S"
                    )
                    
                    if datetime.datetime.now() < expiry_time:
                        return jsonify({
                            'valid': True,
                            'message': 'Key validated successfully',
                            'expiryTime': user_info['expiry_time']
                        })
                except Exception as e:
                    print(f"Error processing key validation: {e}")

        return jsonify({
            'valid': False,
            'message': 'Invalid or expired key'
        })

    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({
            'valid': False,
            'message': f'Server error occurred: {str(e)}'
        }), 500

@app.route('/api/redis/recent-messages', methods=['GET', 'POST'])
def handle_recent_messages():
    if request.method == 'POST':
        data = request.json
        chat_id = data['chatId']
        message = data['message']
        key = f'recent_messages:{chat_id}'
        redis_client.lpush(key, json.dumps(message))
        redis_client.ltrim(key, 0, 9)  # Keep only last 10 messages
        return jsonify({'status': 'success'})
    else:
        chat_id = request.args.get('chatId')
        key = f'recent_messages:{chat_id}'
        messages = redis_client.lrange(key, 0, -1)
        return jsonify([json.loads(m) for m in messages])

@app.route('/api/validate-settings', methods=['POST'])
@security_headers
def validate_settings():
    # Handle settings validation here
    pass

@app.route('/api/process-message', methods=['POST']) 
@security_headers
def process_message():
    # Handle message processing here
    pass

@app.route('/api/check-limits', methods=['POST'])
def check_limits():
    try:
        data = request.get_json()
        user_id = data.get('userId')
        
        # Add your limit checking logic here
        return jsonify({
            'isDailyLimitReached': False,
            'isMonthlyLimitReached': False,
            'remainingDaily': 50,
            'remainingMonthly': 1000
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'alive'})

if __name__ == '__main__':
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain('ssl/localhost.crt', 'ssl/localhost.key')
    
    app.run(
        host='0.0.0.0',
        port=5000,
        ssl_context=ssl_context,
        debug=False  # Set to False for production
    )
