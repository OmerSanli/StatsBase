import os
import instaloader
from dotenv import load_dotenv
from models.user_metrics import UserMetrics

load_dotenv()

def scrape_instagram(username: str) -> UserMetrics:
    session_id = os.getenv("IG_SESSIONID")
    if not session_id:
        raise ValueError("IG_SESSIONID environment variable not found.")

    loader = instaloader.Instaloader()
    loader.context._session.cookies.set("sessionid", session_id)

    try:
        profile = instaloader.Profile.from_username(loader.context, username)
    except Exception as e:
        raise RuntimeError(f"Profil bulunamadı veya erişilemedi: {e}")

    # İlk 20 gönderi üzerinden analiz
    posts = profile.get_posts()
    total_likes = 0
    total_comments = 0
    reel_count = 0
    view_counts = []
    collaborations = []

    for i, post in enumerate(posts):
        if i >= 20:
            break
        total_likes += post.likes
        total_comments += post.comments
        if post.typename == "GraphVideo":
            reel_count += 1
            view_counts.append(post.video_view_count or 0)
        else:
            view_counts.append(post.likes)

        caption = post.caption or ""
        for word in caption.split():
            if word.startswith("@") and word.strip("@") != username:
                collaborations.append(word.strip("@"))

    post_count = i + 1
    follower_count = profile.followers or 1
    engagement_rate = round(((total_likes + total_comments) / post_count) / follower_count * 100, 2)

    return UserMetrics(
        username=username,
        profile_pic_url=profile.profile_pic_url,
        follower_count=follower_count,
        average_likes=total_likes / post_count,
        average_comments=total_comments / post_count,
        reel_count=reel_count,
        engagement_rate=engagement_rate,
        collaboration_count=len(set(collaborations)),
        last_collaborations=list(set(collaborations))
    )
