import random
from models import (
    Program, Subject, Faculty, Room, FacultyAvailability, 
    GlobalUnavailableSlot, ProgramSubjects, FacultySubjects,
    TimetableSlot, db
)
from models.constraints import check_hard_constraints
from config import Config

class TimetableGenerator:
    def __init__(self, program_id):
        self.program_id = program_id
        self.program = Program.query.get(program_id)
        self.subjects = self._get_program_subjects()
        self.faculty_list = Faculty.query.all()
        self.rooms = Room.query.all()
        self.timetable = [[None for _ in range(Config.TIMETABLE_SLOTS_PER_DAY)] 
                         for _ in range(Config.TIMETABLE_DAYS)]
    
    def _get_program_subjects(self):
        program_subjects = ProgramSubjects.query.filter_by(program_id=self.program_id).all()
        return [ps.subject for ps in program_subjects]
    
    def generate(self):
        """Generate timetable using a CSP-like approach"""
        attempts = 0
        
        while attempts < Config.MAX_GENERATION_ATTEMPTS:
            try:
                # Clear existing timetable for this program
                TimetableSlot.query.filter_by(program_id=self.program_id).delete()
                db.session.commit()
                
                # Schedule each subject
                for subject in self.subjects:
                    program_subject = ProgramSubjects.query.filter_by(
                        program_id=self.program_id, subject_id=subject.id
                    ).first()
                    
                    if program_subject:
                        self._schedule_subject(subject, program_subject.hours_per_week)
                
                # If we reach here, generation was successful
                return True, "Timetable generated successfully"
                
            except Exception as e:
                attempts += 1
                db.session.rollback()
                if attempts >= Config.MAX_GENERATION_ATTEMPTS:
                    return False, f"Failed to generate timetable after {attempts} attempts: {str(e)}"
        
        return False, "Unexpected error in timetable generation"
    
    def _schedule_subject(self, subject, required_hours):
        """Schedule a single subject"""
        hours_scheduled = 0
        available_faculty = [fs.faculty for fs in FacultySubjects.query.filter_by(subject_id=subject.id).all()]
        
        if not available_faculty:
            raise ValueError(f"No faculty available to teach {subject.code}")
        
        # Try to schedule each hour
        while hours_scheduled < required_hours:
            slot_found = False
            
            # Try different days and time slots
            for day in range(Config.TIMETABLE_DAYS):
                for time_slot in range(Config.TIMETABLE_SLOTS_PER_DAY):
                    if self.timetable[day][time_slot] is None:
                        # Try different faculty and rooms
                        random.shuffle(available_faculty)
                        random.shuffle(self.rooms)
                        
                        for faculty in available_faculty:
                            for room in self.rooms:
                                if self._is_valid_assignment(subject, faculty, room, day, time_slot):
                                    # Create the timetable slot
                                    timetable_slot = TimetableSlot(
                                        program_id=self.program_id,
                                        subject_id=subject.id,
                                        faculty_id=faculty.id,
                                        room_id=room.id,
                                        day_of_week=day,
                                        time_slot=time_slot
                                    )
                                    
                                    db.session.add(timetable_slot)
                                    self.timetable[day][time_slot] = timetable_slot
                                    hours_scheduled += 1
                                    slot_found = True
                                    break
                            
                            if slot_found:
                                break
                        
                        if slot_found:
                            break
                
                if slot_found:
                    break
            
            if not slot_found:
                raise ValueError(f"Cannot find valid slot for {subject.code}")
        
        db.session.commit()
    
    def _is_valid_assignment(self, subject, faculty, room, day, time_slot):
        """Check if an assignment is valid"""
        # Check hard constraints
        is_valid, message = check_hard_constraints(
            self.program_id, subject.id, faculty.id, room.id, day, time_slot
        )
        
        if not is_valid:
            return False
        
        # Check subject-room compatibility
        if subject.required_room_type != 'any' and subject.required_room_type != room.room_type:
            return False
        
        # Check room features if required
        if subject.required_features and room.features:
            for feature, value in subject.required_features.items():
                if room.features.get(feature) != value:
                    return False
        
        return True