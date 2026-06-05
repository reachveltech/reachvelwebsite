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
INVOICE_STATUSES = {"draft", "sent", "partially_paid", "paid", "overdue"}
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
    follow_up_date: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=5000)


class VendorIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    company: str = Field(default="", max_length=200)
    email: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=40)
    services: str = Field(default="", max_length=500)
    gst_number: str = Field(default="", max_length=40)
    address: str = Field(default="", max_length=500)
    onboarded_date: str = Field(default="", max_length=40)
    status: str = "active"  # active | inactive
    notes: str = Field(default="", max_length=5000)


class CrmProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    client: str = Field(default="", max_length=200)
    lead_id: str = Field(default="", max_length=80)
    vendor_id: str = Field(default="", max_length=80)
    project_group: str = Field(default="", max_length=80)  # CRM | Website | Mobile App | Full Stack | AI Automation | Others
    gst_applicable: bool = True
    status: str = "planning"
    start_date: str = Field(default="", max_length=40)
    end_date: str = Field(default="", max_length=40)
    budget: float = 0.0
    description: str = Field(default="", max_length=5000)
    contact_person: str = Field(default="", max_length=200)
    contact_phone: str = Field(default="", max_length=40)
    contact_email: str = Field(default="", max_length=200)


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
    gst_applicable: bool = False
    gst_pct: float = 18.0
    category: str = Field(default="", max_length=80)
    date: str = Field(default="", max_length=40)
    receipt_url: str = Field(default="", max_length=1000)
    notes: str = Field(default="", max_length=2000)


class VendorPaymentIn(BaseModel):
    project_id: str = Field(default="", max_length=80)
    vendor_id: str = Field(default="", max_length=80)
    description: str = Field(default="", max_length=500)
    amount: float = 0.0
    gst_applicable: bool = True
    gst_pct: float = 18.0
    status: str = "pending"
    date: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=2000)


class InvoiceIn(BaseModel):
    project_id: str = Field(default="", max_length=80)
    invoice_number: str = Field(default="", max_length=80)
    description: str = Field(default="", max_length=500)
    amount: float = 0.0
    gst_applicable: bool = True
    gst_pct: float = 18.0
    status: str = "draft"
    issued_date: str = Field(default="", max_length=40)
    due_date: str = Field(default="", max_length=40)
    paid_date: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=2000)


class RecordInvoicePaymentIn(BaseModel):
    amount: float = Field(gt=0, description="Payment amount, > 0")
    date: str = Field(default="", max_length=40)
    method: str = Field(default="", max_length=80)
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
    source: str = Field(default="", max_length=80)         # e.g. project name / "Manual"
    bank: str = Field(default="", max_length=40)           # SBI | Kotak | …
    project_id: str = Field(default="", max_length=80)
    date: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=2000)


# ──────────────── Generic helpers ────────────────
GST_COLLECTIONS = ("project_invoices", "vendor_payments", "project_expenses")


def _apply_gst(doc: dict) -> dict:
    """Compute gst_amount + total based on gst_applicable + gst_pct + amount."""
    amt = float(doc.get("amount", 0) or 0)
    if doc.get("gst_applicable", False):
        gst_pct = float(doc.get("gst_pct", 0) or 0)
        doc["gst_amount"] = round(amt * gst_pct / 100.0, 2)
        doc["total"] = round(amt + doc["gst_amount"], 2)
    else:
        doc["gst_pct"] = 0.0
        doc["gst_amount"] = 0.0
        doc["total"] = round(amt, 2)
    return doc


async def _create(collection_name: str, payload: dict) -> dict:
    doc = dict(payload)
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    if collection_name in GST_COLLECTIONS:
        _apply_gst(doc)
    await _db[collection_name].insert_one(dict(doc))
    out = await _db[collection_name].find_one({"id": doc["id"]}, {"_id": 0})
    return _strip_oid(out)


async def _update(collection_name: str, item_id: str, payload: dict) -> dict:
    existing = await _db[collection_name].find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    updates = dict(payload)
    # Defensive: never wipe an existing non-empty project_id with an empty one.
    # (Frontend forms occasionally omit project_id on edit; preserving it stops
    #  child records from silently becoming orphans.)
    if not updates.get("project_id") and existing.get("project_id"):
        updates["project_id"] = existing["project_id"]
    updates["updated_at"] = now_iso()
    if collection_name in GST_COLLECTIONS:
        _apply_gst(updates)
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


async def _sync_invoice_payment(invoice: dict) -> None:
    """Keep `project_payments` consistent with the invoice's status.

    - status == "paid":  top up project_payments to cover the invoice total.
                         Existing partial recorded payments are respected.
                         If cumulative paid < total, create a top-up entry
                         for the remaining balance.
    - status != "paid":  do NOT delete recorded payments. The user may have
                         recorded partial payments; just leave them.

    Each auto-created entry uses `auto_synced=True` and `source: "invoice"`.
    """
    inv_id = invoice.get("id")
    if not inv_id:
        return

    invoice_total = float(invoice.get("total", invoice.get("amount", 0)) or 0)

    # Sum of existing payments linked to this invoice
    existing = await _db.project_payments.find(
        {"invoice_id": inv_id}, {"_id": 0}
    ).to_list(1000)
    paid_so_far = round(sum(float(p.get("amount", 0) or 0) for p in existing), 2)

    if invoice.get("status") != "paid":
        # Leave any recorded payments alone (partial or otherwise)
        return

    balance = round(invoice_total - paid_so_far, 2)
    if balance <= 0.01:
        return  # already fully paid via recorded payments

    pay_date = invoice.get("paid_date") or invoice.get("issued_date") \
        or (invoice.get("updated_at", "") or "")[:10]
    description = (
        f"Invoice {invoice.get('invoice_number', '')}".strip()
        or invoice.get("description", "")
        or "Invoice payment"
    )

    doc = {
        "id": new_id(),
        "project_id": invoice.get("project_id", ""),
        "invoice_id": inv_id,
        "amount": balance,
        "method": "Invoice",
        "date": pay_date,
        "notes": description + " (auto top-up)",
        "auto_synced": True,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await _db.project_payments.insert_one(doc)



# ──────────────── Router builder ────────────────
def build_router(db: AsyncIOMotorDatabase, require_admin_dep) -> APIRouter:
    global _db, _require_admin
    _db = db
    _require_admin = require_admin_dep

    r = APIRouter(prefix="/admin/crm", tags=["crm"])

    # ─── Leads ───
    @r.get("/leads")
    async def list_leads(q: Optional[str] = None, stage: Optional[str] = None,
                         service: Optional[str] = None, source: Optional[str] = None,
                         _: dict = Depends(require_admin_dep)):
        query = {}
        if stage and stage != "all":
            query["stage"] = stage
        if service and service != "all":
            query["service"] = service
        if source and source != "all":
            query["source"] = source
        if q:
            rx = {"$regex": re.escape(q), "$options": "i"}
            query["$or"] = [{"name": rx}, {"email": rx}, {"phone": rx}, {"company": rx}, {"service": rx}, {"notes": rx}]
        return await _list("leads", query)

    @r.get("/leads/summary")
    async def leads_summary(_: dict = Depends(require_admin_dep)):
        leads = await _db.leads.find({}, {"_id": 0}).to_list(5000)
        by_stage = {st: 0 for st in LEAD_STAGES}
        for ld in leads:
            by_stage[ld.get("stage", "new")] = by_stage.get(ld.get("stage", "new"), 0) + 1
        pipeline = round(sum(float(ld.get("value", 0) or 0) for ld in leads if ld.get("stage") not in ("won", "lost")), 2)
        won = round(sum(float(ld.get("value", 0) or 0) for ld in leads if ld.get("stage") == "won"), 2)
        # Follow-ups due in next 7 days
        from datetime import date as _date
        today_d = _date.today()
        due_soon = 0
        for ld in leads:
            d = (ld.get("follow_up_date") or "")[:10]
            if not d:
                continue
            try:
                fd = _date.fromisoformat(d)
                if 0 <= (fd - today_d).days <= 7:
                    due_soon += 1
            except Exception:
                pass
        return {
            "total": len(leads),
            "by_stage": by_stage,
            "pipeline_value": pipeline,
            "won_value": won,
            "follow_ups_due_7d": due_soon,
        }

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

    @r.post("/leads/{lid}/convert")
    async def convert_lead_to_project(lid: str, _: dict = Depends(require_admin_dep)):
        lead = await _db.leads.find_one({"id": lid}, {"_id": 0})
        if not lead:
            raise HTTPException(404, "Lead not found")
        if lead.get("stage") == "won":
            # Idempotency: if already won and has a linked project, return it
            existing = await _db.crm_projects.find_one({"lead_id": lid}, {"_id": 0})
            if existing:
                return {"project": existing, "lead": lead, "created": False}
        project_payload = {
            "name": lead.get("company") or lead.get("name") or "New project",
            "client": lead.get("company") or lead.get("name") or "",
            "lead_id": lid,
            "vendor_id": "",
            "project_group": "",
            "gst_applicable": True,
            "status": "planning",
            "start_date": "",
            "end_date": "",
            "budget": float(lead.get("value", 0) or 0),
            "description": (lead.get("notes") or "").strip(),
            "contact_person": lead.get("name") or "",
            "contact_phone": lead.get("phone") or "",
            "contact_email": lead.get("email") or "",
        }
        project = await _create("crm_projects", project_payload)
        # Mark the lead as won
        await _db.leads.update_one({"id": lid}, {"$set": {"stage": "won", "updated_at": now_iso()}})
        lead = await _db.leads.find_one({"id": lid}, {"_id": 0})
        return {"project": project, "lead": lead, "created": True}

    # ─── Vendors ───
    @r.get("/vendors")
    async def list_vendors(q: Optional[str] = None, status: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if status and status != "all":
            if status == "active":
                # Include legacy records without a status field
                query["$or"] = [{"status": "active"}, {"status": {"$exists": False}}]
            else:
                query["status"] = status
        if q:
            rx = {"$regex": re.escape(q), "$options": "i"}
            existing_or = query.pop("$or", None)
            base = [{"name": rx}, {"company": rx}, {"email": rx}, {"phone": rx}, {"services": rx}, {"gst_number": rx}]
            if existing_or:
                query["$and"] = [{"$or": existing_or}, {"$or": base}]
            else:
                query["$or"] = base
        return await _list("vendors", query, sort_key="name", sort_dir=1)

    @r.get("/vendors/summary")
    async def vendors_summary(_: dict = Depends(require_admin_dep)):
        all_v = await _db.vendors.find({}, {"_id": 0}).to_list(5000)
        active = sum(1 for v in all_v if v.get("status", "active") == "active")
        # vendor outflow (paid)
        vps = await _db.vendor_payments.find({"status": "paid"}, {"_id": 0}).to_list(5000)
        outflow = round(sum(float(v.get("total", v.get("amount", 0)) or 0) for v in vps), 2)
        return {
            "total": len(all_v),
            "active": active,
            "inactive": len(all_v) - active,
            "total_paid_outflow": outflow,
        }

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
    @r.get("/projects/summary")
    async def projects_summary(_: dict = Depends(require_admin_dep)):
        """Aggregated KPIs across all CRM projects.
        Orphan records (project_id pointing to a deleted project) are excluded
        so totals stay truthful even before a cleanup run.
        """
        projects = await _db.crm_projects.find({}, {"_id": 0}).to_list(5000)
        by_status = {st: 0 for st in PROJECT_STATUSES}
        for p in projects:
            by_status[p.get("status", "planning")] = by_status.get(p.get("status", "planning"), 0) + 1
        total_budget = round(sum(float(p.get("budget", 0) or 0) for p in projects), 2)
        project_ids = {p["id"] for p in projects}
        # Filter every child collection by membership in active project_ids
        def _linked(items):
            return [x for x in items if x.get("project_id") in project_ids]

        invoices = _linked(await _db.project_invoices.find({}, {"_id": 0}).to_list(10000))
        invoiced = round(sum(float(i.get("total", i.get("amount", 0)) or 0) for i in invoices), 2)
        ppays = _linked(await _db.project_payments.find({}, {"_id": 0}).to_list(10000))
        received = round(sum(float(p.get("amount", 0) or 0) for p in ppays), 2)
        expenses = _linked(await _db.project_expenses.find({}, {"_id": 0}).to_list(10000))
        gen_exp = round(sum(float(e.get("total", e.get("amount", 0)) or 0) for e in expenses), 2)
        vps = _linked(await _db.vendor_payments.find({"status": "paid"}, {"_id": 0}).to_list(10000))
        ven_exp = round(sum(float(v.get("total", v.get("amount", 0)) or 0) for v in vps), 2)
        return {
            "total": len(projects),
            "by_status": by_status,
            "total_budget": total_budget,
            "total_invoiced": invoiced,
            "total_received": received,
            "total_general_expenses": gen_exp,
            "total_vendor_expenses": ven_exp,
            "net_profit": round(received - gen_exp - ven_exp, 2),
        }

    @r.get("/projects/aggregates")
    async def projects_aggregates(_: dict = Depends(require_admin_dep)):
        """Per-project rollup used by the Project Payments page (derived view)."""
        projects = await _db.crm_projects.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
        out = []
        for p in projects:
            pid = p["id"]
            invs = await _db.project_invoices.find({"project_id": pid}, {"_id": 0}).to_list(2000)
            pays = await _db.project_payments.find({"project_id": pid}, {"_id": 0}).to_list(2000)
            exps = await _db.project_expenses.find({"project_id": pid}, {"_id": 0}).to_list(2000)
            vps = await _db.vendor_payments.find({"project_id": pid, "status": "paid"}, {"_id": 0}).to_list(2000)
            invoiced = round(sum(float(i.get("total", i.get("amount", 0)) or 0) for i in invs), 2)
            received = round(sum(float(x.get("amount", 0) or 0) for x in pays), 2)
            gen_exp = round(sum(float(e.get("total", e.get("amount", 0)) or 0) for e in exps), 2)
            ven_exp = round(sum(float(v.get("total", v.get("amount", 0)) or 0) for v in vps), 2)
            out.append({
                "id": pid,
                "name": p.get("name", ""),
                "client": p.get("client", ""),
                "project_group": p.get("project_group", ""),
                "gst_applicable": bool(p.get("gst_applicable", True)),
                "total_budget": float(p.get("budget", 0) or 0),
                "total_invoiced": invoiced,
                "total_received": received,
                "total_general_expenses": gen_exp,
                "total_vendor_expenses": ven_exp,
                "profit": round(received - gen_exp - ven_exp, 2),
                "status": p.get("status", "planning"),
            })
        return out

    @r.get("/orphans/check")
    async def check_orphans(_: dict = Depends(require_admin_dep)):
        """Report orphaned + unlinked child records.
        - orphan = project_id points to a deleted project
        - unlinked = project_id is empty (e.g. an older edit wiped the link)
        """
        active_pids = set(await _db.crm_projects.distinct("id"))
        report = {"orphans": {}, "unlinked": {}}
        for coll in ("crm_tasks", "project_expenses", "vendor_payments",
                     "project_invoices", "project_payments", "reachvel_payments"):
            cur = _db[coll].find({}, {"_id": 0, "project_id": 1})
            orphan_n = 0
            unlinked_n = 0
            async for doc in cur:
                pid = doc.get("project_id")
                if not pid:
                    unlinked_n += 1
                elif pid not in active_pids:
                    orphan_n += 1
            report["orphans"][coll] = orphan_n
            report["unlinked"][coll] = unlinked_n
        report["active_projects"] = len(active_pids)
        report["total_orphans"] = sum(report["orphans"].values())
        report["total_unlinked"] = sum(report["unlinked"].values())
        # Backwards compat — keep the flat shape used by older UI builds
        for k, v in report["orphans"].items():
            report[k] = v
        return report

    @r.post("/orphans/cleanup")
    async def cleanup_orphans(_: dict = Depends(require_admin_dep)):
        """Delete all orphaned child records (project_id of a deleted project).
        Idempotent and safe to re-run."""
        active_pids = await _db.crm_projects.distinct("id")
        report = {}
        for coll in ("crm_tasks", "project_expenses", "vendor_payments",
                     "project_invoices", "project_payments", "reachvel_payments"):
            res = await _db[coll].delete_many({"project_id": {"$nin": active_pids + [""]}})
            report[coll] = res.deleted_count
        report["total_removed"] = sum(report.values())
        report["ok"] = True
        return report



    @r.get("/projects")
    async def list_crm_projects(q: Optional[str] = None, status: Optional[str] = None,
                                project_group: Optional[str] = None,
                                _: dict = Depends(require_admin_dep)):
        query = {}
        if status and status != "all":
            query["status"] = status
        if project_group and project_group != "all":
            query["project_group"] = project_group
        if q:
            rx = {"$regex": re.escape(q), "$options": "i"}
            query["$or"] = [{"name": rx}, {"client": rx}, {"description": rx}]
        projects = await _list("crm_projects", query)
        # Enrich with per-project totals (lightweight)
        for p in projects:
            pid = p["id"]
            exps = await _db.project_expenses.find({"project_id": pid}, {"_id": 0}).to_list(2000)
            vps = await _db.vendor_payments.find({"project_id": pid, "status": "paid"}, {"_id": 0}).to_list(2000)
            p["total_expenses"] = round(
                sum(float(e.get("total", e.get("amount", 0)) or 0) for e in exps)
                + sum(float(v.get("total", v.get("amount", 0)) or 0) for v in vps),
                2,
            )
        return projects

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
        # Verify project exists before cascading
        res = await _db.crm_projects.delete_one({"id": pid})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Not found")
        # Cascade delete all child records linked to this project
        cascade_counts = {}
        for coll in ("crm_tasks", "project_expenses", "vendor_payments",
                     "project_invoices", "project_payments", "reachvel_payments"):
            r2 = await _db[coll].delete_many({"project_id": pid})
            cascade_counts[coll] = r2.deleted_count
        return {"ok": True, "cascaded": cascade_counts}

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
    async def _enrich_invoice(inv: dict) -> dict:
        """Attach computed `paid_amount` and `balance` to an invoice dict."""
        pays = await _db.project_payments.find(
            {"invoice_id": inv["id"]}, {"_id": 0, "amount": 1}
        ).to_list(1000)
        paid = round(sum(float(p.get("amount", 0) or 0) for p in pays), 2)
        total = float(inv.get("total", inv.get("amount", 0)) or 0)
        inv["paid_amount"] = paid
        inv["balance"] = round(max(total - paid, 0), 2)
        return inv

    @r.get("/invoices")
    async def list_invoices(project_id: Optional[str] = None, status: Optional[str] = None, _: dict = Depends(require_admin_dep)):
        query = {}
        if project_id:
            query["project_id"] = project_id
        if status and status != "all":
            query["status"] = status
        items = await _list("project_invoices", query)
        for inv in items:
            await _enrich_invoice(inv)
        return items

    @r.post("/invoices")
    async def create_invoice(payload: InvoiceIn, _: dict = Depends(require_admin_dep)):
        if payload.status not in INVOICE_STATUSES:
            raise HTTPException(400, f"status must be one of {sorted(INVOICE_STATUSES)}")
        data = payload.model_dump()
        # Auto-stamp paid_date on creation if status is already paid
        if data.get("status") == "paid" and not data.get("paid_date"):
            data["paid_date"] = now_iso()[:10]
        inv = await _create("project_invoices", data)
        await _sync_invoice_payment(inv)
        return await _enrich_invoice(await _db.project_invoices.find_one({"id": inv["id"]}, {"_id": 0}))

    @r.put("/invoices/{iid}")
    async def update_invoice(iid: str, payload: InvoiceIn, _: dict = Depends(require_admin_dep)):
        existing = await _db.project_invoices.find_one({"id": iid})
        if not existing:
            raise HTTPException(404, "Not found")
        data = payload.model_dump()
        # Auto-stamp paid_date the moment status flips to paid
        if data.get("status") == "paid" and not data.get("paid_date"):
            data["paid_date"] = existing.get("paid_date") or now_iso()[:10]
        # Clear paid_date if status moves away from paid
        if data.get("status") != "paid":
            data["paid_date"] = ""
        inv = await _update("project_invoices", iid, data)
        await _sync_invoice_payment(inv)
        return await _enrich_invoice(await _db.project_invoices.find_one({"id": iid}, {"_id": 0}))

    @r.delete("/invoices/{iid}")
    async def delete_invoice(iid: str, _: dict = Depends(require_admin_dep)):
        # Remove ALL linked project_payments (manual + auto) so they don't
        # show up as orphans/locked rows after the parent invoice is gone.
        await _db.project_payments.delete_many({"invoice_id": iid})
        return await _delete("project_invoices", iid)

    @r.post("/invoices/{iid}/record-payment")
    async def record_invoice_payment(iid: str, payload: RecordInvoicePaymentIn, _: dict = Depends(require_admin_dep)):
        """Record a (partial or full) payment against an invoice.
        Creates a `project_payments` entry tagged with this invoice and
        auto-flips the invoice status to 'paid' once cumulative >= total.
        """
        inv = await _db.project_invoices.find_one({"id": iid}, {"_id": 0})
        if not inv:
            raise HTTPException(404, "Invoice not found")

        amount = round(float(payload.amount), 2)
        if amount <= 0:
            raise HTTPException(400, "Payment amount must be > 0")

        total = float(inv.get("total", inv.get("amount", 0)) or 0)
        existing = await _db.project_payments.find({"invoice_id": iid}, {"_id": 0, "amount": 1}).to_list(1000)
        paid_so_far = round(sum(float(p.get("amount", 0) or 0) for p in existing), 2)

        pay_date = payload.date or now_iso()[:10]
        description = (
            payload.notes
            or f"Invoice {inv.get('invoice_number', '')}".strip()
            or "Invoice payment"
        )

        doc = {
            "id": new_id(),
            "project_id": inv.get("project_id", ""),
            "invoice_id": iid,
            "amount": amount,
            "method": payload.method or "Recorded",
            "date": pay_date,
            "notes": description,
            "auto_synced": True,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await _db.project_payments.insert_one(doc)

        # Auto-flip invoice status based on cumulative paid
        new_paid_total = round(paid_so_far + amount, 2)
        invoice_updates = {"updated_at": now_iso()}
        if new_paid_total + 0.01 >= total:
            # Fully paid
            if inv.get("status") != "paid":
                invoice_updates["status"] = "paid"
                invoice_updates["paid_date"] = inv.get("paid_date") or pay_date
        elif new_paid_total > 0:
            # Partial payment recorded — mark as partially_paid (unless already paid, which shouldn't happen)
            if inv.get("status") not in ("paid", "partially_paid"):
                invoice_updates["status"] = "partially_paid"
        if invoice_updates:
            await _db.project_invoices.update_one({"id": iid}, {"$set": invoice_updates})

        refreshed = await _db.project_invoices.find_one({"id": iid}, {"_id": 0})
        return await _enrich_invoice(refreshed)

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
        existing = await _db.project_payments.find_one({"id": ppid})
        if existing and existing.get("auto_synced"):
            raise HTTPException(409, "This payment is auto-synced from an invoice. Delete it and record a new payment instead.")
        return await _update("project_payments", ppid, payload.model_dump())

    @r.delete("/project-payments/{ppid}")
    async def delete_project_payment(ppid: str, _: dict = Depends(require_admin_dep)):
        existing = await _db.project_payments.find_one({"id": ppid}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Not found")
        invoice_id = existing.get("invoice_id")
        await _db.project_payments.delete_one({"id": ppid})
        # Reconcile invoice status based on the new cumulative paid amount
        if invoice_id:
            inv = await _db.project_invoices.find_one({"id": invoice_id}, {"_id": 0})
            if inv:
                remaining = await _db.project_payments.find(
                    {"invoice_id": invoice_id}, {"_id": 0, "amount": 1}
                ).to_list(1000)
                paid_total = round(sum(float(p.get("amount", 0) or 0) for p in remaining), 2)
                total = float(inv.get("total", inv.get("amount", 0)) or 0)
                updates = {}
                if paid_total <= 0.01:
                    # No payments left — back to "sent" if it was paid/partially_paid
                    if inv.get("status") in ("paid", "partially_paid"):
                        updates["status"] = "sent"
                        updates["paid_date"] = ""
                elif paid_total + 0.01 < total:
                    # Still has some payments but no longer fully paid
                    if inv.get("status") == "paid":
                        updates["status"] = "partially_paid"
                        updates["paid_date"] = ""
                if updates:
                    updates["updated_at"] = now_iso()
                    await _db.project_invoices.update_one({"id": invoice_id}, {"$set": updates})
        return {"ok": True}

    # ─── Reachvel Payments (credit / debit ledger) ───
    @r.get("/reachvel-payments/summary")
    async def reachvel_payments_summary(_: dict = Depends(require_admin_dep)):
        items = await _db.reachvel_payments.find({}, {"_id": 0}).to_list(10000)
        credit = round(sum(float(p.get("amount", 0) or 0) for p in items if p.get("type") == "credit"), 2)
        debit = round(sum(float(p.get("amount", 0) or 0) for p in items if p.get("type") == "debit"), 2)
        return {
            "total": len(items),
            "credit_total": credit,
            "debit_total": debit,
            "net": round(credit - debit, 2),
            "synced": sum(1 for p in items if p.get("source_type") and p.get("source_type") != "manual"),
            "manual": sum(1 for p in items if not p.get("source_type") or p.get("source_type") == "manual"),
        }

    @r.get("/reachvel-payments")
    async def list_reachvel_payments(
        type: Optional[str] = None,
        category: Optional[str] = None,
        bank: Optional[str] = None,
        project_id: Optional[str] = None,
        _: dict = Depends(require_admin_dep),
    ):
        query = {}
        if type and type != "all":
            query["type"] = type
        if category and category != "all":
            query["category"] = category
        if bank and bank != "all":
            query["bank"] = bank
        if project_id and project_id != "all":
            query["project_id"] = project_id
        return await _list("reachvel_payments", query)

    @r.post("/reachvel-payments")
    async def create_reachvel_payment(payload: ReachvelPaymentIn, _: dict = Depends(require_admin_dep)):
        if payload.type not in REACHVEL_PAYMENT_TYPES:
            raise HTTPException(400, f"type must be one of {sorted(REACHVEL_PAYMENT_TYPES)}")
        data = payload.model_dump()
        data["source_type"] = "manual"
        data["source_id"] = ""
        return await _create("reachvel_payments", data)

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
        invoices_all = await db.project_invoices.find({}, {"_id": 0}).to_list(5000)
        project_payments_all = await db.project_payments.find({}, {"_id": 0}).to_list(5000)
        expenses_all = await db.project_expenses.find({}, {"_id": 0}).to_list(5000)
        vendor_payments_all = await db.vendor_payments.find({}, {"_id": 0}).to_list(5000)
        reachvel_payments = await db.reachvel_payments.find({}, {"_id": 0}).to_list(5000)
        vendors = await db.vendors.find({}, {"_id": 0}).to_list(5000)

        # Exclude orphan records (project_id pointing to a deleted project)
        # so totals stay truthful even before a cleanup run.
        active_pids = {p["id"] for p in projects}
        invoices = [x for x in invoices_all if x.get("project_id") in active_pids]
        project_payments = [x for x in project_payments_all if x.get("project_id") in active_pids]
        expenses = [x for x in expenses_all if x.get("project_id") in active_pids]
        vendor_payments = [x for x in vendor_payments_all if x.get("project_id") in active_pids]

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
