import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import instaloader

# .env dosyasını yükle
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["https://statsbase.netlify.app"])

@app.route("/api/instagram/<username>", methods=["GET"])
def scrape_instagram(username):
    sessionid = os.getenv("INSTAGRAM_SESSIONID")
    if not sessionid:
        return jsonify({"error": "Session ID bulunamadı"}), 500

    try:
        loader = instaloader.Instaloader()
        loader.context._session.cookies.set("sessionid", sessionid)

        profile = instaloader.Profile.from_username(loader.context, username)

        follower_count = profile.followers
        profile_pic_url = profile.profile_pic_url
        reel_count = 0
        total_likes = 0
        total_comments = 0
        view_counts = []
        collaborations = []

        posts = profile.get_posts()
        for i, post in enumerate(posts):
            if i >= 20:
                break
            total_likes += post.likes
            try:
                total_comments += post.comments
            except:
                total_comments += 0
            if post.typename == "GraphVideo":
                view_counts.append(post.video_view_count or 0)
                reel_count += 1
            else:
                view_counts.append(post.likes)

            caption = post.caption or ""
            for word in caption.split():
                if word.startswith("@") and word.strip("@") != username:
                    collaborations.append(word.strip("@"))

        post_count = min(len(view_counts), 20)
        engagement_rate = (
            round(((total_likes + total_comments) / post_count) / follower_count * 100, 2)
            if post_count > 0 else 0
        )

        return jsonify({
            "follower_count": follower_count,
            "average_likes": total_likes // post_count if post_count else 0,
            "average_comments": total_comments // post_count if post_count else 0,
            "reel_count": reel_count,
            "engagement_rate": engagement_rate,
            "collaboration_count": len(set(collaborations)),
            "last_collaborations": list(set(collaborations)),
            "profile_pic_url": profile_pic_url
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
