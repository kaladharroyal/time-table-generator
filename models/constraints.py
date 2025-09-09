from .database import db
from .models import TimetableSlot, FacultyAvailability, GlobalUnavailableSlot, Room, Program

def check_hard_constraints(program_id, subject_id, faculty_id, room_id, day, time_slot):
    """
    Check if a proposed assignment violates any hard constraints
    Returns (is_valid, error_message)
    """
    # 1. Check if faculty is available at this time
    availability = FacultyAvailability.query.filter_by(
        faculty_id=faculty_id, day_of_week=day, time_slot=time_slot
    ).first()
    
    if availability and not availability.is_available:
        return False, "Faculty is not available at this time"
    
    # 2. Check if time slot is globally unavailable
    global_unavailable = GlobalUnavailableSlot.query.filter_by(
        day_of_week=day, time_slot=time_slot
    ).first()
    
    if global_unavailable:
        return False, f"Time slot globally unavailable: {global_unavailable.reason}"
    
    # 3. Check for faculty double booking
    faculty_conflict = TimetableSlot.query.filter_by(
        faculty_id=faculty_id, day_of_week=day, time_slot=time_slot
    ).first()
    
    if faculty_conflict:
        return False, "Faculty already assigned to another class at this time"
    
    # 4. Check for room double booking
    room_conflict = TimetableSlot.query.filter_by(
        room_id=room_id, day_of_week=day, time_slot=time_slot
    ).first()
    
    if room_conflict:
        return False, "Room already occupied at this time"
    
    # 5. Check for student group double booking
    program_conflict = TimetableSlot.query.filter_by(
        program_id=program_id, day_of_week=day, time_slot=time_slot
    ).first()
    
    if program_conflict:
        return False, "Student group already has a class at this time"
    
    # 6. Check room capacity
    program = Program.query.get(program_id)
    room = Room.query.get(room_id)
    
    if program and room and program.strength > room.capacity:
        return False, f"Room capacity ({room.capacity}) exceeded by program strength ({program.strength})"
    
    return True, "All hard constraints satisfied"

def evaluate_soft_constraints(timetable_slots):
    """
    Evaluate soft constraints and return a quality score (higher is better)
    """
    score = 100  # Start with perfect score
    
    # Implement soft constraint checks here
    # For example: faculty preferences, time preferences, etc.
    
    return score