from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.algorithm import TimetableGenerator
from utils.helpers import success_response, error_response
from . import generate_bp

@generate_bp.route('/<int:program_id>', methods=['POST'])
@jwt_required()
def generate_timetable(program_id):
    current_user = get_jwt_identity()
    
    if current_user['role'] != 'admin':
        return error_response('Admin access required', 403)
    
    try:
        generator = TimetableGenerator(program_id)
        success, message = generator.generate()
        
        if success:
            return success_response(message=message)
        else:
            return error_response(message, 400)
    
    except Exception as e:
        return error_response('Timetable generation failed', 500, str(e))