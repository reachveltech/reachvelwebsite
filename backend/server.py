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

from seed_data import PROJECTS_SEED, ARTICLES_SEED, ROLES_SEED
from crm_routes import build_router as build_crm_router


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


def slugify(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-') or str(uuid.uuid4())[:8]


# ───────────────── Models — Contact ─────────────────
class AttachmentIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    filename: str = Field(default="", max_length=300)
    mimetype: str = Field(default="", max_length=120)
    size: int = 0
    data: str = Field(default="", max_length=10_000_000)  # base64 data URL, ≤ ~7.5 MB raw


class JobApplicationIn(BaseModel):
    role_id: Optional[str] = Field(default="", max_length=80)
    role_title: Optional[str] = Field(default="", max_length=200)
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    linkedin: Optional[str] = Field(default="", max_length=400)
    note: str = Field(min_length=10, max_length=5000)
    resume: Optional[AttachmentIn] = None


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(default="", max_length=40)
    company: Optional[str] = Field(default="", max_length=120)
    service: Optional[str] = Field(default="", max_length=80)
    budget: Optional[str] = Field(default="", max_length=40)
    note: str = Field(min_length=10, max_length=5000)
    attachment: Optional[AttachmentIn] = None


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


# ───────────────── Models — CMS ─────────────────
class Metric(BaseModel):
    k: str
    v: str


class ProjectIn(BaseModel):
    slug: Optional[str] = ""
    title: str = Field(min_length=1, max_length=200)
    client: str = Field(default="", max_length=200)
    domain: str = Field(default="", max_length=80)
    year: str = Field(default="", max_length=16)
    summary: str = Field(default="", max_length=2000)
    cover: str = Field(default="", max_length=1000)
    video: str = Field(default="", max_length=1000)
    services: List[str] = Field(default_factory=list)
    metrics: List[Metric] = Field(default_factory=list)
    display_order: int = 0


class Project(ProjectIn):
    id: str
    slug: str
    created_at: datetime
    updated_at: datetime


class ArticleIn(BaseModel):
    slug: Optional[str] = ""
    title: str = Field(min_length=1, max_length=300)
    excerpt: str = Field(default="", max_length=600)
    category: str = Field(default="", max_length=80)
    date: str = Field(default="", max_length=40)
    read_time: str = Field(default="", max_length=20)
    author: str = Field(default="", max_length=120)
    cover: str = Field(default="", max_length=1000)
    body: List[str] = Field(default_factory=list)
    featured: bool = False
    display_order: int = 0


class Article(ArticleIn):
    id: str
    slug: str
    created_at: datetime
    updated_at: datetime


class RoleIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    dept: str = Field(default="", max_length=80)
    location: str = Field(default="", max_length=200)
    type: str = Field(default="", max_length=40)
    description: str = Field(default="", max_length=2000)
    active: bool = True
    display_order: int = 0


class Role(RoleIn):
    id: str
    created_at: datetime
    updated_at: datetime


# ───────────────── Startup: seed + indexes ─────────────────
@app.on_event("startup")
async def seed_everything():
    await db.contact_submissions.create_index("created_at")
    await db.admin_sessions.create_index("token", unique=True)
    await db.login_attempts.create_index("ip")
    await db.login_attempts.create_index("created_at")
    await db.projects.create_index("slug", unique=True)
    await db.articles.create_index("slug", unique=True)

    # CRM indexes
    for col in ("leads", "vendors", "crm_projects", "crm_tasks",
                "project_expenses", "vendor_payments", "project_invoices",
                "project_payments", "reachvel_payments"):
        await db[col].create_index("id", unique=True)
        await db[col].create_index("created_at")

    # admin seed
    doc = await db.admin_config.find_one({"key": "password_hash"})
    if not doc:
        await db.admin_config.insert_one({
            "key": "password_hash",
            "value": hash_password(SEED_ADMIN_PASSWORD),
            "updated_at": now_iso(),
        })

    await db.contact_submissions.update_many(
        {"status": {"$exists": False}},
        {"$set": {"status": "new"}},
    )

    # content seeds — only if collection is empty
    if await db.projects.count_documents({}) == 0:
        for i, p in enumerate(PROJECTS_SEED):
            await db.projects.insert_one({
                "id": str(uuid.uuid4()),
                "slug": p["slug"],
                "title": p["title"],
                "client": p["client"],
                "domain": p["domain"],
                "year": p["year"],
                "summary": p["summary"],
                "cover": p["cover"],
                "video": p["video"],
                "services": p["services"],
                "metrics": p["metrics"],
                "display_order": i,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            })
        logging.info(f"Seeded {len(PROJECTS_SEED)} projects.")

    if await db.articles.count_documents({}) == 0:
        for i, a in enumerate(ARTICLES_SEED):
            await db.articles.insert_one({
                "id": str(uuid.uuid4()),
                "slug": a["slug"],
                "title": a["title"],
                "excerpt": a["excerpt"],
                "category": a["category"],
                "date": a["date"],
                "read_time": a["read_time"],
                "author": a["author"],
                "cover": a["cover"],
                "body": a["body"],
                "featured": a.get("featured", False),
                "display_order": i,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            })
        logging.info(f"Seeded {len(ARTICLES_SEED)} articles.")

    if await db.roles.count_documents({}) == 0:
        for i, r in enumerate(ROLES_SEED):
            await db.roles.insert_one({
                "id": str(uuid.uuid4()),
                "title": r["title"],
                "dept": r["dept"],
                "location": r["location"],
                "type": r["type"],
                "description": r["description"],
                "active": True,
                "display_order": i,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            })
        logging.info(f"Seeded {len(ROLES_SEED)} roles.")


# ───────────────── Rate limit ─────────────────
async def check_rate_limit(ip: str):
    window_start = datetime.now(timezone.utc) - timedelta(minutes=ATTEMPT_WINDOW_MIN)
    fails = await db.login_attempts.count_documents({
        "ip": ip, "success": False,
        "created_at": {"$gte": window_start.isoformat()},
    })
    if fails >= MAX_LOGIN_ATTEMPTS:
        last = await db.login_attempts.find_one(
            {"ip": ip, "success": False}, sort=[("created_at", -1)],
        )
        if last:
            last_at = datetime.fromisoformat(last["created_at"])
            unlock_at = last_at + timedelta(minutes=LOCKOUT_MIN)
            if datetime.now(timezone.utc) < unlock_at:
                retry_in = int((unlock_at - datetime.now(timezone.utc)).total_seconds())
                raise HTTPException(status_code=429, detail=f"Too many attempts. Try again in {retry_in}s.")


async def log_attempt(ip: str, success: bool):
    await db.login_attempts.insert_one({"ip": ip, "success": success, "created_at": now_iso()})
    if success:
        await db.login_attempts.delete_many({"ip": ip, "success": False})


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
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            await db.admin_sessions.delete_one({"token": x_admin_token})
            raise HTTPException(status_code=401, detail="Session expired")
    return {"token": x_admin_token}


# ───────────────── Public routes ─────────────────
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
    if payload.attachment and payload.attachment.data:
        sub["attachment"] = {
            "filename": payload.attachment.filename or "attachment",
            "mimetype": payload.attachment.mimetype or "",
            "size": int(payload.attachment.size or 0),
            "data": payload.attachment.data,
        }
    await db.contact_submissions.insert_one(dict(sub))
    sub["created_at"] = datetime.fromisoformat(sub["created_at"])
    return ContactSubmission(**sub)


@api_router.post("/applications")
async def submit_application(payload: JobApplicationIn):
    app_doc = {
        "id": str(uuid.uuid4()),
        "role_id": (payload.role_id or "").strip(),
        "role_title": (payload.role_title or "").strip(),
        "name": payload.name.strip(),
        "email": str(payload.email).strip().lower(),
        "linkedin": (payload.linkedin or "").strip(),
        "note": payload.note.strip(),
        "status": "new",
        "created_at": now_iso(),
    }
    if payload.resume and payload.resume.data:
        app_doc["resume"] = {
            "filename": payload.resume.filename or "resume",
            "mimetype": payload.resume.mimetype or "",
            "size": int(payload.resume.size or 0),
            "data": payload.resume.data,
        }
    await db.job_applications.insert_one(dict(app_doc))
    return {"id": app_doc["id"], "ok": True}


@api_router.get("/projects")
async def list_projects():
    items = await db.projects.find({}, {"_id": 0}).sort("display_order", 1).to_list(500)
    for it in items:
        for k in ("created_at", "updated_at"):
            if isinstance(it.get(k), str):
                it[k] = datetime.fromisoformat(it[k])
    return items


@api_router.get("/articles")
async def list_articles():
    items = await db.articles.find({}, {"_id": 0}).sort("display_order", 1).to_list(500)
    for it in items:
        for k in ("created_at", "updated_at"):
            if isinstance(it.get(k), str):
                it[k] = datetime.fromisoformat(it[k])
    return items


@api_router.get("/articles/{slug}")
async def get_article(slug: str):
    item = await db.articles.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for k in ("created_at", "updated_at"):
        if isinstance(item.get(k), str):
            item[k] = datetime.fromisoformat(item[k])
    return item


@api_router.get("/roles")
async def list_roles_public():
    items = await db.roles.find({"active": True}, {"_id": 0}).sort("display_order", 1).to_list(500)
    for it in items:
        for k in ("created_at", "updated_at"):
            if isinstance(it.get(k), str):
                it[k] = datetime.fromisoformat(it[k])
    return items


# ───────────────── Admin — auth ─────────────────
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
        "token": token, "created_at": now_iso(),
        "expires_at": expires_at.isoformat(), "ip": ip,
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
    await db.admin_sessions.delete_many({"token": {"$ne": session["token"]}})
    return {"ok": True}


# ───────────────── Admin — briefings ─────────────────
@api_router.get("/admin/submissions", response_model=List[ContactSubmission])
async def list_submissions(q: Optional[str] = None, status: Optional[str] = None, _: dict = Depends(require_admin)):
    query = {}
    if status and status != "all":
        query["status"] = status
    if q:
        regex = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [{"name": regex}, {"email": regex}, {"phone": regex},
                        {"company": regex}, {"note": regex}, {"service": regex}]
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
        {"id": sub_id}, {"$set": {"status": payload.status, "updated_at": now_iso()}},
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
    by_status = {s: await db.contact_submissions.count_documents({"status": s}) for s in ALLOWED_STATUSES}
    projects_count = await db.projects.count_documents({})
    articles_count = await db.articles.count_documents({})
    roles_count = await db.roles.count_documents({"active": True})
    return {
        "total": total, "today": today, "by_status": by_status,
        "projects": projects_count, "articles": articles_count, "roles_active": roles_count,
    }


@api_router.delete("/admin/submissions/{sub_id}")
async def delete_submission(sub_id: str, _: dict = Depends(require_admin)):
    res = await db.contact_submissions.delete_one({"id": sub_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ───────────────── Admin — Job applications ─────────────────
@api_router.get("/admin/applications")
async def admin_list_applications(_: dict = Depends(require_admin)):
    items = await db.job_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items


@api_router.delete("/admin/applications/{aid}")
async def admin_delete_application(aid: str, _: dict = Depends(require_admin)):
    res = await db.job_applications.delete_one({"id": aid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ───────────────── Admin — Projects CRUD ─────────────────
async def _ensure_unique_slug(collection, slug: str, ignore_id: Optional[str] = None) -> str:
    base = slug
    i = 2
    query = {"slug": slug}
    if ignore_id:
        query["id"] = {"$ne": ignore_id}
    while await collection.find_one(query):
        slug = f"{base}-{i}"
        i += 1
        query = {"slug": slug}
        if ignore_id:
            query["id"] = {"$ne": ignore_id}
    return slug


@api_router.get("/admin/projects")
async def admin_list_projects(_: dict = Depends(require_admin)):
    items = await db.projects.find({}, {"_id": 0}).sort("display_order", 1).to_list(1000)
    for it in items:
        for k in ("created_at", "updated_at"):
            if isinstance(it.get(k), str):
                it[k] = datetime.fromisoformat(it[k])
    return items


@api_router.post("/admin/projects")
async def admin_create_project(payload: ProjectIn, _: dict = Depends(require_admin)):
    slug = payload.slug.strip() if payload.slug else slugify(payload.title)
    slug = await _ensure_unique_slug(db.projects, slug)
    doc = payload.model_dump()
    doc["slug"] = slug
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    doc["metrics"] = [m if isinstance(m, dict) else m.model_dump() for m in payload.metrics]
    await db.projects.insert_one(dict(doc))
    return await db.projects.find_one({"id": doc["id"]}, {"_id": 0})


@api_router.put("/admin/projects/{pid}")
async def admin_update_project(pid: str, payload: ProjectIn, _: dict = Depends(require_admin)):
    existing = await db.projects.find_one({"id": pid})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    slug = payload.slug.strip() if payload.slug else slugify(payload.title)
    if slug != existing.get("slug"):
        slug = await _ensure_unique_slug(db.projects, slug, ignore_id=pid)
    updates = payload.model_dump()
    updates["slug"] = slug
    updates["metrics"] = [m if isinstance(m, dict) else m.model_dump() for m in payload.metrics]
    updates["updated_at"] = now_iso()
    await db.projects.update_one({"id": pid}, {"$set": updates})
    return await db.projects.find_one({"id": pid}, {"_id": 0})


@api_router.delete("/admin/projects/{pid}")
async def admin_delete_project(pid: str, _: dict = Depends(require_admin)):
    res = await db.projects.delete_one({"id": pid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ───────────────── Admin — Articles CRUD ─────────────────
@api_router.get("/admin/articles")
async def admin_list_articles(_: dict = Depends(require_admin)):
    items = await db.articles.find({}, {"_id": 0}).sort("display_order", 1).to_list(1000)
    for it in items:
        for k in ("created_at", "updated_at"):
            if isinstance(it.get(k), str):
                it[k] = datetime.fromisoformat(it[k])
    return items


@api_router.post("/admin/articles")
async def admin_create_article(payload: ArticleIn, _: dict = Depends(require_admin)):
    slug = payload.slug.strip() if payload.slug else slugify(payload.title)
    slug = await _ensure_unique_slug(db.articles, slug)
    doc = payload.model_dump()
    doc["slug"] = slug
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.articles.insert_one(dict(doc))
    return await db.articles.find_one({"id": doc["id"]}, {"_id": 0})


@api_router.put("/admin/articles/{aid}")
async def admin_update_article(aid: str, payload: ArticleIn, _: dict = Depends(require_admin)):
    existing = await db.articles.find_one({"id": aid})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    slug = payload.slug.strip() if payload.slug else slugify(payload.title)
    if slug != existing.get("slug"):
        slug = await _ensure_unique_slug(db.articles, slug, ignore_id=aid)
    updates = payload.model_dump()
    updates["slug"] = slug
    updates["updated_at"] = now_iso()
    await db.articles.update_one({"id": aid}, {"$set": updates})
    return await db.articles.find_one({"id": aid}, {"_id": 0})


@api_router.delete("/admin/articles/{aid}")
async def admin_delete_article(aid: str, _: dict = Depends(require_admin)):
    res = await db.articles.delete_one({"id": aid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ───────────────── Admin — Roles CRUD ─────────────────
@api_router.get("/admin/roles")
async def admin_list_roles(_: dict = Depends(require_admin)):
    items = await db.roles.find({}, {"_id": 0}).sort("display_order", 1).to_list(1000)
    for it in items:
        for k in ("created_at", "updated_at"):
            if isinstance(it.get(k), str):
                it[k] = datetime.fromisoformat(it[k])
    return items


@api_router.post("/admin/roles")
async def admin_create_role(payload: RoleIn, _: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.roles.insert_one(dict(doc))
    return await db.roles.find_one({"id": doc["id"]}, {"_id": 0})


@api_router.put("/admin/roles/{rid}")
async def admin_update_role(rid: str, payload: RoleIn, _: dict = Depends(require_admin)):
    existing = await db.roles.find_one({"id": rid})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    updates = payload.model_dump()
    updates["updated_at"] = now_iso()
    await db.roles.update_one({"id": rid}, {"$set": updates})
    return await db.roles.find_one({"id": rid}, {"_id": 0})


@api_router.delete("/admin/roles/{rid}")
async def admin_delete_role(rid: str, _: dict = Depends(require_admin)):
    res = await db.roles.delete_one({"id": rid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ───────────────── Client Logos ─────────────────
class ClientLogoIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    image: str = Field(min_length=1)  # https URL or data:image/* base64
    website: str = Field(default="", max_length=500)
    display_order: int = 0
    active: bool = True


@api_router.get("/client-logos")
async def public_list_client_logos():
    return await db.client_logos.find(
        {"active": True}, {"_id": 0}
    ).sort("display_order", 1).to_list(200)


@api_router.get("/admin/client-logos")
async def admin_list_client_logos(_: dict = Depends(require_admin)):
    return await db.client_logos.find({}, {"_id": 0}).sort("display_order", 1).to_list(500)


@api_router.post("/admin/client-logos")
async def admin_create_client_logo(payload: ClientLogoIn, _: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.client_logos.insert_one(dict(doc))
    return await db.client_logos.find_one({"id": doc["id"]}, {"_id": 0})


@api_router.put("/admin/client-logos/{cid}")
async def admin_update_client_logo(cid: str, payload: ClientLogoIn, _: dict = Depends(require_admin)):
    existing = await db.client_logos.find_one({"id": cid})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    updates = payload.model_dump()
    updates["updated_at"] = now_iso()
    await db.client_logos.update_one({"id": cid}, {"$set": updates})
    return await db.client_logos.find_one({"id": cid}, {"_id": 0})


@api_router.delete("/admin/client-logos/{cid}")
async def admin_delete_client_logo(cid: str, _: dict = Depends(require_admin)):
    res = await db.client_logos.delete_one({"id": cid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


app.include_router(api_router)

# ───────────────── CRM router ─────────────────
crm_router = build_crm_router(db, require_admin)
_crm_wrapper = APIRouter(prefix="/api")
_crm_wrapper.include_router(crm_router)
app.include_router(_crm_wrapper)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
