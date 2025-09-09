from .database import db

class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name
        }

class Program(db.Model):
    __tablename__ = 'programs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    start_year = db.Column(db.Integer)
    strength = db.Column(db.Integer, default=0)
    
    # Relationships
    department = db.relationship('Department', backref='programs')
    subjects = db.relationship('ProgramSubjects', backref='program', cascade='all, delete')
    timetable_slots = db.relationship('TimetableSlot', backref='program', cascade='all, delete')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'start_year': self.start_year,
            'strength': self.strength
        }

class ProgramSubjects(db.Model):
    __tablename__ = 'program_subjects'
    
    program_id = db.Column(db.Integer, db.ForeignKey('programs.id'), primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), primary_key=True)
    hours_per_week = db.Column(db.Integer, default=3)
    
    # Relationship
    subject = db.relationship('Subject', backref='program_associations')
    
    def to_dict(self):
        return {
            'program_id': self.program_id,
            'subject_id': self.subject_id,
            'hours_per_week': self.hours_per_week,
            'subject_name': self.subject.name if self.subject else None,
            'subject_code': self.subject.code if self.subject else None
        }