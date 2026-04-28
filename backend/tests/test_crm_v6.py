"""Iteration 6 backend tests for CRM additions:
- /leads/summary, /vendors/summary, /projects/summary, /reachvel-payments/summary
- /projects/aggregates derived per-project rollup
- gst_applicable=false → gst_amount=0, total=amount on invoices/expenses/vendor-payments
- new filters: leads ?service=&source=, vendors ?status=, projects ?project_group=,
  reachvel-payments ?category=&bank=&project_id=
- POST /reachvel-payments/sync idempotency + source_type=manual on direct create
- convert lead → project carries new fields (project_group='', gst_applicable=true, vendor_id='')
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
CRM = f"{API}/admin/crm"
ADMIN_PASSWORD = "reachvel-admin-2026"


def _ip():
    return f"10.{os.getpid() % 255}.{int(time.time()) % 255}.{uuid.uuid4().int % 255}"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_headers(session):
    r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD},
                     headers={"X-Forwarded-For": _ip(), "Content-Type": "application/json"})
    assert r.status_code == 200, r.text
    return {"X-Admin-Token": r.json()["token"], "Content-Type": "application/json"}


def _del(session, headers, path, ids):
    for i in ids:
        try:
            session.delete(f"{CRM}{path}/{i}", headers=headers)
        except Exception:
            pass


# ───────── Summary endpoints ─────────
class TestSummaries:
    def test_leads_summary_shape(self, session, admin_headers):
        r = session.get(f"{CRM}/leads/summary", headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("total", "by_stage", "pipeline_value", "won_value", "follow_ups_due_7d"):
            assert k in d
        assert isinstance(d["by_stage"], dict)
        for st in ("new", "contacted", "qualified", "proposal", "won", "lost"):
            assert st in d["by_stage"]

    def test_vendors_summary_shape(self, session, admin_headers):
        r = session.get(f"{CRM}/vendors/summary", headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("total", "active", "inactive", "total_paid_outflow"):
            assert k in d
        assert d["total"] == d["active"] + d["inactive"]

    def test_projects_summary_shape(self, session, admin_headers):
        r = session.get(f"{CRM}/projects/summary", headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("total", "by_status", "total_budget", "total_invoiced",
                  "total_received", "total_general_expenses",
                  "total_vendor_expenses", "net_profit"):
            assert k in d

    def test_reachvel_summary_shape(self, session, admin_headers):
        r = session.get(f"{CRM}/reachvel-payments/summary", headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("total", "credit_total", "debit_total", "net", "synced", "manual"):
            assert k in d


# ───────── New filters ─────────
class TestNewFilters:
    created = {"leads": [], "vendors": [], "projects": [], "rp": []}

    def test_lead_service_source_filter(self, session, admin_headers):
        a = session.post(f"{CRM}/leads", json={
            "name": "TEST6 Lead Web", "service": "Website Development",
            "source": "Referral", "stage": "new",
        }, headers=admin_headers).json()
        b = session.post(f"{CRM}/leads", json={
            "name": "TEST6 Lead AI", "service": "AI Automation",
            "source": "Event", "stage": "new",
        }, headers=admin_headers).json()
        TestNewFilters.created["leads"].extend([a["id"], b["id"]])

        r = session.get(f"{CRM}/leads", headers=admin_headers,
                        params={"service": "Website Development"})
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert a["id"] in ids and b["id"] not in ids

        r = session.get(f"{CRM}/leads", headers=admin_headers, params={"source": "Event"})
        ids = [x["id"] for x in r.json()]
        assert b["id"] in ids and a["id"] not in ids

    def test_vendor_status_filter_active_includes_legacy(self, session, admin_headers):
        v_active = session.post(f"{CRM}/vendors", json={
            "name": "TEST6 V Active", "status": "active",
        }, headers=admin_headers).json()
        v_inactive = session.post(f"{CRM}/vendors", json={
            "name": "TEST6 V Inactive", "status": "inactive",
        }, headers=admin_headers).json()
        TestNewFilters.created["vendors"].extend([v_active["id"], v_inactive["id"]])

        r = session.get(f"{CRM}/vendors", headers=admin_headers, params={"status": "inactive"})
        ids = [x["id"] for x in r.json()]
        assert v_inactive["id"] in ids and v_active["id"] not in ids

        # active should include legacy (records without status field)
        r = session.get(f"{CRM}/vendors", headers=admin_headers, params={"status": "active"})
        ids = [x["id"] for x in r.json()]
        assert v_active["id"] in ids
        assert v_inactive["id"] not in ids

    def test_project_group_filter(self, session, admin_headers):
        a = session.post(f"{CRM}/projects", json={
            "name": "TEST6 P CRM", "client": "C", "status": "planning",
            "project_group": "CRM",
        }, headers=admin_headers).json()
        b = session.post(f"{CRM}/projects", json={
            "name": "TEST6 P Mobile", "client": "C", "status": "planning",
            "project_group": "Mobile App",
        }, headers=admin_headers).json()
        TestNewFilters.created["projects"].extend([a["id"], b["id"]])

        r = session.get(f"{CRM}/projects", headers=admin_headers, params={"project_group": "CRM"})
        ids = [x["id"] for x in r.json()]
        assert a["id"] in ids and b["id"] not in ids

    def test_reachvel_category_bank_project_filter(self, session, admin_headers):
        proj = session.post(f"{CRM}/projects", json={
            "name": "TEST6 P For RP", "client": "X", "status": "planning",
        }, headers=admin_headers).json()
        TestNewFilters.created["projects"].append(proj["id"])

        a = session.post(f"{CRM}/reachvel-payments", json={
            "type": "credit", "description": "TEST6 cat A", "amount": 100,
            "category": "Revenue", "bank": "SBI", "project_id": proj["id"],
        }, headers=admin_headers).json()
        b = session.post(f"{CRM}/reachvel-payments", json={
            "type": "debit", "description": "TEST6 cat B", "amount": 50,
            "category": "Marketing", "bank": "Kotak",
        }, headers=admin_headers).json()
        TestNewFilters.created["rp"].extend([a["id"], b["id"]])

        r = session.get(f"{CRM}/reachvel-payments", headers=admin_headers, params={"category": "Revenue"})
        ids = [x["id"] for x in r.json()]
        assert a["id"] in ids and b["id"] not in ids

        r = session.get(f"{CRM}/reachvel-payments", headers=admin_headers, params={"bank": "Kotak"})
        ids = [x["id"] for x in r.json()]
        assert b["id"] in ids and a["id"] not in ids

        r = session.get(f"{CRM}/reachvel-payments", headers=admin_headers,
                        params={"project_id": proj["id"]})
        ids = [x["id"] for x in r.json()]
        assert a["id"] in ids and b["id"] not in ids

    def test_manual_create_marks_source_type(self, session, admin_headers):
        a = session.post(f"{CRM}/reachvel-payments", json={
            "type": "credit", "description": "TEST6 manual", "amount": 10,
            "category": "Others",
        }, headers=admin_headers).json()
        TestNewFilters.created["rp"].append(a["id"])
        assert a.get("source_type") == "manual"

    def test_cleanup(self, session, admin_headers):
        _del(session, admin_headers, "/reachvel-payments", TestNewFilters.created["rp"])
        _del(session, admin_headers, "/projects", TestNewFilters.created["projects"])
        _del(session, admin_headers, "/vendors", TestNewFilters.created["vendors"])
        _del(session, admin_headers, "/leads", TestNewFilters.created["leads"])


# ───────── GST non-applicable behaviour ─────────
class TestGstNonApplicable:
    created = {"projects": [], "invoices": [], "expenses": [], "vps": [], "vendors": []}

    def test_invoice_non_gst_create_and_update(self, session, admin_headers):
        proj = session.post(f"{CRM}/projects", json={
            "name": "TEST6 GST off", "client": "X", "status": "planning",
        }, headers=admin_headers).json()
        TestGstNonApplicable.created["projects"].append(proj["id"])

        r = session.post(f"{CRM}/invoices", json={
            "project_id": proj["id"], "invoice_number": "TEST6-INV-001",
            "amount": 1500, "gst_pct": 18, "gst_applicable": False,
            "status": "draft",
        }, headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["gst_amount"] == 0.0
        assert d["gst_pct"] == 0.0
        assert d["total"] == 1500.0
        TestGstNonApplicable.created["invoices"].append(d["id"])

        # update — flip back to gst_applicable=True with pct=10
        u = session.put(f"{CRM}/invoices/{d['id']}", json={
            "project_id": proj["id"], "invoice_number": "TEST6-INV-001",
            "amount": 1000, "gst_pct": 10, "gst_applicable": True,
            "status": "sent",
        }, headers=admin_headers).json()
        assert u["gst_amount"] == 100.0
        assert u["total"] == 1100.0

    def test_expense_non_gst(self, session, admin_headers):
        pid = TestGstNonApplicable.created["projects"][0]
        r = session.post(f"{CRM}/expenses", json={
            "project_id": pid, "description": "TEST6 non-gst expense",
            "amount": 250, "gst_pct": 18, "gst_applicable": False,
        }, headers=admin_headers).json()
        TestGstNonApplicable.created["expenses"].append(r["id"])
        assert r["gst_amount"] == 0.0
        assert r["total"] == 250.0

        # update with GST on
        u = session.put(f"{CRM}/expenses/{r['id']}", json={
            "project_id": pid, "description": "TEST6 expense gst on",
            "amount": 200, "gst_pct": 18, "gst_applicable": True,
        }, headers=admin_headers).json()
        assert u["gst_amount"] == 36.0
        assert u["total"] == 236.0

    def test_vendor_payment_non_gst(self, session, admin_headers):
        v = session.post(f"{CRM}/vendors", json={"name": "TEST6 V"}, headers=admin_headers).json()
        TestGstNonApplicable.created["vendors"].append(v["id"])
        pid = TestGstNonApplicable.created["projects"][0]
        r = session.post(f"{CRM}/vendor-payments", json={
            "vendor_id": v["id"], "project_id": pid,
            "description": "TEST6 vp no gst", "amount": 800,
            "gst_pct": 18, "gst_applicable": False, "status": "pending",
        }, headers=admin_headers).json()
        TestGstNonApplicable.created["vps"].append(r["id"])
        assert r["gst_amount"] == 0.0
        assert r["total"] == 800.0

    def test_cleanup(self, session, admin_headers):
        _del(session, admin_headers, "/vendor-payments", TestGstNonApplicable.created["vps"])
        _del(session, admin_headers, "/expenses", TestGstNonApplicable.created["expenses"])
        _del(session, admin_headers, "/invoices", TestGstNonApplicable.created["invoices"])
        _del(session, admin_headers, "/vendors", TestGstNonApplicable.created["vendors"])
        _del(session, admin_headers, "/projects", TestGstNonApplicable.created["projects"])


# ───────── Aggregates + Sync + total_expenses on project list ─────────
class TestAggregatesAndSync:
    created = {"projects": [], "invoices": [], "expenses": [], "vps": [],
               "pps": [], "vendors": [], "rp_to_clean": []}

    def test_project_list_includes_total_expenses(self, session, admin_headers):
        proj = session.post(f"{CRM}/projects", json={
            "name": "TEST6 Agg Project", "client": "Acme",
            "status": "in_progress", "budget": 100000,
            "project_group": "Website", "gst_applicable": True,
        }, headers=admin_headers).json()
        TestAggregatesAndSync.created["projects"].append(proj["id"])

        # Add 1 expense (gst on) and 1 paid vendor payment
        ex = session.post(f"{CRM}/expenses", json={
            "project_id": proj["id"], "description": "TEST6 expense",
            "amount": 1000, "gst_pct": 18, "gst_applicable": True,
        }, headers=admin_headers).json()
        TestAggregatesAndSync.created["expenses"].append(ex["id"])

        vendor = session.post(f"{CRM}/vendors", json={"name": "TEST6 vAgg"}, headers=admin_headers).json()
        TestAggregatesAndSync.created["vendors"].append(vendor["id"])
        vp = session.post(f"{CRM}/vendor-payments", json={
            "vendor_id": vendor["id"], "project_id": proj["id"],
            "description": "TEST6 vp paid", "amount": 500, "gst_pct": 0,
            "gst_applicable": False, "status": "paid",
        }, headers=admin_headers).json()
        TestAggregatesAndSync.created["vps"].append(vp["id"])

        # Add 1 invoice (sent) + 1 project payment
        inv = session.post(f"{CRM}/invoices", json={
            "project_id": proj["id"], "invoice_number": "TEST6-AGG-1",
            "amount": 2000, "gst_pct": 18, "gst_applicable": True,
            "status": "sent",
        }, headers=admin_headers).json()
        TestAggregatesAndSync.created["invoices"].append(inv["id"])
        pp = session.post(f"{CRM}/project-payments", json={
            "project_id": proj["id"], "invoice_id": inv["id"],
            "amount": 800, "method": "upi",
        }, headers=admin_headers).json()
        TestAggregatesAndSync.created["pps"].append(pp["id"])

        # Project list should have total_expenses = 1180 (gst on 1000) + 500 = 1680
        r = session.get(f"{CRM}/projects", headers=admin_headers).json()
        row = next((x for x in r if x["id"] == proj["id"]), None)
        assert row is not None
        assert "total_expenses" in row
        assert row["total_expenses"] == 1680.0

    def test_aggregates_endpoint(self, session, admin_headers):
        pid = TestAggregatesAndSync.created["projects"][0]
        r = session.get(f"{CRM}/projects/aggregates", headers=admin_headers)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        row = next((x for x in rows if x["id"] == pid), None)
        assert row is not None
        for k in ("id", "name", "client", "project_group", "gst_applicable",
                  "total_budget", "total_invoiced", "total_received",
                  "total_general_expenses", "total_vendor_expenses",
                  "profit", "status"):
            assert k in row, f"missing {k}"
        assert row["total_invoiced"] == 2360.0  # 2000+18% gst
        assert row["total_received"] == 800.0
        assert row["total_general_expenses"] == 1180.0  # 1000 + 18% gst
        assert row["total_vendor_expenses"] == 500.0
        assert row["profit"] == round(800 - 1180 - 500, 2)

    def test_sync_idempotent(self, session, admin_headers):
        # First sync — should add at least 1 credit (project payment) + 2 debits (1 expense + 1 paid vp)
        r1 = session.post(f"{CRM}/reachvel-payments/sync", headers=admin_headers)
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert d1["ok"] is True
        assert d1["added_credits"] >= 1
        assert d1["added_debits"] >= 2

        # Second sync — must be 0 added (idempotent), updated likely 0 too
        r2 = session.post(f"{CRM}/reachvel-payments/sync", headers=admin_headers)
        d2 = r2.json()
        assert d2["added_credits"] == 0
        assert d2["added_debits"] == 0

        # Verify materialized rows have correct source_type values
        rps = session.get(f"{CRM}/reachvel-payments", headers=admin_headers).json()
        synced = [x for x in rps if x.get("source_type") in ("project_payment", "expense", "vendor_payment")]
        assert len(synced) >= 3
        # Pick our records by source_id and remember to clean up
        our_ids = {TestAggregatesAndSync.created["pps"][0],
                   TestAggregatesAndSync.created["expenses"][0],
                   TestAggregatesAndSync.created["vps"][0]}
        ours = [x for x in synced if x.get("source_id") in our_ids]
        assert len(ours) == 3
        TestAggregatesAndSync.created["rp_to_clean"] = [x["id"] for x in ours]
        # Each must point to a real source_type
        kinds = {x["source_type"] for x in ours}
        assert kinds == {"project_payment", "expense", "vendor_payment"}

    def test_cleanup(self, session, admin_headers):
        _del(session, admin_headers, "/reachvel-payments", TestAggregatesAndSync.created["rp_to_clean"])
        _del(session, admin_headers, "/project-payments", TestAggregatesAndSync.created["pps"])
        _del(session, admin_headers, "/invoices", TestAggregatesAndSync.created["invoices"])
        _del(session, admin_headers, "/vendor-payments", TestAggregatesAndSync.created["vps"])
        _del(session, admin_headers, "/expenses", TestAggregatesAndSync.created["expenses"])
        _del(session, admin_headers, "/vendors", TestAggregatesAndSync.created["vendors"])
        _del(session, admin_headers, "/projects", TestAggregatesAndSync.created["projects"])


# ───────── Convert lead → project carries new fields ─────────
class TestConvertLead:
    def test_convert_carries_new_fields(self, session, admin_headers):
        r = session.post(f"{CRM}/leads", json={
            "name": "TEST6 Convert Lead", "company": "ConvCo",
            "value": 12345, "stage": "qualified",
        }, headers=admin_headers)
        assert r.status_code == 200
        lid = r.json()["id"]
        try:
            c = session.post(f"{CRM}/leads/{lid}/convert", headers=admin_headers)
            assert c.status_code == 200, c.text
            data = c.json()
            assert data.get("created") is True
            proj = data["project"]
            assert proj.get("project_group") == ""
            assert proj.get("gst_applicable") is True
            assert proj.get("vendor_id") == ""
            assert proj.get("budget") == 12345
            try:
                session.delete(f"{CRM}/projects/{proj['id']}", headers=admin_headers)
            except Exception:
                pass
        finally:
            session.delete(f"{CRM}/leads/{lid}", headers=admin_headers)
