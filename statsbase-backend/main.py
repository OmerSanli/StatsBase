from flask import Flask, jsonify
from flask_cors import CORS
import os
import instaloader
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/api/instagram/<username>")
def scrape_instagram(username):
    try:
        # Kullanıcı adı ve şifreyi .env'den al
        ig_user = os.getenv("IG_USERNAME")
        ig_pass = os.getenv("IG_PASSWORD")

        L = instaloader.Instaloader()
        L.login(ig_user, ig_pass)  # Giriş yap

        profile = instaloader.Profile.from_username(L.context, username)

        data = {
            "username": profile.username,
            "follower_count": profile.followers,
            "profile_pic_url": profile.profile_pic_url,
            "reel_count": profile.mediacount,
            "bio": profile.biography,
            "full_name": profile.full_name,
        }

        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
