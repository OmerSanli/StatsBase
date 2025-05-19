import instaloader
from dotenv import load_dotenv
import os

# Ortam değişkenlerini yükle
load_dotenv()

USERNAME = os.getenv("IG_USERNAME")
PASSWORD = os.getenv("IG_PASSWORD")

def get_instagram_data(username):
    try:
        loader = instaloader.Instaloader()
        loader.login(USERNAME, PASSWORD)
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
                if word.startswith("@") and word != f"@{username}":
                    collaborations.append(word.strip("@"))

        post_count = min(len(view_counts), 20)
        engagement_rate = round(((total_likes + total_comments) / post_count) / follower_count * 100, 2) if post_count > 0 else 0

        return {
            "follower_count": follower_count,
            "average_likes": total_likes // post_count if post_count else 0,
            "average_comments": total_comments // post_count if post_count else 0,
            "reel_count": reel_count,
            "engagement_rate": engagement_rate,
            "collaboration_count": len(set(collaborations)),
            "last_collaborations": list(set(collaborations)),
            "profile_pic_url": profile_pic_url,
        }
    except Exception as e:
        return {"error": str(e)}
