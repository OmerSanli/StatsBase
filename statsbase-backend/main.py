from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Test endpoint (zaten vardı)
@app.route('/api/test')
def test():
    return jsonify({"message": "Hello from Flask!"})

# Yeni endpoint: /api/stats/<username>
@app.route('/api/stats/<username>')
def get_user_stats(username):
    mock_data = {
        "testuser": {
            "username": "testuser",
            "follower_count": 10000,
            "average_likes": 100,
            "average_comments": 25,
            "average_views": 200,
            "engagement_rate": 7.5,
            "reel_count": 4,
            "post_count": 10,
            "collaboration_count": 3,
            "last_collaborations": ["adidas", "nike"]
        },
        "omer": {
            "username": "omer",
            "follower_count": 2000,
            "average_likes": 50,
            "average_comments": 10,
            "average_views": 500,
            "engagement_rate": 8.1,
            "reel_count": 2,
            "post_count": 5,
            "collaboration_count": 1,
            "last_collaborations": ["uniqlo"]
        }
    }

    if username in mock_data:
        return jsonify(mock_data[username])
    else:
        return jsonify({"error": "User not found"}), 404
