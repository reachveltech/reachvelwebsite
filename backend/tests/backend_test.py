"""Backend tests for Reachvel — Iteration 3.

Covers the hardened admin auth (bcrypt + session tokens + IP rate limit),
submission status lifecycle (PATCH + filters + search), admin stats and
the existing public /contact endpoint.

Rate limiting is IP based (via x-forwarded-for). Each test uses a unique
X-Forwarded-For to avoid lockout collateral between tests.
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
    """Return a unique synthetic IP for X-Forwarded-For to isolate rate-limit state per test."""
    return f"10.{os.getpid() % 255}.{int(time.time()) % 255}.{uuid.uuid4().int % 255}"


def _login(session, password=ADMIN_PASSWORD, ip=None):
    headers = {"X-Forwarded-For": ip or _ip(), "Content-Type": "application/json"}
    return session.post(f"{API}/admin/login", json={"password": password}, headers=headers)


# ─────────────────── Fixtures ───────────────────
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def admin_token(session):
    """Fresh token per test — module-scoped tokens get nuked by rotate-password tests."""
    r = _login(session)
    assert r.status_code == 200, r.text
    tok = r.json().get("token")
    assert tok and isinstance(tok, str)
    return tok


@pytest.fixture
def admin_headers(admin_token):
    return {"X-Admin-Token": admin_token, "Content-Type": "application/json"}


# ─────────────────── Health ───────────────────
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("message") == "Reachvel API"


# ─────────────────── Contact submission ───────────────────
class TestContact:
    def test_create_valid_and_status_new(self, session):
        payload = {
            "name": "TEST Ada Lovelace",
            "email": "test_ada@example.com",
            "phone": "+1 (415) 555-0199",
            "company": "TEST Co",
            "service": "Web Engineering",
            "budget": "$50k - $150k",
            "note": "We need an engineering partner for our new product line.",
        }
        r = session.post(f"{API}/contact", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] and isinstance(data["id"], str)
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"].lower()
        assert data["status"] == "new"
        assert "_id" not in data
        pytest.created_id = data["id"]

    def test_invalid_email(self, session):
        r = session.post(f"{API}/contact", json={
            "name": "TEST Bad Email", "email": "not-an-email",
            "note": "This is a long enough note to pass minimum length.",
        })
        assert r.status_code == 422


# ─────────────────── Admin login + token semantics ───────────────────
class TestAdminLogin:
    def test_wrong_password_401(self, session):
        r = _login(session, password="wrong-one")
        assert r.status_code == 401

    def test_correct_password_returns_opaque_token(self, session):
        r = _login(session)
        assert r.status_code == 200
        body = r.json()
        assert "token" in body and "expires_at" in body
        tok = body["token"]
        # token must NOT be the password
        assert tok != ADMIN_PASSWORD
        # opaque (secrets.token_urlsafe(40) => ~54 chars)
        assert len(tok) >= 40

    def test_each_login_returns_unique_token(self, session):
        t1 = _login(session).json()["token"]
        t2 = _login(session).json()["token"]
        assert t1 != t2

    def test_password_cannot_be_used_as_token(self, session):
        r = session.get(f"{API}/admin/submissions", headers={"X-Admin-Token": ADMIN_PASSWORD})
        assert r.status_code == 401

    def test_token_works(self, session, admin_token):
        r = session.get(f"{API}/admin/submissions", headers={"X-Admin-Token": admin_token})
        assert r.status_code == 200

    def test_logout_invalidates_token(self, session):
        login_ip = _ip()
        tok = _login(session, ip=login_ip).json()["token"]
        r1 = session.get(f"{API}/admin/submissions", headers={"X-Admin-Token": tok})
        assert r1.status_code == 200
        r2 = session.post(f"{API}/admin/logout", headers={"X-Admin-Token": tok})
        assert r2.status_code == 200
        r3 = session.get(f"{API}/admin/submissions", headers={"X-Admin-Token": tok})
        assert r3.status_code == 401


# ─────────────────── Rate limit ───────────────────
class TestRateLimit:
    def test_lockout_after_five_failures(self, session):
        ip = _ip()
        for i in range(5):
            r = _login(session, password=f"bad-{i}", ip=ip)
            assert r.status_code == 401, f"attempt {i} got {r.status_code}"
        r6 = _login(session, password="bad-6", ip=ip)
        assert r6.status_code == 429
        detail = r6.json().get("detail", "")
        assert "Try again in" in detail and "s." in detail

    def test_success_resets_failure_counter(self, session):
        ip = _ip()
        # 4 bad
        for i in range(4):
            assert _login(session, password=f"bad-{i}", ip=ip).status_code == 401
        # 1 good -> resets
        assert _login(session, ip=ip).status_code == 200
        # 4 more bad -> still 401 (not 429), because counter was cleared
        for i in range(4):
            r = _login(session, password=f"bad-{i}", ip=ip)
            assert r.status_code == 401, f"after-reset attempt {i} got {r.status_code}"


# ─────────────────── Rotate password ───────────────────
class TestRotatePassword:
    NEW_PW = "Reachvel-Admin-2026-Rotated!"

    def test_rotate_flow(self, session):
        # dedicated session for rotation (so we can verify other sessions die)
        login_ip = _ip()
        tok_rotator = _login(session, ip=login_ip).json()["token"]
        tok_other = _login(session, ip=_ip()).json()["token"]

        # other session currently valid
        assert session.get(f"{API}/admin/submissions",
                           headers={"X-Admin-Token": tok_other}).status_code == 200

        # wrong current -> 401
        r_bad = session.post(
            f"{API}/admin/rotate-password",
            json={"current_password": "totally-wrong", "new_password": self.NEW_PW},
            headers={"X-Admin-Token": tok_rotator},
        )
        assert r_bad.status_code == 401

        # same as current -> 400
        r_same = session.post(
            f"{API}/admin/rotate-password",
            json={"current_password": ADMIN_PASSWORD, "new_password": ADMIN_PASSWORD},
            headers={"X-Admin-Token": tok_rotator},
        )
        assert r_same.status_code == 400

        # short new password -> 422 (pydantic min_length=8)
        r_short = session.post(
            f"{API}/admin/rotate-password",
            json={"current_password": ADMIN_PASSWORD, "new_password": "short"},
            headers={"X-Admin-Token": tok_rotator},
        )
        assert r_short.status_code == 422

        # no token -> 401
        r_noauth = session.post(
            f"{API}/admin/rotate-password",
            json={"current_password": ADMIN_PASSWORD, "new_password": self.NEW_PW},
        )
        assert r_noauth.status_code == 401

        # happy path
        r_ok = session.post(
            f"{API}/admin/rotate-password",
            json={"current_password": ADMIN_PASSWORD, "new_password": self.NEW_PW},
            headers={"X-Admin-Token": tok_rotator},
        )
        assert r_ok.status_code == 200, r_ok.text

        # rotator's session stays valid
        assert session.get(f"{API}/admin/submissions",
                           headers={"X-Admin-Token": tok_rotator}).status_code == 200

        # other session invalidated
        assert session.get(f"{API}/admin/submissions",
                           headers={"X-Admin-Token": tok_other}).status_code == 401

        # old password no longer works
        r_old = _login(session, password=ADMIN_PASSWORD)
        assert r_old.status_code == 401

        # new password works
        r_new = _login(session, password=self.NEW_PW)
        assert r_new.status_code == 200

        # ── rotate BACK to original so docs remain accurate ──
        tok_back = r_new.json()["token"]
        r_restore = session.post(
            f"{API}/admin/rotate-password",
            json={"current_password": self.NEW_PW, "new_password": ADMIN_PASSWORD},
            headers={"X-Admin-Token": tok_back},
        )
        assert r_restore.status_code == 200, r_restore.text
        # final check: original password works again
        assert _login(session, password=ADMIN_PASSWORD).status_code == 200


# ─────────────────── Submission status + search + filter ───────────────────
class TestSubmissionsAdmin:
    def test_list_no_token_401(self, session):
        assert session.get(f"{API}/admin/submissions").status_code == 401

    def test_list_bad_token_401(self, session):
        r = session.get(f"{API}/admin/submissions", headers={"X-Admin-Token": "nope"})
        assert r.status_code == 401

    def test_list_has_no_mongo_id(self, session, admin_headers):
        r = session.get(f"{API}/admin/submissions", headers=admin_headers)
        assert r.status_code == 200
        for item in r.json():
            assert "_id" not in item
            assert "status" in item

    def test_patch_status_flow(self, session, admin_headers):
        # create subject
        payload = {
            "name": "TEST Status Sub",
            "email": "test_status@example.com",
            "note": "Long enough note for status lifecycle test.",
        }
        sub_id = session.post(f"{API}/contact", json=payload).json()["id"]

        # valid transition
        r = session.patch(f"{API}/admin/submissions/{sub_id}",
                          json={"status": "reviewing"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "reviewing"

        # listing reflects it
        listing = session.get(f"{API}/admin/submissions", headers=admin_headers).json()
        got = next((x for x in listing if x["id"] == sub_id), None)
        assert got and got["status"] == "reviewing"

        # invalid status -> 400
        r_bad = session.patch(f"{API}/admin/submissions/{sub_id}",
                              json={"status": "banana"}, headers=admin_headers)
        assert r_bad.status_code == 400

        # unknown id -> 404
        r_nf = session.patch(f"{API}/admin/submissions/does-not-exist",
                             json={"status": "won"}, headers=admin_headers)
        assert r_nf.status_code == 404

        # set to "won" for filter test
        assert session.patch(f"{API}/admin/submissions/{sub_id}",
                             json={"status": "won"}, headers=admin_headers).status_code == 200
        pytest.won_id = sub_id

    def test_search_and_filter(self, session, admin_headers):
        # seed a searchable record
        uniq = f"findme-{uuid.uuid4().hex[:8]}"
        payload = {
            "name": f"TEST {uniq}",
            "email": f"{uniq}@example.com",
            "note": "Specific searchable note used by the filter test.",
            "service": "Web Engineering",
        }
        sub_id = session.post(f"{API}/contact", json=payload).json()["id"]

        # ?q= matches case-insensitive across fields
        r = session.get(f"{API}/admin/submissions", headers=admin_headers,
                        params={"q": uniq.upper()})
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert sub_id in ids

        # ?status=won only returns won items
        r_won = session.get(f"{API}/admin/submissions", headers=admin_headers,
                            params={"status": "won"})
        assert r_won.status_code == 200
        won_ids = [x["id"] for x in r_won.json()]
        assert all(x["status"] == "won" for x in r_won.json())
        assert getattr(pytest, "won_id", None) in won_ids
        # our freshly created one is "new", so it should NOT be in won
        assert sub_id not in won_ids

        # combining q + status ANDs
        r_and = session.get(f"{API}/admin/submissions", headers=admin_headers,
                            params={"q": uniq, "status": "new"})
        assert r_and.status_code == 200
        and_ids = [x["id"] for x in r_and.json()]
        assert sub_id in and_ids

        r_and2 = session.get(f"{API}/admin/submissions", headers=admin_headers,
                             params={"q": uniq, "status": "won"})
        assert sub_id not in [x["id"] for x in r_and2.json()]


# ─────────────────── Stats ───────────────────
class TestStats:
    def test_stats_no_token(self, session):
        assert session.get(f"{API}/admin/stats").status_code == 401

    def test_stats_structure_and_counts(self, session, admin_headers):
        r = session.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert set(data.keys()) >= {"total", "today", "by_status"}
        bs = data["by_status"]
        for k in ("new", "reviewing", "contacted", "won", "lost"):
            assert k in bs and isinstance(bs[k], int)
        # totals must be consistent
        assert sum(bs.values()) == data["total"]
        # won >= 1 since we set one in TestSubmissionsAdmin
        assert bs["won"] >= 1


# ─────────────────── Delete ───────────────────
class TestDelete:
    def test_delete_flow(self, session, admin_headers):
        sub_id = session.post(f"{API}/contact", json={
            "name": "TEST DeleteMe",
            "email": "deleteme@example.com",
            "note": "Throwaway record to verify delete pipeline.",
        }).json()["id"]
        assert session.delete(f"{API}/admin/submissions/{sub_id}",
                              headers=admin_headers).status_code == 200
        assert session.delete(f"{API}/admin/submissions/{sub_id}",
                              headers=admin_headers).status_code == 404


# ─────────────────── Cleanup ───────────────────
def test_zzz_cleanup(session):
    r = _login(session)
    headers = {"X-Admin-Token": r.json()["token"], "Content-Type": "application/json"}
    listing = session.get(f"{API}/admin/submissions", headers=headers).json()
    if not isinstance(listing, list):
        return
    for item in listing:
        name = (item.get("name") or "")
        email = (item.get("email") or "")
        if name.startswith("TEST") or email.startswith("test_") or email == "deleteme@example.com":
            session.delete(f"{API}/admin/submissions/{item['id']}", headers=headers)


def test_zzzz_password_restored(session):
    """Sanity: original password MUST be valid after the full suite."""
    assert _login(session, password=ADMIN_PASSWORD).status_code == 200
