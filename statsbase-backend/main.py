from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import instaloader

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/api/instagram/<username>")
def scrape_instagram(username):
    L = instaloader.Instaloader()

    ig_user = os.getenv("IG_USERNAME")
    ig_pass = os.getenv("IG_PASSWORD")

    try:
        L.login(ig_user, ig_pass)
        profile = instaloader.Profile.from_username(L.context, username)

        posts = profile.get_posts()
        post_data = []
        total_likes = 0
        total_comments = 0
        brands = set()

        for i, post in enumerate(posts):
            if i >= 20:
                break
            total_likes += post.likes
            total_comments += post.comments
            caption = post.caption or ""
            for word in caption.split():
                if word.startswith("@") or word.startswith("#"):
                    brands.add(word)

        return jsonify({
            "username": profile.username,
            "followers": profile.followers,
            "profile_pic_url": profile.profile_pic_url,
            "average_likes": total_likes // 20,
            "average_comments": total_comments // 20,
            "engagement_rate": round(((total_likes + total_comments) / profile.followers) * 100, 2),
            "last_collaborations": list(brands)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
