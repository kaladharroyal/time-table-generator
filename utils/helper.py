from flask import jsonify

def success_response(data=None, message="Success", status_code=200):
    response = {
        'success': True,
        'message': message,
        'data': data
    }
    return jsonify(response), status_code

def error_response(message="Error", status_code=400, details=None):
    response = {
        'success': False,
        'message': message,
        'details': details
    }
    return jsonify(response), status_code

def validate_required_fields(data, required_fields):
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    return missing_fields