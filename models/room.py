from .database import db
import json

class Room(db.Model):
    __tablename__ = 'rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    room_type = db.Column(db.Enum('lecture_hall', 'lab', 'tutorial_room'), default='lecture_hall')
    features = db.Column(db.JSON, default=None)
    
    timetable_slots = db.relationship('TimetableSlot', backref='room', cascade='all, delete')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'capacity': self.capacity,
            'room_type': self.room_type,
            'features': self.features
        }