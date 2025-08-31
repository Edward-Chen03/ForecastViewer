from flask import Blueprint, request, jsonify
from utils.user import validate_email, get_user_by_email, create_user

authFunctions = Blueprint('auth', __name__, url_prefix='/auth')

@authFunctions.route('/login', methods=['POST'])
def auth_login():
    try:
        data = request.json
        email = data.get('email')
        
        is_valid, error_message = validate_email(email)
        if not is_valid:
            return jsonify({'status': 'error', 'message': error_message})
        
        existing_user = get_user_by_email(email)
        
        if existing_user:
            user_data = existing_user
            user_status = 'existing'
            message = f'Welcome back!'
        else:
            user_data = create_user(email)
            user_status = 'new'
            message = f'Welcome! Your account has been created.'
        
        return jsonify({
            'status': 'success',
            'email': email,
            'user_id': user_data['id'],
            'user_status': user_status,
            'message': message
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})