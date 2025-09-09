from .database import db

class Faculty(db.Model):
    __tablename__ = 'faculty'
    
    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    max_hours_per_week = db.Column(db.Integer, default=20)
    
    # Relationships
    availability = db.relationship('FacultyAvailability', backref='faculty', cascade='all, delete')
    subjects = db.relationship('FacultySubjects', backref='faculty', cascade='all, delete')
    timetable_slots = db.relationship('TimetableSlot', backref='faculty', cascade='all, delete')
    
    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'department_id': self.department_id,
            'max_hours_per_week': self.max_hours_per_week,
            'full_name': f'{self.first_name} {self.last_name}'
        }

class FacultyAvailability(db.Model):
    __tablename__ = 'faculty_availability'
    
    id = db.Column(db.Integer, primary_key=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)
    time_slot = db.Column(db.Integer, nullable=False)
    is_available = db.Column(db.Boolean, default=False)
    
    __table_args__ = (
        db.UniqueConstraint('faculty_id', 'day_of_week', 'time_slot', name='unique_faculty_time'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'faculty_id': self.faculty_id,
            'day_of_week': self.day_of_week,
            'time_slot': self.time_slot,
            'is_available': self.is_available
        }

class FacultySubjects(db.Model):
    __tablename__ = 'faculty_subjects'
    
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.id'), primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), primary_key=True)
    preference_score = db.Column(db.Integer, default=1)
    
    # Relationship
    subject = db.relationship('Subject', backref='faculty_associations')
    
    def to_dict(self):
        return {
            'faculty_id': self.faculty_id,
            'subject_id': self.subject_id,
            'preference_score': self.preference_score,
            'subject_name': self.subject.name if self.subject else None
        }