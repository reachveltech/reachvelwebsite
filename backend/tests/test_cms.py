"""Iteration 4 backend tests — CMS for Projects, Articles, Roles.

Covers:
- Public reads (no auth) for /api/projects, /api/articles, /api/articles/:slug, /api/roles
- Admin auth gating on all /api/admin/{projects,articles,roles}
- CRUD round-trips with slug auto-gen and uniqueness (-2 suffix)
- Field round-trips: metrics [{k,v}], body [str,...], featured bool
- Public /api/roles only returns active=true; admin sees all
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "reachvel-admin-2026"


def _ip():
    return f"10.{os.getpid() % 255}.{int(time.time()) % 255}.{uuid.uuid4().int % 255}"


def _login(session):
    r = session.post(f"{API}/admin/login",
                     json={"password": ADMIN_PASSWORD},
                     headers={"X-Forwarded-For": _ip(),
                              "Content-Type": "application/json"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def admin_headers(session):
    tok = _login(session)
    return {"X-Admin-Token": tok, "Content-Type": "application/json"}


# ────────────── Public reads ──────────────
class TestPublicReads:
    def test_projects_public_seeded(self, session):
        r = session.get(f"{API}/projects")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 6
        for p in items:
            assert "_id" not in p
            assert "id" in p and "slug" in p and "title" in p
        # display_order ascending
        orders = [p.get("display_order", 0) for p in items]
        assert orders == sorted(orders)

    def test_articles_public_seeded_with_featured(self, session):
        r = session.get(f"{API}/articles")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 6
        assert any(a.get("featured") is True for a in items)
        for a in items:
            assert "_id" not in a
            assert "read_time" in a  # snake_case
            assert isinstance(a.get("body"), list)

    def test_articles_get_by_slug(self, session):
        items = session.get(f"{API}/articles").json()
        slug = items[0]["slug"]
        r = session.get(f"{API}/articles/{slug}")
        assert r.status_code == 200
        body = r.json()
        assert body["slug"] == slug
        assert isinstance(body["body"], list)

    def test_articles_bad_slug_404(self, session):
        r = session.get(f"{API}/articles/this-slug-definitely-does-not-exist-xyz123")
        assert r.status_code == 404

    def test_roles_public_only_active(self, session):
        r = session.get(f"{API}/roles")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 8
        assert all(role.get("active") is True for role in items)


# ────────────── Auth gating ──────────────
class TestAuthGating:
    @pytest.mark.parametrize("path", [
        "/admin/projects", "/admin/articles", "/admin/roles",
    ])
    def test_list_requires_token(self, session, path):
        r = session.get(f"{API}{path}")
        assert r.status_code == 401

    @pytest.mark.parametrize("path", [
        "/admin/projects", "/admin/articles", "/admin/roles",
    ])
    def test_create_requires_token(self, session, path):
        r = session.post(f"{API}{path}", json={"title": "x"})
        assert r.status_code == 401


# ────────────── Projects CRUD ──────────────
class TestProjectsCRUD:
    created_ids = []

    def test_create_auto_slug(self, session, admin_headers):
        title = f"TEST Project {uuid.uuid4().hex[:6]}"
        payload = {
            "title": title, "client": "TEST Client", "domain": "AI", "year": "2026",
            "summary": "Summary text.", "cover": "", "video": "",
            "services": ["Web", "AI"],
            "metrics": [{"k": "+50%", "v": "Growth"}, {"k": "10ms", "v": "p95"}],
            "display_order": 999,
        }
        r = session.post(f"{API}/admin/projects", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] == title
        assert data["slug"]  # auto-generated
        assert "_id" not in data
        assert data["metrics"] == payload["metrics"]
        assert data["services"] == payload["services"]
        TestProjectsCRUD.created_ids.append(data["id"])
        TestProjectsCRUD._first_slug = data["slug"]
        TestProjectsCRUD._first_title = title

    def test_create_same_title_unique_slug(self, session, admin_headers):
        title = TestProjectsCRUD._first_title
        r = session.post(f"{API}/admin/projects",
                         json={"title": title, "metrics": [], "services": []},
                         headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["slug"] != TestProjectsCRUD._first_slug
        assert data["slug"].endswith("-2") or "-" in data["slug"]
        TestProjectsCRUD.created_ids.append(data["id"])

    def test_admin_list_ordered(self, session, admin_headers):
        r = session.get(f"{API}/admin/projects", headers=admin_headers)
        assert r.status_code == 200
        items = r.json()
        orders = [p.get("display_order", 0) for p in items]
        assert orders == sorted(orders)
        # our created items present
        ids = {p["id"] for p in items}
        for cid in TestProjectsCRUD.created_ids:
            assert cid in ids

    def test_update_and_slug_change(self, session, admin_headers):
        pid = TestProjectsCRUD.created_ids[0]
        new_slug = f"test-renamed-{uuid.uuid4().hex[:6]}"
        r = session.put(f"{API}/admin/projects/{pid}",
                        json={"title": "TEST Updated Title",
                              "slug": new_slug,
                              "metrics": [{"k": "A", "v": "B"}],
                              "services": ["Mobile"]},
                        headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json()["slug"] == new_slug
        assert r.json()["title"] == "TEST Updated Title"
        assert r.json()["metrics"] == [{"k": "A", "v": "B"}]

        # Reading public reflects update
        pub = session.get(f"{API}/projects").json()
        got = next((p for p in pub if p["id"] == pid), None)
        assert got and got["slug"] == new_slug

    def test_update_keep_slug_no_collision(self, session, admin_headers):
        # update without changing slug — should not bump it
        pid = TestProjectsCRUD.created_ids[0]
        existing = next(p for p in session.get(f"{API}/admin/projects",
                                               headers=admin_headers).json() if p["id"] == pid)
        r = session.put(f"{API}/admin/projects/{pid}",
                        json={"title": existing["title"], "slug": existing["slug"],
                              "metrics": [], "services": []},
                        headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["slug"] == existing["slug"]

    def test_delete(self, session, admin_headers):
        for pid in TestProjectsCRUD.created_ids:
            assert session.delete(f"{API}/admin/projects/{pid}",
                                  headers=admin_headers).status_code == 200
        # second delete -> 404
        assert session.delete(f"{API}/admin/projects/{TestProjectsCRUD.created_ids[0]}",
                              headers=admin_headers).status_code == 404


# ────────────── Articles CRUD ──────────────
class TestArticlesCRUD:
    created_ids = []

    def test_create_with_body_paragraphs_and_featured(self, session, admin_headers):
        title = f"TEST Article {uuid.uuid4().hex[:6]}"
        body = ["Para one.", "Para two.", "Para three."]
        r = session.post(f"{API}/admin/articles",
                         json={"title": title, "excerpt": "x", "category": "AI",
                               "date": "Jan 2026", "read_time": "5 min", "author": "TestAuthor",
                               "body": body, "featured": True},
                         headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["body"] == body
        assert data["featured"] is True
        assert data["read_time"] == "5 min"
        TestArticlesCRUD.created_ids.append(data["id"])
        TestArticlesCRUD._slug1 = data["slug"]
        TestArticlesCRUD._title = title

    def test_create_same_title_unique_slug(self, session, admin_headers):
        r = session.post(f"{API}/admin/articles",
                         json={"title": TestArticlesCRUD._title, "body": []},
                         headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["slug"] != TestArticlesCRUD._slug1
        TestArticlesCRUD.created_ids.append(r.json()["id"])

    def test_featured_visible_in_public_list(self, session):
        items = session.get(f"{API}/articles").json()
        assert any(a.get("featured") is True for a in items)

    def test_update_unfeatured(self, session, admin_headers):
        aid = TestArticlesCRUD.created_ids[0]
        r = session.put(f"{API}/admin/articles/{aid}",
                        json={"title": "TEST Updated Article",
                              "body": ["only one"], "featured": False},
                        headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["featured"] is False
        assert r.json()["body"] == ["only one"]

    def test_delete(self, session, admin_headers):
        for aid in TestArticlesCRUD.created_ids:
            assert session.delete(f"{API}/admin/articles/{aid}",
                                  headers=admin_headers).status_code == 200


# ────────────── Roles CRUD ──────────────
class TestRolesCRUD:
    created_ids = []

    def test_create_active(self, session, admin_headers):
        r = session.post(f"{API}/admin/roles",
                         json={"title": f"TEST Role Active {uuid.uuid4().hex[:6]}",
                               "dept": "Engineering", "location": "Remote",
                               "type": "Full-time", "description": "test",
                               "active": True},
                         headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["active"] is True
        TestRolesCRUD.created_ids.append(data["id"])
        TestRolesCRUD._active_id = data["id"]

    def test_create_inactive(self, session, admin_headers):
        r = session.post(f"{API}/admin/roles",
                         json={"title": f"TEST Role Inactive {uuid.uuid4().hex[:6]}",
                               "active": False},
                         headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["active"] is False
        TestRolesCRUD.created_ids.append(data["id"])
        TestRolesCRUD._inactive_id = data["id"]

    def test_public_excludes_inactive_admin_includes(self, session, admin_headers):
        public = session.get(f"{API}/roles").json()
        public_ids = {r["id"] for r in public}
        assert TestRolesCRUD._active_id in public_ids
        assert TestRolesCRUD._inactive_id not in public_ids

        admin = session.get(f"{API}/admin/roles", headers=admin_headers).json()
        admin_ids = {r["id"] for r in admin}
        assert TestRolesCRUD._active_id in admin_ids
        assert TestRolesCRUD._inactive_id in admin_ids

    def test_toggle_active_then_public(self, session, admin_headers):
        # toggle active to false
        rid = TestRolesCRUD._active_id
        r = session.put(f"{API}/admin/roles/{rid}",
                        json={"title": "TEST Role Toggled", "active": False},
                        headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["active"] is False
        public_ids = {x["id"] for x in session.get(f"{API}/roles").json()}
        assert rid not in public_ids

    def test_delete(self, session, admin_headers):
        for rid in TestRolesCRUD.created_ids:
            assert session.delete(f"{API}/admin/roles/{rid}",
                                  headers=admin_headers).status_code == 200
        assert session.delete(f"{API}/admin/roles/{TestRolesCRUD.created_ids[0]}",
                              headers=admin_headers).status_code == 404
