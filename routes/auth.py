from flask import request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User
from utils.helper import success_response, error_response
from . import auth_bp

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            return error_response('Username and password required', 400)
        
        user = User.query.filter_by(username=data['username']).first()
        if not user or not user.check_password(data['password']):
            return error_response('Invalid credentials', 401)
        
        # Create access token
        access_token = create_access_token(identity={
            'id': user.id,
            'username': user.username,
            'role': user.role
        })
        
        user_data = user.to_dict()
        if user.role == 'faculty' and user.faculty:
            user_data.update(user.faculty.to_dict())
        elif user.role == 'student' and user.student:
            user_data.update(user.student.to_dict())
        
        return success_response({
            'access_token': access_token,
            'user': user_data
        })
    
    except Exception as e:
        return error_response('Login failed', 500, str(e))

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user:
        return error_response('User not found', 404)
    
    user_data = user.to_dict()
    if user.role == 'faculty' and user.faculty:
        user_data.update(user.faculty.to_dict())
    elif user.role == 'student' and user.student:
        user_data.update(user.student.to_dict())
    
    return success_response(user_data)