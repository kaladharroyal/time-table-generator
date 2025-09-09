from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Faculty, TimetableSlot, FacultyAvailability
from utils.helpers import success_response, error_response
from . import faculty_bp

@faculty_bp.route('/timetable', methods=['GET'])
@jwt_required()
def get_faculty_timetable():
    current_user = get_jwt_identity()
    
    if current_user['role'] != 'faculty':
        return error_response('Faculty access required', 403)
    
    faculty_id = current_user['id']
    timetable_slots = TimetableSlot.query.filter_by(faculty_id=faculty_id).all()
    
    # Group by day
    timetable = {}
    for slot in timetable_slots:
        if slot.day_of_week not in timetable:
            timetable[slot.day_of_week] = []
        timetable[slot.day_of_week].append(slot.to_dict())
    
    return success_response(timetable)

@faculty_bp.route('/availability', methods=['POST'])
@jwt_required()
def set_availability():
    current_user = get_jwt_identity()
    
    if current_user['role'] != 'faculty':
        return error_response('Faculty access required', 403)
    
    try:
        data = request.get_json()
        faculty_id = current_user['id']
        
        # Clear existing availability
        FacultyAvailability.query.filter_by(faculty_id=faculty_id).delete()
        
        # Add new availability
        for availability in data.get('availability', []):
            avail = FacultyAvailability(
                faculty_id=faculty_id,
                day_of_week=availability['day_of_week'],
                time_slot=availability['time_slot'],
                is_available=availability['is_available']
            )
            FacultyAvailability.session.add(avail)
        
        FacultyAvailability.session.commit()
        return success_response(message='Availability updated successfully')
    
    except Exception as e:
        FacultyAvailability.session.rollback()
        return error_response('Failed to update availability', 500, str(e))