import asyncio
from pyppeteer import launch
import re

async def scrape_instagram(username, sessionid):
    url = f"https://www.instagram.com/{username}/"

    browser = await launch(headless=True, args=['--no-sandbox'])
    page = await browser.newPage()

    # SessionID çerezi ayarla
    await page.setCookie({
        'name': 'sessionid',
        'value': sessionid,
        'domain': '.instagram.com',
        'path': '/',
        'httpOnly': True,
        'secure': True
    })

    await page.goto(url, {'waitUntil': 'networkidle2'})
    await asyncio.sleep(2)

    content = await page.content()

    # Profil verilerini JSON'dan ayıkla
    match = re.search(r'window\._sharedData\s*=\s*(\{.*?\});</script>', content)
    if not match:
        await browser.close()
        return {"error": "Profil verisi bulunamadı."}

    data = match.group(1)
    import json
    try:
        parsed = json.loads(data)
    except Exception as e:
        await browser.close()
        return {"error": f"JSON parse hatası: {str(e)}"}

    try:
        user_data = parsed["entry_data"]["ProfilePage"][0]["graphql"]["user"]
    except Exception as e:
        await browser.close()
        return {"error": f"Kullanıcı verisi alınamadı: {str(e)}"}

    follower_count = user_data["edge_followed_by"]["count"]
    following_count = user_data["edge_follow"]["count"]
    post_count = user_data["edge_owner_to_timeline_media"]["count"]
    profile_pic_url = user_data["profile_pic_url_hd"]

    # Son 20 gönderi
    posts = user_data["edge_owner_to_timeline_media"]["edges"][:20]

    total_likes = 0
    total_comments = 0
    reel_count = 0
    mentions = []

    for post in posts:
        node = post["node"]
        total_likes += node["edge_liked_by"]["count"]
        total_comments += node["edge_media_to_comment"]["count"]
        if node.get("__typename") == "GraphVideo":
            reel_count += 1
        caption = node.get("edge_media_to_caption", {}).get("edges", [])
        if caption:
            text = caption[0]["node"]["text"]
            tags = [tag.strip("@") for tag in text.split() if tag.startswith("@")]
            mentions.extend(tags)

    post_count = len(posts)
    avg_likes = total_likes // post_count if post_count else 0
    avg_comments = total_comments // post_count if post_count else 0
    engagement = round(((total_likes + total_comments) / post_count) / follower_count * 100, 2) if post_count > 0 else 0

    await browser.close()

    return {
        "follower_count": follower_count,
        "following_count": following_count,
        "post_count": post_count,
        "profile_pic_url": profile_pic_url,
        "average_likes": avg_likes,
        "average_comments": avg_comments,
        "engagement_rate": engagement,
        "reel_count": reel_count,
        "collaboration_count": len(set(mentions)),
        "last_collaborations": list(set(mentions))
    }

# Manuel test örneği:
# asyncio.get_event_loop().run_until_complete(scrape_instagram("omersanli35", "SESSIONID_HERE"))
