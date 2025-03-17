from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import datetime
import os

app = Flask(__name__)
# Update CORS configuration
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",
            "https://wormgpt-frontend.onrender.com",
            "https://wormgpt-frontend.onrender.com/"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept", "Origin"],
        "supports_credentials": True
    }
})

# Update file path handling
USER_DATA_FILE = os.getenv('USER_DATA_FILE', os.path.join(os.getcwd(), '..', 'user_data.json'))
print(f"Looking for user_data.json at: {USER_DATA_FILE}")

def load_user_data():
    try:
        print(f"\n=== Debug Info ===")
        print(f"Current working directory: {os.getcwd()}")
        print(f"USER_DATA_FILE path: {USER_DATA_FILE}")
        
        if os.path.exists(USER_DATA_FILE):
            try:
                with open(USER_DATA_FILE, 'r') as f:
                    data = json.load(f)
                print(f"Successfully loaded data from: {USER_DATA_FILE}")
                return data
            except Exception as e:
                print(f"Warning: Could not read {USER_DATA_FILE}: {e}")
        
        # Fallback to project root
        root_file = os.path.join(os.getcwd(), '..', 'user_data.json')
        if os.path.exists(root_file):
            try:
                with open(root_file, 'r') as f:
                    data = json.load(f)
                print(f"Successfully loaded data from: {root_file}")
                return data
            except Exception as e:
                print(f"Warning: Could not read {root_file}: {e}")
        
        print("No readable user_data.json found")
        return {}
            
    except Exception as e:
        print(f"Error in load_user_data: {str(e)}")
        return {}

@app.route('/')
def index():
    return jsonify({
        'status': 'alive',
        'message': 'WormGPT API Server is running'
    })

@app.route('/validate-key', methods=['POST'])
def validate_key():
    try:
        data = request.json
        key = data.get('key')
        if not key:
            print("No key provided in request")
            return jsonify({
                'valid': False,
                'message': 'No key provided'
            }), 400

        # Normalize key and add debug logging
        key = key.upper()
        print(f"\nValidation Request:")
        print(f"Input key: {key}")
        print(f"User data file: {USER_DATA_FILE}")
        
        user_data = load_user_data()
        if not user_data:
            print("Warning: user_data.json is empty or not found")
            
        # Print user data structure
        print("\nUser Data Structure:")
        for user_id, info in user_data.items():
            print(f"User {user_id}:")
            print(f"  Key: {info.get('key', 'No key')}")
            print(f"  Expiry: {info.get('expiry_time', 'No expiry')}")

        # Test key handling
        if key == "WR-TEST12345":
            print("Test key validated successfully")
            return jsonify({
                'valid': True,
                'message': 'Test key validated successfully',
                'expiryTime': (datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
            })

        # Check if key exists in any user's data
        for user_id, user_info in user_data.items():
            stored_key = user_info.get('key', '').upper()
            print(f"Comparing input key '{key}' with stored key '{stored_key}'")
            
            if stored_key == key:
                try:
                    expiry_time = datetime.datetime.strptime(
                        user_info['expiry_time'], 
                        "%Y-%m-%d %H:%M:%S"
                    )
                    
                    if datetime.datetime.now() < expiry_time:
                        print(f"Valid key found for user {user_id}")
                        return jsonify({
                            'valid': True,
                            'message': 'Key validated successfully',
                            'expiryTime': user_info['expiry_time']
                        })
                    else:
                        print(f"Key expired for user {user_id}")
                        return jsonify({
                            'valid': False,
                            'message': 'Key has expired'
                        })
                except Exception as e:
                    print(f"Error processing expiry time for user {user_id}: {e}")
                    return jsonify({
                        'valid': False,
                        'message': 'Error validating key expiry'
                    })

        print("No matching key found in user data")
        return jsonify({
            'valid': False,
            'message': 'Invalid key'
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

@app.route('/system-check', methods=['GET'])
def system_check():
    try:
        # Check directory permissions
        data_dir = os.path.dirname(USER_DATA_FILE)
        dir_exists = os.path.exists(data_dir)
        dir_writable = os.access(data_dir, os.W_OK) if dir_exists else False
        dir_readable = os.access(data_dir, os.R_OK) if dir_exists else False
        
        user_data = load_user_data()
        return jsonify({
            'status': 'healthy',
            'file_exists': os.path.exists(USER_DATA_FILE),
            'file_path': USER_DATA_FILE,
            'user_count': len(user_data),
            'readable': os.access(USER_DATA_FILE, os.R_OK),
            'writable': os.access(USER_DATA_FILE, os.W_OK),
            'directory': {
                'path': data_dir,
                'exists': dir_exists,
                'readable': dir_readable,
                'writable': dir_writable,
                'permissions': oct(os.stat(data_dir).st_mode)[-3:] if dir_exists else 'N/A'
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Ensure data directory exists
    os.makedirs(os.path.dirname(USER_DATA_FILE), exist_ok=True)
    
    # Check if we can write to the data directory
    if not os.access(os.path.dirname(USER_DATA_FILE), os.W_OK):
        print(f"Warning: Cannot write to {os.path.dirname(USER_DATA_FILE)}")
    
    app.run(debug=True, port=5000)
