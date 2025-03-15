from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import datetime
import os

app = Flask(__name__)
CORS(app)

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

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'alive'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)