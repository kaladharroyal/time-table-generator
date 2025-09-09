from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Faculty, Student, Program, Subject, Room, Department, ProgramSubjects, FacultySubjects
from utils.helper import success_response, error_response, validate_required_fields
from . import admin_bp

def admin_required(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user = get_jwt_identity()
        if current_user['role'] != 'admin':
            return error_response('Admin access required', 403)
        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper

# Faculty Management
@admin_bp.route('/faculty', methods=['GET'])
@admin_required
def get_faculty():
    faculty_list = Faculty.query.all()
    return success_response([f.to_dict() for f in faculty_list])

@admin_bp.route('/faculty', methods=['POST'])
@admin_required
def create_faculty():
    try:
        data = request.get_json()
        required = ['username', 'password', 'first_name', 'last_name', 'email']
        missing = validate_required_fields(data, required)
        
        if missing:
            return error_response(f'Missing fields: {", ".join(missing)}', 400)
        
        # Create user
        user = User(username=data['username'], role='faculty')
        user.set_password(data['password'])
        
        # Create faculty
        faculty = Faculty(
            id=user.id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            department_id=data.get('department_id'),
            max_hours_per_week=data.get('max_hours_per_week', 20)
        )
        
        User.session.add(user)
        User.session.add(faculty)
        User.session.commit()
        
        return success_response(faculty.to_dict(), 'Faculty created successfully', 201)
    
    except Exception as e:
        User.session.rollback()
        return error_response('Failed to create faculty', 500, str(e))

# Similar endpoints for students, programs, subjects, rooms, departments...
# Due to length, I'll show one example each category

@admin_bp.route('/students', methods=['GET'])
@admin_required
def get_students():
    students = Student.query.all()
    return success_response([s.to_dict() for s in students])

@admin_bp.route('/programs', methods=['GET'])
@admin_required
def get_programs():
    programs = Program.query.all()
    return success_response([p.to_dict() for p in programs])

@admin_bp.route('/subjects', methods=['GET'])
@admin_required
def get_subjects():
    subjects = Subject.query.all()
    return success_response([s.to_dict() for s in subjects])

@admin_bp.route('/rooms', methods=['GET'])
@admin_required
def get_rooms():
    rooms = Room.query.all()
    return success_response([r.to_dict() for r in rooms])