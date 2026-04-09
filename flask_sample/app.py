from flask import Flask, render_template, request, jsonify, session
from datetime import datetime
import hashlib
import re
import json
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-in-production'

# JSON file to store users
USERS_FILE = 'users.json'

def load_users():
    """Load users from JSON file"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    return {}

def save_users(users):
    """Save users to JSON file"""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """Validate username (3-20 chars, alphanumeric and underscore)"""
    pattern = r'^[a-zA-Z0-9_]{3,20}$'
    return re.match(pattern, username) is not None

def check_password_strength(password):
    """Check password strength"""
    score = 0
    if len(password) >= 8:
        score += 1
    if re.search(r'[a-z]', password):
        score += 1
    if re.search(r'[A-Z]', password):
        score += 1
    if re.search(r'[0-9]', password):
        score += 1
    if re.search(r'[$@#&!]', password):
        score += 1
    
    if score >= 4:
        return (score, "Strong password", "#00ff00")
    elif score >= 2:
        return (score, "Medium password", "#ffaa00")
    else:
        return (score, "Weak password", "#ff4444")

@app.route('/')
def home():
    """Serve the registration page"""
    return render_template('register.html')

@app.route('/api/check-password-strength', methods=['POST'])
def check_password_strength_api():
    """API endpoint to check password strength"""
    data = request.json
    password = data.get('password', '')
    score, message, color = check_password_strength(password)
    
    return jsonify({
        'score': score,
        'message': message,
        'color': color,
        'width': f"{score * 20}%"
    })

@app.route('/api/check-email', methods=['POST'])
def check_email():
    """Check if email already exists in JSON file"""
    data = request.json
    email = data.get('email', '')
    
    users = load_users()
    exists = email in users
    
    return jsonify({'exists': exists})

@app.route('/api/register', methods=['POST'])
def register():
    """Handle registration with JSON file storage"""
    try:
        data = request.json
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirmPassword', '')
        
        # Validation
        if not validate_username(username):
            return jsonify({
                'success': False,
                'message': 'Username must be 3-20 characters (letters, numbers, underscore)'
            }), 400
        
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Please enter a valid email address'
            }), 400
        
        password_score, _, _ = check_password_strength(password)
        if password_score < 3:
            return jsonify({
                'success': False,
                'message': 'Please use a stronger password'
            }), 400
        
        if password != confirm_password:
            return jsonify({
                'success': False,
                'message': 'Passwords do not match'
            }), 400
        
        # Load existing users
        users = load_users()
        
        # Check if email already exists
        if email in users:
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 400
        
        # Create user data
        users[email] = {
            'username': username,
            'email': email,
            'password': hash_password(password),
            'created_at': datetime.now().isoformat(),
            'is_active': True
        }
        
        # Save to JSON file
        save_users(users)
        
        # Store in session
        session['user_email'] = email
        session['username'] = username
        
        return jsonify({
            'success': True,
            'message': 'Registration successful!'
        })
    
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Registration failed. Please try again.'
        }), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """API endpoint to get all users (for admin purposes)"""
    users = load_users()
    
    # Remove passwords from the response for security
    safe_users = []
    for email, user_data in users.items():
        safe_users.append({
            'username': user_data.get('username'),
            'email': email,
            'created_at': user_data.get('created_at'),
            'is_active': user_data.get('is_active')
        })
    
    return jsonify({'users': safe_users})

@app.route('/api/user/<email>', methods=['GET'])
def get_user(email):
    """Get specific user by email"""
    users = load_users()
    
    if email in users:
        user_data = users[email].copy()
        del user_data['password']  # Remove password for security
        return jsonify(user_data)
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/api/delete-user/<email>', methods=['DELETE'])
def delete_user(email):
    """Delete a user (admin feature)"""
    users = load_users()
    
    if email in users:
        del users[email]
        save_users(users)
        return jsonify({'success': True, 'message': 'User deleted successfully'})
    else:
        return jsonify({'success': False, 'message': 'User not found'}), 404

if __name__ == '__main__':
    # Initialize empty users.json if it doesn't exist
    if not os.path.exists(USERS_FILE):
        save_users({})
        print("✅ Created new users.json file")
    
    print("🚀 Starting Registration App with JSON File Storage...")
    print("📍 Visit: http://localhost:5000")
    print(f"📁 Data stored in: {USERS_FILE}")
    app.run(debug=True, host='0.0.0.0', port=5000)