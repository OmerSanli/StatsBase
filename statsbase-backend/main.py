from flask import Flask, jsonify
from flask_cors import CORS
import instaloader

app = Flask(__name__)
CORS(app)

@app.route("/api/instagram/<username>", methods=["GET"])
def get_instagram_data(username):
    L = instaloader.Instaloader()

    try:
        profile = instaloader.Profile.from_username(L.context, username)

        posts = profile.get_posts()
        post_list = []

        for i, post in enumerate(posts):
            if i >= 20:
                break
            post_list.append({
                "likes": post.likes,
                "comments": post.comments,
                "caption": post.caption,
                "hashtags": post.caption_hashtags,
                "mentions": post.caption_mentions
            })

        avg_likes = sum(p["likes"] for p in post_list) / len(post_list)
        avg_comments = sum(p["comments"] for p in post_list) / len(post_list)
        engagement_rate = ((avg_likes + avg_comments) / profile.followers) * 100

        return jsonify({
            "username": username,
            "profile_pic_url": profile.profile_pic_url,
            "follower_count": profile.followers,
            "average_likes": round(avg_likes),
            "average_comments": round(avg_comments),
            "engagement_rate": round(engagement_rate, 2),
            "last_20_posts": post_list
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500