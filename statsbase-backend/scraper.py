import json
import instaloader

def scrape_instagram_data(username):
    L = instaloader.Instaloader()

    # Kullanıcı bilgilerini anonim olarak çekmeye çalışır
    profile = instaloader.Profile.from_username(L.context, username)

    # Profil bilgileri
    follower_count = profile.followers
    posts = list(profile.get_posts())[:20]

    total_likes = 0
    total_comments = 0
    total_views = 0
    collaborations = set()

    for post in posts:
        total_likes += post.likes
        total_comments += post.comments
        if hasattr(post, "video_view_count") and post.video_view_count:
            total_views += post.video_view_count

        if post.caption:
            if any(keyword in post.caption.lower() for keyword in ["sponsor", "işbirliği", "paid partnership", "reklam", "#ad", "#sponsored"]):
                collaborations.add(post.caption.split()[0])

    avg_likes = round(total_likes / len(posts), 2) if posts else 0
    avg_comments = round(total_comments / len(posts), 2) if posts else 0
    avg_views = round(total_views / len(posts), 2) if total_views else 0
    engagement_rate = round((avg_likes + avg_comments) / follower_count * 100, 2) if follower_count else 0

    return {
        "follower_count": follower_count,
        "average_likes": avg_likes,
        "average_comments": avg_comments,
        "average_views": avg_views,
        "reel_count": len(posts),
        "engagement_rate": engagement_rate,
        "collaboration_count": len(collaborations),
        "last_collaborations": list(collaborations)
    }
