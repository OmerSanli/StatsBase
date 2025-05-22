from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from platform_scrapers.scraper_playwright import scrape_instagram_data
import os

load_dotenv()

app = FastAPI()

# CORS ayarları
origins = [
    "http://localhost:5173",
    "https://statsbase.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/instagram/{username}")
def get_instagram_data(username: str, request: Request):
    sessionid = request.headers.get("X-IG-Session")
    if not sessionid:
        raise HTTPException(status_code=400, detail="Session ID eksik")

    try:
        print(f"Veri çekiliyor... kullanıcı: {username}, sessionid: {sessionid[:12]}...")
        data = scrape_instagram_data(username, sessionid)
        return data
    except Exception as e:
        print("HATA:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
