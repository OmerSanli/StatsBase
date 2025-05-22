from . import instagram
# from . import youtube
# from . import tiktok

def get_scraper(platform: str):
    if platform == "instagram":
        return instagram
    # elif platform == "youtube":
    #     return youtube
    # elif platform == "tiktok":
    #     return tiktok
    return None
