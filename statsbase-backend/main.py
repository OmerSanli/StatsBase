from flask import Flask, jsonify
from flask_cors import CORS
import instaloader
import json

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Hello from Real Scraper API 🎯"

@app.route("/api/stats/<username>")
def get_user_stats(username):
    try:
        L = instaloader.Instaloader()
        profile = instaloader.Profile.from_username(L.context, username)

        posts = profile.get_posts()
        recent_posts = list(posts)[:20]

        total_likes = 0
        total_comments = 0
        total_views = 0
        brand_mentions = []

        for post in recent_posts:
            total_likes += post.likes
            total_comments += post.comments
            if post.typename == "GraphVideo" and hasattr(post, "video_view_count"):
                total_views += post.video_view_count

            caption = post.caption or ""
            # Basit marka ismi çıkarımı: "@adidas", "#nike", "sponsored by"
            for word in caption.split():
                if "@" in word or "#" in word or "sponsored" in word.lower():
                    brand_mentions.append(word.strip().lower())

        data = {
            "username": profile.username,
            "follower_count": profile.followers,
            "profile_pic_url": profile.profile_pic_url,
            "post_count": profile.mediacount,
            "reel_count": len(recent_posts),
            "average_likes": round(total_likes / len(recent_posts), 2),
            "average_comments": round(total_comments / len(recent_posts), 2),
            "average_views": round(total_views / len(recent_posts), 2),
            "engagement_rate": round(((total_likes + total_comments) / profile.followers) * 100 / len(recent_posts), 2),
            "last_collaborations": list(set(brand_mentions)),
        }

        return jsonify(data)

    except Exception as e:
        print("Scraper hatası:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
