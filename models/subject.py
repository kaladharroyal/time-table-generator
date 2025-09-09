from .database import db
import json

class Subject(db.Model):
    __tablename__ = 'subjects'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    is_lab = db.Column(db.Boolean, default=False)
    required_room_type = db.Column(db.Enum('lecture_hall', 'lab', 'any'), default='any')
    required_features = db.Column(db.JSON, default=None)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'is_lab': self.is_lab,
            'required_room_type': self.required_room_type,
            'required_features': self.required_features
        }