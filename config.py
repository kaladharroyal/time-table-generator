import os
from datetime import timedelta

class Config:
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:@localhost/time_table'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = 'your-super-secret-jwt-key-change-in-production-2024'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Algorithm Configuration
    MAX_GENERATION_ATTEMPTS = 1000
    TIMETABLE_DAYS = 5
    TIMETABLE_SLOTS_PER_DAY = 8