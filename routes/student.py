from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Student, TimetableSlot
from utils.helper import success_response, error_response
from . import student_bp

@student_bp.route('/timetable', methods=['GET'])
@jwt_required()
def get_student_timetable():
    current_user = get_jwt_identity()
    
    if current_user['role'] != 'student':
        return error_response('Student access required', 403)
    
    student = Student.query.get(current_user['id'])
    if not student:
        return error_response('Student not found', 404)
    
    timetable_slots = TimetableSlot.query.filter_by(program_id=student.program_id).all()
    
    # Group by day
    timetable = {}
    for slot in timetable_slots:
        if slot.day_of_week not in timetable:
            timetable[slot.day_of_week] = []
        timetable[slot.day_of_week].append(slot.to_dict())
    
    return success_response(timetable)