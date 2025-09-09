from flask import Blueprint

# Create blueprints
auth_bp = Blueprint('auth', __name__)
admin_bp = Blueprint('admin', __name__)
faculty_bp = Blueprint('faculty', __name__)
student_bp = Blueprint('student', __name__)
generate_bp = Blueprint('generate', __name__)

# Import routes
from . import auth, admin, faculty, student, generate