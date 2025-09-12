from flask import Flask, send_from_directory, request, jsonify
import os
import pymysql
app = Flask(__name__, static_folder='static')
# MySQL DB connection setup
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '**********',#your mysql password
    'database': 'time_table'
}
# Get all departments for dropdown
@app.route('/api/departments', methods=['GET'])
def get_departments():
    return jsonify({'success': True, 'departments': [{'id': 1, 'name': 'Computer Science', 'code': 'CSE'}]})
# Timetable save endpoint (moved below app initialization)
@app.route('/api/timetable/save', methods=['POST'])
def save_timetable():
    data = request.get_json()
    slots = data.get('slots')
    if not slots or not isinstance(slots, list):
        return jsonify({'success': False, 'message': 'No timetable slots provided'}), 400
    saved_count = 0
    skipped_count = 0
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            for slot in slots:
                # Validate required fields
                if not all([
                    slot.get('class_id'),
                    slot.get('subject_id'),
                    slot.get('faculty_id'),
                    slot.get('room_id'),
                    slot.get('day_of_week'),
                    slot.get('time_slot')
                ]):
                    skipped_count += 1
                    continue
                cursor.execute(
                    "INSERT INTO timetable_slots (class_id, subject_id, faculty_id, room_id, day_of_week, time_slot) VALUES (%s, %s, %s, %s, %s, %s)",
                    (
                        slot.get('class_id'),
                        slot.get('subject_id'),
                        slot.get('faculty_id'),
                        slot.get('room_id'),
                        slot.get('day_of_week'),
                        slot.get('time_slot')
                    )
                )
                saved_count += 1
            conn.commit()
        conn.close()
        msg = f'Timetable saved. {saved_count} slots inserted, {skipped_count} slots skipped.'
        return jsonify({'success': True, 'message': msg})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
# Faculty schedule endpoint (moved below app initialization)
@app.route('/api/faculty/<int:faculty_id>/schedule', methods=['GET'])
def get_faculty_schedule(faculty_id):
    # Map numeric day indices (if stored) to names
    day_names = {1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'}
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    ts.day_of_week,
                    ts.time_slot,
                    COALESCE(s.name, '') AS subject_name,
                    COALESCE(s.type, 'theory') AS subject_type,
                    COALESCE(r.name, '') AS room_name,
                    COALESCE(c.name, '') AS class_name
                FROM timetable_slots ts
                LEFT JOIN subjects s ON ts.subject_id = s.id
                LEFT JOIN rooms r ON ts.room_id = r.id
                LEFT JOIN classes c ON ts.class_id = c.id
                WHERE ts.faculty_id = %s
                ORDER BY 
                    FIELD(ts.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
                    ts.time_slot
            """, (faculty_id,))
            rows = cursor.fetchall()
        conn.close()

        schedule_list = []
        for row in rows:
            # Normalize day_of_week to full day name
            raw_day = row.get('day_of_week')
            day_name = ''
            if isinstance(raw_day, int):
                day_name = day_names.get(raw_day, str(raw_day))
            elif isinstance(raw_day, str) and raw_day.isdigit():
                day_name = day_names.get(int(raw_day), raw_day)
            else:
                day_name = str(raw_day).capitalize() if raw_day else ''

            # Normalize time_slot to 'P1'..'P7' or 'Break'/'Lunch'
            raw_ts = row.get('time_slot')
            time_slot = None
            if isinstance(raw_ts, int):
                if raw_ts == 0:
                    time_slot = 'Break'
                elif raw_ts == -1:
                    time_slot = 'Lunch'
                else:
                    time_slot = 'P' + str(raw_ts)
            elif isinstance(raw_ts, str):
                rs = raw_ts.strip()
                if rs.lower() == 'break':
                    time_slot = 'Break'
                elif rs.lower() == 'lunch':
                    time_slot = 'Lunch'
                elif rs.upper().startswith('P') and rs[1:].isdigit():
                    time_slot = rs.upper()
                elif rs.isdigit():
                    time_slot = 'P' + rs
                else:
                    time_slot = rs
            else:
                time_slot = None

            schedule_list.append({
                'day_of_week': day_name,
                'time_slot': time_slot,
                'subject': row.get('subject_name', '') or '',
                'subject_type': row.get('subject_type', 'theory') or 'theory',
                'room': row.get('room_name', '') or '',
                'section': row.get('class_name', '') or ''
            })

        return jsonify({'success': True, 'schedule': schedule_list})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Database error fetching faculty schedule', 'error': str(e)}), 500
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
    return jsonify({'success': True, 'programs': [{'id': 1, 'name': 'BTech CSE', 'code': 'CSE-BT'}]})
@app.route('/api/sections', methods=['GET'])
def get_sections():
    return jsonify({'success': True, 'sections': ['CSE-A', 'CSE-B', 'CSE-C', 'CSE-D']})
# Get all faculty
@app.route('/api/faculty', methods=['GET', 'POST'])
def faculty():
    if request.method == 'GET':
        try:
            conn = pymysql.connect(**DB_CONFIG)
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name FROM faculty")
                faculty = cursor.fetchall()
            conn.close()
            faculty_list = [{'id': f[0], 'name': f[1]} for f in faculty]
            return jsonify({'success': True, 'faculty': faculty_list})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
    elif request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        email = data.get('email', None)
        department_id = data.get('department_id', None)
        max_hours_per_week = data.get('max_hours_per_week', 20)
        if not name:
            return jsonify({'success': False, 'message': 'Faculty name required'}), 400
        try:
            conn = pymysql.connect(**DB_CONFIG)
            with conn.cursor() as cursor:
                cursor.execute("INSERT INTO faculty (name, email, department_id, max_hours_per_week) VALUES (%s, %s, %s, %s)",
                               (name, email, department_id, max_hours_per_week))
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
            # Include `section` (and optionally email) in the selected columns
            cursor.execute("SELECT id, username, password, role, name, section FROM users WHERE username=%s AND role=%s", (username, role))
            user = cursor.fetchone()
        conn.close()
        if user:
            # Debug print for password comparison
            print(f"DB password: {user[2]}, Provided password: {password}")
            if str(user[2]).strip() == str(password).strip():
                # Return user info including section in 'data.user' for frontend compatibility
                return jsonify({'success': True, 'data': {'user': {'id': user[0], 'username': user[1], 'role': user[3], 'name': user[4], 'section': user[5]}}})
            else:
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
# --- NEW SCHEMA ENDPOINTS ---
# Get all classes (sections)
@app.route('/api/classes', methods=['GET'])
def get_classes():
    return jsonify({'success': True, 'classes': [
        {'id': 1, 'name': 'CSE-A', 'room_id': 1},
        {'id': 2, 'name': 'CSE-B', 'room_id': 2},
        {'id': 3, 'name': 'CSE-C', 'room_id': 3},
        {'id': 4, 'name': 'CSE-D', 'room_id': 4}
    ]})
# Get all rooms
@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    return jsonify({'success': True, 'rooms': [
        {'id': 1, 'name': 'Room 101'},
        {'id': 2, 'name': 'Room 102'},
        {'id': 3, 'name': 'Room 103'},
        {'id': 4, 'name': 'Room 104'},
        {'id': 5, 'name': 'Room 105'},
        {'id': 6, 'name': 'Lab-101'},
        {'id': 7, 'name': 'Lab 201'},
        {'id': 8, 'name': 'Lab 202'}
    ]})
# Get all faculty
@app.route('/api/faculty', methods=['GET'])
def get_faculty():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name FROM faculty")
            faculty = cursor.fetchall()
        conn.close()
        faculty_list = [{'id': f[0], 'name': f[1]} for f in faculty]
        return jsonify({'success': True, 'faculty': faculty_list})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
# Get all subjects
@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    return jsonify({'success': True, 'subjects': [
        {'id': 1, 'name': 'Data Structures', 'faculty_id': 1, 'hours': 6, 'type': 'theory'},
        {'id': 2, 'name': 'Database Management', 'faculty_id': 2, 'hours': 6, 'type': 'theory'},
        {'id': 3, 'name': 'Operating Systems', 'faculty_id': 3, 'hours': 6, 'type': 'theory'},
        {'id': 4, 'name': 'Computer Networks', 'faculty_id': 4, 'hours': 6, 'type': 'theory'},
        {'id': 5, 'name': 'Software Engineering', 'faculty_id': 5, 'hours': 6, 'type': 'theory'},
        {'id': 6, 'name': 'DS Lab', 'faculty_id': 1, 'hours': 3, 'type': 'lab'},
        {'id': 7, 'name': 'DBMS Lab', 'faculty_id': 2, 'hours': 3, 'type': 'lab'},
        {'id': 8, 'name': 'OS Lab', 'faculty_id': 3, 'hours': 3, 'type': 'lab'},
        {'id': 9, 'name': 'CN Lab', 'faculty_id': 4, 'hours': 3, 'type': 'lab'},
        {'id': 10, 'name': 'SE Lab', 'faculty_id': 5, 'hours': 3, 'type': 'lab'},
        {'id': 11, 'name': 'LIB', 'faculty_id': 6, 'hours': 2, 'type': 'theory'}
    ]})
# Save generated timetables (per class/section, with conflict check)
@app.route('/api/timetable/save', methods=['POST'])
def save_timetables():
    data = request.get_json()
    slots = data.get('slots')
    if not slots or not isinstance(slots, list):
        return jsonify({'success': False, 'message': 'No timetable slots provided'}), 400
    
    # Get the class_id from the first slot to clear existing entries
    class_id = slots[0].get('class_id') if slots else None
    if not class_id:
        return jsonify({'success': False, 'message': 'Class ID is required'}), 400
        
    # Map period names to standard format
    period_map = {
        'P1': 1, 'P2': 2, 'P3': 3, 'P4': 4, 'P5': 5, 'P6': 6, 'P7': 7,
        'Break': 'Break', 'Lunch': 'Lunch'
    }

    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            # First, clear existing slots for this class
            cursor.execute("DELETE FROM timetable_slots WHERE class_id = %s", (class_id,))
            
            # Now insert all new slots
            for slot in slots:
                # Convert time slot to proper format
                time_slot = slot.get('time_slot')
                if isinstance(time_slot, str):
                    if time_slot.startswith('P'):
                        time_slot = time_slot[1:]  # Convert 'P1' to '1'
                    elif time_slot == 'Break':
                        time_slot = '0'  # Use 0 for break
                    elif time_slot == 'Lunch':
                        time_slot = '-1'  # Use -1 for lunch
                
                # Convert time_slot to integer if it's a string like 'P1', 'P2', etc.
                time_slot = slot.get('time_slot')
                if isinstance(time_slot, str) and time_slot.startswith('P'):
                    time_slot = int(time_slot[1:])
                    
                if not all([
                    slot.get('class_id'),
                    slot.get('subject_id'),
                    slot.get('faculty_id'),
                    slot.get('room_id'),
                    slot.get('day_of_week'),
                    time_slot
                ]):
                    print(f"Skipping invalid slot: {slot}")
                    continue
                
                # Conflict check: no faculty or room double-booked at same time
                cursor.execute("""
                    SELECT COUNT(*) FROM timetable_slots 
                    WHERE day_of_week=%s AND time_slot=%s 
                    AND class_id != %s 
                    AND (faculty_id=%s OR room_id=%s)
                """, (slot['day_of_week'], time_slot, class_id, slot['faculty_id'], slot['room_id']))
                
                conflict = cursor.fetchone()[0]
                if conflict:
                    print(f"Conflict detected: {slot}")
                    continue # Skip conflicting slots instead of failing the entire save

                try:
                    cursor.execute(
                        """INSERT INTO timetable_slots 
                        (class_id, subject_id, faculty_id, room_id, day_of_week, time_slot) 
                        VALUES (%s, %s, %s, %s, %s, %s)""",
                        (slot['class_id'], slot['subject_id'], slot['faculty_id'], 
                         slot['room_id'], slot['day_of_week'], time_slot)
                    )
                    saved_count += 1
                except Exception as e:
                    print(f"Error saving slot: {slot}, Error: {str(e)}")
                    skipped_count += 1
            
            conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': f'Timetable saved successfully for class {class_id}'})
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
# Fetch timetable for a class/section
@app.route('/api/timetable/class/<int:class_id>', methods=['GET'])
def get_class_timetable(class_id):
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT day_of_week, time_slot, subject_id, faculty_id, room_id FROM timetable_slots
                WHERE class_id=%s
            """, (class_id,))
            slots = cursor.fetchall()
        conn.close()
        timetable = [{'day_of_week': s[0], 'time_slot': s[1], 'subject_id': s[2], 'faculty_id': s[3], 'room_id': s[4]} for s in slots]
        return jsonify({'success': True, 'timetable': timetable})
    except Exception as e:
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

# Get time periods configuration
@app.route('/api/periods', methods=['GET'])
def get_periods():
    # Standard time slots for a week
    time_slots = [
        {'id': 1, 'start_time': '09:00', 'end_time': '10:00', 'name': '1st Period'},
        {'id': 2, 'start_time': '10:00', 'end_time': '11:00', 'name': '2nd Period'},
        {'id': 3, 'start_time': '11:15', 'end_time': '12:15', 'name': '3rd Period'},
        {'id': 4, 'start_time': '12:15', 'end_time': '13:15', 'name': '4th Period'},
        {'id': 5, 'start_time': '14:00', 'end_time': '15:00', 'name': '5th Period'},
        {'id': 6, 'start_time': '15:00', 'end_time': '16:00', 'name': '6th Period'},
        {'id': 7, 'start_time': '16:00', 'end_time': '17:00', 'name': '7th Period'}
    ]
    
    days = [
        {'id': 1, 'name': 'Monday'},
        {'id': 2, 'name': 'Tuesday'},
        {'id': 3, 'name': 'Wednesday'},
        {'id': 4, 'name': 'Thursday'},
        {'id': 5, 'name': 'Friday'},
        {'id': 6, 'name': 'Saturday'}
    ]
    
    return jsonify({
        'success': True,
        'periods_per_day': len(time_slots),
        'total_periods_per_week': len(time_slots) * len(days),
        'time_slots': time_slots,
        'days': days
    })

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
