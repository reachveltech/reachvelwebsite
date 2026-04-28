"""Reachvel Dashboard (CRM) routes — separate from Website CMS.

Collections:
  leads, vendors, crm_projects, crm_tasks, project_expenses,
  vendor_payments, project_invoices, project_payments, reachvel_payments
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import re

from motor.motor_asyncio import AsyncIOMotorDatabase

# Will be injected from server.py
_db: Optional[AsyncIOMotorDatabase] = None
_require_admin = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def _strip_oid(doc):
    if isinstance(doc, dict):
        doc.pop("_id", None)
    return doc


# ──────────────── Constants ────────────────
LEAD_STAGES = {"new", "contacted", "qualified", "proposal", "won", "lost"}
PROJECT_STATUSES = {"planning", "in_progress", "on_hold", "completed", "cancelled"}
TASK_STATUSES = {"todo", "in_progress", "done"}
TASK_PRIORITIES = {"low", "medium", "high", "urgent"}
INVOICE_STATUSES = {"draft", "sent", "paid", "overdue"}
PAYMENT_STATUSES = {"pending", "paid"}
REACHVEL_PAYMENT_TYPES = {"credit", "debit"}


# ──────────────── Models ────────────────
class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=40)
    company: str = Field(default="", max_length=200)
    service: str = Field(default="", max_length=120)
    source: str = Field(default="", max_length=80)
    value: float = 0.0
    stage: str = "new"
    owner: str = Field(default="", max_length=120)
    notes: str = Field(default="", max_length=5000)


class VendorIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    company: str = Field(default="", max_length=200)
    email: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=40)
    services: str = Field(default="", max_length=500)
    gst_number: str = Field(default="", max_length=40)
    address: str = Field(default="", max_length=500)
    notes: str = Field(default="", max_length=5000)


class CrmProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    client: str = Field(default="", max_length=200)
    lead_id: str = Field(default="", max_length=80)
    status: str = "planning"
    start_date: str = Field(default="", max_length=40)
    end_date: str = Field(default="", max_length=40)
    budget: float = 0.0
    description: str = Field(default="", max_length=5000)


class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=5000)
    project_id: str = Field(default="", max_length=80)
    assignee: str = Field(default="", max_length=120)
    priority: str = "medium"
    status: str = "todo"
    due_date: str = Field(default="", max_length=40)


class ExpenseIn(BaseModel):
    project_id: str = Field(default="", max_length=80)
    description: str = Field(min_length=1, max_length=500)
    amount: float = 0.0
    category: str = Field(default="", max_length=80)
    date: str = Field(default="", max_length=40)
    receipt_url: str = Field(default="", max_length=1000)
    notes: str = Field(default="", max_length=2000)


class VendorPaymentIn(BaseModel):
    project_id: str = Field(default="", max_length=80)
    vendor_id: str = Field(default="", max_length=80)
    description: str = Field(default="", max_length=500)
    amount: float = 0.0
    gst_pct: float = 18.0
    status: str = "pending"
    date: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=2000)


class InvoiceIn(BaseModel):
    project_id: str = Field(default="", max_length=80)
    invoice_number: str = Field(default="", max_length=80)
    description: str = Field(default="", max_length=500)
    amount: float = 0.0
    gst_pct: float = 18.0
    status: str = "draft"
    issued_date: str = Field(default="", max_length=40)
    due_date: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=2000)


class ProjectPaymentIn(BaseModel):
    project_id: str = Field(default="", max_length=80)
    invoice_id: str = Field(default="", max_length=80)
    amount: float = 0.0
    method: str = Field(default="", max_length=80)
    date: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=2000)


class ReachvelPaymentIn(BaseModel):
    type: str = "debit"
    category: str = Field(default="", max_length=120)
    description: str = Field(min_length=1, max_length=500)
    amount: float = 0.0
    date: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=2000)


# ──────────────── Generic helpers ────────────────
async def _create(collection_name: str, payload: dict) -> dict:
    doc = dict(payload)
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    # derived: gst_amount, total for invoices + vendor_payments
    if collection_name in ("project_invoices", "vendor_payments"):
        amt = float(doc.get("amount", 0) or 0)
        gst_pct = float(doc.get("gst_pct", 0) or 0)
        doc["gst_amount"] = round(amt * gst_pct / 100.0, 2)
        doc["total"] = round(amt + doc["gst_amount"], 2)
    await _db[collection_name].insert_one(dict(doc))
    out = await _db[collection_name].find_one({"id": doc["id"]}, {"_id": 0})
    return _strip_oid(out)


async def _update(collection_name: str, item_id: str, payload: dict) -> dict:
    existing = await _db[collection_name].find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    updates = dict(payload)
    updates["updated_at"] = now_iso()
    if collection_name in ("project_invoices", "vendor_payments"):
        amt = float(updates.get("amount", 0) or 0)
        gst_pct = float(updates.get("gst_pct", 0) or 0)
        updates["gst_amount"] = round(amt * gst_pct / 100.0, 2)
        updates["total"] = round(amt + updates["gst_amount"], 2)
    await _db[collection_name].update_one({"id": item_id}, {"$set": updates})
    out = await _db[collection_name].find_one({"id": item_id}, {"_id": 0})
    return _strip_oid(out)


async def _delete(collection_name: str, item_id: str) -> dict:
    res = await _db[collection_name].delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


async def _list(collection_name: str, query: Optional[dict] = None, sort_key: str = "created_at", sort_dir: int = -1) -> list:
    q = query or {}
    items = await _db[collection_name].find(q, {"_id": 0}).sort(sort_key, sort_dir).to_list(2000)
    return items


# ──────────────── Router builder ────────────────
def build_router(db: AsyncIOMotorDatabase, require_admin_dep) -> APIRouter:
    global _db, _require_admin
    _db = db
    _require_admin = require_admin_dep

    r = APIRouter(prefix="/admin/crm", tags=["crm"])

    # ─── Leads ───
    @r.get("/leads")
    async def list_leads(q: Optional[str] = None, stage: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if stage and stage != "all":
            query["stage"] = stage
        if q:
            rx = {"$regex": re.escape(q), "$options": "i"}
            query["$or"] = [{"name": rx}, {"email": rx}, {"phone": rx}, {"company": rx}, {"service": rx}, {"notes": rx}]
        return await _list("leads", query)

    @r.post("/leads")
    async def create_lead(payload: LeadIn, _: dict = Depends(require_admin_dep)):
        if payload.stage not in LEAD_STAGES:
            raise HTTPException(400, f"stage must be one of {sorted(LEAD_STAGES)}")
        return await _create("leads", payload.model_dump())

    @r.put("/leads/{lid}")
    async def update_lead(lid: str, payload: LeadIn, _: dict = Depends(require_admin_dep)):
        if payload.stage not in LEAD_STAGES:
            raise HTTPException(400, f"stage must be one of {sorted(LEAD_STAGES)}")
        return await _update("leads", lid, payload.model_dump())

    @r.delete("/leads/{lid}")
    async def delete_lead(lid: str, _: dict = Depends(require_admin_dep)):
        return await _delete("leads", lid)

    # ─── Vendors ───
    @r.get("/vendors")
    async def list_vendors(q: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if q:
            rx = {"$regex": re.escape(q), "$options": "i"}
            query["$or"] = [{"name": rx}, {"company": rx}, {"email": rx}, {"phone": rx}, {"services": rx}, {"gst_number": rx}]
        return await _list("vendors", query, sort_key="name", sort_dir=1)

    @r.post("/vendors")
    async def create_vendor(payload: VendorIn, _: dict = Depends(require_admin_dep)):
        return await _create("vendors", payload.model_dump())

    @r.put("/vendors/{vid}")
    async def update_vendor(vid: str, payload: VendorIn, _: dict = Depends(require_admin_dep)):
        return await _update("vendors", vid, payload.model_dump())

    @r.delete("/vendors/{vid}")
    async def delete_vendor(vid: str, _: dict = Depends(require_admin_dep)):
        return await _delete("vendors", vid)

    # ─── CRM Projects ───
    @r.get("/projects")
    async def list_crm_projects(q: Optional[str] = None, status: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if status and status != "all":
            query["status"] = status
        if q:
            rx = {"$regex": re.escape(q), "$options": "i"}
            query["$or"] = [{"name": rx}, {"client": rx}, {"description": rx}]
        return await _list("crm_projects", query)

    @r.get("/projects/{pid}")
    async def get_crm_project(pid: str, _: dict = Depends(require_admin_dep)):
        item = await _db.crm_projects.find_one({"id": pid}, {"_id": 0})
        if not item:
            raise HTTPException(404, "Not found")
        return item

    @r.post("/projects")
    async def create_crm_project(payload: CrmProjectIn, _: dict = Depends(require_admin_dep)):
        if payload.status not in PROJECT_STATUSES:
            raise HTTPException(400, f"status must be one of {sorted(PROJECT_STATUSES)}")
        return await _create("crm_projects", payload.model_dump())

    @r.put("/projects/{pid}")
    async def update_crm_project(pid: str, payload: CrmProjectIn, _: dict = Depends(require_admin_dep)):
        if payload.status not in PROJECT_STATUSES:
            raise HTTPException(400, f"status must be one of {sorted(PROJECT_STATUSES)}")
        return await _update("crm_projects", pid, payload.model_dump())

    @r.delete("/projects/{pid}")
    async def delete_crm_project(pid: str, _: dict = Depends(require_admin_dep)):
        return await _delete("crm_projects", pid)

    # ─── Tasks ───
    @r.get("/tasks")
    async def list_tasks(q: Optional[str] = None, status: Optional[str] = None, project_id: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if status and status != "all":
            query["status"] = status
        if project_id:
            query["project_id"] = project_id
        if q:
            rx = {"$regex": re.escape(q), "$options": "i"}
            query["$or"] = [{"title": rx}, {"description": rx}, {"assignee": rx}]
        return await _list("crm_tasks", query)

    @r.post("/tasks")
    async def create_task(payload: TaskIn, _: dict = Depends(require_admin_dep)):
        if payload.status not in TASK_STATUSES:
            raise HTTPException(400, f"status must be one of {sorted(TASK_STATUSES)}")
        if payload.priority not in TASK_PRIORITIES:
            raise HTTPException(400, f"priority must be one of {sorted(TASK_PRIORITIES)}")
        return await _create("crm_tasks", payload.model_dump())

    @r.put("/tasks/{tid}")
    async def update_task(tid: str, payload: TaskIn, _: dict = Depends(require_admin_dep)):
        return await _update("crm_tasks", tid, payload.model_dump())

    @r.delete("/tasks/{tid}")
    async def delete_task(tid: str, _: dict = Depends(require_admin_dep)):
        return await _delete("crm_tasks", tid)

    # ─── Project Expenses ───
    @r.get("/expenses")
    async def list_expenses(project_id: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if project_id:
            query["project_id"] = project_id
        return await _list("project_expenses", query)

    @r.post("/expenses")
    async def create_expense(payload: ExpenseIn, _: dict = Depends(require_admin_dep)):
        return await _create("project_expenses", payload.model_dump())

    @r.put("/expenses/{eid}")
    async def update_expense(eid: str, payload: ExpenseIn, _: dict = Depends(require_admin_dep)):
        return await _update("project_expenses", eid, payload.model_dump())

    @r.delete("/expenses/{eid}")
    async def delete_expense(eid: str, _: dict = Depends(require_admin_dep)):
        return await _delete("project_expenses", eid)

    # ─── Vendor Payments ───
    @r.get("/vendor-payments")
    async def list_vendor_payments(project_id: Optional[str] = None, vendor_id: Optional[str] = None, status: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if project_id:
            query["project_id"] = project_id
        if vendor_id:
            query["vendor_id"] = vendor_id
        if status and status != "all":
            query["status"] = status
        return await _list("vendor_payments", query)

    @r.post("/vendor-payments")
    async def create_vendor_payment(payload: VendorPaymentIn, _: dict = Depends(require_admin_dep)):
        if payload.status not in PAYMENT_STATUSES:
            raise HTTPException(400, f"status must be one of {sorted(PAYMENT_STATUSES)}")
        return await _create("vendor_payments", payload.model_dump())

    @r.put("/vendor-payments/{vpid}")
    async def update_vendor_payment(vpid: str, payload: VendorPaymentIn, _: dict = Depends(require_admin_dep)):
        return await _update("vendor_payments", vpid, payload.model_dump())

    @r.delete("/vendor-payments/{vpid}")
    async def delete_vendor_payment(vpid: str, _: dict = Depends(require_admin_dep)):
        return await _delete("vendor_payments", vpid)

    # ─── Project Invoices ───
    @r.get("/invoices")
    async def list_invoices(project_id: Optional[str] = None, status: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if project_id:
            query["project_id"] = project_id
        if status and status != "all":
            query["status"] = status
        return await _list("project_invoices", query)

    @r.post("/invoices")
    async def create_invoice(payload: InvoiceIn, _: dict = Depends(require_admin_dep)):
        if payload.status not in INVOICE_STATUSES:
            raise HTTPException(400, f"status must be one of {sorted(INVOICE_STATUSES)}")
        return await _create("project_invoices", payload.model_dump())

    @r.put("/invoices/{iid}")
    async def update_invoice(iid: str, payload: InvoiceIn, _: dict = Depends(require_admin_dep)):
        return await _update("project_invoices", iid, payload.model_dump())

    @r.delete("/invoices/{iid}")
    async def delete_invoice(iid: str, _: dict = Depends(require_admin_dep)):
        return await _delete("project_invoices", iid)

    # ─── Project Payments (incoming from clients) ───
    @r.get("/project-payments")
    async def list_project_payments(project_id: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if project_id:
            query["project_id"] = project_id
        return await _list("project_payments", query)

    @r.post("/project-payments")
    async def create_project_payment(payload: ProjectPaymentIn, _: dict = Depends(require_admin_dep)):
        return await _create("project_payments", payload.model_dump())

    @r.put("/project-payments/{ppid}")
    async def update_project_payment(ppid: str, payload: ProjectPaymentIn, _: dict = Depends(require_admin_dep)):
        return await _update("project_payments", ppid, payload.model_dump())

    @r.delete("/project-payments/{ppid}")
    async def delete_project_payment(ppid: str, _: dict = Depends(require_admin_dep)):
        return await _delete("project_payments", ppid)

    # ─── Reachvel Payments (credit / debit ledger) ───
    @r.get("/reachvel-payments")
    async def list_reachvel_payments(type: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if type and type != "all":
            query["type"] = type
        return await _list("reachvel_payments", query)

    @r.post("/reachvel-payments")
    async def create_reachvel_payment(payload: ReachvelPaymentIn, _: dict = Depends(require_admin_dep)):
        if payload.type not in REACHVEL_PAYMENT_TYPES:
            raise HTTPException(400, f"type must be one of {sorted(REACHVEL_PAYMENT_TYPES)}")
        return await _create("reachvel_payments", payload.model_dump())

    @r.put("/reachvel-payments/{rpid}")
    async def update_reachvel_payment(rpid: str, payload: ReachvelPaymentIn, _: dict = Depends(require_admin_dep)):
        return await _update("reachvel_payments", rpid, payload.model_dump())

    @r.delete("/reachvel-payments/{rpid}")
    async def delete_reachvel_payment(rpid: str, _: dict = Depends(require_admin_dep)):
        return await _delete("reachvel_payments", rpid)

    # ─── Analytics (aggregate) ───
    @r.get("/analytics")
    async def crm_analytics(_: dict = Depends(require_admin_dep)):
        leads = await db.leads.find({}, {"_id": 0}).to_list(5000)
        projects = await db.crm_projects.find({}, {"_id": 0}).to_list(5000)
        tasks = await db.crm_tasks.find({}, {"_id": 0}).to_list(5000)
        invoices = await db.project_invoices.find({}, {"_id": 0}).to_list(5000)
        project_payments = await db.project_payments.find({}, {"_id": 0}).to_list(5000)
        expenses = await db.project_expenses.find({}, {"_id": 0}).to_list(5000)
        vendor_payments = await db.vendor_payments.find({}, {"_id": 0}).to_list(5000)
        reachvel_payments = await db.reachvel_payments.find({}, {"_id": 0}).to_list(5000)
        vendors = await db.vendors.find({}, {"_id": 0}).to_list(5000)

        def s(arr, key): return round(sum(float(x.get(key, 0) or 0) for x in arr), 2)

        revenue_collected = s(project_payments, "amount")
        invoiced_total = s(invoices, "total") or s(invoices, "amount")
        invoiced_paid = round(sum(float(i.get("total", i.get("amount", 0)) or 0) for i in invoices if i.get("status") == "paid"), 2)
        invoiced_pending = round(invoiced_total - invoiced_paid, 2)

        total_expenses = s(expenses, "amount")
        total_vendor_outflow = round(sum(float(v.get("total", v.get("amount", 0)) or 0) for v in vendor_payments if v.get("status") == "paid"), 2)
        total_debit = round(sum(float(p.get("amount", 0) or 0) for p in reachvel_payments if p.get("type") == "debit"), 2)
        total_credit = round(sum(float(p.get("amount", 0) or 0) for p in reachvel_payments if p.get("type") == "credit"), 2)

        net_profit = round(revenue_collected + total_credit - total_expenses - total_vendor_outflow - total_debit, 2)

        # Leads by stage
        leads_by_stage = {st: 0 for st in LEAD_STAGES}
        for ld in leads:
            st = ld.get("stage", "new")
            leads_by_stage[st] = leads_by_stage.get(st, 0) + 1
        pipeline_value = round(sum(float(ld.get("value", 0) or 0) for ld in leads if ld.get("stage") not in ("won", "lost")), 2)
        won_value = round(sum(float(ld.get("value", 0) or 0) for ld in leads if ld.get("stage") == "won"), 2)

        # Projects by status
        projects_by_status = {st: 0 for st in PROJECT_STATUSES}
        for p in projects:
            st = p.get("status", "planning")
            projects_by_status[st] = projects_by_status.get(st, 0) + 1

        # Tasks by status
        tasks_by_status = {st: 0 for st in TASK_STATUSES}
        for t in tasks:
            st = t.get("status", "todo")
            tasks_by_status[st] = tasks_by_status.get(st, 0) + 1

        # Monthly series — last 6 months of revenue vs expenses
        now = datetime.now(timezone.utc)
        months = []
        for i in range(5, -1, -1):
            ref = (now.replace(day=1) - timedelta(days=30 * i))
            months.append(ref.strftime("%Y-%m"))
        months = sorted(set(months))[-6:]

        def _month_of(dt_str: str) -> str:
            if not dt_str:
                return ""
            try:
                # Accept YYYY-MM-DD or ISO
                return dt_str[:7]
            except Exception:
                return ""

        series = []
        for m in months:
            rev = round(sum(float(p.get("amount", 0) or 0) for p in project_payments if (p.get("date") or p.get("created_at", ""))[:7] == m), 2)
            exp = round(sum(float(e.get("amount", 0) or 0) for e in expenses if (e.get("date") or e.get("created_at", ""))[:7] == m), 2)
            ven = round(sum(float(v.get("total", v.get("amount", 0)) or 0) for v in vendor_payments if v.get("status") == "paid" and (v.get("date") or v.get("created_at", ""))[:7] == m), 2)
            series.append({"month": m, "revenue": rev, "expenses": round(exp + ven, 2)})

        # Top 5 vendors by paid amount
        vendor_totals = {}
        for v in vendor_payments:
            if v.get("status") != "paid":
                continue
            vid = v.get("vendor_id") or ""
            vendor_totals[vid] = vendor_totals.get(vid, 0) + float(v.get("total", v.get("amount", 0)) or 0)
        vendor_name = {v["id"]: v.get("name", v.get("company", "Unknown")) for v in vendors}
        top_vendors = sorted(
            [{"vendor_id": k, "name": vendor_name.get(k, "Unknown"), "total": round(val, 2)} for k, val in vendor_totals.items()],
            key=lambda x: x["total"], reverse=True,
        )[:5]

        return {
            "summary": {
                "leads_total": len(leads),
                "projects_total": len(projects),
                "vendors_total": len(vendors),
                "tasks_total": len(tasks),
                "revenue_collected": revenue_collected,
                "invoiced_total": invoiced_total,
                "invoiced_paid": invoiced_paid,
                "invoiced_pending": invoiced_pending,
                "total_expenses": total_expenses,
                "total_vendor_outflow": total_vendor_outflow,
                "total_credit": total_credit,
                "total_debit": total_debit,
                "net_profit": net_profit,
                "pipeline_value": pipeline_value,
                "won_value": won_value,
            },
            "leads_by_stage": leads_by_stage,
            "projects_by_status": projects_by_status,
            "tasks_by_status": tasks_by_status,
            "monthly": series,
            "top_vendors": top_vendors,
        }

    return r
