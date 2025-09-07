# config.py

import urllib.parse

# URL-encode your password
password = urllib.parse.quote_plus("Kaladhar*011")

DB_USER = "root"
DB_PASSWORD = "Kaladhar*011"
DB_HOST = "localhost"
DB_NAME = "timetable_db"

SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
SQLALCHEMY_TRACK_MODIFICATIONS = False
