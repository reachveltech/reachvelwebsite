from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets
import logging
import re
import bcrypt
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SEED_ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'reachvel-admin-2026')
SESSION_TTL_HOURS = 24
MAX_LOGIN_ATTEMPTS = 5
ATTEMPT_WINDOW_MIN = 5
LOCKOUT_MIN = 15
ALLOWED_STATUSES = {"new", "reviewing", "contacted", "won", "lost"}

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ───────────────── Helpers ─────────────────
def hash_password(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(pwd: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pwd.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def client_ip(request: Request) -> str:
    xff = request.headers.get('x-forwarded-for')
    if xff:
        return xff.split(',')[0].strip()
    return request.client.host if request.client else 'unknown'


# ───────────────── Models ─────────────────
class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(default="", max_length=40)
    company: Optional[str] = Field(default="", max_length=120)
    service: Optional[str] = Field(default="", max_length=80)
    budget: Optional[str] = Field(default="", max_length=40)
    note: str = Field(min_length=10, max_length=5000)


class ContactSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    phone: str = ""
    company: str = ""
    service: str = ""
    budget: str = ""
    note: str
    source: str = "contact"
    status: str = "new"
    created_at: datetime


class AdminLoginIn(BaseModel):
    password: str


class AdminLoginOut(BaseModel):
    token: str
    expires_at: datetime


class RotatePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=200)


class StatusUpdateIn(BaseModel):
    status: str


# ───────────────── Startup: seed + indexes ─────────────────
@app.on_event("startup")
async def seed_admin_and_indexes():
    # indexes
    await db.contact_submissions.create_index("created_at")
    await db.admin_sessions.create_index("token", unique=True)
    await db.login_attempts.create_index("ip")
    await db.login_attempts.create_index("created_at")

    # seed admin config if missing
    doc = await db.admin_config.find_one({"key": "password_hash"})
    if not doc:
        await db.admin_config.insert_one({
            "key": "password_hash",
            "value": hash_password(SEED_ADMIN_PASSWORD),
            "updated_at": now_iso(),
        })
        logging.info("Seeded admin password hash from env.")

    # migrate any existing contact submissions without a status
    await db.contact_submissions.update_many(
        {"status": {"$exists": False}},
        {"$set": {"status": "new"}},
    )


# ───────────────── Rate limit ─────────────────
async def check_rate_limit(ip: str):
    window_start = datetime.now(timezone.utc) - timedelta(minutes=ATTEMPT_WINDOW_MIN)
    fails = await db.login_attempts.count_documents({
        "ip": ip,
        "success": False,
        "created_at": {"$gte": window_start.isoformat()},
    })
    if fails >= MAX_LOGIN_ATTEMPTS:
        # find the most recent failure; lockout from there for LOCKOUT_MIN
        last = await db.login_attempts.find_one(
            {"ip": ip, "success": False},
            sort=[("created_at", -1)],
        )
        if last:
            last_at = datetime.fromisoformat(last["created_at"])
            unlock_at = last_at + timedelta(minutes=LOCKOUT_MIN)
            if datetime.now(timezone.utc) < unlock_at:
                retry_in = int((unlock_at - datetime.now(timezone.utc)).total_seconds())
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many attempts. Try again in {retry_in}s.",
                )


async def log_attempt(ip: str, success: bool):
    await db.login_attempts.insert_one({
        "ip": ip,
        "success": success,
        "created_at": now_iso(),
    })
    if success:
        # clear failure history for this ip on success
        await db.login_attempts.delete_many({"ip": ip, "success": False})


# ───────────────── Auth dependency ─────────────────
async def require_admin(x_admin_token: str = Header(default="")) -> dict:
    if not x_admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    session = await db.admin_sessions.find_one({"token": x_admin_token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at is not None:
        # normalize to tz-aware UTC for comparison
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            await db.admin_sessions.delete_one({"token": x_admin_token})
            raise HTTPException(status_code=401, detail="Session expired")
    return {"token": x_admin_token}


# ───────────────── Routes ─────────────────
@api_router.get("/")
async def root():
    return {"message": "Reachvel API"}


@api_router.post("/contact", response_model=ContactSubmission)
async def submit_contact(payload: ContactIn):
    sub = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": str(payload.email).strip().lower(),
        "phone": (payload.phone or "").strip(),
        "company": (payload.company or "").strip(),
        "service": (payload.service or "").strip(),
        "budget": (payload.budget or "").strip(),
        "note": payload.note.strip(),
        "source": "contact",
        "status": "new",
        "created_at": now_iso(),
    }
    await db.contact_submissions.insert_one(dict(sub))
    sub["created_at"] = datetime.fromisoformat(sub["created_at"])
    return ContactSubmission(**sub)


@api_router.post("/admin/login", response_model=AdminLoginOut)
async def admin_login(payload: AdminLoginIn, request: Request):
    ip = client_ip(request)
    await check_rate_limit(ip)
    doc = await db.admin_config.find_one({"key": "password_hash"})
    if not doc or not verify_password(payload.password or "", doc["value"]):
        await log_attempt(ip, success=False)
        raise HTTPException(status_code=401, detail="Invalid password")
    await log_attempt(ip, success=True)
    token = secrets.token_urlsafe(40)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)
    await db.admin_sessions.insert_one({
        "token": token,
        "created_at": now_iso(),
        "expires_at": expires_at.isoformat(),
        "ip": ip,
    })
    return AdminLoginOut(token=token, expires_at=expires_at)


@api_router.post("/admin/logout")
async def admin_logout(session=Depends(require_admin)):
    await db.admin_sessions.delete_one({"token": session["token"]})
    return {"ok": True}


@api_router.post("/admin/rotate-password")
async def rotate_password(payload: RotatePasswordIn, session=Depends(require_admin)):
    doc = await db.admin_config.find_one({"key": "password_hash"})
    if not doc or not verify_password(payload.current_password, doc["value"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different")
    await db.admin_config.update_one(
        {"key": "password_hash"},
        {"$set": {"value": hash_password(payload.new_password), "updated_at": now_iso()}},
    )
    # invalidate all other sessions, keep current one valid
    await db.admin_sessions.delete_many({"token": {"$ne": session["token"]}})
    return {"ok": True}


@api_router.get("/admin/submissions", response_model=List[ContactSubmission])
async def list_submissions(
    q: Optional[str] = None,
    status: Optional[str] = None,
    _: dict = Depends(require_admin),
):
    query = {}
    if status and status != "all":
        query["status"] = status
    if q:
        pattern = re.escape(q)
        regex = {"$regex": pattern, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"email": regex},
            {"phone": regex},
            {"company": regex},
            {"note": regex},
            {"service": regex},
        ]
    subs = await db.contact_submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(2000)
    for s in subs:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
        s.setdefault('status', 'new')
    return subs


@api_router.patch("/admin/submissions/{sub_id}", response_model=ContactSubmission)
async def update_submission_status(sub_id: str, payload: StatusUpdateIn, _: dict = Depends(require_admin)):
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {sorted(ALLOWED_STATUSES)}")
    res = await db.contact_submissions.update_one(
        {"id": sub_id},
        {"$set": {"status": payload.status, "updated_at": now_iso()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    sub = await db.contact_submissions.find_one({"id": sub_id}, {"_id": 0})
    if isinstance(sub.get('created_at'), str):
        sub['created_at'] = datetime.fromisoformat(sub['created_at'])
    return ContactSubmission(**sub)


@api_router.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    total = await db.contact_submissions.count_documents({})
    today_iso = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today = await db.contact_submissions.count_documents({"created_at": {"$gte": today_iso}})
    by_status = {}
    for s in ALLOWED_STATUSES:
        by_status[s] = await db.contact_submissions.count_documents({"status": s})
    return {"total": total, "today": today, "by_status": by_status}


@api_router.delete("/admin/submissions/{sub_id}")
async def delete_submission(sub_id: str, _: dict = Depends(require_admin)):
    res = await db.contact_submissions.delete_one({"id": sub_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
