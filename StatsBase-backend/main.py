from flask import Flask, jsonify
from flask_cors import CORS
from scraper import scrape

app = Flask(__name__)
CORS(app)

@app.route("/api/scrape")
def run_scraper():
    data = scrape()
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True, port=3001)