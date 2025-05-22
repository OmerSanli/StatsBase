from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import re
import time

def parse_meta_count(text):
    text = text.strip().lower().replace(" ", "").replace(",", "")
    if "k" in text:
        return int(float(text.replace("k", "")) * 1_000)
    elif "m" in text:
        return int(float(text.replace("m", "")) * 1_000_000)
    try:
        return int(text)
    except:
        return 0

def parse_post_count(text):
    text = text.strip().lower().replace("\u202f", "").replace("&nbsp;", "").replace(" ", "")
    text = text.replace(".", "").replace(",", ".")
    if "mn" in text:
        return int(float(text.replace("mn", "")) * 1_000_000)
    elif "m" in text:
        return int(float(text.replace("m", "")) * 1_000_000)
    elif "b" in text:
        return int(float(text.replace("b", "")) * 1_000)
    try:
        return int(float(text))
    except:
        return 0

def extract_meta_counts(description: str):
    """Meta açıklamadan takipçi, takip ve gönderi sayılarını ayrıştırır."""
    follower_count = following_count = posts_count = 0
    try:
        match = re.search(r"([\d.,]+(?:[KM]|[BkMn])?)\s+Takipçi,\s+([\d.,]+)\s+Takip,\s+([\d.,]+)\s+Gönderi", description)
        if match:
            follower_count = parse_meta_count(match.group(1))
            following_count = parse_meta_count(match.group(2))
            posts_count = parse_meta_count(match.group(3))
    except:
        pass
    return follower_count, following_count, posts_count

def scrape_instagram_data(username: str, sessionid: str) -> dict:
    print(f"Veri çekiliyor... kullanıcı: {username}, sessionid: {sessionid[:12]}...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        context.add_cookies([{
            'name': 'sessionid',
            'value': sessionid,
            'domain': '.instagram.com',
            'path': '/',
            'httpOnly': True,
            'secure': True,
            'sameSite': 'Lax'
        }])

        page = context.new_page()
        profile_url = f"https://www.instagram.com/{username}/"

        try:
            page.goto(profile_url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(3000)
            print("✅ Sayfa açıldı. Meta veriler analiz ediliyor...")

            html = page.content()
            soup = BeautifulSoup(html, "html.parser")

            # Meta description
            description_tag = soup.find("meta", attrs={"name": "description"})
            description = description_tag["content"] if description_tag else ""
            print("🔍 Meta description:", description)

            follower_count, following_count, posts_count = extract_meta_counts(description)

            # Full name ve bio
            name_and_bio = description.split(" - ", 1)[-1]
            match = re.search(r"Gönderi - Instagram'da (.+?) \(@", description)
            full_name = match.group(1).strip() if match else ""
            biography = name_and_bio.split(":", 1)[-1].strip() if ":" in name_and_bio else ""

            # E-posta
            match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", biography)
            contact_email = match.group(0) if match else ""

            # Profil fotoğrafı: 2 farklı yöntemi sırayla dener
            profile_pic_url = ""
            try:
                img_element = page.locator("header img").first
                profile_pic_url = img_element.get_attribute("src")
                if not profile_pic_url:
                    img_element = page.locator("img[alt*='profile'], img[alt*='profil']").first
                    profile_pic_url = img_element.get_attribute("src")
            except:
                profile_pic_url = ""

            print("📜 Gönderiler yükleniyor...")
            page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
            page.wait_for_timeout(3000)

            post_elements = page.query_selector_all("a[href*='/p/'], a[href*='/reel/']")
            print(f"🔗 {len(post_elements)} gönderi bağlantısı bulundu...")

            posts = []
            for el in post_elements[:20]:
                try:
                    el.hover()
                    page.wait_for_timeout(600)

                    href = el.get_attribute("href")
                    url = f"https://www.instagram.com{href}"

                    ul_el = el.query_selector("ul")
                    if ul_el:
                        span_elements = ul_el.query_selector_all("li span span")
                        likes = parse_post_count(span_elements[0].inner_text()) if len(span_elements) > 0 else 0
                        comments = parse_post_count(span_elements[1].inner_text()) if len(span_elements) > 1 else 0
                    else:
                        likes = comments = 0

                    engagement = round((likes + comments) / follower_count, 4) if follower_count else 0
                    posts.append({
                        "url": url,
                        "likes": likes,
                        "comments": comments,
                        "engagement": engagement
                    })

                    print(f"🔗 {url} | ❤️ {likes} | 💬 {comments}")
                except Exception as e:
                    print(f"⚠️ Post alınamadı: {str(e)}")
                    continue

            avg_engagement = round(sum(p["engagement"] for p in posts) / len(posts), 4) if posts else 0

            return {
                "username": username,
                "full_name": full_name,
                "biography": biography,
                "contact_email": contact_email,
                "profile_pic_url": profile_pic_url,
                "follower_count": follower_count,
                "following_count": following_count,
                "posts_count": posts_count,
                "posts": posts,
                "average_engagement_rate": avg_engagement
            }

        except Exception as e:
            print("❌ HATA:", str(e))
            raise Exception("Instagram verisi ayrıştırılamadı.")
        finally:
            browser.close()
