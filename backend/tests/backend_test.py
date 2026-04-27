"""Backend tests for Reachvel: Contact + Admin endpoints (MongoDB-backed)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://reachvel-studio.preview.emergentagent.com").rstrip("/")
ADMIN_PASSWORD = "reachvel-admin-2026"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_headers():
    return {"X-Admin-Token": ADMIN_PASSWORD, "Content-Type": "application/json"}


# ───────── Health ─────────
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("message") == "Reachvel API"


# ───────── Contact submission ─────────
class TestContact:
    def test_create_valid(self, session):
        payload = {
            "name": "TEST Ada Lovelace",
            "email": "test_ada@example.com",
            "phone": "+1 (415) 555-0199",
            "company": "TEST Co",
            "service": "Web Engineering",
            "budget": "$50k – $150k",
            "note": "We need an engineering partner for our new product line.",
        }
        r = session.post(f"{API}/contact", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"].lower()
        assert data["phone"] == payload["phone"]
        assert data["service"] == payload["service"]
        assert data["note"] == payload["note"]
        assert "_id" not in data
        assert "created_at" in data
        # cache for later test
        pytest.created_id = data["id"]

    def test_invalid_email(self, session):
        r = session.post(f"{API}/contact", json={
            "name": "TEST Bad Email",
            "email": "not-an-email",
            "note": "This is a long enough note to pass minimum length.",
        })
        assert r.status_code == 422

    def test_short_note(self, session):
        r = session.post(f"{API}/contact", json={
            "name": "TEST Short",
            "email": "short@example.com",
            "note": "tiny",
        })
        assert r.status_code == 422

    def test_missing_name(self, session):
        r = session.post(f"{API}/contact", json={
            "name": "",
            "email": "x@example.com",
            "note": "Long enough note for the validator to be happy.",
        })
        assert r.status_code == 422


# ───────── Admin login ─────────
class TestAdminLogin:
    def test_wrong_password(self, session):
        r = session.post(f"{API}/admin/login", json={"password": "wrong"})
        assert r.status_code == 401

    def test_correct_password(self, session):
        r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
        assert r.status_code == 200
        body = r.json()
        assert body.get("token") == ADMIN_PASSWORD


# ───────── Admin protected endpoints ─────────
class TestAdminProtected:
    def test_submissions_no_token(self, session):
        r = session.get(f"{API}/admin/submissions")
        assert r.status_code == 401

    def test_submissions_wrong_token(self, session):
        r = session.get(f"{API}/admin/submissions", headers={"X-Admin-Token": "nope"})
        assert r.status_code == 401

    def test_submissions_valid_token(self, session, admin_headers):
        r = session.get(f"{API}/admin/submissions", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        for item in data:
            assert "_id" not in item
            assert "id" in item and "name" in item and "email" in item
        # contains the one we just created
        ids = [x["id"] for x in data]
        assert getattr(pytest, "created_id", None) in ids
        # sorted by created_at desc
        timestamps = [x["created_at"] for x in data]
        assert timestamps == sorted(timestamps, reverse=True)

    def test_stats_no_token(self, session):
        r = session.get(f"{API}/admin/stats")
        assert r.status_code == 401

    def test_stats_with_token(self, session, admin_headers):
        r = session.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert "total" in data and "today" in data
        assert isinstance(data["total"], int) and isinstance(data["today"], int)
        assert data["total"] >= 1
        assert data["today"] >= 1


# ───────── Admin delete ─────────
class TestAdminDelete:
    def test_delete_not_found(self, session, admin_headers):
        r = session.delete(f"{API}/admin/submissions/non-existent-id-xyz", headers=admin_headers)
        assert r.status_code == 404

    def test_delete_no_token(self, session):
        sub_id = getattr(pytest, "created_id", None)
        assert sub_id, "need created submission"
        r = session.delete(f"{API}/admin/submissions/{sub_id}")
        assert r.status_code == 401

    def test_delete_success_and_persistence(self, session, admin_headers):
        # create a fresh one
        r = session.post(f"{API}/contact", json={
            "name": "TEST DeleteMe",
            "email": "deleteme@example.com",
            "note": "Throwaway record to verify delete pipeline.",
        })
        assert r.status_code == 200
        sub_id = r.json()["id"]

        # delete
        d = session.delete(f"{API}/admin/submissions/{sub_id}", headers=admin_headers)
        assert d.status_code == 200
        assert d.json().get("ok") is True

        # verify removal
        listing = session.get(f"{API}/admin/submissions", headers=admin_headers).json()
        assert sub_id not in [x["id"] for x in listing]

        # second delete -> 404
        d2 = session.delete(f"{API}/admin/submissions/{sub_id}", headers=admin_headers)
        assert d2.status_code == 404


# ───────── Cleanup ─────────
def test_zzz_cleanup_test_data(session, admin_headers):
    """Remove all TEST_-prefixed submissions created during the run."""
    listing = session.get(f"{API}/admin/submissions", headers=admin_headers).json()
    for item in listing:
        if item.get("name", "").startswith("TEST") or item.get("email", "").startswith("test_") or item.get("email") == "deleteme@example.com":
            session.delete(f"{API}/admin/submissions/{item['id']}", headers=admin_headers)
