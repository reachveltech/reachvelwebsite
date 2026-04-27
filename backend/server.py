from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'change-me')

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ───────────────── Models ─────────────────
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


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
    created_at: datetime


class AdminLoginIn(BaseModel):
    password: str


class AdminLoginOut(BaseModel):
    token: str


# ───────────────── Auth helper ─────────────────
async def require_admin(x_admin_token: str = Header(default="")):
    if not x_admin_token or not secrets.compare_digest(x_admin_token, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


# ───────────────── Routes ─────────────────
@api_router.get("/")
async def root():
    return {"message": "Reachvel API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for c in status_checks:
        if isinstance(c.get('timestamp'), str):
            c['timestamp'] = datetime.fromisoformat(c['timestamp'])
    return status_checks


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
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contact_submissions.insert_one(dict(sub))
    sub["created_at"] = datetime.fromisoformat(sub["created_at"])
    return ContactSubmission(**sub)


@api_router.post("/admin/login", response_model=AdminLoginOut)
async def admin_login(payload: AdminLoginIn):
    if not secrets.compare_digest(payload.password or "", ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Invalid password")
    return AdminLoginOut(token=ADMIN_PASSWORD)


@api_router.get("/admin/submissions", response_model=List[ContactSubmission])
async def list_submissions(_: bool = Depends(require_admin)):
    subs = await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for s in subs:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return subs


@api_router.get("/admin/stats")
async def admin_stats(_: bool = Depends(require_admin)):
    total = await db.contact_submissions.count_documents({})
    today_iso = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today = await db.contact_submissions.count_documents({"created_at": {"$gte": today_iso}})
    return {"total": total, "today": today}


@api_router.delete("/admin/submissions/{sub_id}")
async def delete_submission(sub_id: str, _: bool = Depends(require_admin)):
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
