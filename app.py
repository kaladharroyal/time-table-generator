from flask import Flask, send_from_directory, request, jsonify
import os
import pymysql
app = Flask(__name__, static_folder='static')
# MySQL DB connection setup
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Kaladhar*011',
    'database': 'time_table'
}
# Get all departments for dropdown
@app.route('/api/departments', methods=['GET'])
def get_departments():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, code FROM departments")
            departments = cursor.fetchall()
        conn.close()
        department_list = [{'id': d[0], 'name': d[1], 'code': d[2]} for d in departments]
        return jsonify({'success': True, 'departments': department_list})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
# Timetable save endpoint (moved below app initialization)
@app.route('/api/timetable/save', methods=['POST'])
def save_timetable():
    data = request.get_json()
    slots = data.get('slots')
    if not slots or not isinstance(slots, list):
        return jsonify({'success': False, 'message': 'No timetable slots provided'}), 400
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            for slot in slots:
                cursor.execute(
                    "INSERT INTO timetable_slots (program_id, subject_id, faculty_id, room_id, day_of_week, time_slot) VALUES (%s, %s, %s, %s, %s, %s)",
                    (
                        slot.get('program_id'),
                        slot.get('subject_id'),
                        slot.get('faculty_id'),
                        slot.get('room_id'),
                        slot.get('day_of_week'),
                        slot.get('time_slot')
                    )
                )
            conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Timetable saved'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
# Faculty schedule endpoint (moved below app initialization)
@app.route('/api/faculty/<int:faculty_id>/schedule', methods=['GET'])
def get_faculty_schedule(faculty_id):
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT ts.day_of_week, ts.time_slot, s.name AS subject_name, r.name AS room_name, ts.program_id
                FROM timetable_slots ts
                JOIN subjects s ON ts.subject_id = s.id
                JOIN rooms r ON ts.room_id = r.id
                WHERE ts.faculty_id = %s
            """, (faculty_id,))
            schedule = cursor.fetchall()
        conn.close()
        schedule_list = [
            {
                'day_of_week': row[0],
                'time_slot': row[1],
                'subject': row[2],
                'room': row[3],
                'program_id': row[4]
            }
            for row in schedule
        ]
        return jsonify({'success': True, 'schedule': schedule_list})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
@app.route('/')
def serve_index():
    return send_from_directory('static', 'login.html')  # Serve login as default
# Serve any dashboard HTML file from static folder
@app.route('/<filename>')
def serve_html(filename):
    if filename.endswith('.html'):
        return send_from_directory('static', filename)
    return "Not Found", 404
@app.route('/api/programs', methods=['GET'])
def get_programs():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, code FROM programs")
            programs = cursor.fetchall()
        conn.close()
        program_list = [{'id': p[0], 'name': p[1], 'code': p[2]} for p in programs]
        return jsonify({'success': True, 'programs': program_list})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
@app.route('/api/sections', methods=['GET'])
def get_sections():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("SELECT DISTINCT section FROM students WHERE section IS NOT NULL AND section != ''")
            sections = [row[0] for row in cursor.fetchall()]
        conn.close()
        return jsonify({'success': True, 'sections': sections})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
@app.route('/api/faculty', methods=['GET', 'POST'])
def faculty():
    if request.method == 'GET':
        try:
            conn = pymysql.connect(**DB_CONFIG)
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, first_name, last_name FROM faculty")
                faculty = cursor.fetchall()
            conn.close()
            faculty_list = [{'id': f[0], 'name': f"{f[1]} {f[2]}".strip()} for f in faculty]
            return jsonify({'success': True, 'faculty': faculty_list})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
    elif request.method == 'POST':
        data = request.get_json()
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        department_id = data.get('department_id')
        max_hours_per_week = data.get('max_hours_per_week', 20)
        if not first_name or not last_name or not email or not department_id:
            return jsonify({'success': False, 'message': 'All faculty fields required'}), 400
        try:
            conn = pymysql.connect(**DB_CONFIG)
            with conn.cursor() as cursor:
                cursor.execute("INSERT INTO faculty (first_name, last_name, email, department_id, max_hours_per_week) VALUES (%s, %s, %s, %s, %s)",
                               (first_name, last_name, email, department_id, max_hours_per_week))
                conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Faculty added'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    if not username or not password or not role:
        return jsonify({'success': False, 'message': 'Missing credentials'}), 400
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, password, role, name FROM users WHERE username=%s AND role=%s", (username, role))
            user = cursor.fetchone()
        conn.close()
        if user:
            # Debug print for password comparison
            print(f"DB password: {user[2]}, Provided password: {password}")
            if str(user[2]).strip() == str(password).strip():
                # Return user info in 'data.user' for frontend compatibility
                return jsonify({'success': True, 'data': {'user': {'id': user[0], 'username': user[1], 'role': user[3], 'name': user[4]}}})
            else:
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
# Debug endpoint
@app.route('/debug')
def debug_info():
    files = os.listdir('static')
    return {
        'message': 'Server is running!',
        'static_files': files,
        'available_routes': [
            '/',
            '/login.html',
            '/AdminDashboard.html', 
            '/FacultyDashboard.html',
            '/StudentDashboard.html',
            '/static/styles.css',
            '/static/script.js',
            '/api/health'
        ]
    }
if __name__ == '__main__':
    print("🚀 Timetable Generator Server Started!")
    print("📁 Static files found:", os.listdir('static'))
    print("🌐 Available URLs:")
    print("   http://localhost:5000/")
    print("   http://localhost:5000/login.html")
    print("   http://localhost:5000/AdminDashboard.html")
    print("   http://localhost:5000/FacultyDashboard.html")
    print("   http://localhost:5000/StudentDashboard.html")
    print("   http://localhost:5000/api/health")
    print("   http://localhost:5000/debug")
    app.run(debug=True, host='0.0.0.0', port=5000)