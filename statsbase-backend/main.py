from flask import Flask, jsonify, request
from flask_cors import CORS
import instaloader

app = Flask(__name__)
CORS(app, origins=["https://statsbase.netlify.app"])

@app.route("/api/instagram/<username>", methods=["GET"])
def scrape_instagram(username):
    sessionid = request.headers.get("X-IG-Session")

    if not sessionid:
        print("❌ HATA: Session ID eksik")
        return jsonify({"error": "Session ID eksik"}), 400

    try:
        loader = instaloader.Instaloader()
        loader.context._session.cookies.set("sessionid", sessionid)
        profile = instaloader.Profile.from_username(loader.context, username)

        # DEVAMINI BURAYA KOY
    except Exception as e:
        print(f"🔥 EXCEPTION YAKALANDI: {e}")
        return jsonify({"error": str(e)}), 500

    # Profil verileri
    follower_count = profile.followers
    reel_count = 0
    total_likes = 0
    total_comments = 0
    view_counts = []
    collaborations = []

    try:
        posts = profile.get_posts()
        for i, post in enumerate(posts):
            if i >= 20:
                break
            total_likes += post.likes
            total_comments += post.comments
            if post.typename == "GraphVideo":
                view_counts.append(post.video_view_count or 0)
            else:
                view_counts.append(post.likes)
            caption = post.caption or ""
            for word in caption.split():
                if word.startswith("@") and word != f"@{username}":
                    collaborations.append(word.strip("@"))

            if post.typename == "GraphVideo":
                reel_count += 1
    except Exception as e:
        return jsonify({"error": f"Post parsing error: {str(e)}"}), 500

    post_count = min(len(view_counts), 20)
    engagement_rate = round(((total_likes + total_comments) / post_count) / follower_count * 100, 2) if post_count > 0 else 0

    return jsonify({
        "follower_count": follower_count,
        "average_likes": total_likes // post_count if post_count else 0,
        "average_comments": total_comments // post_count if post_count else 0,
        "reel_count": reel_count,
        "engagement_rate": engagement_rate,
        "collaboration_count": len(set(collaborations)),
        "last_collaborations": list(set(collaborations))
    })

if __name__ == "__main__":
    app.run(debug=True)
