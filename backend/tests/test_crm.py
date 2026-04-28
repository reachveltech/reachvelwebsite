"""Backend tests for Reachvel Dashboard (CRM) — Iteration 5.

Covers /api/admin/crm/* full CRUD, GST auto-calc on create+update, lead stage
validation, filters, search, analytics aggregation, auth-gating and _id scrub.
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


def _login(session):
    return session.post(
        f"{API}/admin/login",
        json={"password": ADMIN_PASSWORD},
        headers={"X-Forwarded-For": _ip(), "Content-Type": "application/json"},
    )


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_headers(session):
    r = _login(session)
    assert r.status_code == 200, r.text
    return {"X-Admin-Token": r.json()["token"], "Content-Type": "application/json"}


def _delete(session, admin_headers, path, ids):
    for i in ids:
        try:
            session.delete(f"{CRM}{path}/{i}", headers=admin_headers)
        except Exception:
            pass


# ───────── Auth gating ─────────
class TestAuthGating:
    @pytest.mark.parametrize("path", [
        "/leads", "/vendors", "/projects", "/tasks", "/expenses",
        "/vendor-payments", "/invoices", "/project-payments",
        "/reachvel-payments", "/analytics",
    ])
    def test_get_without_token_401(self, session, path):
        assert session.get(f"{CRM}{path}").status_code == 401

    @pytest.mark.parametrize("path", [
        "/leads", "/vendors", "/projects", "/tasks", "/expenses",
        "/vendor-payments", "/invoices", "/project-payments",
        "/reachvel-payments",
    ])
    def test_post_without_token_401(self, session, path):
        assert session.post(f"{CRM}{path}", json={}).status_code == 401


# ───────── Leads ─────────
class TestLeads:
    created = []

    def test_invalid_stage_400(self, session, admin_headers):
        r = session.post(f"{CRM}/leads", json={
            "name": "TEST Bad Stage", "stage": "banana"
        }, headers=admin_headers)
        assert r.status_code == 400

    def test_create_and_persist(self, session, admin_headers):
        payload = {
            "name": "TEST Alice Acme", "email": "alice@acme.io",
            "company": "Acme", "service": "Web",
            "value": 50000, "stage": "qualified", "source": "referral",
        }
        r = session.post(f"{CRM}/leads", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and "_id" not in data
        assert data["stage"] == "qualified"
        assert data["value"] == 50000
        TestLeads.created.append(data["id"])

    def test_update_changes_persist(self, session, admin_headers):
        lid = TestLeads.created[0]
        r = session.put(f"{CRM}/leads/{lid}", json={
            "name": "TEST Alice Acme", "email": "alice@acme.io",
            "stage": "won", "value": 75000,
        }, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["stage"] == "won"
        g = session.get(f"{CRM}/leads", headers=admin_headers).json()
        found = next((x for x in g if x["id"] == lid), None)
        assert found and found["value"] == 75000

    def test_filter_by_stage(self, session, admin_headers):
        # create one 'new' and one 'qualified'
        r1 = session.post(f"{CRM}/leads", json={"name": "TEST NewLead", "stage": "new"}, headers=admin_headers)
        r2 = session.post(f"{CRM}/leads", json={"name": "TEST QualLead", "stage": "qualified"}, headers=admin_headers)
        TestLeads.created.extend([r1.json()["id"], r2.json()["id"]])
        r = session.get(f"{CRM}/leads", headers=admin_headers, params={"stage": "qualified"})
        assert r.status_code == 200
        assert all(x["stage"] == "qualified" for x in r.json())
        assert r2.json()["id"] in [x["id"] for x in r.json()]

    def test_search_q(self, session, admin_headers):
        r = session.get(f"{CRM}/leads", headers=admin_headers, params={"q": "alice"})
        assert r.status_code == 200
        names = [x["name"].lower() for x in r.json()]
        assert any("alice" in n for n in names)

    def test_cleanup(self, session, admin_headers):
        _delete(session, admin_headers, "/leads", TestLeads.created)
        TestLeads.created.clear()


# ───────── Vendors ─────────
class TestVendors:
    created = []

    def test_crud(self, session, admin_headers):
        r = session.post(f"{CRM}/vendors", json={
            "name": "TEST CloudCorp", "company": "CloudCorp Pvt",
            "email": "v@cloudcorp.io", "services": "Hosting",
        }, headers=admin_headers)
        assert r.status_code == 200
        vid = r.json()["id"]
        TestVendors.created.append(vid)
        assert "_id" not in r.json()

        # update
        up = session.put(f"{CRM}/vendors/{vid}", json={
            "name": "TEST CloudCorp", "company": "CloudCorp Ltd",
            "email": "v@cloudcorp.io",
        }, headers=admin_headers)
        assert up.status_code == 200
        assert up.json()["company"] == "CloudCorp Ltd"

        # search
        s = session.get(f"{CRM}/vendors", headers=admin_headers, params={"q": "cloud"})
        assert s.status_code == 200
        assert vid in [x["id"] for x in s.json()]

    def test_cleanup(self, session, admin_headers):
        _delete(session, admin_headers, "/vendors", TestVendors.created)
        TestVendors.created.clear()


# ───────── CRM Projects + Tasks filters ─────────
class TestProjectsAndTasks:
    created_projects = []
    created_tasks = []

    def test_invalid_status_400(self, session, admin_headers):
        r = session.post(f"{CRM}/projects", json={"name": "TEST Bad", "status": "fake"}, headers=admin_headers)
        assert r.status_code == 400

    def test_create_and_filter(self, session, admin_headers):
        r1 = session.post(f"{CRM}/projects", json={
            "name": "TEST Proj Active", "client": "C1", "status": "in_progress", "budget": 100000,
        }, headers=admin_headers)
        r2 = session.post(f"{CRM}/projects", json={
            "name": "TEST Proj Plan", "client": "C2", "status": "planning",
        }, headers=admin_headers)
        assert r1.status_code == 200 and r2.status_code == 200
        TestProjectsAndTasks.created_projects.extend([r1.json()["id"], r2.json()["id"]])

        r = session.get(f"{CRM}/projects", headers=admin_headers, params={"status": "in_progress"})
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert r1.json()["id"] in ids and r2.json()["id"] not in ids

    def test_task_filter_by_project_and_status(self, session, admin_headers):
        pid = TestProjectsAndTasks.created_projects[0]
        t1 = session.post(f"{CRM}/tasks", json={
            "title": "TEST Task Todo", "project_id": pid, "status": "todo", "priority": "high",
        }, headers=admin_headers)
        t2 = session.post(f"{CRM}/tasks", json={
            "title": "TEST Task Done", "project_id": pid, "status": "done", "priority": "medium",
        }, headers=admin_headers)
        assert t1.status_code == 200 and t2.status_code == 200
        TestProjectsAndTasks.created_tasks.extend([t1.json()["id"], t2.json()["id"]])

        r = session.get(f"{CRM}/tasks", headers=admin_headers,
                        params={"project_id": pid, "status": "todo"})
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert t1.json()["id"] in ids and t2.json()["id"] not in ids

    def test_cleanup(self, session, admin_headers):
        _delete(session, admin_headers, "/tasks", TestProjectsAndTasks.created_tasks)
        _delete(session, admin_headers, "/projects", TestProjectsAndTasks.created_projects)
        TestProjectsAndTasks.created_tasks.clear()
        TestProjectsAndTasks.created_projects.clear()


# ───────── GST auto-calc (Invoices + Vendor payments) ─────────
class TestGSTAutoCalc:
    created = {"invoices": [], "vendor_payments": [], "projects": [], "vendors": []}

    def _project(self, session, admin_headers):
        r = session.post(f"{CRM}/projects", json={"name": "TEST GST Proj", "client": "X", "status": "in_progress"},
                         headers=admin_headers)
        pid = r.json()["id"]
        TestGSTAutoCalc.created["projects"].append(pid)
        return pid

    def test_invoice_create_gst(self, session, admin_headers):
        pid = self._project(session, admin_headers)
        r = session.post(f"{CRM}/invoices", json={
            "project_id": pid, "invoice_number": "TEST-INV-001",
            "amount": 1000, "gst_pct": 18, "status": "draft",
        }, headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["gst_amount"] == 180.0
        assert d["total"] == 1180.0
        TestGSTAutoCalc.created["invoices"].append(d["id"])

    def test_invoice_update_recomputes_gst(self, session, admin_headers):
        iid = TestGSTAutoCalc.created["invoices"][0]
        r = session.put(f"{CRM}/invoices/{iid}", json={
            "project_id": "", "amount": 2000, "gst_pct": 5, "status": "sent",
            "invoice_number": "TEST-INV-001",
        }, headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["gst_amount"] == 100.0
        assert d["total"] == 2100.0
        assert d["status"] == "sent"

    def test_invoice_filter_status_and_project(self, session, admin_headers):
        pid = TestGSTAutoCalc.created["projects"][0]
        # filter by project_id
        r = session.get(f"{CRM}/invoices", headers=admin_headers, params={"project_id": pid})
        assert r.status_code == 200
        # filter by status=sent (we set one to sent)
        r2 = session.get(f"{CRM}/invoices", headers=admin_headers, params={"status": "sent"})
        assert r2.status_code == 200
        assert all(x["status"] == "sent" for x in r2.json())

    def test_vendor_payment_gst_create_and_update(self, session, admin_headers):
        vr = session.post(f"{CRM}/vendors", json={"name": "TEST GST Vendor"}, headers=admin_headers)
        vid = vr.json()["id"]
        TestGSTAutoCalc.created["vendors"].append(vid)
        r = session.post(f"{CRM}/vendor-payments", json={
            "vendor_id": vid, "project_id": "", "amount": 500, "gst_pct": 18,
            "status": "pending", "description": "TEST vendor payment",
        }, headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["gst_amount"] == 90.0
        assert d["total"] == 590.0
        vpid = d["id"]
        TestGSTAutoCalc.created["vendor_payments"].append(vpid)

        # update: change amount + gst_pct, expect recompute
        u = session.put(f"{CRM}/vendor-payments/{vpid}", json={
            "vendor_id": vid, "amount": 1000, "gst_pct": 12, "status": "paid",
            "description": "TEST vendor payment updated",
        }, headers=admin_headers)
        assert u.status_code == 200
        ud = u.json()
        assert ud["gst_amount"] == 120.0
        assert ud["total"] == 1120.0

    def test_cleanup(self, session, admin_headers):
        _delete(session, admin_headers, "/vendor-payments", TestGSTAutoCalc.created["vendor_payments"])
        _delete(session, admin_headers, "/invoices", TestGSTAutoCalc.created["invoices"])
        _delete(session, admin_headers, "/vendors", TestGSTAutoCalc.created["vendors"])
        _delete(session, admin_headers, "/projects", TestGSTAutoCalc.created["projects"])


# ───────── Reachvel Payments (credit/debit) ─────────
class TestReachvelPayments:
    created = []

    def test_invalid_type_400(self, session, admin_headers):
        r = session.post(f"{CRM}/reachvel-payments", json={
            "type": "foo", "description": "TEST bad"
        }, headers=admin_headers)
        assert r.status_code == 400

    def test_create_and_filter(self, session, admin_headers):
        c = session.post(f"{CRM}/reachvel-payments", json={
            "type": "credit", "description": "TEST credit A", "amount": 10000,
        }, headers=admin_headers)
        d = session.post(f"{CRM}/reachvel-payments", json={
            "type": "debit", "description": "TEST debit A", "amount": 3000,
        }, headers=admin_headers)
        assert c.status_code == 200 and d.status_code == 200
        TestReachvelPayments.created.extend([c.json()["id"], d.json()["id"]])
        r = session.get(f"{CRM}/reachvel-payments", headers=admin_headers, params={"type": "debit"})
        assert r.status_code == 200
        assert all(x["type"] == "debit" for x in r.json())
        assert d.json()["id"] in [x["id"] for x in r.json()]

    def test_cleanup(self, session, admin_headers):
        _delete(session, admin_headers, "/reachvel-payments", TestReachvelPayments.created)
        TestReachvelPayments.created.clear()


# ───────── Analytics aggregation ─────────
class TestAnalytics:
    def test_shape(self, session, admin_headers):
        r = session.get(f"{CRM}/analytics", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert "summary" in data
        s = data["summary"]
        for k in ("revenue_collected", "invoiced_total", "invoiced_paid",
                  "invoiced_pending", "total_expenses", "total_vendor_outflow",
                  "total_credit", "total_debit", "net_profit",
                  "pipeline_value", "won_value"):
            assert k in s, f"missing summary.{k}"
        for k in ("leads_by_stage", "projects_by_status", "tasks_by_status",
                  "monthly", "top_vendors"):
            assert k in data, f"missing {k}"
        assert isinstance(data["monthly"], list)
        if data["monthly"]:
            m0 = data["monthly"][0]
            assert "month" in m0 and "revenue" in m0 and "expenses" in m0

    def test_aggregation_math(self, session, admin_headers):
        # seed: one credit 5000, one debit 2000, one project payment 1000
        c = session.post(f"{CRM}/reachvel-payments", json={
            "type": "credit", "description": "TEST agg credit", "amount": 5000,
        }, headers=admin_headers).json()["id"]
        d = session.post(f"{CRM}/reachvel-payments", json={
            "type": "debit", "description": "TEST agg debit", "amount": 2000,
        }, headers=admin_headers).json()["id"]
        pp = session.post(f"{CRM}/project-payments", json={
            "project_id": "", "invoice_id": "", "amount": 1000, "method": "upi",
        }, headers=admin_headers).json()["id"]

        r = session.get(f"{CRM}/analytics", headers=admin_headers)
        s = r.json()["summary"]
        assert s["total_credit"] >= 5000
        assert s["total_debit"] >= 2000
        assert s["revenue_collected"] >= 1000

        # cleanup
        _delete(session, admin_headers, "/reachvel-payments", [c, d])
        _delete(session, admin_headers, "/project-payments", [pp])


# ───────── No Mongo _id leak anywhere ─────────
class TestNoOidLeak:
    @pytest.mark.parametrize("path", [
        "/leads", "/vendors", "/projects", "/tasks", "/expenses",
        "/vendor-payments", "/invoices", "/project-payments", "/reachvel-payments",
    ])
    def test_list_no_oid(self, session, admin_headers, path):
        r = session.get(f"{CRM}{path}", headers=admin_headers)
        assert r.status_code == 200
        for item in r.json():
            assert "_id" not in item
