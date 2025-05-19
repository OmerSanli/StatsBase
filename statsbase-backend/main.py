from flask import Flask, request, jsonify
from flask_cors import CORS
from scraper import scrape_instagram_data

app = Flask(__name__)
CORS(app, origins=["https://statsbase.netlify.app"])

@app.route("/")
def index():
    return "StatsBase API is running."

@app.route("/api/instagram/<username>", methods=["GET"])
def get_instagram_stats(username):
    session_id = request.headers.get("X-IG-Session")
    
    if not session_id:
        return jsonify({"error": "Instagram session ID eksik."}), 400

    data = scrape_instagram_data(username, session_id)

    if "error" in data:
        return jsonify(data), 500

    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
