from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import datetime
import os
import string
import random
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Update path to be relative to the script location
BASE_DIR = Path(__file__).parent.parent
USER_DATA_FILE = BASE_DIR / "user_data.json"

def load_user_data():
    if USER_DATA_FILE.exists():
        with open(USER_DATA_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def generate_key():
    return "WR-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

def get_expiry_time(days=1):
    return (datetime.datetime.now() + datetime.timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")

# Add root route
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'status': 'running',
        'version': '1.0.0',
        'endpoints': [
            '/health',
            '/api/validate-key',
            '/api/generate-key'
        ]
    })

@app.route('/api/validate-key', methods=['POST'])
def validate_key():
    try:
        data = request.json
        key = data.get('key')
        if not key:
            return jsonify({
                'valid': False,
                'message': 'No key provided'
            }), 400

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
                        'message': 'Error processing key'
                    }), 500

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

@app.route('/api/generate-key', methods=['POST'])
def generate_trial_key():
    try:
        data = request.json
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID required'
            }), 400

        user_data = load_user_data()
        
        # Initialize user if not exists
        if str(user_id) not in user_data:
            user_data[str(user_id)] = {
                "verified": True,
                "total_keys_generated": 0
            }

        # Generate new key
        key = generate_key()
        expiry_time = get_expiry_time()
        
        user_data[str(user_id)].update({
            "key": key,
            "expiry_time": expiry_time,
            "total_keys_generated": user_data[str(user_id)].get("total_keys_generated", 0) + 1
        })

        # Save to file
        with open(USER_DATA_FILE, 'w') as f:
            json.dump(user_data, f)

        return jsonify({
            'success': True,
            'key': key,
            'expiryTime': expiry_time
        })

    except Exception as e:
        print(f"Error generating key: {e}")
        return jsonify({
            'success': False,
            'message': 'Error generating key'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'alive'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
