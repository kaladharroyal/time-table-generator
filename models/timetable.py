from .database import db

class TimetableSlot(db.Model):
    __tablename__ = 'timetable_slots'
    
    id = db.Column(db.Integer, primary_key=True)
    program_id = db.Column(db.Integer, db.ForeignKey('programs.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)
    time_slot = db.Column(db.Integer, nullable=False)
    
    # Relationships
    subject = db.relationship('Subject', backref='timetable_slots')
    
    __table_args__ = (
        db.UniqueConstraint('program_id', 'day_of_week', 'time_slot', name='unique_program_time'),
        db.UniqueConstraint('faculty_id', 'day_of_week', 'time_slot', name='unique_faculty_time'),
        db.UniqueConstraint('room_id', 'day_of_week', 'time_slot', name='unique_room_time'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'program_id': self.program_id,
            'program_name': self.program.name if self.program else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'subject_code': self.subject.code if self.subject else None,
            'faculty_id': self.faculty_id,
            'faculty_name': f'{self.faculty.first_name} {self.faculty.last_name}' if self.faculty else None,
            'room_id': self.room_id,
            'room_name': self.room.name if self.room else None,
            'day_of_week': self.day_of_week,
            'time_slot': self.time_slot
        }

class GlobalUnavailableSlot(db.Model):
    __tablename__ = 'global_unavailable_slots'
    
    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.Integer, nullable=False)
    time_slot = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(255))
    
    __table_args__ = (
        db.UniqueConstraint('day_of_week', 'time_slot', name='unique_global_slot'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'day_of_week': self.day_of_week,
            'time_slot': self.time_slot,
            'reason': self.reason
        }