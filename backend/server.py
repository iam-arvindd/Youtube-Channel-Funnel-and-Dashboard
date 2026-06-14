from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from cryptography.fernet import Fernet
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from anthropic import Anthropic

# ---------- Config ----------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
ADMIN_EMAIL = os.environ['ADMIN_EMAIL'].lower()
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']
ENCRYPTION_KEY = os.environ['API_KEY_ENCRYPTION_KEY']
JWT_ALGORITHM = "HS256"
fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

# ---------- Logging ----------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- DB ----------
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# ---------- App ----------
app = FastAPI(title="Finance YT Command Center")
api = APIRouter(prefix="/api")

# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def encrypt_key(plain: str) -> str:
    return fernet.encrypt(plain.encode()).decode()

def decrypt_key(cipher: str) -> str:
    return fernet.decrypt(cipher.encode()).decode()

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------- Models ----------
class LoginRequest(BaseModel):
    email: str
    password: str

class ApiKeyRequest(BaseModel):
    api_key: str

class Idea(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    sub_niche: str  # personal_finance | investing | psychology | case_study | side_hustle
    hook: Optional[str] = ""
    rating: int = 5  # 1-10
    tags: List[str] = []
    notes: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)

class IdeaCreate(BaseModel):
    title: str
    sub_niche: str
    hook: Optional[str] = ""
    rating: int = 5
    tags: List[str] = []
    notes: Optional[str] = ""

class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    sub_niche: Optional[str] = None
    hook: Optional[str] = None
    rating: Optional[int] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

VideoStage = Literal["idea", "script", "voiceover", "video", "thumbnail", "scheduled", "published"]

class Video(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    sub_niche: str = "investing"
    stage: VideoStage = "idea"
    hook: Optional[str] = ""
    script: Optional[str] = ""
    voiceover_url: Optional[str] = ""
    video_url: Optional[str] = ""
    thumbnail_url: Optional[str] = ""
    youtube_url: Optional[str] = ""
    scheduled_date: Optional[str] = None  # ISO date
    published_date: Optional[str] = None
    notes: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class VideoCreate(BaseModel):
    title: str
    sub_niche: Optional[str] = "investing"
    stage: Optional[VideoStage] = "idea"
    hook: Optional[str] = ""

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    sub_niche: Optional[str] = None
    stage: Optional[VideoStage] = None
    hook: Optional[str] = None
    script: Optional[str] = None
    voiceover_url: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    youtube_url: Optional[str] = None
    scheduled_date: Optional[str] = None
    published_date: Optional[str] = None
    notes: Optional[str] = None

class AnalyticsEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_id: Optional[str] = None
    video_title: str
    date: str  # ISO date
    views: int = 0
    ctr: float = 0.0  # percent
    retention: float = 0.0  # percent
    watch_hours: float = 0.0
    adsense_earnings: float = 0.0  # in INR
    subscribers_gained: int = 0
    rpm: float = 0.0
    created_at: str = Field(default_factory=now_iso)

class AnalyticsCreate(BaseModel):
    video_id: Optional[str] = None
    video_title: str
    date: str
    views: int = 0
    ctr: float = 0.0
    retention: float = 0.0
    watch_hours: float = 0.0
    adsense_earnings: float = 0.0
    subscribers_gained: int = 0
    rpm: float = 0.0

class Affiliate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner: str  # Groww / Zerodha / Upstox / Amazon / Other
    month: str  # YYYY-MM
    clicks: int = 0
    conversions: int = 0
    earnings: float = 0.0  # INR
    notes: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)

class AffiliateCreate(BaseModel):
    partner: str
    month: str
    clicks: int = 0
    conversions: int = 0
    earnings: float = 0.0
    notes: Optional[str] = ""

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    video_id: Optional[str] = None
    messages: List[ChatMessage]
    system: Optional[str] = None

# ---------- Auth ----------
@api.post("/auth/login")
async def login(body: LoginRequest):
    email = body.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user.get("name", "Admin")}}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# ---------- Settings (Anthropic Key) ----------
@api.post("/settings/anthropic-key")
async def save_key(body: ApiKeyRequest, user: dict = Depends(get_current_user)):
    key = body.api_key.strip()
    if len(key) < 20 or not key.startswith("sk-"):
        raise HTTPException(status_code=400, detail="API key looks invalid (must start with 'sk-')")
    encrypted = encrypt_key(key)
    await db.user_settings.update_one(
        {"user_id": user["id"]},
        {"$set": {"anthropic_key_encrypted": encrypted, "updated_at": now_iso()}},
        upsert=True,
    )
    return {"status": "ok", "preview": f"{key[:7]}...{key[-4:]}"}

@api.get("/settings/anthropic-key")
async def get_key_info(user: dict = Depends(get_current_user)):
    doc = await db.user_settings.find_one({"user_id": user["id"]})
    if not doc or "anthropic_key_encrypted" not in doc:
        return {"configured": False}
    try:
        plain = decrypt_key(doc["anthropic_key_encrypted"])
        return {"configured": True, "preview": f"{plain[:7]}...{plain[-4:]}", "updated_at": doc.get("updated_at")}
    except Exception:
        return {"configured": False}

@api.delete("/settings/anthropic-key")
async def delete_key(user: dict = Depends(get_current_user)):
    await db.user_settings.update_one({"user_id": user["id"]}, {"$unset": {"anthropic_key_encrypted": ""}})
    return {"status": "removed"}

# ---------- Ideas ----------
@api.get("/ideas")
async def list_ideas(user: dict = Depends(get_current_user)):
    docs = await db.ideas.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs

@api.post("/ideas")
async def create_idea(body: IdeaCreate, user: dict = Depends(get_current_user)):
    idea = Idea(**body.model_dump())
    await db.ideas.insert_one(idea.model_dump())
    return idea

@api.patch("/ideas/{idea_id}")
async def update_idea(idea_id: str, body: IdeaUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.ideas.update_one({"id": idea_id}, {"$set": updates})
    doc = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Idea not found")
    return doc

@api.delete("/ideas/{idea_id}")
async def delete_idea(idea_id: str, user: dict = Depends(get_current_user)):
    await db.ideas.delete_one({"id": idea_id})
    return {"status": "deleted"}

@api.post("/ideas/{idea_id}/promote")
async def promote_idea(idea_id: str, user: dict = Depends(get_current_user)):
    """Promote an idea into the pipeline as a Video card (stage=script)."""
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(404, "Idea not found")
    video = Video(
        title=idea["title"],
        sub_niche=idea.get("sub_niche", "investing"),
        hook=idea.get("hook", ""),
        stage="script",
    )
    await db.videos.insert_one(video.model_dump())
    return video

# ---------- Videos / Pipeline ----------
@api.get("/videos")
async def list_videos(user: dict = Depends(get_current_user)):
    return await db.videos.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.post("/videos")
async def create_video(body: VideoCreate, user: dict = Depends(get_current_user)):
    video = Video(**body.model_dump())
    await db.videos.insert_one(video.model_dump())
    return video

@api.get("/videos/{vid}")
async def get_video(vid: str, user: dict = Depends(get_current_user)):
    doc = await db.videos.find_one({"id": vid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Video not found")
    return doc

@api.patch("/videos/{vid}")
async def update_video(vid: str, body: VideoUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.videos.update_one({"id": vid}, {"$set": updates})
    doc = await db.videos.find_one({"id": vid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Video not found")
    return doc

@api.delete("/videos/{vid}")
async def delete_video(vid: str, user: dict = Depends(get_current_user)):
    await db.videos.delete_one({"id": vid})
    await db.chat_messages.delete_many({"video_id": vid})
    return {"status": "deleted"}

# ---------- Chat history per video ----------
@api.get("/videos/{vid}/messages")
async def get_messages(vid: str, user: dict = Depends(get_current_user)):
    msgs = await db.chat_messages.find({"video_id": vid}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return msgs

@api.delete("/videos/{vid}/messages")
async def clear_messages(vid: str, user: dict = Depends(get_current_user)):
    await db.chat_messages.delete_many({"video_id": vid})
    return {"status": "cleared"}

# ---------- Analytics ----------
@api.get("/analytics")
async def list_analytics(user: dict = Depends(get_current_user)):
    return await db.analytics.find({}, {"_id": 0}).sort("date", -1).to_list(1000)

@api.post("/analytics")
async def create_analytics(body: AnalyticsCreate, user: dict = Depends(get_current_user)):
    entry = AnalyticsEntry(**body.model_dump())
    await db.analytics.insert_one(entry.model_dump())
    return entry

@api.delete("/analytics/{eid}")
async def delete_analytics(eid: str, user: dict = Depends(get_current_user)):
    await db.analytics.delete_one({"id": eid})
    return {"status": "deleted"}

# ---------- Affiliates ----------
@api.get("/affiliates")
async def list_affiliates(user: dict = Depends(get_current_user)):
    return await db.affiliates.find({}, {"_id": 0}).sort("month", -1).to_list(1000)

@api.post("/affiliates")
async def create_affiliate(body: AffiliateCreate, user: dict = Depends(get_current_user)):
    aff = Affiliate(**body.model_dump())
    await db.affiliates.insert_one(aff.model_dump())
    return aff

@api.delete("/affiliates/{aid}")
async def delete_affiliate(aid: str, user: dict = Depends(get_current_user)):
    await db.affiliates.delete_one({"id": aid})
    return {"status": "deleted"}

# ---------- Dashboard summary ----------
@api.get("/dashboard/summary")
async def dashboard_summary(user: dict = Depends(get_current_user)):
    videos = await db.videos.find({}, {"_id": 0}).to_list(1000)
    analytics = await db.analytics.find({}, {"_id": 0}).to_list(2000)
    affiliates = await db.affiliates.find({}, {"_id": 0}).to_list(2000)

    by_stage = {}
    for v in videos:
        by_stage[v["stage"]] = by_stage.get(v["stage"], 0) + 1

    total_views = sum(a.get("views", 0) for a in analytics)
    total_adsense = sum(a.get("adsense_earnings", 0) for a in analytics)
    total_subs = sum(a.get("subscribers_gained", 0) for a in analytics)
    total_affiliate = sum(a.get("earnings", 0) for a in affiliates)
    avg_ctr = (sum(a.get("ctr", 0) for a in analytics) / len(analytics)) if analytics else 0
    avg_retention = (sum(a.get("retention", 0) for a in analytics) / len(analytics)) if analytics else 0

    # last 30 days views trend (group by date)
    trend_map = {}
    for a in analytics:
        d = (a.get("date") or "")[:10]
        if not d:
            continue
        trend_map[d] = trend_map.get(d, 0) + a.get("views", 0)
    trend = [{"date": k, "views": v} for k, v in sorted(trend_map.items())][-30:]

    return {
        "total_videos": len(videos),
        "by_stage": by_stage,
        "total_views": total_views,
        "total_adsense": round(total_adsense, 2),
        "total_affiliate": round(total_affiliate, 2),
        "total_earnings": round(total_adsense + total_affiliate, 2),
        "total_subscribers_gained": total_subs,
        "avg_ctr": round(avg_ctr, 2),
        "avg_retention": round(avg_retention, 2),
        "trend": trend,
    }

# ---------- Claude Chat (streaming) ----------
DEFAULT_SYSTEM = (
    "You are an expert YouTube script writer and finance educator for a faceless channel "
    "targeting Indian millennials (22-35). Tone: conversational, engaging, slightly dramatic, like a storyteller "
    "explaining money. Always: (1) open with a shocking hook in the first 30 seconds, (2) use simple language with "
    "no unexplained jargon, (3) add stock-footage scene directions in [brackets], (4) include a natural "
    "'This is not financial advice' line, (5) end with a subscribe CTA. Default target length: 1300-1500 words for "
    "a ~10-minute video. When asked for ideas, titles, hooks or thumbnails, be specific, punchy, and India-aware "
    "(₹, SIP, mutual funds, Groww, Zerodha references)."
)

@api.post("/chat/stream")
async def chat_stream(body: ChatRequest, user: dict = Depends(get_current_user)):
    settings = await db.user_settings.find_one({"user_id": user["id"]})
    if not settings or "anthropic_key_encrypted" not in settings:
        raise HTTPException(status_code=400, detail="No Anthropic API key configured. Add it in Settings.")
    try:
        key = decrypt_key(settings["anthropic_key_encrypted"])
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt API key")

    client = Anthropic(api_key=key)
    system_prompt = body.system or DEFAULT_SYSTEM
    api_messages = [{"role": m.role, "content": m.content} for m in body.messages]

    # persist user message
    if body.video_id and body.messages:
        last_user = body.messages[-1]
        if last_user.role == "user":
            await db.chat_messages.insert_one({
                "id": str(uuid.uuid4()),
                "video_id": body.video_id,
                "role": "user",
                "content": last_user.content,
                "created_at": now_iso(),
            })

    def event_gen():
        full = ""
        try:
            with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                system=system_prompt,
                messages=api_messages,
            ) as stream:
                for text in stream.text_stream:
                    full += text
                    yield text
        except Exception as e:
            err = f"\n\n[ERROR] {str(e)}"
            yield err
            full += err
        # persist assistant message
        if body.video_id:
            import asyncio
            try:
                loop = asyncio.new_event_loop()
                loop.run_until_complete(db.chat_messages.insert_one({
                    "id": str(uuid.uuid4()),
                    "video_id": body.video_id,
                    "role": "assistant",
                    "content": full,
                    "created_at": now_iso(),
                }))
                loop.close()
            except Exception as e:
                logger.error(f"failed to persist assistant msg: {e}")

    return StreamingResponse(event_gen(), media_type="text/plain")

# ---------- Seed ----------
SEED_IDEAS = [
    # Personal Finance India
    ("Why 90% of Indians Die Broke (And How to Not Be One of Them)", "personal_finance"),
    ("The Real Reason Your Salary Is Never Enough", "personal_finance"),
    ("The 50-30-20 Rule Indians Are Doing Wrong", "personal_finance"),
    ("Biggest Money Mistakes Indians Make in Their 20s", "personal_finance"),
    ("Why Gold Is NOT What Rich Indians Buy", "personal_finance"),
    ("The Truth About LIC Policies — Are You Getting Scammed?", "personal_finance"),
    ("How to Build an Emergency Fund That Actually Works", "personal_finance"),
    ("5 Things Rich Indians Do Differently with Their Salary", "personal_finance"),
    ("Hidden Costs Nobody Warns You About in India", "personal_finance"),
    ("How Much Should You Really Be Saving Every Month?", "personal_finance"),
    # Investing
    ("Mutual Funds Explained in 10 Minutes (For Absolute Beginners)", "investing"),
    ("SIP vs Lump Sum: Which One Makes You More Money?", "investing"),
    ("What is an Index Fund? Why Warren Buffett Swears By It", "investing"),
    ("How to Start Investing with Just ₹500/month", "investing"),
    ("Nifty 50 vs Sensex — Finally Explained Simply", "investing"),
    ("ELSS vs PPF: Which Tax-Saving Investment is Better?", "investing"),
    ("Compounding: The Most Powerful Concept in Finance", "investing"),
    ("Groww vs Zerodha vs Upstox — Which One Should You Pick?", "investing"),
    ("What is a Demat Account? Step-by-Step How to Open", "investing"),
    ("Active vs Passive Mutual Funds: Which Wins Long Term?", "investing"),
    # Psychology
    ("Why Smart People Make Dumb Money Decisions", "psychology"),
    ("The Psychology of Why You Can't Stop Spending", "psychology"),
    ("How the Rich Think About Money Differently", "psychology"),
    ("7 Financial Habits That Changed My Life", "psychology"),
    ("The Lifestyle Inflation Trap — Why Raises Make You Poorer", "psychology"),
    ("Why Most People Never Become Wealthy (The Real Reason)", "psychology"),
    ("The One Money Mistake That Keeps People Broke Forever", "psychology"),
    ("What School Never Taught You About Money", "psychology"),
    ("How to Think About Money Like a Millionaire", "psychology"),
    ("The 3 Types of Income — Only One Makes You Rich", "psychology"),
    # Case Studies
    ("How Zepto Went from Zero to ₹10,000 Crore in 2 Years", "case_study"),
    ("Why Byju's Failed: India's Biggest Startup Collapse", "case_study"),
    ("How Zomato Built a ₹1 Lakh Crore Company From Scratch", "case_study"),
    ("The Rise and Fall of Kingfisher Airlines", "case_study"),
    ("How Jio Changed India's Economy Forever", "case_study"),
    ("Paytm's Billion Dollar Mistake — What Really Happened", "case_study"),
    ("How Amazon Entered India and Disrupted Everything", "case_study"),
    ("CRED — How a Loss-Making App Raised Billions", "case_study"),
    ("Why Flipkart Was Sold to Walmart — The Inside Story", "case_study"),
    ("How Tata Built India's Most Trusted Empire", "case_study"),
    # Side Hustles
    ("I Made ₹50,000 in One Month With No Investment", "side_hustle"),
    ("5 Side Hustles That Actually Pay in India in 2026", "side_hustle"),
    ("Passive Income Methods That Actually Work (Tested)", "side_hustle"),
    ("How to Quit Your Job in 12 Months (Real Plan)", "side_hustle"),
    ("Credit Card Hacks Indians Don't Know About", "side_hustle"),
    ("Best Credit Cards in India in 2026 (Ranked)", "side_hustle"),
    ("Home Loan vs Rent: What's Actually Better in India?", "side_hustle"),
    ("How to File ITR Yourself in 30 Minutes", "side_hustle"),
    ("What is CIBIL Score? How to Improve It Fast", "side_hustle"),
    ("How to Negotiate a Higher Salary in India (Scripts Included)", "side_hustle"),
]

async def seed_admin_and_ideas():
    # Admin user
    user = await db.users.find_one({"email": ADMIN_EMAIL})
    if not user:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Creator",
            "created_at": now_iso(),
        })
        logger.info("Admin user seeded.")
    else:
        # rotate password if .env changed
        if not verify_password(ADMIN_PASSWORD, user["password_hash"]):
            await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
            logger.info("Admin password updated from .env.")

    # Seed ideas only if empty
    count = await db.ideas.count_documents({})
    if count == 0:
        docs = []
        for title, niche in SEED_IDEAS:
            docs.append(Idea(title=title, sub_niche=niche, rating=7).model_dump())
        await db.ideas.insert_many(docs)
        logger.info(f"Seeded {len(docs)} ideas.")

# ---------- Wire up ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_start():
    await seed_admin_and_ideas()

@app.on_event("shutdown")
async def on_stop():
    mongo_client.close()
