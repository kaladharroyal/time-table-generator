from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import config  # Make sure config.py has your DB URI

app = Flask(__name__)
app.config.from_object(config)

db = SQLAlchemy(app)

# ----------------------------
# MODELS
# ----------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


# ----------------------------
# ROUTES
# ----------------------------
@app.route("/")
def home():
    app.logger.info("University Timetable Generator API is running!")
    return jsonify({"message": "University Timetable Generator API is running!"})


# CRUD for Users
@app.route("/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@app.route("/users", methods=["POST"])
def create_user():
    data = request.json
    if not data or "name" not in data:
        return jsonify({"error": "Name is required"}), 400
    user = User(name=data["name"])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@app.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    if not data or "name" not in data:
        return jsonify({"error": "Name is required"}), 400
    user.name = data["name"]
    db.session.commit()
    return jsonify(user.to_dict())


@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})


# ----------------------------
# MAIN
# ----------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        app.logger.info("Database connected and tables created successfully!")
    app.run(debug=True)
# ----------------------------
