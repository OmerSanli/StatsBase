def scrape_instagram_profile(username, max_posts=12):
    # Sahte veriler – frontend testleri için
    return {
        "total_likes": 1200,
        "total_comments": 300,
        "avg_likes": 100,
        "avg_comments": 25,
        "avg_views": 200,
        "post_count": 10,
        "reel_count": 4,
        "collaboration_count": 3,
        "posts": [
            {"has_collaboration": True, "mentions": ["nike", "adidas"]},
            {"has_collaboration": False, "mentions": []}
        ]
    }
